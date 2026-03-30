import time
import os
import time
import re
os.system("clear")
print("\n\n\n")
print(" █████╗ ███████╗ ██████╗ ██╗███████╗    ██╗    ██╗ █████╗ ███████╗")
print("██╔══██╗██╔════╝██╔════╝ ██║██╔════╝    ██║    ██║██╔══██╗██╔════╝")
print("███████║█████╗  ██║  ███╗██║███████╗    ██║ █╗ ██║███████║█████╗  ")
print("██╔══██║██╔══╝  ██║   ██║██║╚════██║    ██║███╗██║██╔══██║██╔══╝  ")
print("██║  ██║███████╗╚██████╔╝██║███████║    ╚███╔███╔╝██║  ██║██║     ")
print("╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚══════╝     ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝     ")
print("\n\n\n")
backend = input("Enter backend URL (example: http://localhost:8080): ").strip()

port = input("Enter port for Firewall (default 8000): ").strip()

if port == "":
    port = "8000"

print("\nConfiguring Firewall...\n")

if not backend.startswith("http"):
    backend = "http://" + backend


app_file = "waf/app.py"

with open(app_file, "r") as f:
    data = f.read()

data = re.sub(
    r'BACKEND\s*=\s*".*?"',
    f'BACKEND = "{backend}"',
    data
)

with open(app_file, "w") as f:
    f.write(data)

compose_file = "docker-compose.yml"

with open(compose_file, "r") as f:
    compose = f.read()

compose = re.sub(
    r'"\d+:80"',
    f'"{port}:80"',
    compose
)

with open(compose_file, "w") as f:
    f.write(compose)

print("Starting firewall...\n")

os.system("docker compose up --build -d")

print(f"\nFirewall running at:")
print(f"http://localhost:{port}")

print("Firewall is running...")
print("Press CTRL+C to stop firewall\n")


# keep script alive
try:

    while True:
        time.sleep(5)

except KeyboardInterrupt:

    print("\nStopping firewall...\n")

    os.system("docker compose down")

    print("Firewall stopped")
