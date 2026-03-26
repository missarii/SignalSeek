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
