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

Дополнительно по подключению к БД:

Если вы развернули контейнер с PostgreSQL и хотите проверить, что база данных внутри работает правильно, можно выполнить несколько действий для проверки и тестирования.

1. Подключение к PostgreSQL

Чтобы проверить состояние базы данных и работать с ней, нужно подключиться к контейнеру и использовать утилиту psql (клиент для PostgreSQL), которая предустановлена в контейнере.

Подключитесь к контейнеру (если вы не сделали этого раньше):

```shell script
sudo docker exec -it my_postgres_container bash
```
Здесь: `my_postgres_container` — это имя или ID вашего контейнера. Убедитесь, что используете правильное имя контейнера.

Запустите psql (клиент для PostgreSQL), чтобы подключиться к базе данных PostgreSQL:

```shell script
psql -U postgres
```

Здесь:

`-U postgres` — указывает, что вы подключаетесь как пользователь postgres. Важно, что при запуске контейнера вы задавали пароль для этого пользователя с помощью переменной окружения POSTGRES_PASSWORD.

После подключения к PostgreSQL в командной строке вы попадете в интерактивную среду psql.
```shell script
psql (14.2)
Type "help" for help.
```
2. Проверка списка баз данных

Чтобы убедиться, что PostgreSQL работает и у вас есть хотя бы одна база данных, выполните команду для отображения списка баз данных:
```shell script
\l
```
Это покажет список всех баз данных в PostgreSQL.

3. Проверка подключения и таблиц

Вы можете проверить подключение к базе данных и список таблиц:

Подключитесь к конкретной базе данных (например, к базе данных по умолчанию postgres): `\c postgres`

Проверьте список таблиц: `\dt`

Эта команда отобразит все таблицы в текущей базе данных. Если таблиц нет, то она выведет пустой список.

Примерный итог: `postgres=# \dt`

```shell script
          List of relations
 Schema |   Name   | Type  |  Owner   
--------+----------+-------+----------
 public | comments | table | postgres
 public | posts    | table | postgres
 public | users    | table | postgres
 public | votes    | table | postgres
(4 rows)
```
Создание таблицы вручеую (на всякий):

```sql
-- Создание таблицы users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    email VARCHAR NOT NULL UNIQUE,
    password VARCHAR NOT NULL
);

CREATE TYPE post_type AS ENUM ('bug', 'feature', 'feedback);

-- Создание таблицы posts
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    title VARCHAR NOT NULL,
    content VARCHAR NOT NULL,
    published BOOLEAN NOT NULL DEFAULT TRUE,
    owner_id INTEGER NOT NULL,
    type post_type, -- Новая колонка для типа задачи
    FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Создание таблицы votes
CREATE TABLE votes (
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    post_id INTEGER,
    user_id INTEGER,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    likes_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    comment_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    UNIQUE (user_id, comment_id)
);


```
Запустить контейнер:
- docker start my_postgres
- docker exec -it my_postgres bash
- sudo docker exec -it my_postgres bash
- psql -U postgres

Остановите и удалите контейнер:
- docker stop my_postgres
- docker rm my_postgres

для миграций:

- alembic init alembic
alembic.ini — конфигурационный файл для Alembic.
Папку versions — здесь будут храниться ваши миграции.
env.py — файл, который отвечает за подключение к базе данных и выполнение миграций.

- alembic revision --autogenerate -m "Add image_url to Post model"
- alembic upgrade head