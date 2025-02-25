from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from pydantic.types import conint


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class User(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        orm_mode = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PostBase(BaseModel):
    title: str
    content: str
    published: bool = True
    type: str
    image_url: Optional[str] = None


class PostCreate(PostBase):
    pass


class Post(PostBase):
    id: int
    created_at: datetime
    owner_id: int
    owner: User
    type: Optional[str] = None

    class Config:
        orm_mode = True


class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    content: str


class Comment(CommentBase):
    id: int
    post_id: int
    user_id: int
    likes_count: int

    class Config:
        orm_mode = True


class CommentBase(BaseModel):
    content: str
    post_id: int
    user_id: int
    likes_count: int

    class Config:
        orm_mode = True


class CommentOut(CommentBase):
    id: int


class PostOut(BaseModel):
    Post: Post
    votes: int
    comments: Optional[List[CommentOut]] = None

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    id: int
    username: Optional[str]


class Vote(BaseModel):
    post_id: int
    direction: conint(le=1)
