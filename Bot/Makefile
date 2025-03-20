IMAGE_NAME = lingo-bot
CONTAINER_NAME = lingo-bot
NETWORK_NAME = attendee_attendee_network
PORT = 8001
TZ = Asia/Kolkata

.PHONY: build run logs

build:
	docker build -t $(IMAGE_NAME) .

run:
	docker run -p $(PORT):$(PORT) --name $(CONTAINER_NAME) --network $(NETWORK_NAME) -e TZ=$(TZ) $(IMAGE_NAME)

logs:
	docker logs -f $(CONTAINER_NAME)
