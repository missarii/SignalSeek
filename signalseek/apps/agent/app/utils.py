from __future__ import annotations
import hashlib, re
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

TRACKING_PARAMS = {"utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","fbclid","mc_cid","mc_eid"}

def canonicalize_url(url: str) -> str:
    try:
        p = urlparse(url.strip())
        scheme = (p.scheme or "https").lower()
        host = (p.hostname or "").lower()
        if host.startswith("www."):
            host = host[4:]
        port = f":{p.port}" if p.port and p.port not in (80, 443) else ""
        path = p.path.rstrip("/") or "/"
        q = [(k,v) for k,v in parse_qsl(p.query) if k.lower() not in TRACKING_PARAMS]
        q.sort()
        query = urlencode(q)
        out = urlunparse((scheme, f"{host}{port}", path, "", query, ""))
        return out
    except Exception:
        return url.strip()

def normalize_query(q: str) -> str:
    q = q.strip().lower()
    q = re.sub(r"\s+", " ", q)
    return q

def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()

def dedupe_queries(queries: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for q in queries:
        n = normalize_query(q)
        if n and n not in seen:
            seen.add(n)
            out.append(q.strip())
    return out

def classify_contradiction(a: str, b: str) -> str:
    """Heuristic classifier distinguishing genuine vs scope/time/definition/opinion differences."""
    al, bl = a.lower(), b.lower()
    if any(t in al+bl for t in ["opinion", "believe", "should", "recommend"]):
        return "opinion-difference"
    if re.search(r"\b(20\d\d|19\d\d)\b", a) and re.search(r"\b(20\d\d|19\d\d)\b", b):
        ya = set(re.findall(r"\b(20\d\d)\b", a)); yb = set(re.findall(r"\b(20\d\d)\b", b))
        if ya != yb:
            return "different-reporting-dates"
    if any(w in al for w in ["global","worldwide"]) != any(w in bl for w in ["global","worldwide"]):
        return "different-scope"
    if any(w in al+bl for w in ["defined as","definition","means"]):
        return "different-definitions"
    if "not" in al.split() or "not" in bl.split() or "no " in al or "no " in bl:
        return "genuine"
