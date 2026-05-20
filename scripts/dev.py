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


def kill_port(port: int) -> None:
    """Kill bất kỳ process nào đang chiếm port (Windows + Unix)."""
    try:
        if os.name == "nt":
            result = subprocess.run(
                ["netstat", "-ano"],
                capture_output=True, text=True
            )
            for line in result.stdout.splitlines():
                if f":{port} " in line and "LISTENING" in line:
                    parts = line.split()
                    pid = parts[-1]
                    if pid.isdigit():
                        subprocess.run(["taskkill", "/PID", pid, "/F"], capture_output=True)
                        print(f"[dev] Killed process PID {pid} on port {port}.", flush=True)
        else:
            subprocess.run(["fuser", "-k", f"{port}/tcp"], capture_output=True)
    except Exception:
        pass


def can_bind_port(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.1)
        if s.connect_ex(("127.0.0.1", port)) == 0:
            return False
    if socket.has_ipv6:
        with socket.socket(socket.AF_INET6, socket.SOCK_STREAM) as s:
            s.settimeout(0.1)
            if s.connect_ex(("::1", port)) == 0:
                return False
    return True


def free_port(port: int) -> int:
    """Giải phóng port nếu bị chiếm, trả về port đã free."""
    if not can_bind_port(port):
        print(f"[dev] Port {port} đang bị chiếm, đang kill process...", flush=True)
        kill_port(port)
        # Chờ tối đa 3s để port được giải phóng
        import time
        for _ in range(6):
            time.sleep(0.5)
            if can_bind_port(port):
                print(f"[dev] Port {port} đã được giải phóng.", flush=True)
                return port
        print(f"[dev] Không thể giải phóng port {port}, chuyển sang port tiếp theo.", flush=True)
    return port


def find_available_port(preferred_port: int, used_ports: set[int], free: bool = False) -> int:
    port = preferred_port
    if free:
        port = free_port(port)
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
    parser.add_argument("--backend-port", type=int, default=8000)
    parser.add_argument("--frontend-port", type=int, default=3000)
    parser.add_argument(
        "--kill-ports", action="store_true", default=True,
        help="Tự động kill process đang giữ port trước khi start (mặc định: bật)",
    )
    parser.add_argument(
        "--no-kill-ports", dest="kill_ports", action="store_false",
        help="Không kill process cũ, tìm port trống tiếp theo thay thế",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    used_ports: set[int] = set()

    backend_port = find_available_port(args.backend_port, used_ports, free=args.kill_ports)
    frontend_port = find_available_port(args.frontend_port, used_ports, free=args.kill_ports)

    if backend_port != args.backend_port:
        print(f"[dev] Backend dùng port {backend_port} (port {args.backend_port} không trống).", flush=True)
    if frontend_port != args.frontend_port:
        print(f"[dev] Frontend dùng port {frontend_port} (port {args.frontend_port} không trống).", flush=True)

    env = os.environ.copy()
    env["GENERATE_CV_URL"] = f"http://localhost:{backend_port}"
    env["JD_SEARCH_URL"] = f"http://localhost:{backend_port}"
    env["PYTHONIOENCODING"] = "utf-8"
    backend_src = str(ROOT_DIR / "backend" / "src")
    existing_path = env.get("PYTHONPATH", "")
    env["PYTHONPATH"] = f"{backend_src}{os.pathsep}{existing_path}" if existing_path else backend_src

    processes = [
        start_process(
            "backend",
            [sys.executable, "-m", "uvicorn", "gateway:app", "--reload", "--port", str(backend_port)],
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
        f"[dev] Frontend: http://localhost:{frontend_port}\n"
        f"[dev] Backend:  http://localhost:{backend_port}/docs\n"
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
