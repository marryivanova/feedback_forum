import os
from typing import List, Optional
from fastapi.templating import Jinja2Templates
from fastapi import (
    Response,
    status,
    HTTPException,
    Depends,
    APIRouter,
    Request,
    UploadFile,
    File,
    Form,
)
from sqlalchemy import func
from sqlalchemy.orm import Session
from starlette.responses import HTMLResponse

from .. import schemas, oauth2, models
from ..database import get_db
from ..models import User
from ..oauth2 import oauth2_scheme, verify_access_token, get_current_user


router = APIRouter(prefix="/v1/posts", tags=["Posts"])

template_dir = os.path.join(os.path.dirname(__file__), "templates")
templates = Jinja2Templates(directory=template_dir)

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/welcome_page", response_class=HTMLResponse)
def welcome_page(request: Request):
    return templates.TemplateResponse("welcome_page.html", {"request": request})


@router.get("/thank-you")
def thank_you_page(request: Request):
    return templates.TemplateResponse("thx.html", {"request": request})


@router.get("/", response_model=List[schemas.PostOut])
def get_posts(
    limit: int = 10,
    skip: int = 0,
    search: Optional[str] = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user),
):
    results = (
        db.query(models.Post, func.count(models.Vote.post_id).label("votes"))
        .join(models.Vote, models.Vote.post_id == models.Post.id, isouter=True)
        .group_by(models.Post.id)
        .filter(models.Post.title.contains(search))
        .limit(limit)
        .offset(skip)
        .all()
    )

    return results


@router.get("/{post_id}", response_model=schemas.PostOut)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user),
):
    post = (
        db.query(models.Post, func.count(models.Vote.post_id).label("votes"))
        .join(models.Vote, models.Vote.post_id == models.Post.id, isouter=True)
        .group_by(models.Post.id)
        .filter(models.Post.id == post_id)
        .first()
    )

    check_if_exists(post, post_id)
    return post


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schemas.Post)
def create_post(
    title: str = Form(...),
    content: str = Form(...),
    published: bool = Form(True),
    type: str = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(oauth2.get_current_user),
):
    image_url = None

    if image:
        file_location = os.path.join(UPLOAD_DIR, image.filename)

        with open(file_location, "wb") as f:
            f.write(image.file.read())

        image_url = f"/uploads/{image.filename}"

    new_post = models.Post(
        owner_id=current_user.id,
        title=title,
        content=content,
        published=published,
        type=type,
        image_url=image_url,
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return new_post


@router.put("/{post_id}", response_model=schemas.Post)
def update_post(
    post_id: int,
    post: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user),
):
    post_query = db.query(models.Post).filter(models.Post.id == post_id)
    found_post = post_query.first()

    check_if_exists(found_post, post_id)
    if found_post.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform requested action",
        )

    post_query.update(post.dict(), synchronize_session=False)
    db.commit()

    return post_query.first()


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user),
):
    post_query = db.query(models.Post).filter(models.Post.id == post_id)
    post = post_query.first()

    check_if_exists(post, post_id)

    if post.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform requested action",
        )

    post_query.delete(synchronize_session=False)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


def check_if_exists(post, post_id):
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with {post_id} id was not found",
        )
