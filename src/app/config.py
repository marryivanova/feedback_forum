from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_hostname: str
    database_port: int
    database_name: str
    database_username: str
    database_password: str
    jwt_secret_key: str
    jwt_algorithm: str
    jwt_access_token_expire_minutes: int = 60
    jira_base_url: str
    jira_api_token: str
    jira_project_key: str
    jira_email: str

    class Config:
        env_file = ".env"


settings = Settings()
