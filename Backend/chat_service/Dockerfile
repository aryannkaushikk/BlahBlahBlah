# Use official Python slim image as base
FROM python:3.11-slim

# Environment variables to make Python behave nicely
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory inside container
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Upgrade pip and install dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy the rest of the app's code
COPY . .

# Expose port your app runs on
EXPOSE 8080

# Run using gunicorn + eventlet (for Socket.IO support)
CMD ["gunicorn", "-k", "eventlet", "-w", "1", "-b", "0.0.0.0:8080", "main:app"]
