from fastapi import FastAPI, Request
from fastapi.responses import Response
import requests
from detector import detect_attack
from datetime import datetime
import os

app = FastAPI()

BACKEND = "http://backend:80"


def log_attack(ip, attack_type, payload):

    os.makedirs("logs", exist_ok=True)

    with open("logs/attacks.log", "a") as f:
        f.write(
            f"[{datetime.now()}] IP: {ip} | Attack: {attack_type} | Payload: {payload}\n"
        )


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy(path: str, request: Request):

    body = await request.body()

    body = await request.body()

    url_payload = str(request.url)
    query_payload = str(request.query_params)
    body_payload = body.decode(errors="ignore")

    combined_payload = url_payload + query_payload + body_payload

    attack = detect_attack(combined_payload)

    client_ip = request.client.host

    if attack:
        log_attack(client_ip, attack, combined_payload)
        return {
            "status": "blocked",
            "attack_type": attack,
            "ip": client_ip
        }

    url = f"{BACKEND}/{path}" if path else BACKEND

    resp = requests.request(
        method=request.method,
        url=url,
        headers={k: v for k, v in request.headers.items() if k.lower() != "host"},
        data=body
    )

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=dict(resp.headers)
    )
