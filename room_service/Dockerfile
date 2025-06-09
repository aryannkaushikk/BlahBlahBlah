# Use official Python slim image as base
FROM python:3.11-slim

# Set environment variables inside container
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set PYTHONPATH so Python can find shared module
ENV PYTHONPATH=/app

# Set working directory inside container
WORKDIR /app/room_service

# Copy requirements first to leverage Docker cache
COPY ./room_service/requirements.txt /app/room_service/

# Upgrade pip and install dependencies
RUN pip install --upgrade pip
RUN pip install -r /app/room_service/requirements.txt

# Copy the API source code
COPY ./room_service /app/room_service

# Copy the shared folder (for shared modules)
COPY ../shared /app/shared

# Expose port your app runs on
EXPOSE 5800

# Command to run your app
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5800", "main:app"]