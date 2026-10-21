# One image: Vite UI + FastAPI + PeTTa/SWI-Prolog, served together by kabla.web:app (UI at /, API at /api).
# Used for Fly (fly.toml), Railway (railway.toml) and local docker.
FROM node:22-bookworm-slim AS web
WORKDIR /web
COPY web/package.json web/package-lock.json* ./
RUN npm ci || npm install
COPY web/ ./
ENV VITE_API_URL=/api
RUN npm run build

FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive \
    KABLA_MODE=deterministic \
    PETTA_HOME=/app/.vendor/PeTTa \
    KABLA_DB=/data/kabla.sqlite \
    KABLA_KEY_DIR=/data/keys \
    PYTHONUNBUFFERED=1
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        software-properties-common git ca-certificates python3 python3-pip python3-venv \
    && apt-add-repository -y ppa:swi-prolog/stable \
    && apt-get update \
    && apt-get install -y --no-install-recommends swi-prolog-nox \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . /app
COPY --from=web /web/dist /app/web/dist
RUN python3 scripts/setup_petta.py \
    && python3 -m pip install --break-system-packages --no-cache-dir -e "api[dev]" \
    && mkdir -p /data
EXPOSE 8000
CMD ["sh", "-c", "python3 -m kabla.cli init && python3 -m uvicorn kabla.web:app --host 0.0.0.0 --port ${PORT:-8000}"]
