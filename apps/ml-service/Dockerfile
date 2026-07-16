FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required by sentence-transformers
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files first for better caching
COPY pyproject.toml requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the sentence-transformers model
RUN python3 -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Start the service
# PORT env var is set by Catalyst AppSail (default 9000 if not set)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
