#!/bin/bash
# dev-setup.sh - Initializes and starts the local development environment.
# Requirements: docker and docker-compose must be installed.

echo "Stopping any currently running containers..."
docker-compose down

echo "Building and starting containers in detached mode..."
docker-compose up --build -d

echo "Waiting for services to be ready..."
sleep 2

echo "Initializing default model in Ollama container..."
# This command triggers the model download/initialization in the Ollama container.
# Replace 'llama3.2:1b' with the model version you want to use if required.
docker exec ollama ollama pull llama3.2

echo "Your Local development environment is up!"
