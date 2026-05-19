from __future__ import annotations

import argparse
import os
import signal
import socket
import subprocess
import sys
import threading
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = ROOT_DIR / "frontend"


def npm_command() -> str:
    return "npm.cmd" if os.name == "nt" else "npm"


def can_bind_port(port: int) -> bool:
    checks: list[tuple[int, tuple]] = [(socket.AF_INET, ("127.0.0.1", port))]
    if socket.has_ipv6:
        checks.append((socket.AF_INET6, ("::", port)))

    for family, address in checks:
        with socket.socket(family, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind(address)
            except OSError:
                return False
    return True


def find_available_port(preferred_port: int, used_ports: set[int]) -> int:
    port = preferred_port
    while port in used_ports or not can_bind_port(port):
        port += 1
    used_ports.add(port)
    return port


def stream_output(name: str, pipe) -> None:
    try:
        for line in iter(pipe.readline, ""):
            print(f"[{name}] {line}", end="", flush=True)
    finally:
        pipe.close()


def start_process(name: str, command: list[str], cwd: Path, env: dict[str, str]) -> subprocess.Popen[str]:
    print(f"[dev] Starting {name}: {' '.join(command)}", flush=True)
    process = subprocess.Popen(
        command,
        cwd=cwd,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    threading.Thread(target=stream_output, args=(name, process.stdout), daemon=True).start()
    return process


def stop_processes(processes: list[subprocess.Popen[str]]) -> None:
    for process in processes:
        if process.poll() is None:
            process.terminate()

    for process in processes:
        if process.poll() is None:
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run CVCraft frontend and backend services.")
    parser.add_argument("--generate-port", type=int, default=8000)
    parser.add_argument("--jd-port", type=int, default=8001)
    parser.add_argument("--frontend-port", type=int, default=3000)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    used_ports: set[int] = set()
    generate_port = find_available_port(args.generate_port, used_ports)
    jd_port = find_available_port(args.jd_port, used_ports)
    frontend_port = find_available_port(args.frontend_port, used_ports)

    if generate_port != args.generate_port:
        print(f"[dev] Port {args.generate_port} is unavailable for Generate CV. Using {generate_port}.", flush=True)
    if jd_port != args.jd_port:
        print(f"[dev] Port {args.jd_port} is unavailable for JD Search. Using {jd_port}.", flush=True)
    if frontend_port != args.frontend_port:
        print(f"[dev] Port {args.frontend_port} is unavailable for Frontend. Using {frontend_port}.", flush=True)

    env = os.environ.copy()
    env["GENERATE_CV_URL"] = f"http://localhost:{generate_port}"
    env["JD_SEARCH_URL"] = f"http://localhost:{jd_port}"

    processes = [
        start_process(
            "generate-cv",
            [sys.executable, "-m", "uvicorn", "generate_cv.api.main:app", "--reload", "--port", str(generate_port)],
            ROOT_DIR,
            env,
        ),
        start_process(
            "jd-search",
            [sys.executable, "-m", "uvicorn", "jd_search.api.main:app", "--reload", "--port", str(jd_port)],
            ROOT_DIR,
            env,
        ),
        start_process(
            "frontend",
            [npm_command(), "run", "dev", "--", "--port", str(frontend_port)],
            FRONTEND_DIR,
            env,
        ),
    ]

    print(
        "\n[dev] Services are starting.\n"
        f"[dev] Frontend:    http://localhost:{frontend_port}\n"
        f"[dev] Generate CV: http://localhost:{generate_port}/docs\n"
        f"[dev] JD Search:   http://localhost:{jd_port}/docs\n"
        "[dev] Press Ctrl+C to stop all services.\n",
        flush=True,
    )

    def handle_signal(_signum, _frame) -> None:
        raise KeyboardInterrupt

    signal.signal(signal.SIGINT, handle_signal)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, handle_signal)

    try:
        while True:
            for process in processes:
                return_code = process.poll()
                if return_code is not None:
                    stop_processes(processes)
                    print(f"[dev] A service exited with code {return_code}. Stopped remaining services.", flush=True)
                    return return_code
            threading.Event().wait(0.5)
    except KeyboardInterrupt:
        print("\n[dev] Stopping services...", flush=True)
        stop_processes(processes)
        print("[dev] Stopped.", flush=True)
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
