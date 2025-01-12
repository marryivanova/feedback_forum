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
            logging.warning(
                f"Login attempt failed for {user_credentials.username}: User not found"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        if not verify(user_credentials.password, user.password):
            logging.warning(
                f"Login attempt failed for {user_credentials.username}: Incorrect password"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password"
            )

        access_token = create_access_token(data={"user_id": user.id, "sub": user.email})
        logging.info(f"User {user.email} logged in successfully")

        return schemas.Token(access_token=access_token)

    except HTTPException as http_err:
        logging.error(f"HTTP error during login: {http_err.detail}")
        raise http_err
    except Exception as e:
        logging.error(f"Unexpected error during login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error",
        )
