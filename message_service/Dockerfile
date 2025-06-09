# Use official Python slim image as base
FROM python:3.11-slim

# Set environment variables inside container
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory inside container
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY ./message_service/requirements.txt /app/

# Upgrade pip and install dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy the rest of your app's source code
COPY ./message_service /app/

# Expose port your app runs on
EXPOSE 5600

# Command to run your app
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5600", "main:app"]