#!/bin/bash
# logs.sh - Show live (streaming) logs for one or more Docker containers with colored container labels.
# Usage: ./logs.sh <container_name> [container_name ...]
# Example: ./logs.sh lingo-app lingo-service lingo-ollama

# Define an array of color codes (tput setaf values)
colors=(2 3 4 5 6)

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 <container_name> [container_name ...]"
  exit 1
fi

echo "Following live logs for containers: $@"

i=0
for container in "$@"; do
  # Cycle through colors using modulo
  color_index=${colors[$(( i % ${#colors[@]} ))]}
  container_color=$(tput setaf $color_index)
  reset_color=$(tput sgr0)

  echo "===== Following logs for container: ${container_color}${container}${reset_color} ====="

  # Prefix each line with colored container name
  docker logs --follow "$container" 2>&1 | sed "s/^/[$container_color$container$reset_color] /" &

  i=$((i+1))
done

# Wait for all background processes to finish
wait