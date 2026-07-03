from __future__ import annotations

import uvicorn


def serve() -> None:
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)