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
    text: str
    locator: str = ""
    source_url: str
    source_title: str

class ClaimOut(BaseModel):
    text: str
    status: Literal["SUPPORTED","PARTIALLY_SUPPORTED","CONTRADICTED","INSUFFICIENT","NOT_EVALUATED"] = "SUPPORTED"
    evidence: list[PassageOut] = Field(default_factory=list)

class RunResult(BaseModel):
    plan: ResearchPlan
    sources: list[dict] = Field(default_factory=list)
    claims: list[ClaimOut] = Field(default_factory=list)
    contradictions: list[dict] = Field(default_factory=list)
    report_markdown: str = ""
    citations: list[dict] = Field(default_factory=list)
    entities: list[dict] = Field(default_factory=list)
    relationships: list[dict] = Field(default_factory=list)
    events: list[dict] = Field(default_factory=list)
    rounds_executed: int = 0
    queries_issued: int = 0
