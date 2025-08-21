from __future__ import annotations
import json
from typing import List

import eventlet
# Needed by Flask-SocketIO for WebSocket server
eventlet.monkey_patch()

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO

from .config import settings
from .database import Base, engine, SessionLocal
from .models import Panel, Inverter
from .telemetry import make_provider

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": settings.CORS_ORIGINS}})
socketio = SocketIO(app, cors_allowed_origins=settings.CORS_ORIGINS, async_mode="eventlet")

# Create tables if not exist
Base.metadata.create_all(bind=engine)

provider = make_provider()

# Relay provider updates to WebSocket clients
provider.on_update(lambda payload: socketio.emit("telemetry", payload))

@app.get("/health")
def health():
    return {"ok": True, "telemetry_provider": settings.TELEMETRY_PROVIDER}

@app.get("/api/assets")
def list_assets():
    db = SessionLocal()
    try:
        panels = db.query(Panel).all()
        inverters = db.query(Inverter).all()
        # Ensure providers watch these
        for p in panels:
            if p.active:
                provider.ensure_panel(p.id)
        for inv in inverters:
            if inv.active:
                provider.ensure_inverter(inv.id)
        return jsonify({
            "panels": [
                {"id": p.id, "name": p.name, "rated_watts": p.rated_watts, "active": p.active}
                for p in panels
            ],
            "inverters": [
                {"id": i.id, "name": i.name, "rated_watts": i.rated_watts, "active": i.active}
                for i in inverters
            ],
        })
    finally:
        db.close()

@app.post("/api/panels")
def create_panel():
    body = request.get_json(force=True)
    name = body.get("name")
    rated = float(body.get("rated_watts", 400))
    if not name:
        return jsonify({"error": "name is required"}), 400
    db = SessionLocal()
    try:
        p = Panel(name=name, rated_watts=rated, active=True)
        db.add(p)
        db.commit()
        db.refresh(p)
        provider.ensure_panel(p.id)
        return jsonify({"id": p.id, "name": p.name, "rated_watts": p.rated_watts, "active": p.active}), 201
    finally:
        db.close()

@app.delete("/api/panels/<int:pid>")
def delete_panel(pid: int):
    db = SessionLocal()
    try:
        p = db.get(Panel, pid)
        if not p:
            return jsonify({"error": "panel not found"}), 404
        p.active = False
        db.commit()
        return jsonify({"ok": True})
    finally:
        db.close()

@app.post("/api/inverters")
def create_inverter():
    body = request.get_json(force=True)
    name = body.get("name")
    rated = float(body.get("rated_watts", 5000))
    if not name:
        return jsonify({"error": "name is required"}), 400
    db = SessionLocal()
    try:
        inv = Inverter(name=name, rated_watts=rated, active=True)
        db.add(inv)
        db.commit()
        db.refresh(inv)
        provider.ensure_inverter(inv.id)
        return jsonify({"id": inv.id, "name": inv.name, "rated_watts": inv.rated_watts, "active": inv.active}), 201
    finally:
        db.close()

@app.delete("/api/inverters/<int:iid>")
def delete_inverter(iid: int):
    db = SessionLocal()
    try:
        inv = db.get(Inverter, iid)
        if not inv:
            return jsonify({"error": "inverter not found"}), 404
        inv.active = False
        db.commit()
        return jsonify({"ok": True})
    finally:
        db.close()

@app.get("/api/telemetry")
def get_telemetry():
    kind = request.args.get("type", "panel").lower()
    ids_arg = request.args.get("ids", "")
    ids: List[int] = [int(x) for x in ids_arg.split(",") if x.strip().isdigit()]
    if not ids:
        return jsonify({"error": "ids query param required, e.g. ?type=panel&ids=1,2"}), 400

    if kind == "panel":
        for pid in ids:
            provider.ensure_panel(pid)
        data = [provider.read_panel(pid) for pid in ids]
    elif kind == "inverter":
        for iid in ids:
            provider.ensure_inverter(iid)
        data = [provider.read_inverter(iid) for iid in ids]
    else:
        return jsonify({"error": "type must be 'panel' or 'inverter'"}), 400

    return jsonify({"type": kind, "data": data})

if __name__ == "__main__":
    print(f"Starting server on {settings.HOST}:{settings.PORT} (provider={settings.TELEMETRY_PROVIDER})")
    socketio.run(app, host=settings.HOST, port=settings.PORT)
