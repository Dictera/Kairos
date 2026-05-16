#!/usr/bin/env python3
"""
Minimal mock sidecar for tests — echoes stdin back with status:success.
"""

import json
import sys

def main():
    raw_input = sys.stdin.read()
    try:
        envelope = json.loads(raw_input)
    except json.JSONDecodeError:
        print(json.dumps({"status": "error", "code": 99, "message": "Invalid JSON"}))
        sys.exit(99)

    # Echo back with success
    print(json.dumps({
        "status": "success",
        "result": {
            "python_version": "3.11.0",
            "libreoffice_version": None,
            "python_accessible": True,
            "libreoffice_accessible": False,
        }
    }))
    sys.exit(0)

if __name__ == "__main__":
    main()