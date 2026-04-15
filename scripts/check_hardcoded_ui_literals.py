#!/usr/bin/env python3
"""Fail if category literals are hardcoded in UI source files.

This guard helps keep categories/content centralized in config + i18n.
"""

from __future__ import annotations

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
PRODUCTS_FILE = ROOT / "normalized" / "products.json"
SCAN_TARGETS = [
    ROOT / "index.html",
    ROOT / "assets" / "js" / "main.js",
]


def load_categories() -> list[str]:
    products = json.loads(PRODUCTS_FILE.read_text(encoding="utf-8"))
    values = sorted({item.get("category", "") for item in products if item.get("category")})
    return values


def find_hardcoded_literals(text: str, literals: list[str]) -> list[str]:
    hits: list[str] = []
    for literal in literals:
        if re.search(rf"(?<![\\w-]){re.escape(literal)}(?![\\w-])", text):
            hits.append(literal)
    return hits


def main() -> int:
    categories = load_categories()
    failing = False

    for target in SCAN_TARGETS:
        text = target.read_text(encoding="utf-8")
        matches = find_hardcoded_literals(text, categories)
        if matches:
            failing = True
            print(f"[FAIL] {target.relative_to(ROOT)} hardcodes categories: {', '.join(matches)}")

    if failing:
        print("\nMove category literals to content/app-config.json and i18n keys.")
        return 1

    print("[PASS] No hardcoded product categories in UI source targets.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
