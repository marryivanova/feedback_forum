import os

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import logging

from .. import schemas, models
from ..database import get_db

from ..oauth2 import create_access_token
from ...utils.verifyi import verify

router = APIRouter(prefix="/v1/login", tags=["Authentication"])


template_dir = os.path.join(os.path.dirname(__file__), "templates")
templates = Jinja2Templates(directory=template_dir)


@router.get("/login_page", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@router.post("/", response_model=schemas.Token)
def login(
    user_credentials: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    try:
        user = (
            db.query(models.User)
            .filter(models.User.email == user_credentials.username)
            .first()
        )
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Credentials"
            )

        if not verify(user_credentials.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Credentials"
            )

        access_token = create_access_token(data={"user_id": user.id, "sub": user.email})
        return schemas.Token(access_token=access_token)
    except Exception as e:
        logging.error(f"Error during login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error",
        )
