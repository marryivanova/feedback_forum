# Blog FastAPI

В этом проекте используется: **Python**, **PostgreSQL**, **FastAPI**, **SQLAlchemy**, **Alembic** and **pytest**.

- Python: 3.12
- FastAPI: 0.115.6
- PostgreSQL: 14.2
## PostgreSQL Install Steps
Вы можете установить PostgreSQL 14.2 на свой компьютер, выполнив следующие действия  [link](https://www.postgresql.org/download/).

Также вы можете установить PostgreSQL с помощью Docker:
```shell script
docker pull postgres:14.2
```
Работа с Docker (если используете контейнер):
```
docker run --name my_postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres:14.2
```
- my_postgres — это имя контейнера.
- POSTGRES_PASSWORD=mysecretpassword — задает пароль для пользователя postgres в базе данных.
## Installing application

To install the application use following commands:
```shell script
python -m pip install --upgrade pip
pip install poetry
poetry install
```

## Environment configuration

Следующие переменные окружения должны быть установлены в вашей ОС или добавлены в новый файл **.env** из корня этой директории.
```
DATABASE_HOSTNAME = localhost
DATABASE_PORT = 5432
DATABASE_NAME = ADD_HERE_YOUR_DB_NAME
DATABASE_USERNAME = ADD_HERE_YOUR_DB_USERNAME
DATABASE_PASSWORD = ADD_HERE_YOUR_DB_PASSWORD
JWT_SECRET_KEY = ADD_HERE_A_JWT_SECRET_KEY
JWT_ALGORITHM = HSA256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 60
```
Сгенерировать секретный ключ JWT можно с помощью следующей команды:
```shell script
openssl rand -hex 32
```
или запустить - `generate_key_hex.py`

## Running the application in dev mode

Вы можете запустить свое приложение в режиме dev, который позволяет выполнять кодирование в реальном времени:
```shell script
uvicorn src.app.main:app --host 0.0.0.0 --port 8000
```
переход на: `http://localhost:8000/`

## Related Guides

- Python ([guide](https://www.python.org/docs/))
- PostgreSQL ([guide](https://www.postgresql.org/docs/)): Самая передовая в мире реляционная база данных с открытым исходным кодом.
- FastAPI ([guide](https://fastapi.tiangolo.com/)): Фреймворк FastAPI, высокая производительность, легкость в изучении и т.д
- SQLAlchemy ([guide](https://www.sqlalchemy.org/)): SQLAlchemy -> SQL.
- Alembic ([guide](https://alembic.sqlalchemy.org/en/latest/index.html)): Для Миграций.
