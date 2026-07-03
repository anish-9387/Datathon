import re
import hashlib
from typing import Optional
from datetime import datetime, date

import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

from app.core import settings, KARNATAKA_DISTRICTS, CRIME_TYPES, FESTIVAL_DATES_2025_2026, SALARY_DAYS


_MODEL: Optional[SentenceTransformer] = None


def get_embedding_model() -> SentenceTransformer:
    global _MODEL
    if _MODEL is None:
        _MODEL = SentenceTransformer(settings.embedding_model)
    return _MODEL


def encode_fir_text(fir_text: str) -> np.ndarray:
    model = get_embedding_model()
    return model.encode(fir_text, normalize_embeddings=True)


def build_fir_fingerprint(
    time_of_day: str = "",
    location_type: str = "",
    weapon: str = "",
    victim_profile: str = "",
    accused_profile: str = "",
    section: str = "",
    district: str = "",
    crime_type: str = "",
) -> str:
    fields = [
        time_of_day.lower().strip(),
        location_type.lower().strip(),
        weapon.lower().strip(),
        victim_profile.lower().strip(),
        accused_profile.lower().strip(),
        section.lower().strip(),
        district.lower().strip(),
        crime_type.lower().strip(),
    ]
    raw = "|".join(fields)
    h = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]
    return h


def create_mo_feature_vector(
    hour_of_day: int = 0,
    day_of_week: int = 0,
    crime_type: str = "Unknown",
    location: str = "Unknown",
    weapon: str = "Unknown",
    escape_mode: str = "Unknown",
    location_type: str = "Unknown",
    victim_profile: str = "Unknown",
    accused_profile: str = "Unknown",
) -> np.ndarray:
    vec = [
        np.sin(2 * np.pi * hour_of_day / 24),
        np.cos(2 * np.pi * hour_of_day / 24),
        np.sin(2 * np.pi * day_of_week / 7),
        np.cos(2 * np.pi * day_of_week / 7),
        _hash_categorical(crime_type, 20),
        _hash_categorical(location, 50),
        _hash_categorical(weapon, 20),
        _hash_categorical(escape_mode, 10),
        _hash_categorical(location_type, 10),
        _hash_categorical(victim_profile, 20),
        _hash_categorical(accused_profile, 20),
    ]
    return np.array(vec, dtype=np.float32)


def _hash_categorical(value: str, modulus: int) -> float:
    if not value or value == "Unknown":
        return 0.0
    return float(hash(value.lower()) % modulus) / float(modulus)


def extract_time_features(dt: Optional[datetime]) -> dict:
    if dt is None:
        now = datetime.now()
        dt = now
    features = {
        "hour": dt.hour,
        "day": dt.day,
        "month": dt.month,
        "day_of_week": dt.weekday(),
        "is_weekend": 1 if dt.weekday() >= 5 else 0,
        "is_festival": 1 if (dt.month, dt.day) in FESTIVAL_DATES_2025_2026 else 0,
        "is_salary_day": 1 if dt.day in SALARY_DAYS else 0,
        "sin_hour": np.sin(2 * np.pi * dt.hour / 24),
        "cos_hour": np.cos(2 * np.pi * dt.hour / 24),
        "sin_month": np.sin(2 * np.pi * dt.month / 12),
        "cos_month": np.cos(2 * np.pi * dt.month / 12),
    }
    return features


def extract_mo_fingerprint(fir: dict) -> dict:
    dt = fir.get("date_time")
    if dt and isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt)
        except ValueError:
            dt = None

    time_feats = extract_time_features(dt)

    return {
        "hour_of_day": time_feats["hour"],
        "day_of_week": time_feats["day_of_week"],
        "is_night": 1 if time_feats["hour"] < 6 or time_feats["hour"] >= 21 else 0,
        "crime_type": fir.get("crime_type", "Unknown"),
        "location": fir.get("location", "Unknown"),
        "location_type": fir.get("location_type", "Unknown"),
        "weapon": fir.get("weapon", "Unknown"),
        "escape_mode": fir.get("escape_mode", "Unknown"),
        "victim_profile": fir.get("victim_profile", "Unknown"),
        "accused_profile": fir.get("accused_profile", "Unknown"),
        "district": fir.get("district", "Unknown"),
        "section_law": fir.get("section_law", ""),
    }


def extract_location_features(fir: dict) -> dict:
    lat = fir.get("latitude")
    lng = fir.get("longitude")
    district = fir.get("district", "Unknown")

    if lat is not None and lng is not None:
        return {
            "latitude": float(lat),
            "longitude": float(lng),
            "sin_lat": np.sin(float(lat) * np.pi / 180),
            "cos_lat": np.cos(float(lat) * np.pi / 180),
            "sin_lng": np.sin(float(lng) * np.pi / 180),
            "cos_lng": np.cos(float(lng) * np.pi / 180),
            "district": district,
        }

    from app.core import KARNATAKA_COORDS
    coords = KARNATAKA_COORDS.get(district)
    if coords:
        return {
            "latitude": coords["lat"],
            "longitude": coords["lng"],
            "sin_lat": np.sin(coords["lat"] * np.pi / 180),
            "cos_lat": np.cos(coords["lat"] * np.pi / 180),
            "sin_lng": np.sin(coords["lng"] * np.pi / 180),
            "cos_lng": np.cos(coords["lng"] * np.pi / 180),
            "district": district,
        }

    return {
        "latitude": 0.0,
        "longitude": 0.0,
        "sin_lat": 0.0,
        "cos_lat": 0.0,
        "sin_lng": 0.0,
        "cos_lng": 0.0,
        "district": district,
    }


def extract_keywords(text: str) -> list[str]:
    stop_words = {
        "the", "a", "an", "is", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would",
        "shall", "should", "may", "might", "can", "could",
        "in", "on", "at", "to", "for", "of", "by", "with", "from",
        "and", "or", "but", "not", "so", "if", "as",
        "this", "that", "these", "those", "it", "its",
        "he", "she", "they", "them", "their", "his", "her",
        "i", "we", "you", "me", "my", "our", "your",
        "reported", "stated", "says", "said", "told",
    }
    words = re.findall(r"[a-zA-Z]+", text.lower())
    keywords = [w for w in words if w not in stop_words and len(w) > 2]
    freq: dict[str, int] = {}
    for w in keywords:
        freq[w] = freq.get(w, 0) + 1
    sorted_kw = sorted(freq.items(), key=lambda x: -x[1])
    return [kw for kw, _ in sorted_kw[:20]]


def sentence_tokenize(text: str) -> list[str]:
    sentences = re.split(r"[.!?]+", text)
    return [s.strip() for s in sentences if len(s.strip()) > 10]


def summarize_text(text: str, max_sentences: int = 5) -> str:
    sentences = sentence_tokenize(text)
    if not sentences:
        return text[:500]

    words = re.findall(r"[a-zA-Z]+", text.lower())
    stop_words = {
        "the", "a", "an", "is", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would",
        "in", "on", "at", "to", "for", "of", "by", "with", "from",
        "and", "or", "but", "not", "so", "if", "as",
    }
    word_freq: dict[str, int] = {}
    total_words = 0
    for w in words:
        if w not in stop_words and len(w) > 2:
            word_freq[w] = word_freq.get(w, 0) + 1
            total_words += 1

    if total_words == 0:
        return text[:500]

    sentence_scores: list[tuple[float, str]] = []
    for sent in sentences:
        sent_lower = sent.lower()
        sent_words = re.findall(r"[a-zA-Z]+", sent_lower)
        if not sent_words:
            continue
        score = sum(word_freq.get(w, 0) for w in sent_words) / len(sent_words)

        if any(kw in sent_lower for kw in ["arrested", "stolen", "murder", "robbery",
                                            "kidnapped", "burglary", "assault"]):
            score *= 1.5
        if any(kw in sent_lower for kw in ["investigation", "pray", "therefore",
                                            "request", "humble"]):
            score *= 0.7
        sentence_scores.append((score, sent))

    sentence_scores.sort(key=lambda x: -x[0])
    top_sentences = sentence_scores[:max_sentences]
    top_sentences.sort(key=lambda s: sentences.index(s[1]))

    summary = ". ".join(s for _, s in top_sentences)
    if summary:
        summary += "."
    return summary if summary else text[:500]


def nl_to_sql(natural_language: str) -> tuple[str, str]:
    nl = natural_language.lower().strip()

    select = "SELECT * FROM fir"
    conditions: list[str] = []
    explanation_parts: list[str] = []

    crime_map = {
        "robbery": "Robbery", "burglary": "Burglary", "theft": "Theft",
        "assault": "Assault", "homicide": "Homicide", "murder": "Homicide",
        "kidnapping": "Kidnapping", "kidnap": "Kidnapping",
        "cyber": "Cyber Crime", "fraud": "Fraud", "drug": "Drug Offense",
        "sexual": "Sexual Offense", "arson": "Arson", "extortion": "Extortion",
        "riot": "Riots", "vehicle theft": "Vehicle Theft",
        "snatching": "Theft", "chain snatching": "Theft",
    }
    for keyword, crime_type in crime_map.items():
        if keyword in nl:
            conditions.append(f"crime_type = '{crime_type}'")
            explanation_parts.append(f"filter by crime type '{crime_type}'")
            break

    time_conditions = {
        r"(\d+)\s*pm": lambda m: f"EXTRACT(HOUR FROM date_time) BETWEEN {int(m.group(1)) + 12 if int(m.group(1)) < 12 else int(m.group(1))} AND 23",
        r"(\d+)\s*am": lambda m: f"EXTRACT(HOUR FROM date_time) BETWEEN 0 AND {int(m.group(1))}",
        r"after\s+(\d+)\s*(pm|am)": lambda m: _time_after(m),
        r"before\s+(\d+)\s*(pm|am)": lambda m: _time_before(m),
        r"between\s+(\d+)\s*(pm|am)\s+and\s+(\d+)\s*(pm|am)": lambda m: _time_between(m),
        r"(today|yesterday|last\s+week|last\s+month|this\s+month)": lambda m: _relative_date(m, nl),
        r"(\d{4}-\d{2}-\d{2})": lambda m: f"date_time >= '{m.group(1)}'::timestamp AND date_time < '{m.group(1)}'::timestamp + INTERVAL '1 day'",
    }
    for pattern, handler in time_conditions.items():
        m = re.search(pattern, nl)
        if m:
            cond = handler(m)
            if cond:
                conditions.append(cond)
                explanation_parts.append(f"filter by time range")
            break

    district_map = {
        "bengaluru": "Bengaluru Urban", "bangalore": "Bengaluru Urban",
        "mysuru": "Mysuru", "mysore": "Mysuru", "belagavi": "Belagavi",
        "belgaum": "Belagavi", "hubli": "Dharwad", "dharwad": "Dharwad",
        "mangaluru": "Dakshina Kannada", "mangalore": "Dakshina Kannada",
    }
    for keyword, district in district_map.items():
        if keyword in nl:
            conditions.append(f"district = '{district}'")
            explanation_parts.append(f"filter by district '{district}'")
            break

    if re.search(r"\b(with|using)\s+(\w+)", nl):
        m = re.search(r"\b(with|using)\s+(\w+)", nl)
        weapon = m.group(2).capitalize()
        conditions.append(f"(weapon ILIKE '%{weapon}%' OR weapon = '{weapon}')")
        explanation_parts.append(f"filter by weapon '{weapon}'")

    if re.search(r"\b(open|pending|under investigation)\b", nl):
        val = "Under Investigation" if "under investigation" in nl else ("Open" if "open" in nl else "Pending")
        conditions.append(f"status = '{val}'")
        explanation_parts.append(f"filter by status '{val}'")

    distance_match = re.search(r"within\s+(\d+(?:\.\d+)?)\s*(km|kms|kilometers|meters|m)\s+of\s+(.+)", nl)
    if distance_match:
        dist_value = float(distance_match.group(1))
        unit = distance_match.group(2)
        if unit in ("m", "meters"):
            dist_value /= 1000.0
        location_name = distance_match.group(3).strip()
        conditions.append(f"ST_DWithin(location_geom, ST_GeomFromText('POINT({{lng}} {{lat}})', 4326), {dist_value * 1000})")
        explanation_parts.append(f"filter within {dist_value}km of '{location_name}'")

    if re.search(r"\blast\s+(\d+)\s+(day|week|month|year)s?\b", nl):
        m = re.search(r"\blast\s+(\d+)\s+(day|week|month|year)s?\b", nl)
        num = int(m.group(1))
        unit = m.group(2)
        conditions.append(f"date_time >= NOW() - INTERVAL '{num} {unit}s'")
        explanation_parts.append(f"filter by last {num} {unit}s")

    order = ""
    if re.search(r"\b(recent|latest|newest)\b", nl):
        order = " ORDER BY date_time DESC"
        explanation_parts.append("ordered by most recent")
    elif re.search(r"\b(oldest|earliest)\b", nl):
        order = " ORDER BY date_time ASC"
        explanation_parts.append("ordered by oldest first")

    limit = ""
    limit_match = re.search(r"\b(top|limit|first)\s+(\d+)\b", nl)
    if limit_match:
        limit = f" LIMIT {limit_match.group(2)}"
        explanation_parts.append(f"limit to top {limit_match.group(2)} results")
    if re.search(r"\ba lot\b|\bmany\b", nl):
        limit = " LIMIT 25"
    if not limit:
        limit = " LIMIT 50"

    where = ""
    if conditions:
        where = " WHERE " + " AND ".join(conditions)

    sql = select + where + order + limit
    explanation = " | ".join(explanation_parts) if explanation_parts else "No specific filters detected, returning recent FIRs"
    return sql, explanation


def _time_after(m: re.Match) -> str:
    hour = int(m.group(1))
    period = m.group(2)
    if period == "pm" and hour < 12:
        hour += 12
    return f"EXTRACT(HOUR FROM date_time) >= {hour}"


def _time_before(m: re.Match) -> str:
    hour = int(m.group(1))
    period = m.group(2)
    if period == "pm" and hour < 12:
        hour += 12
    return f"EXTRACT(HOUR FROM date_time) <= {hour}"


def _time_between(m: re.Match) -> str:
    h1 = int(m.group(1))
    p1 = m.group(2)
    h2 = int(m.group(3))
    p2 = m.group(4)
    if p1 == "pm" and h1 < 12:
        h1 += 12
    if p2 == "pm" and h2 < 12:
        h2 += 12
    if p1 == "am" and h1 == 12:
        h1 = 0
    if p2 == "am" and h2 == 12:
        h2 = 0
    return f"EXTRACT(HOUR FROM date_time) BETWEEN {h1} AND {h2}"


def _relative_date(m: re.Match, full_text: str) -> str:
    match_str = m.group(1)
    import datetime as dtmod
    today = date.today()
    if match_str == "today":
        return f"date_time >= '{today}'::date AND date_time < '{today}'::date + INTERVAL '1 day'"
    elif match_str == "yesterday":
        yesterday = today - dtmod.timedelta(days=1)
        return f"date_time >= '{yesterday}'::date AND date_time < '{today}'::date"
    elif match_str == "last week":
        week_ago = today - dtmod.timedelta(days=7)
        return f"date_time >= '{week_ago}'::date"
    elif match_str in ("last month", "this month"):
        if match_str == "last month":
            first_of_month = today.replace(day=1) - dtmod.timedelta(days=1)
            first_of_month = first_of_month.replace(day=1)
        else:
            first_of_month = today.replace(day=1)
        return f"date_time >= '{first_of_month}'::date"
    return ""
