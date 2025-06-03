import requests
import time

def join_meeting_with_retry(meeting_url: str, bot_name: str):
    while True:
        print(f"Joining meeting: {meeting_url} with bot: {bot_name}")
        response = requests.post(
            "http://localhost:8000/api/v1/bots",
            headers={
                "Authorization": "Token r9HdnelHbYxvOVsTyZpjNvDog68OI6Pt",
                "Content-Type": "application/json"
            },
            json={"meeting_url": meeting_url, "bot_name": bot_name}
        )
        print(f"Join bot response: {response.status_code}, {response.text}")

        if response.status_code == 201:
            bot_id = response.json().get("id")
            print(f"Bot created with ID: {bot_id}")

            while True:
                status_response = requests.get(
                    f"http://localhost:8000/api/v1/bots/{bot_id}",
                    headers={
                        "Authorization": "Token NdSQYHmxkqAExXlkOOgUwKCTO8oFlXMd",
                        "Content-Type": "application/json"
                    }
                )
                status_data = status_response.json()
                print(f"Bot status: {status_data}")

                if status_data.get("state") in ["joined_recording", "joined"]:
                    print("Bot joined successfully")
                    return
                elif status_data.get("state") == "fatal_error":
                    print("Bot failed to join. Retrying...")
                    break

                print("Retrying bot status check in 30 seconds...")
                time.sleep(30)

        print("Retrying bot join in 30 seconds...")
        time.sleep(30)
