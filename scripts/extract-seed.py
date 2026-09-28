"""Create the Epic 1 seed JSON from the single approved workbook source.

The workbook is a synthetic teaching dataset. This small conversion preserves
empty cells as null and carries the recipe channel column that is absent from
the workbook's parallel JSON export.
"""
from __future__ import annotations

import datetime as dt
import json
import sys
from pathlib import Path

import openpyxl


def serial(value):
    if isinstance(value, (dt.date, dt.datetime)):
        return value.isoformat()[:10]
    return value


def records(sheet, fields):
    rows = list(sheet.iter_rows(values_only=True))
    return [
        {field: serial(value) for field, value in zip(fields, row)}
        for row in rows[1:]
        if any(value is not None for value in row)
    ]


def main(source: Path, destination: Path):
    workbook = openpyxl.load_workbook(source, read_only=True, data_only=True)
    # Workbook sheet order is part of this one-time source conversion.
    data = {
        "materials": records(workbook.worksheets[2], [
            "material_id", "name", "unit", "pack_quantity", "base_pack_price",
            "lead_days", "safety_days", "supplier_id",
        ]),
        "menus": records(workbook.worksheets[3], [
            "menu_id", "name", "price", "category", "recipe_version",
        ]),
        "recipes": records(workbook.worksheets[4], [
            "recipe_version", "menu_id", "material_id", "quantity", "unit",
            "applicable_channel",
        ]),
        "price_history": records(workbook.worksheets[5], [
            "material_id", "effective_date", "pack_price", "pack_quantity",
        ]),
        "sales": records(workbook.worksheets[7], [
            "sale_id", "date", "menu_id", "channel", "quantity", "unit_price",
            "discount_amount", "net_sales", "payment_fee", "recipe_version",
            "unit_food_cost_snapshot", "unit_packaging_cost_snapshot",
        ]),
    }
    expected = {"materials": 11, "menus": 8, "recipes": 22, "price_history": 33, "sales": 6112}
    actual = {key: len(value) for key, value in data.items()}
    if actual != expected:
        raise SystemExit(f"Unexpected workbook row counts: {actual}")
    if not any(row["applicable_channel"] == "포장" for row in data["recipes"]):
        raise SystemExit("Workbook is missing channel-specific packaging recipe rows")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {destination} ({actual})")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("usage: extract-seed.py SOURCE.xlsx DESTINATION.json")
    main(Path(sys.argv[1]), Path(sys.argv[2]))
