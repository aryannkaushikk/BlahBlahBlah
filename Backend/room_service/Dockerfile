# Use official Python slim image as base
FROM python:3.11-slim

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Set working directory
WORKDIR /app

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy the full service source code
COPY . .

# Expose Flask service port
EXPOSE 5800

# Run the app with gunicorn
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5800", "main:app"]
