#!/bin/bash
# start.sh - Starts specified Docker containers or all containers if no arguments are provided.
# If container names are provided (e.g., "lingo-app lingo-service"), only those will be started.
# Otherwise, it starts all containers with docker-compose up -d.

if [ "$#" -gt 0 ]; then
  echo "Starting specified containers: $@"
  for container in "$@"; do
    echo "Starting container: $container"
    docker start "$container"
  done
else
  echo "No container names specified. Starting all containers with docker-compose up -d..."
  docker-compose up -d
fi
