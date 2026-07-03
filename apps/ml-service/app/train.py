from __future__ import annotations

from pathlib import Path

import pandas as pd

from app.models import CrimeForecaster


def _load_training_rows(data_dir: Path) -> list[dict]:
    rows: list[dict] = []

    district_files = [
        data_dir / "ka-district-wise-2024.csv",
        data_dir / "ka-district-wise-2025.csv",
        data_dir / "ka-crime-review-2024.csv",
    ]

    for file_path in district_files:
        if not file_path.exists():
            continue

        frame = pd.read_csv(file_path)
        for _, row in frame.iterrows():
            district = row.get("DISTRICT/UNITS", row.get("Districts/Units", row.get("HEADS CIRME", "Unknown")))
            if pd.isna(district) or str(district).startswith("Unnamed"):
                continue

            numeric_values = [float(value) for value in row.values if isinstance(value, (int, float)) and not pd.isna(value)]
            total_count = sum(numeric_values) if numeric_values else 1.0

            rows.append({
                "district": str(district).strip(),
                "crime_type": str(row.get("MAJOR HEADS", row.get("Districts/Units", "Unknown"))).strip(),
                "population_density": float(total_count),
                "historical_crime_count": float(total_count),
                "hour": 21,
                "day": 15,
                "month": 6,
                "day_of_week": 5,
                "is_weekend": True,
                "is_festival": False,
                "is_salary_day": False,
            })

    return rows


def main() -> None:
    service_root = Path(__file__).resolve().parents[1]
    data_dir = service_root.parent.parent / "data"

    forecaster = CrimeForecaster()
    rows = _load_training_rows(data_dir)
    artifact = forecaster.train_from_records(rows)

    print(f"Trained forecasting model with {artifact.get('metrics', {}).get('records', 0)} rows")
    print(f"Saved artifact to {forecaster.artifact_path}")


if __name__ == "__main__":
    main()