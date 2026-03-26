from __future__ import annotations
import re, hashlib
from .security import validate_outbound_url
from .providers_search import MockSearchProvider

MAX_BYTES = 2_000_000
FETCH_TIMEOUT = 15

def extract_demo_content(url: str, query_hint: str) -> tuple[str, str]:
    """Deterministic demo extractor for demo.signalseek.local URLs (no network)."""
    if "dataset" in url:
        title = f"Demo dataset figures for {query_hint}"
        body = (f"# {title}\n\nPassage 1 (scope: global survey 2024): Adoption of {query_hint} reached 41% globally in 2024. "
                f"## Figures\nPassage 2 (scope: EU enterprises 2024): Adoption of {query_hint} reached 27% among EU enterprises in 2024. "
                f"## Timeline\nPassage 3: Pilot programs for {query_hint} began in 2022; broader rollout followed in 2023.")
    elif "analysis" in url:
        title = f"Demo timeline analysis for {query_hint}"
        body = (f"# {title}\n\nPassage 1: In 2022, early pilots of {query_hint} were reported. "
                f"## 2023\nPassage 2: In 2023, enterprise evaluations of {query_hint} expanded. "
                f"## 2024\nPassage 3: In 2024, conflicting reports emerged on adoption rates, differing by geographic scope.")
    else:
        title = f"Demo briefing overview for {query_hint}"
        body = (f"# {title}\n\nPassage 1: {query_hint} is the subject of this demonstration investigation. "
                f"## Background\nPassage 2: Analysts track {query_hint} using public demo sources labeled as demonstration content. "
                f"## Note\nPassage 3: Figures in demo sources use different scopes and must not be treated as factual truth.")
    return title, body

async def retrieve_text(url: str, query_hint: str = "") -> tuple[str, str, str]:
    """Returns (title, text, method). Raises on blocked/unreachable sources (marked inaccessible, never fabricated)."""
    validate_outbound_url(url)
