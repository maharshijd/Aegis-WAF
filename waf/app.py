from fastapi import FastAPI, Request
import requests
from detector import detect_attack

app = FastAPI()

BACKEND = "http://backend"

@app.api_route("/{path:path}", methods=["GET","POST","PUT","DELETE"])
async def proxy(path: str, request: Request):

    payload = str(request.url)

    attack = detect_attack(payload)

    if attack:
        return {"blocked": attack}

    resp = requests.get(f"{BACKEND}/{path}")

    return resp.text
