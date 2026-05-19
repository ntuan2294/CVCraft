install:
	pip install -e ".[api,dev]"

frontend-install:
	cd frontend && npm install

frontend:
	cd frontend && npm run dev

dev:
	python scripts/dev.py

api-generate:
	uvicorn generate_cv.api.main:app --reload --port 8000

api-jd:
	uvicorn jd_search.api.main:app --reload --port 8001

generate:
	generate-cv generate

generate-build-index:
	generate-cv build-index

generate-rag-stats:
	generate-cv rag-stats

jd-build-seed-index:
	jd-search build-seed-index

jd-build-index:
	jd-search build-jd-index

jd-search:
	jd-search jd-search "$(QUERY)"

test:
	pytest

test-generate:
	pytest generate-cv/tests -v

test-jd:
	pytest jd-search/tests -v

lint:
	ruff check generate-cv/src jd-search/src shared/src

.PHONY: install frontend-install frontend dev api-generate api-jd generate generate-build-index generate-rag-stats jd-build-seed-index jd-build-index jd-search test test-generate test-jd lint
