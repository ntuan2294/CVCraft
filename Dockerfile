FROM python:3.11-slim

WORKDIR /app

# Install deps trước (cache layer)
COPY pyproject.toml .
COPY src/ src/
RUN pip install --no-cache-dir -e .

# Copy runtime data
COPY templates/ templates/
COPY .env.example .env

# Tạo thư mục runtime
RUN mkdir -p data/vectordb data/raw data/processed outputs

ENV PYTHONPATH=/app/src

CMD ["python", "-m", "cvcraft.cli.commands", "generate"]
