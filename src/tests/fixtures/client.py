import pytest


from fastapi.testclient import TestClient

from src.app.database import get_db
from src.app.main import app


@pytest.fixture
def client(session):
    def override_get_db():
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
