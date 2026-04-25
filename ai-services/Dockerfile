# Use Python 3.9 slim
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies for spacy/playwright
RUN apt-get update && apt-get install -y \
    build-essential \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download Spacy model
RUN python -m spacy download en_core_web_sm

# Copy service code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
