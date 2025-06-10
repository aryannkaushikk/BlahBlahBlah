# Use official Python slim image as base
FROM python:3.11-slim

# Set environment variables inside container
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set PYTHONPATH so Python can find shared module
ENV PYTHONPATH=/app

# Set working directory inside container
WORKDIR /app/api

# Copy requirements first to leverage Docker cache
COPY ./api/requirements.txt /app/api/

# Upgrade pip and install dependencies
RUN pip install --upgrade pip
RUN pip install -r /app/api/requirements.txt

# Copy the API source code
COPY ./api /app/api

COPY ../firebase-sdk.json /app

# Expose port your app runs on
EXPOSE 5100

# Command to run your app
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5100", "main:app"]