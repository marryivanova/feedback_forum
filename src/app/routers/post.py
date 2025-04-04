import os
from typing import List, Optional
from sqlalchemy.orm import joinedload
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

template_dir = os.path.join(os.path.dirname(__file__), "../../frontend")
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


@router.get("/posts/{post_id}/image")
def get_post_image(post_id: int, db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post or not post.image_data:
        raise HTTPException(status_code=404, detail="Image not found")

    return Response(content=post.image_data, media_type="image/jpeg")


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
    image_data = None
    image_url = None

    if image:
        image_data = image.file.read()

    new_post = models.Post(
        owner_id=current_user.id,
        title=title,
        content=content,
        published=published,
        type=type,
        image_data=image_data,
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    if image_data:
        image_url = f"/posts/{new_post.id}/image"
        new_post.image_url = image_url
        db.commit()
        db.refresh(new_post)

    return new_post


@router.put("/{post_id}", response_model=schemas.PostOut)
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

    post_with_comments = (
        db.query(models.Post)
        .options(joinedload(models.Post.comments))
        .filter(models.Post.id == post_id)
        .first()
    )

    return schemas.PostOut(
        Post=post_with_comments,
        votes=0,
        comments=[
            schemas.CommentOut.from_orm(comment)
            for comment in post_with_comments.comments
        ]
        if post_with_comments.comments
        else [],
    )


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


@router.get("/{post_id}/comments", response_model=List[schemas.CommentOut])
def get_comments(
    post_id: int,
    db: Session = Depends(get_db),
):
    comments = db.query(models.Comment).filter(models.Comment.post_id == post_id).all()
    return comments


@router.post("/{post_id}/comments", response_model=schemas.Comment)
def create_comment(
    post_id: int,
    comment: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user),
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id {post_id} was not found",
        )

    new_comment = models.Comment(
        post_id=post_id,
        user_id=current_user.id,
        content=comment.content,
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return new_comment


@router.delete("/{post_id}/comments", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    post_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user),
):
    comment = (
        db.query(models.Comment)
        .filter(models.Comment.post_id == post_id, models.Comment.id == comment_id)
        .first()
    )

    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with id {comment_id} not found in post with id {post_id}",
        )

    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform requested action",
        )

    db.delete(comment)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/{post_id}/comments", status_code=status.HTTP_200_OK)
def update_comment(
    post_id: int,
    comment_id: int,
    comment_data: schemas.CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user),
):
    comment = (
        db.query(models.Comment)
        .filter(models.Comment.post_id == post_id, models.Comment.id == comment_id)
        .first()
    )

    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with id {comment_id} not found in post with id {post_id}",
        )

    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform requested action",
        )

    comment.content = comment_data.content
    db.commit()

    return {"message": "Comment updated successfully"}