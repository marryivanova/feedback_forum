import pytest


from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.app.config import settings
from src.app.database import Base

SQLALCHEMY_DATABASE_URL = f"postgresql://{settings.database_username}:{settings.database_password}@{settings.database_hostname}:{settings.database_port}/{settings.database_name}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def session():
    # Using SQL Alchemy to create and drop database
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # alembic to create and drop the database
    # command.downgrade("base")
    # command.upgrade("head")

    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
