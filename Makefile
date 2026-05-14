.PHONY: install dev-install run test test-unit lint build-index build-index-hf api docker-build

# === SETUP ===
install:
	pip install -e .

dev-install:
	pip install -e ".[dev,api]"

# === RUN ===
run:
	python -m cvcraft.cli.commands generate

api:
	uvicorn cvcraft.api.main:app --reload --port 8000

# === RAG INDEX ===
build-index:
	python -m cvcraft.rag.indexing.indexer

build-index-reset:
	python -m cvcraft.rag.indexing.indexer --reset

build-index-hf:
	python -m cvcraft.rag.indexing.hf_indexer

# === TEST ===
test:
	pytest tests/ -v

test-unit:
	pytest tests/unit/ -v

test-e2e:
	pytest tests/e2e/ -v -m e2e

# === LINT ===
lint:
	ruff check src/ tests/

lint-fix:
	ruff check --fix src/ tests/

# === DOCKER ===
docker-build:
	docker build -t cvcraft:latest .

docker-run:
	docker run --env-file .env cvcraft:latest
