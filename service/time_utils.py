# time_utils.py
from __future__ import annotations
from typing import Optional, Tuple, Dict
from datetime import datetime, timedelta
import dateparser

def parse_natural_date(text: str, base_dt: Optional[datetime] = None) -> Optional[datetime]:
    return dateparser.parse(text, settings={"RELATIVE_BASE": base_dt or datetime.now()})

def month_bounds(dt: datetime) -> Tuple[datetime, datetime]:
    start = dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1) - timedelta(microseconds=1)
    else:
        end = start.replace(month=start.month + 1) - timedelta(microseconds=1)
    return start, end

def last_month_range(base: Optional[datetime] = None) -> Tuple[datetime, datetime]:
    base = base or datetime.now()
    prev_month = (base.replace(day=1) - timedelta(days=1))
    return month_bounds(prev_month)

def normalize_timeframe(entities: Dict) -> Dict:
    """
    Accepts entities that might contain:
      - date (e.g., '2025-09-02' or '2nd September')
      - timeframe ('last_month', 'last one month', 'yesterday', 'today')
    Returns dict possibly augmented with ISO 'start_date'/'end_date'.
    """
    base = datetime.now()
    out = dict(entities)

    # Explicit 'date' normalization (free text or ISO)
    if "date" in out and out["date"]:
        dt = parse_natural_date(str(out["date"]), base_dt=base)
        if dt:
            out["date"] = dt.date().isoformat()

    tf = (out.get("timeframe") or "").lower().strip()

    if tf in {"last_month", "last one month", "previous month"}:
        s, e = last_month_range(base)
        out["start_date"] = s.date().isoformat()
        out["end_date"] = e.date().isoformat()
    elif tf in {"yesterday"}:
        y = (base - timedelta(days=1)).date()
        out["start_date"] = y.isoformat()
        out["end_date"] = y.isoformat()
    elif tf in {"today"}:
        t = base.date()
        out["start_date"] = t.isoformat()
        out["end_date"] = t.isoformat()
    elif tf.startswith("last ") and "day" in tf:
        # e.g. "last 7 days"
        try:
            n = int(tf.split()[1])
            s = (base - timedelta(days=n)).date().isoformat()
            e = base.date().isoformat()
            out["start_date"] = s
            out["end_date"] = e
        except Exception:
            pass

    return out
