from __future__ import annotations

import os

import uvicorn


def serve() -> None:
    port = int(os.getenv("PORT", os.getenv("X_ZOHO_CATALYST_LISTEN_PORT", "8000")))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)