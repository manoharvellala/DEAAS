

"""Telemetry providers for EPICS and Mock.

- EPICSTelemetryProvider: subscribes to PVs using pyepics and caches latest values.
- MockTelemetryProvider: generates values on an interval; also emits via callback.

Both providers expose:
- ensure_panel(id: int)
- ensure_inverter(id: int)
- read_panel(id: int) -> dict
- read_inverter(id: int) -> dict
- on_update(callback)  # callback signature: (payload: dict)
"""

from __future__ import annotations
import os
import random
import threading
import time
from typing import Callable, Dict, Optional

from .config import settings

try:
    from epics import PV  # type: ignore
except Exception:  # pyepics is optional in mock mode
    PV = None

UpdateCallback = Callable[[dict], None]

class _UpdateEmitter:
    def __init__(self):
        self._cb: Optional[UpdateCallback] = None
    def register(self, cb: UpdateCallback):
        self._cb = cb
    def emit(self, payload: dict):
        if self._cb:
            self._cb(payload)

class EPICSTelemetryProvider:
    def __init__(self, prefix: str):
        if PV is None:
            raise RuntimeError("pyepics not available; install or use mock provider")
        # Honor CA env if provided
        if settings.EPICS_CA_ADDR_LIST:
            os.environ["EPICS_CA_ADDR_LIST"] = settings.EPICS_CA_ADDR_LIST
        if settings.EPICS_CA_AUTO_ADDR_LIST:
            os.environ["EPICS_CA_AUTO_ADDR_LIST"] = settings.EPICS_CA_AUTO_ADDR_LIST

        self.prefix = prefix.rstrip(":")
        self._emitter = _UpdateEmitter()
        self._panel_pvs: Dict[int, Dict[str, PV]] = {}
        self._inverter_pvs: Dict[int, Dict[str, PV]] = {}
        self._cache: Dict[str, float | int | str] = {}
        self._lock = threading.Lock()

    def on_update(self, cb: UpdateCallback):
        self._emitter.register(cb)

    # Helpers
    def _panel_names(self, pid: int) -> Dict[str, str]:
        base = f"{self.prefix}:PANEL:{pid:03d}"
        return {
            "DC_POWER": f"{base}:DC_POWER",
            "VOLTAGE": f"{base}:VOLTAGE",
            "CURRENT": f"{base}:CURRENT",
        }

    def _inverter_names(self, iid: int) -> Dict[str, str]:
        base = f"{self.prefix}:INV:{iid:03d}"
        return {
            "AC_POWER": f"{base}:AC_POWER",
            "STATUS": f"{base}:STATUS",
        }

    def _watch(self, name: str):
        pv = PV(name, auto_monitor=True)
        def _cb(pvname=None, value=None, **kws):
            with self._lock:
                self._cache[pvname] = value
            # Infer type/id for payload
            payload = {"pv": pvname, "value": value}
            self._emitter.emit({"type": "pv", "data": payload})
        pv.add_callback(_cb)
        return pv

    def ensure_panel(self, pid: int):
        if pid in self._panel_pvs:
            return
        names = self._panel_names(pid)
        self._panel_pvs[pid] = {k: self._watch(v) for k, v in names.items()}

    def ensure_inverter(self, iid: int):
        if iid in self._inverter_pvs:
            return
        names = self._inverter_names(iid)
        self._inverter_pvs[iid] = {k: self._watch(v) for k, v in names.items()}

    def read_panel(self, pid: int) -> dict:
        names = self._panel_names(pid)
        return {
            "id": pid,
            "metrics": {
                k: self._cache.get(v) for k, v in names.items()
            },
        }

    def read_inverter(self, iid: int) -> dict:
        names = self._inverter_names(iid)
        return {
            "id": iid,
            "metrics": {
                k: self._cache.get(v) for k, v in names.items()
            },
        }

class MockTelemetryProvider:
    def __init__(self, prefix: str, interval_sec: float = 1.0):
        self.prefix = prefix.rstrip(":")
        self.interval = interval_sec
        self._emitter = _UpdateEmitter()
        self._panels: Dict[int, dict] = {}
        self._inverters: Dict[int, dict] = {}
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()

    def on_update(self, cb: UpdateCallback):
        self._emitter.register(cb)

    def ensure_panel(self, pid: int):
        if pid not in self._panels:
            self._panels[pid] = {
                "DC_POWER": 0.0,
                "VOLTAGE": 40.0 + random.random() * 5,
                "CURRENT": 0.0,
            }

    def ensure_inverter(self, iid: int):
        if iid not in self._inverters:
            self._inverters[iid] = {
                "AC_POWER": 0.0,
                "STATUS": 1,
            }

    def _tick_panel(self, pid: int):
        m = self._panels[pid]
        # Simple irradiance day-curve mock
        base_power = random.uniform(100, 380)
        m["DC_POWER"] = round(base_power, 2)
        m["VOLTAGE"] = round(38 + random.random() * 6, 2)
        m["CURRENT"] = round(m["DC_POWER"] / max(m["VOLTAGE"], 0.1), 2)
        self._emitter.emit({
            "type": "panel",
            "id": pid,
            "metrics": m.copy(),
        })

    def _tick_inverter(self, iid: int):
        m = self._inverters[iid]
        # Sum a few panels randomly to emulate AC output
        m["AC_POWER"] = round(random.uniform(1500, 4500), 2)
        # Random occasional fault
        m["STATUS"] = 2 if random.random() < 0.01 else 1
        self._emitter.emit({
            "type": "inverter",
            "id": iid,
            "metrics": m.copy(),
        })

    def _loop(self):
        while not self._stop.is_set():
            for pid in list(self._panels.keys()):
                self._tick_panel(pid)
            for iid in list(self._inverters.keys()):
                self._tick_inverter(iid)
            time.sleep(self.interval)

    def read_panel(self, pid: int) -> dict:
        return {"id": pid, "metrics": self._panels.get(pid, {})}

    def read_inverter(self, iid: int) -> dict:
        return {"id": iid, "metrics": self._inverters.get(iid, {})}

    def stop(self):
        self._stop.set()


def make_provider() -> EPICSTelemetryProvider | MockTelemetryProvider:
    if settings.TELEMETRY_PROVIDER == "epics":
        return EPICSTelemetryProvider(settings.PV_PREFIX)
    return MockTelemetryProvider(settings.PV_PREFIX)


