"""
System information module for Goose Guard.
Reads Raspberry Pi health stats: CPU, temperature, memory, disk, uptime,
network, and audio device status. Gracefully degrades on non-Pi hardware.
"""

import os
import re
import shutil
import socket
import subprocess
import time
from pathlib import Path


def _read_file(path, default=""):
    try:
        with open(path) as f:
            return f.read().strip()
    except (FileNotFoundError, PermissionError, OSError):
        return default


def get_uptime():
    """Return uptime in seconds and a human-readable string."""
    raw = _read_file("/proc/uptime")
    if not raw:
        return {"seconds": 0, "human": "unknown"}
    try:
        seconds = int(float(raw.split()[0]))
    except (ValueError, IndexError):
        return {"seconds": 0, "human": "unknown"}

    days = seconds // 86400
    hours = (seconds % 86400) // 3600
    minutes = (seconds % 3600) // 60

    if days > 0:
        human = f"{days}d {hours}h"
    elif hours > 0:
        human = f"{hours}h {minutes}m"
    else:
        human = f"{minutes}m"

    return {"seconds": seconds, "human": human}


def get_cpu_temperature():
    """Return CPU temperature in Celsius, or None if unavailable."""
    # Primary path on Raspberry Pi
    raw = _read_file("/sys/class/thermal/thermal_zone0/temp")
    if raw:
        try:
            return round(int(raw) / 1000.0, 1)
        except ValueError:
            pass

    # Fallback: vcgencmd
    try:
        result = subprocess.run(
            ["vcgencmd", "measure_temp"],
            capture_output=True, text=True, timeout=2
        )
        match = re.search(r"([\d.]+)", result.stdout)
        if match:
            return round(float(match.group(1)), 1)
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    return None


def get_cpu_load():
    """Return 1-minute load average and percent (assuming single-load reading)."""
    raw = _read_file("/proc/loadavg")
    if not raw:
        return {"load_1m": 0.0, "percent": 0}
    try:
        parts = raw.split()
        load_1m = float(parts[0])
    except (ValueError, IndexError):
        return {"load_1m": 0.0, "percent": 0}

    # Normalize against CPU count for a rough percent
    try:
        cpu_count = os.cpu_count() or 1
    except Exception:
        cpu_count = 1

    percent = min(100, round((load_1m / cpu_count) * 100))
    return {"load_1m": round(load_1m, 2), "percent": percent}


def get_memory():
    """Return memory usage in MB and percent."""
    raw = _read_file("/proc/meminfo")
    if not raw:
        return {"total_mb": 0, "used_mb": 0, "percent": 0}

    values = {}
    for line in raw.splitlines():
        parts = line.split(":")
        if len(parts) == 2:
            key = parts[0].strip()
            val_match = re.search(r"(\d+)", parts[1])
            if val_match:
                values[key] = int(val_match.group(1))  # kB

    total = values.get("MemTotal", 0)
    available = values.get("MemAvailable", values.get("MemFree", 0))
    used = total - available

    if total == 0:
        return {"total_mb": 0, "used_mb": 0, "percent": 0}

    return {
        "total_mb": round(total / 1024),
        "used_mb": round(used / 1024),
        "percent": round((used / total) * 100),
    }


def get_disk():
    """Return disk usage for the root filesystem."""
    try:
        usage = shutil.disk_usage("/")
    except OSError:
        return {"total_gb": 0, "used_gb": 0, "percent": 0}

    return {
        "total_gb": round(usage.total / (1024 ** 3), 1),
        "used_gb": round(usage.used / (1024 ** 3), 1),
        "percent": round((usage.used / usage.total) * 100),
    }


def get_hostname():
    try:
        return socket.gethostname()
    except Exception:
        return "unknown"


def get_ip_address():
    """Return the primary non-loopback IP address."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        # Doesn't actually send a packet
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return None


def get_wifi_info():
    """Return WiFi SSID and signal strength, or None if not connected via WiFi."""
    # Try iwgetid for SSID
    ssid = None
    signal = None

    try:
        result = subprocess.run(
            ["iwgetid", "-r"],
            capture_output=True, text=True, timeout=2
        )
        ssid = result.stdout.strip() or None
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    # Parse /proc/net/wireless for signal quality
    raw = _read_file("/proc/net/wireless")
    if raw:
        for line in raw.splitlines()[2:]:
            # Example: "wlan0: 0000 70. -40. -256"
            parts = line.split()
            if len(parts) >= 4:
                try:
                    # quality link (out of 70 typically)
                    quality = float(parts[2].rstrip("."))
                    signal = min(100, round((quality / 70) * 100))
                    break
                except ValueError:
                    continue

    if ssid or signal is not None:
        return {"ssid": ssid, "signal_percent": signal}
    return None


def get_audio_device():
    """Check if an audio output device is available."""
    try:
        result = subprocess.run(
            ["aplay", "-l"],
            capture_output=True, text=True, timeout=2
        )
        output = result.stdout
        if "no soundcards" in output.lower() or not output.strip():
            return {"available": False, "device": None}

        # Extract first card name
        match = re.search(r"card \d+: (\w+)", output)
        device_name = match.group(1) if match else "default"
        return {"available": True, "device": device_name}
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return {"available": False, "device": None}


def get_service_status(service_name="goose-guard"):
    """Return whether the systemd service is active."""
    try:
        result = subprocess.run(
            ["systemctl", "is-active", service_name],
            capture_output=True, text=True, timeout=2
        )
        status = result.stdout.strip()
        return {"name": service_name, "status": status, "active": status == "active"}
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return {"name": service_name, "status": "unknown", "active": False}


def get_sound_inventory(sounds_dir):
    """Return count of sound files per category."""
    sounds_path = Path(sounds_dir)
    inventory = {}
    if not sounds_path.exists():
        return inventory

    for category_dir in sounds_path.iterdir():
        if category_dir.is_dir():
            count = sum(
                1 for f in category_dir.iterdir()
                if f.suffix.lower() in (".mp3", ".wav", ".ogg")
            )
            inventory[category_dir.name] = count
    return inventory


def get_health_summary():
    """Produce an overall health verdict and warnings list."""
    warnings = []
    status = "healthy"

    temp = get_cpu_temperature()
    if temp is not None:
        if temp >= 80:
            status = "critical"
            warnings.append(f"CPU temperature is {temp}degC -- overheating")
        elif temp >= 70:
            if status == "healthy":
                status = "warning"
            warnings.append(f"CPU temperature is {temp}degC -- running hot")

    mem = get_memory()
    if mem["percent"] >= 90:
        if status == "healthy":
            status = "warning"
        warnings.append(f"Memory usage at {mem['percent']}%")

    disk = get_disk()
    if disk["percent"] >= 90:
        if status == "healthy":
            status = "warning"
        warnings.append(f"Disk usage at {disk['percent']}%")

    audio = get_audio_device()
    if not audio["available"]:
        status = "critical"
        warnings.append("No audio output device detected")

    return {"status": status, "warnings": warnings}


def collect_all(sounds_dir=None):
    """Gather every stat for the status page."""
    data = {
        "hostname": get_hostname(),
        "ip": get_ip_address(),
        "uptime": get_uptime(),
        "temperature_c": get_cpu_temperature(),
        "cpu": get_cpu_load(),
        "memory": get_memory(),
        "disk": get_disk(),
        "wifi": get_wifi_info(),
        "audio": get_audio_device(),
        "service": get_service_status(),
        "health": get_health_summary(),
        "timestamp": int(time.time()),
    }
    if sounds_dir:
        data["sounds"] = get_sound_inventory(sounds_dir)
    return data
