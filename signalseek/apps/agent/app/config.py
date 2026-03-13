from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    agent_port: int = 8001
    agent_internal_auth_secret: str = "dev-agent-secret-change-me-32chars-min"
    database_url: str = "postgresql://signalseek:signalseek_pw@localhost:5432/signalseek"
    redis_url: str = "redis://localhost:6379"
    search_provider: str = "mock"
    tavily_api_key: str = ""
    brave_search_api_key: str = ""
    llm_provider: str = "mock"
    llm_api_key: str = ""
    llm_base_url: str = ""
    llm_model: str = "gpt-4o-mini"
    max_research_rounds: int = 4
    max_search_queries: int = 20
    max_sources_per_investigation: int = 50
    max_investigation_duration_seconds: int = 600
    log_level: str = "info"
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
