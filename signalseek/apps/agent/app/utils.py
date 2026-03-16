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
