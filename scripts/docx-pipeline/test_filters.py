"""Unit tests for Turkish Jinja2 custom filters."""

import sys
import os

# Ensure filters.py is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from filters import tr_currency, tarih, upper_tr, lower_tr


def test_tr_currency_basic():
    result = tr_currency(150000)
    assert "₺" in result, f"Expected currency symbol ₺ in {result!r}"
    # Turkish format: thousands = '.', decimal = ','
    assert "." in result, f"Expected thousands separator '.' in {result!r}"
    assert "," in result, f"Expected decimal separator ',' in {result!r}"


def test_tr_currency_none():
    assert tr_currency(None) == ""


def test_tr_currency_string_input():
    result = tr_currency("2500.50")
    assert "₺" in result


def test_tarih_iso_string():
    assert tarih("2026-02-14") == "14.02.2026"


def test_tarih_none():
    assert tarih(None) == ""


def test_tarih_datetime():
    from datetime import datetime
    assert tarih(datetime(2026, 2, 14)) == "14.02.2026"


def test_tarih_date():
    from datetime import date
    assert tarih(date(2026, 2, 14)) == "14.02.2026"


def test_upper_tr():
    assert upper_tr("istanbul ısparta") == "İSTANBUL ISPARTA"


def test_lower_tr():
    assert lower_tr("İSTANBUL ISPARTA") == "istanbul ısparta"


def test_empty_string():
    assert tr_currency("") == ""
    assert tarih("") == ""
    assert upper_tr("") == ""
    assert lower_tr("") == ""


if __name__ == "__main__":
    test_tr_currency_basic()
    test_tr_currency_none()
    test_tr_currency_string_input()
    test_tarih_iso_string()
    test_tarih_none()
    test_tarih_datetime()
    test_tarih_date()
    test_upper_tr()
    test_lower_tr()
    test_empty_string()
    print("All assertions passed!")
