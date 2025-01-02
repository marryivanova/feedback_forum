import os
from fastapi import APIRouter
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi import Request

template_dir = os.path.join(os.path.dirname(__file__), "templates")

templates = Jinja2Templates(directory=template_dir)

router = APIRouter(
    tags=["Root"]
)

@router.get("/", response_class=HTMLResponse)
def root(request: Request):
    return templates.TemplateResponse("welcome.html", {"request": request})
