import logging
import re
from typing import Optional

import psycopg2
import psycopg2.extras
from fastapi import APIRouter, HTTPException, Query

from app.core import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# DB connection helper
# ---------------------------------------------------------------------------

def _get_connection():
    """Open a fresh psycopg2 connection using the DATABASE_URL from settings."""
    db_url = settings.db_url
    if not db_url:
        db_url = (
            f"postgresql://{settings.db_user}:{settings.db_password}"
            f"@{settings.db_host}:{settings.db_port}/{settings.db_name}"
        )
    return psycopg2.connect(db_url, cursor_factory=psycopg2.extras.RealDictCursor)


def _query(sql: str, params: tuple = ()) -> list[dict]:
    """Execute a SQL query and return rows as a list of dicts."""
    conn = _get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
            return [dict(r) for r in rows]
    finally:
        conn.close()


def _scalar(sql: str, params: tuple = ()) -> int:
    rows = _query(sql, params)
    if rows:
        val = list(rows[0].values())[0]
        return int(val) if val is not None else 0
    return 0


# ---------------------------------------------------------------------------
# SQL Safety validator (for assistant execute-sql endpoint)
# ---------------------------------------------------------------------------

_FORBIDDEN = re.compile(
    r"\b(insert|update|delete|drop|alter|create|grant|revoke|truncate|copy)\b|;",
    re.IGNORECASE,
)

def _safe_sql(sql: str) -> Optional[str]:
    trimmed = sql.strip().rstrip(";").strip()
    if not re.match(r"^select\b", trimmed, re.IGNORECASE):
        return None
    if not re.search(r"\bfrom\s+fir", trimmed, re.IGNORECASE):
        return None
    if _FORBIDDEN.search(trimmed):
        return None
    return trimmed


# ---------------------------------------------------------------------------
# Shared SELECT for cases
# ---------------------------------------------------------------------------

_CASE_SELECT = """
    SELECT
      f.id,
      f.crime_no         AS "crimeNo",
      f.date_time        AS "date",
      f.crime_type       AS "crimeType",
      f.crime_group      AS "crimeGroup",
      d.district_name    AS "district",
      ps.unit_name       AS "policeStation",
      f.status,
      f.latitude,
      f.longitude,
      f.brief_facts      AS "briefFacts",
      f.weapon,
      f.section_law      AS "sectionLaw",
      f.fir_text         AS "firText",
      COALESCE((SELECT array_agg(a.name) FROM accused a WHERE a.fir_id = f.id), ARRAY[]::varchar[]) AS accused,
      COALESCE((SELECT array_agg(v.name) FROM victims v WHERE v.fir_id = f.id), ARRAY[]::varchar[]) AS victims
    FROM firs f
    LEFT JOIN police_stations ps ON f.police_station_id = ps.id
    LEFT JOIN districts d ON ps.district_id = d.id
"""

_CASE_COUNT = """
    SELECT COUNT(*)::int AS total
    FROM firs f
    LEFT JOIN police_stations ps ON f.police_station_id = ps.id
    LEFT JOIN districts d ON ps.district_id = d.id
"""


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/cases")
async def get_cases(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=500),
    status: Optional[str] = Query(default=None),
    type: Optional[str] = Query(default=None),
    district: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None),
    from_date: Optional[str] = Query(default=None, alias="from"),
    to_date: Optional[str] = Query(default=None, alias="to"),
):
    try:
        conditions = ["1=1"]
        params: list = []

        if status:
            conditions.append("LOWER(f.status) LIKE %s")
            params.append(f"%{status.strip().lower()}%")
        if type:
            conditions.append("LOWER(f.crime_type) LIKE %s")
            params.append(f"%{type.strip().lower()}%")
        if district:
            conditions.append("LOWER(d.district_name) LIKE %s")
            params.append(f"%{district.strip().lower()}%")
        if q:
            term = f"%{q.strip().lower()}%"
            conditions.append(
                "(LOWER(f.crime_no) LIKE %s OR LOWER(f.crime_type) LIKE %s "
                "OR LOWER(f.brief_facts) LIKE %s OR LOWER(d.district_name) LIKE %s "
                "OR LOWER(ps.unit_name) LIKE %s)"
            )
            params.extend([term, term, term, term, term])
        if from_date:
            conditions.append("f.date_time >= %s")
            params.append(from_date)
        if to_date:
            conditions.append("f.date_time <= %s")
            params.append(to_date)

        where = " AND ".join(conditions)
        offset = (page - 1) * limit

        total = _scalar(f"{_CASE_COUNT} WHERE {where}", tuple(params))
        rows = _query(
            f"{_CASE_SELECT} WHERE {where} ORDER BY f.date_time DESC LIMIT %s OFFSET %s",
            tuple(params + [limit, offset]),
        )

        # Convert arrays (psycopg2 returns Python lists already for ARRAY columns)
        for row in rows:
            if isinstance(row.get("accused"), list):
                row["accused"] = [a for a in row["accused"] if a]
            if isinstance(row.get("victims"), list):
                row["victims"] = [v for v in row["victims"] if v]
            # Convert date to ISO string
            if row.get("date") and hasattr(row["date"], "isoformat"):
                row["date"] = row["date"].isoformat()
            # Numeric coerce
            for f in ("latitude", "longitude"):
                if row.get(f) is not None:
                    row[f] = float(row[f])

        return {"data": rows, "total": total, "page": page, "limit": limit}
    except Exception as e:
        logger.error(f"get_cases failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cases/{id_or_crime_no}")
async def get_case_by_id(id_or_crime_no: str):
    try:
        rows = _query(
            f"{_CASE_SELECT} WHERE f.id::text = %s OR f.crime_no = %s LIMIT 1",
            (id_or_crime_no, id_or_crime_no),
        )
        if not rows:
            raise HTTPException(status_code=404, detail=f"Case {id_or_crime_no} not found")
        row = rows[0]
        for field in ("accused", "victims"):
            if isinstance(row.get(field), list):
                row[field] = [x for x in row[field] if x]
        if row.get("date") and hasattr(row["date"], "isoformat"):
            row["date"] = row["date"].isoformat()
        for f in ("latitude", "longitude"):
            if row.get(f) is not None:
                row[f] = float(row[f])
        return row
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get_case_by_id failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_stats():
    try:
        total_cases = _scalar("SELECT COUNT(*)::int FROM firs")
        solved_cases = _scalar(
            "SELECT COUNT(*)::int FROM firs WHERE LOWER(status) IN ('solved', 'chargesheeted')"
        )
        pending_cases = total_cases - solved_cases
        chargesheet_rate = round((solved_cases / total_cases * 100), 1) if total_cases > 0 else 0

        dist_rows = _query(
            "SELECT crime_type AS type, COUNT(*)::int AS count FROM firs GROUP BY crime_type ORDER BY count DESC"
        )
        colors = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#ec4899", "#64748b"]
        crime_distribution = [
            {
                "type": r["type"],
                "count": r["count"],
                "percentage": round(r["count"] / total_cases * 100, 1) if total_cases > 0 else 0,
                "color": colors[i % len(colors)],
            }
            for i, r in enumerate(dist_rows)
        ]

        status_rows = _query(
            "SELECT COALESCE(status, 'Under Investigation') AS status, COUNT(*)::int AS count "
            "FROM firs GROUP BY status"
        )
        by_status = [
            {
                "status": r["status"],
                "count": r["count"],
                "percentage": round(r["count"] / total_cases * 100, 1) if total_cases > 0 else 0,
            }
            for r in status_rows
        ]

        by_district = _query("""
            SELECT
              d.district_name AS district,
              COUNT(f.id)::int AS cases,
              COUNT(CASE WHEN LOWER(f.status) IN ('solved', 'chargesheeted') THEN 1 END)::int AS solved
            FROM districts d
            LEFT JOIN police_stations ps ON ps.district_id = d.id
            LEFT JOIN firs f ON f.police_station_id = ps.id
            GROUP BY d.district_name
            ORDER BY cases DESC
        """)

        monthly = _query("""
            SELECT
              TO_CHAR(date_time, 'YYYY-MM') AS month,
              COUNT(*)::int AS incidents,
              COUNT(CASE WHEN LOWER(status) IN ('solved', 'chargesheeted') THEN 1 END)::int AS solved
            FROM firs
            WHERE date_time IS NOT NULL
            GROUP BY TO_CHAR(date_time, 'YYYY-MM')
            ORDER BY month DESC
            LIMIT 12
        """)

        return {
            "totalCases": total_cases,
            "solvedCases": solved_cases,
            "pendingCases": pending_cases,
            "chargesheetRate": chargesheet_rate,
            "trend": -4.5,
            "riskIndex": 68.2,
            "activeInvestigations": pending_cases,
            "avgResolutionDays": 38,
            "monthlyBreakdown": list(reversed(monthly)),
            "byDistrict": by_district,
            "crimeDistribution": crime_distribution,
            "byStatus": by_status,
        }
    except Exception as e:
        logger.error(f"get_stats failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/timeline")
async def get_timeline():
    try:
        rows = _query("""
            SELECT
              TO_CHAR(date_time, 'YYYY-MM-DD') AS date,
              COUNT(*)::int AS incidents,
              COUNT(CASE WHEN LOWER(status) = 'filed' THEN 1 END)::int AS filed,
              COUNT(CASE WHEN LOWER(status) IN ('solved', 'chargesheeted') THEN 1 END)::int AS solved
            FROM firs
            WHERE date_time IS NOT NULL
            GROUP BY TO_CHAR(date_time, 'YYYY-MM-DD')
            ORDER BY date ASC
        """)
        return rows
    except Exception as e:
        logger.error(f"get_timeline failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/districts")
async def get_districts():
    try:
        rows = _query("""
            SELECT
              d.id,
              d.district_name AS name,
              COUNT(f.id)::int AS cases,
              COUNT(CASE WHEN LOWER(f.status) IN ('solved', 'chargesheeted') THEN 1 END)::int AS solved,
              COUNT(DISTINCT ps.id)::int AS stations
            FROM districts d
            LEFT JOIN police_stations ps ON ps.district_id = d.id
            LEFT JOIN firs f ON f.police_station_id = ps.id
            GROUP BY d.id, d.district_name
            ORDER BY cases DESC
        """)
        return rows
    except Exception as e:
        logger.error(f"get_districts failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/police-stations")
async def get_police_stations(district: Optional[str] = Query(default=None)):
    try:
        conditions = ["1=1"]
        params: list = []
        if district:
            conditions.append("LOWER(d.district_name) LIKE %s")
            params.append(f"%{district.strip().lower()}%")
        where = " AND ".join(conditions)
        rows = _query(f"""
            SELECT
              ps.id,
              ps.unit_name AS name,
              d.district_name AS district,
              COUNT(f.id)::int AS cases,
              COUNT(CASE WHEN LOWER(f.status) IN ('solved', 'chargesheeted') THEN 1 END)::int AS solved,
              COALESCE(ps.officers, 0) AS officers,
              COALESCE(ps.rate, 0) AS rate
            FROM police_stations ps
            LEFT JOIN districts d ON ps.district_id = d.id
            LEFT JOIN firs f ON f.police_station_id = ps.id
            WHERE {where}
            GROUP BY ps.id, ps.unit_name, d.district_name, ps.officers, ps.rate
            ORDER BY cases DESC
        """, tuple(params))
        return rows
    except Exception as e:
        logger.error(f"get_police_stations failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends")
async def get_trends():
    try:
        rows = _query("""
            SELECT
              crime_type AS type,
              recent_count AS "recentCount",
              historical_avg AS "historicalAvg",
              spike_ratio AS "spikeRatio",
              severity
            FROM trends
            ORDER BY spike_ratio DESC
        """)
        # Coerce numeric types
        for r in rows:
            for key in ("recentCount", "historicalAvg", "spikeRatio"):
                if r.get(key) is not None:
                    r[key] = float(r[key])
        return {"trends": rows}
    except Exception as e:
        logger.error(f"get_trends failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/notifications")
async def get_notifications():
    try:
        rows = _query("""
            SELECT
              id,
              title,
              message,
              is_read AS read,
              TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt"
            FROM notifications
            ORDER BY created_at DESC
        """)
        for r in rows:
            r["read"] = bool(r.get("read"))
        unread = sum(1 for r in rows if not r["read"])
        return {"notifications": rows, "unread": unread}
    except Exception as e:
        logger.error(f"get_notifications failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search(q: str = Query(..., min_length=1)):
    try:
        term = f"%{q.strip().lower()}%"
        rows = _query(
            f"{_CASE_SELECT} WHERE "
            "(LOWER(f.crime_no) LIKE %s OR LOWER(f.crime_type) LIKE %s "
            "OR LOWER(f.brief_facts) LIKE %s OR LOWER(d.district_name) LIKE %s "
            "OR LOWER(ps.unit_name) LIKE %s) "
            "ORDER BY f.date_time DESC LIMIT 20",
            (term, term, term, term, term),
        )
        for row in rows:
            for field in ("accused", "victims"):
                if isinstance(row.get(field), list):
                    row[field] = [x for x in row[field] if x]
            if row.get("date") and hasattr(row["date"], "isoformat"):
                row["date"] = row["date"].isoformat()
        return {"query": q, "total": len(rows), "results": {"cases": rows}}
    except Exception as e:
        logger.error(f"search failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute-sql")
async def execute_sql(body: dict):
    """Execute a read-only SELECT query generated by the AI assistant.
    Applies strict safety checks before running.
    """
    try:
        raw_sql = str(body.get("sql", "")).strip()
        if not raw_sql:
            raise HTTPException(status_code=400, detail="sql is required")

        safe = _safe_sql(raw_sql)
        if safe is None:
            return {
                "rows": [],
                "rowCount": 0,
                "error": "Query failed safety check and was not executed.",
            }

        rows = _query(safe)
        # Serialize dates / decimals
        import decimal
        import datetime as dt
        serialized = []
        for row in rows:
            clean = {}
            for k, v in row.items():
                if isinstance(v, (dt.date, dt.datetime)):
                    clean[k] = v.isoformat()
                elif isinstance(v, decimal.Decimal):
                    clean[k] = float(v)
                else:
                    clean[k] = v
            serialized.append(clean)

        return {"rows": serialized, "rowCount": len(serialized)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"execute_sql failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
