import hashlib
import hmac
import os
import re

from typing import Optional

def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Hashes a password using scrypt with a 16-byte random hex salt."""
    if not salt:
        salt_bytes = os.urandom(16)
        salt_hex = salt_bytes.hex()
    else:
        salt_bytes = bytes.fromhex(salt)
        salt_hex = salt

    derived_key = hashlib.scrypt(
        password.encode('utf-8'),
        salt=salt_bytes,
        n=16384,
        r=8,
        p=1,
        maxmem=0,
        dklen=64
    )
    return f"{salt_hex}:{derived_key.hex()}"

def hash_password_legacy(password: str) -> str:
    """Computes unsalted SHA-256 hash for legacy credentials."""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(password_to_verify: str, stored_hash: str) -> bool:
    """Verifies plain-text password against stored hash using timing-safe comparison."""
    if not stored_hash or not password_to_verify:
        return False

    if ":" in stored_hash:
        parts = stored_hash.split(":")
        if len(parts) != 2:
            return False
        salt_hex, key_hex = parts
        try:
            target_key = bytes.fromhex(key_hex)
            derived_key = hashlib.scrypt(
                password_to_verify.encode('utf-8'),
                salt=bytes.fromhex(salt_hex),
                n=16384,
                r=8,
                p=1,
                maxmem=0,
                dklen=len(target_key)
            )
            return hmac.compare_digest(target_key, derived_key)
        except Exception:
            return False

    if re.match(r"^[0-9a-fA-F]{64}$", stored_hash):
        legacy_hash = hash_password_legacy(password_to_verify)
        return hmac.compare_digest(stored_hash.lower(), legacy_hash.lower())

    return stored_hash == password_to_verify
