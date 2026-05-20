install:
	pip install -e ".[api,dev]"

frontend-install:
	cd frontend && npm install

dev:
	python scripts/dev.py

frontend:
	cd frontend && npm run dev

api:
	uvicorn gateway:app --reload --port 8000

generate:
	generate-cv generate

build-index:
	generate-cv build-index

build-hf-index:
	generate-cv build-hf-index

rag-stats:
	generate-cv rag-stats

jd-build-seed-index:
	jd-search build-seed-index

jd-build-index:
	jd-search build-jd-index

jd-search:
	jd-search jd-search "$(QUERY)"

jd-stats:
	jd-search jd-stats

test:
	pytest

lint:
	ruff check backend/src

.PHONY: install frontend-install dev frontend api generate build-index build-hf-index rag-stats jd-build-seed-index jd-build-index jd-search jd-stats test lint
