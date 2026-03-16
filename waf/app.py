from fastapi import FastAPI, Request
import requests
from detector import detect_attack
from datetime import datetime

app = FastAPI()

BACKEND = "http://backend"


def log_attack(ip, attack_type, payload):

    with open("logs/attacks.log", "a") as f:
        f.write(
            f"[{datetime.now()}] IP: {ip} | Attack: {attack_type} | Payload: {payload}\n"
        )


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy(path: str, request: Request):

    payload = str(request.url)

    attack = detect_attack(payload)

    client_ip = request.client.host

    if attack:

        log_attack(client_ip, attack, payload)

        return {
            "status": "blocked",
            "attack_type": attack,
            "ip": client_ip
        }

    resp = requests.get(f"{BACKEND}/{path}")

    return resp.text
