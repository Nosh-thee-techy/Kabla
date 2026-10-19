# Thin wrapper over scripts/tasks.py so the same targets work on Windows
# (python scripts/tasks.py <target>) and on Linux/macOS (make <target>).
PY ?= python3

.PHONY: setup run api web test test-metta test-api demo verify lint

setup:
	$(PY) scripts/tasks.py setup

run:
	$(PY) scripts/tasks.py run

api:
	$(PY) scripts/tasks.py api

web:
	$(PY) scripts/tasks.py web

test:
	$(PY) scripts/tasks.py test

test-metta:
	$(PY) scripts/tasks.py test-metta

test-api:
	$(PY) scripts/tasks.py test-api

demo:
	$(PY) scripts/tasks.py demo

verify:
	$(PY) scripts/tasks.py verify

lint:
	$(PY) scripts/tasks.py lint
