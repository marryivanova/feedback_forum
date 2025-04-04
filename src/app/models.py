from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    text,
    TIMESTAMP,
    ForeignKey,
    DateTime,
    LargeBinary,
)
from sqlalchemy.dialects.mysql import ENUM
from sqlalchemy.orm import relationship
from .database import Base


class EntityBase:
    id = Column(Integer, primary_key=True, nullable=False)
    created_at = Column(
        TIMESTAMP(timezone=True), nullable=False, server_default=text("now()")
    )


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    published = Column(Boolean, nullable=False, server_default="TRUE")
    owner_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    owner = relationship("User")
    image_url = Column(String, nullable=True)
    image_data = Column(LargeBinary, nullable=True)

    type = Column(
        ENUM("bug", "feature", "feedback", name="post_type"),
        nullable=False,
        server_default="feature",
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    comments = relationship(
        "Comment", back_populates="post", cascade="all, delete-orphan"
    )


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    likes_count = Column(Integer, default=0)

    post = relationship("Post", back_populates="comments")
    user = relationship("User", back_populates="comments")
    likes = relationship("Like", back_populates="comment")


class User(Base, EntityBase):
    __tablename__ = "users"

    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)

    comments = relationship("Comment", back_populates="user")
    likes = relationship("Like", back_populates="user")


class Vote(Base):
    __tablename__ = "votes"
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )
    post_id = Column(
        Integer,
        ForeignKey("posts.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )


class Like(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    comment_id = Column(Integer, ForeignKey("comments.id"))

    user = relationship("User", back_populates="likes")
    comment = relationship("Comment", back_populates="likes")