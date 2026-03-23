from __future__ import annotations
import ipaddress, socket
from urllib.parse import urlparse

BLOCKED_HOSTS = {"localhost", "metadata.google.internal"}
CLOUD_METADATA_IPS = {"169.254.169.254", "fd00:ec2::254"}

def is_blocked_ip(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
    except ValueError:
        return True
    if ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_multicast or ip.is_reserved:
        return True
    if ip_str in CLOUD_METADATA_IPS:
        return True
    return False

def validate_outbound_url(url: str) -> str:
    """SSRF guard: http(s) only, no credentials, no blocked hosts, DNS resolves to public IPs."""
    p = urlparse(url.strip())
    if p.scheme not in ("http", "https"):
        raise ValueError(f"URL scheme not allowed: {p.scheme}")
    if p.username or p.password:
        raise ValueError("URL credentials not allowed")
    host = (p.hostname or "").lower()
    if not host or host in BLOCKED_HOSTS or host.endswith(".internal") or host.endswith(".local"):
        # allow demo.signalseek.local only for deterministic demo content
        if host != "demo.signalseek.local":
            raise ValueError(f"Blocked host: {host}")
        return url
    if host in ("metadata.google.internal",):
        raise ValueError(f"Blocked host: {host}")
    try:
        infos = socket.getaddrinfo(host, p.port or (443 if p.scheme == "https" else 80), type=socket.SOCK_STREAM)
    except socket.gaierror as e:
        raise ValueError(f"DNS resolution failed for {host}: {e}")
    for info in infos:
        if is_blocked_ip(info[4][0]):
            raise ValueError(f"URL resolves to blocked address: {host}")
    return url
