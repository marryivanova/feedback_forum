import os
import logging as log

log.basicConfig(level=log.INFO)


def generate_key_hex():
    """
    Generate a random 32-byte hexadecimal string and log it.
    """
    key = os.urandom(32).hex()
    log.info(f"Generated Key: {key}")
    return key

generated_key = generate_key_hex()