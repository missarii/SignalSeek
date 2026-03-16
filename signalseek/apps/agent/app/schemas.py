from __future__ import annotations
from typing import Literal
from pydantic import BaseModel, Field

class SearchResult(BaseModel):
    provider: str
    title: str
    url: str
    snippet: str = ""
    published_at: str | None = None
    author: str | None = None
    result_type: str = "web"

class PlanRequest(BaseModel):
    question: str
    description: str = ""
    max_rounds: int = 4
    max_queries: int = 20

class ResearchPlan(BaseModel):
    objective: str
    subquestions: list[str] = Field(default_factory=list)
    search_queries: list[str] = Field(default_factory=list)
    source_categories: list[str] = Field(default_factory=list)

class RunRequest(BaseModel):
    investigation_id: str
    workspace_id: str
    question: str
    description: str = ""
    plan: ResearchPlan | None = None
    max_rounds: int = 4
    max_queries: int = 20
    max_sources: int = 50
    demo: bool = True

class PassageOut(BaseModel):
