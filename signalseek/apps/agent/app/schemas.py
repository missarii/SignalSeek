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
