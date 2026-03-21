from __future__ import annotations
import ipaddress, socket
from urllib.parse import urlparse

BLOCKED_HOSTS = {"localhost", "metadata.google.internal"}
CLOUD_METADATA_IPS = {"169.254.169.254", "fd00:ec2::254"}
