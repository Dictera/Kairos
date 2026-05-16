"""Turkish Jinja2 custom filters for docxtpl template rendering."""

from __future__ import annotations

from datetime import date, datetime

from babel.numbers import format_currency

UPPER_TR_TABLE = str.maketrans({"i": "İ", "ı": "I"})
LOWER_TR_TABLE = str.maketrans({"İ": "i", "I": "ı"})


def tr_currency(value):
    """Format a number as Turkish Lira with TR locale separators.

    Output format: ``150.000,00 ₺`` (amount first, symbol last).
    """
    if value is None or value == "":
        return ""
    if isinstance(value, str):
        value = float(value)
    result = format_currency(value, "TRY", locale="tr_TR")
    # Babel tr_TR produces "₺150.000,00" — move symbol to end with space
    if result.startswith("₺"):
        result = result[1:].strip() + " ₺"
    return result


def tarih(value):
    """Format a date/datetime/ISO-string as dd.MM.yyyy."""
    if value is None or value == "":
        return ""
    if isinstance(value, str):
        value = datetime.strptime(value, "%Y-%m-%d")
    return value.strftime("%d.%m.%Y")


def upper_tr(value):
    """Turkish-aware uppercase: i→İ, ı→I."""
    if not value:
        return ""
    return str(value).translate(UPPER_TR_TABLE).upper()


def lower_tr(value):
    """Turkish-aware lowercase: İ→i, I→ı."""
    if not value:
        return ""
    return str(value).translate(LOWER_TR_TABLE).lower()
