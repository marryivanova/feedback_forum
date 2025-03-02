import os

from fastapi import status, Depends, APIRouter, HTTPException, Request
from sqlalchemy.orm import Session
from starlette.responses import HTMLResponse
from starlette.templating import Jinja2Templates

from .. import oauth2, schemas, models
from ..database import get_db
from ..models import User, Comment, Like

router = APIRouter(prefix="/v1/vote", tags=["Vote"])

template_dir = os.path.join(os.path.dirname(__file__), "../../frontend")
templates = Jinja2Templates(directory=template_dir)


@router.post("/", status_code=status.HTTP_201_CREATED)
def vote_post(
    vote: schemas.Vote,
    db: Session = Depends(get_db),
    current_user: User = Depends(oauth2.get_current_user),
):
    post = db.query(models.Post).filter(models.Post.id == vote.post_id).first()
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id {vote.post_id} does not exist.",
        )

    vote_query = db.query(models.Vote).filter(
        models.Vote.post_id == vote.post_id, models.Vote.user_id == current_user.id
    )
    found_vote = vote_query.first()

    if vote.direction == 1:
        if found_vote:
            vote_query.delete(synchronize_session=False)
            db.commit()
            return {"message": "Successfully removed vote"}
        else:
            new_vote = models.Vote(post_id=vote.post_id, user_id=current_user.id)
            db.add(new_vote)
            db.commit()
            return {"message": "Successfully added vote"}
    else:
        if found_vote is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Vote does not exist."
            )
        vote_query.delete(synchronize_session=False)
        db.commit()
        return {"message": "Successfully deleted vote"}


@router.get("/feedback/forum", response_class=HTMLResponse)
def feedback_page(request: Request):
    return templates.TemplateResponse("forum.html", {"request": request})


@router.post("/like", status_code=status.HTTP_200_OK)
def like_comment(
        comment_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(oauth2.get_current_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with id {comment_id} does not exist.",
        )

    existing_like = db.query(Like).filter(Like.comment_id == comment_id, Like.user_id == current_user.id).first()

    if existing_like:
        db.delete(existing_like)
        comment.likes_count -= 1
    else:
        new_like = Like(user_id=current_user.id, comment_id=comment_id)
        db.add(new_like)
        comment.likes_count += 1

    db.commit()
    db.refresh(comment)

    return {"message": "Successfully updated like", "likes_count": comment.likes_count}

