#!/bin/bash
# stop.sh - Stops specified Docker containers.
# If one or more container names are provided as arguments, only those containers are stopped.
# If no arguments are provided, the script stops all containers using docker-compose down.

if [ "$#" -gt 0 ]; then
  echo "Stopping specified containers: $@"
  for container in "$@"; do
    if docker ps --filter "name=$container" --format '{{.Names}}' | grep -q "$container"; then
      echo "Stopping container: $container"
      docker stop "$container"
    else
      echo "Container '$container' is not running or does not exist."
    fi
  done
else
  echo "No container names specified. Stopping all containers using docker-compose down..."
  docker-compose down
fi