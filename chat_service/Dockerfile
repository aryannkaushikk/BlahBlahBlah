# Use official Python slim image as base
FROM python:3.11-slim

# Set environment variables inside container
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory inside container
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY ./chat_service/requirements.txt /app/

# Upgrade pip and install dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy the rest of your app's source code
COPY ./chat_service /app/

# Expose port your app runs on
EXPOSE 8080

# Command to run your app
CMD ["gunicorn", "-k", "eventlet", "-w", "1", "-b", "0.0.0.0:8080", "main:app"]
