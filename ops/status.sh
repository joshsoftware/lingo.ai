#!/bin/bash
# status.sh - Dynamically displays the status of Docker Compose services.
# It shows each service’s container name (or falls back to the service name if not running),
# along with its status (Running or Not Running) and port mappings.
# Colors:
#   Green: Running
#   Red: Not Running
# Requirements: docker and docker-compose must be installed.

# Define colors using tput:
GREEN=$(tput setaf 2)
RED=$(tput setaf 1)
BLUE=$(tput setaf 4)
RESET=$(tput sgr0)

# Retrieve the list of services from the docker-compose configuration.
services=$(docker-compose config --services)

# Loop over each service.
for service in $services; do
    # Get the container ID (if the service is running).
    container_id=$(docker-compose ps -q "$service")

    if [ -n "$container_id" ]; then
        # If running, get the actual container name.
        cname=$(docker inspect -f '{{.Name}}' "$container_id" | sed 's/^\/\(.*\)/\1/')
        status="${GREEN}Running${RESET}"
        # Retrieve the port mapping, defaulting to "N/A" if blank.
        ports=$(docker port "$container_id" 2>/dev/null | tr '\n' '; ')
        [ -z "$ports" ] && ports="N/A"
    else
        # If not running, use the service name for display.
        cname="$service"
        status="${RED}Not Running${RESET}"
        ports="N/A"
    fi

    # Print the container (or service) name, status, and port mapping.
    printf "%-20s [Status: %s] [Ports: %s]\n" "$cname" "$status" "$ports"
done

echo "=========================================="