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
    from urllib.parse import urlparse
    host = (urlparse(url).hostname or "").lower()
    if host == "demo.signalseek.local":
        title, body = extract_demo_content(url, query_hint or "the research topic")
        return title, body, "demo-extractor"
    import httpx
    async with httpx.AsyncClient(timeout=FETCH_TIMEOUT, max_redirects=3,
                                 headers={"User-Agent": "SignalSeek/0.1 (research bot; respects robots)"}) as c:
        r = await c.get(url)
        r.raise_for_status()
        ctype = r.headers.get("content-type", "")
        if "text" not in ctype and "html" not in ctype and "xml" not in ctype and "json" not in ctype:
            raise ValueError(f"Unsupported content-type: {ctype}")
        raw = r.content[:MAX_BYTES]
    text = raw.decode("utf-8", errors="ignore")
    # Prefer trafilatura for HTML readability; fallback to raw slice.
    if "<html" in text.lower() or "<article" in text.lower():
        try:
            import trafilatura
            extracted = trafilatura.extract(text, include_comments=False, include_tables=True)
            if extracted:
                m = re.search(r"<title>(.*?)</title>", text, re.I | re.S)
                title = (m.group(1).strip() if m else url)
                return title, extracted[:20000], "trafilatura"
        except Exception:
            pass
        # BeautifulSoup fallback: strip tags
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(text, "html.parser")
            title = soup.title.string.strip() if soup.title and soup.title.string else url
            for tag in soup(["script", "style", "nav", "footer"]):
                tag.decompose()
            clean = soup.get_text(separator="\n")
            clean = re.sub(r"\n{3,}", "\n\n", clean).strip()
            return title, clean[:20000], "beautifulsoup"
        except Exception:
            pass
    return url, text[:20000], "raw"

def chunk_text(text: str, max_chars: int = 1200, overlap: int = 200) -> list[tuple[str, str]]:
    """Split into overlapping passages with locators. Returns (locator, passage)."""
    paras = [p.strip() for p in re.split(r"\n{2,}|\n", text) if p.strip()]
    chunks: list[tuple[str, str]] = []
    buf = ""
    idx = 0
    for para in paras:
        if len(buf) + len(para) + 1 <= max_chars:
            buf = (buf + "\n" + para).strip()
        else:
            if buf:
                idx += 1
                chunks.append((f"chunk-{idx}", buf))
                buf = buf[-overlap:] + "\n" + para if overlap else para
            else:
                # single long paragraph: hard split
                for i in range(0, len(para), max_chars - overlap):
                    idx += 1
                    chunks.append((f"chunk-{idx}", para[i:i + max_chars - overlap]))
                buf = ""
    if buf.strip():
        idx += 1
        chunks.append((f"chunk-{idx}", buf.strip()))
    return chunks[:40]

def content_hash(text: str) -> str:
    import hashlib
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()
