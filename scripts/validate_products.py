#!/usr/bin/env python3
"""Lightweight validator for normalized/products.json.

Checks:
- required fields present and non-empty where applicable
- category values constrained to allowed list
- image_main path convention + file existence
"""

from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS_FILE = ROOT / "normalized" / "products.json"
ALLOWED_CATEGORIES = {
    "Educational Kits",
    "Sensory Development Kits",
}
REQUIRED_FIELDS = [
    "id",
    "name",
    "slug",
    "category",
    "subcategory",
    "age_min",
    "age_max",
    "skills",
    "sensory_focus",
    "short_description",
    "long_description",
    "price",
    "currency",
    "image_main",
    "image_gallery",
    "stock_status",
    "featured",
    "tags",
]


def load_products() -> list[dict]:
    try:
        data = json.loads(PRODUCTS_FILE.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"ERROR: missing file: {PRODUCTS_FILE}")
        sys.exit(1)
    except json.JSONDecodeError as exc:
        print(f"ERROR: invalid JSON in {PRODUCTS_FILE}: {exc}")
        sys.exit(1)

    if not isinstance(data, list):
        print("ERROR: normalized/products.json must be a JSON array")
        sys.exit(1)
    return data


def validate(products: list[dict]) -> list[str]:
    errors: list[str] = []

    for idx, product in enumerate(products, start=1):
        pid = product.get("id", f"row-{idx}")

        for field in REQUIRED_FIELDS:
            if field not in product:
                errors.append(f"{pid}: missing required field '{field}'")

        for non_empty in ["id", "name", "slug", "subcategory", "short_description", "long_description", "image_main"]:
            if non_empty in product and (product[non_empty] is None or str(product[non_empty]).strip() == ""):
                errors.append(f"{pid}: field '{non_empty}' cannot be empty")

        category = product.get("category")
        if category not in ALLOWED_CATEGORIES:
            errors.append(
                f"{pid}: invalid category '{category}' (allowed: {sorted(ALLOWED_CATEGORIES)})"
            )

        image_main = str(product.get("image_main", ""))
        if image_main and not image_main.startswith("images/products/"):
            errors.append(
                f"{pid}: image_main must start with 'images/products/' (found: '{image_main}')"
            )
        if image_main:
            image_path = ROOT / image_main
            if not image_path.exists():
                errors.append(f"{pid}: image file not found at '{image_main}'")

        slug = str(product.get("slug", ""))
        if slug and any(ch in slug for ch in " _"):
            errors.append(f"{pid}: slug should be lowercase-hyphen style (found: '{slug}')")

        if product.get("category") == "":
            errors.append(f"{pid}: category cannot be blank")

    return errors


def main() -> int:
    products = load_products()
    errors = validate(products)

    if errors:
        print("Validation failed:")
        for err in errors:
            print(f"- {err}")
        return 1

    print(
        f"OK: {len(products)} products validated in normalized/products.json "
        "(required fields, categories, image paths)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
