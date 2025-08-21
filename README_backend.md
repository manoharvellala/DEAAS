# 🔐 .env.example

# "mock" or "epics"

TELEMETRY_PROVIDER=mock

# Comma-separated EPICS CA addresses (only if using epics provider)

EPICS_CA_ADDR_LIST=127.0.0.1
EPICS_CA_AUTO_ADDR_LIST=YES

# Flask

FLASK_ENV=development
HOST=0.0.0.0
PORT=5001
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Database

DATABASE_URL=sqlite:///./deaas.db

# PV naming prefix (customize for your plant/site)

PV_PREFIX=PLANT1:BUS0

---

# 📄 README_backend.md

## Quick Start

1. **Create venv & install deps**

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

2. **Choose telemetry mode** in `.env`:

- `TELEMETRY_PROVIDER=mock` → generates realistic values locally (no EPICS needed)
- `TELEMETRY_PROVIDER=epics` → reads live PVs via Channel Access (requires EPICS IOCs)

3. **Init DB + seed a few assets (optional)**

```bash
python backend/seed.py
```

4. **Run the server (WebSocket included)**

```bash
python backend/app.py
```

Server runs at `http://localhost:5001`.

### Default PV Naming (customizable)

Panels:

- `{PV_PREFIX}:PANEL:{NNN}:DC_POWER` (W)
- `{PV_PREFIX}:PANEL:{NNN}:VOLTAGE` (V)
- `{PV_PREFIX}:PANEL:{NNN}:CURRENT` (A)

Inverters:

- `{PV_PREFIX}:INV:{NNN}:AC_POWER` (W)
- `{PV_PREFIX}:INV:{NNN}:STATUS` (0=OFF,1=ON,2=FAULT)

> For **mock mode**, PVs are virtual; IDs match asset IDs.

### REST API (excerpt)

- `GET /api/assets` → all panels & inverters
- `POST /api/panels` body `{name, rated_watts}` → create
- `DELETE /api/panels/<id>`
- `GET /api/telemetry?type=panel&ids=1,2` → latest values

### WebSocket

- Connect to `ws` via Socket.IO at `/socket.io/`
- Server emits `telemetry` with payload `{ type, id, metrics }` on value changes (or mock ticks).

## Quick Start

1. **Create venv & install deps**

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

2. **Choose telemetry mode** in `.env`:

- `TELEMETRY_PROVIDER=mock` → generates realistic values locally (no EPICS needed)
- `TELEMETRY_PROVIDER=epics` → reads live PVs via Channel Access (requires EPICS IOCs)

3. **Init DB + seed a few assets (optional)**

```bash
python backend/seed.py
```

4. **Run the server (WebSocket included)**

```bash
python backend/app.py
```

Server runs at `http://localhost:5001`.

### Default PV Naming (customizable)

Panels:

- `{PV_PREFIX}:PANEL:{NNN}:DC_POWER` (W)
- `{PV_PREFIX}:PANEL:{NNN}:VOLTAGE` (V)
- `{PV_PREFIX}:PANEL:{NNN}:CURRENT` (A)

Inverters:

- `{PV_PREFIX}:INV:{NNN}:AC_POWER` (W)
- `{PV_PREFIX}:INV:{NNN}:STATUS` (0=OFF,1=ON,2=FAULT)

> For **mock mode**, PVs are virtual; IDs match asset IDs.

### REST API (excerpt)

- `GET /api/assets` → all panels & inverters
- `POST /api/panels` body `{name, rated_watts}` → create
- `DELETE /api/panels/<id>`
- `GET /api/telemetry?type=panel&ids=1,2` → latest values

### WebSocket

- Connect to `ws` via Socket.IO at `/socket.io/`
- Server emits `telemetry` with payload `{ type, id, metrics }` on value changes (or mock ticks).
