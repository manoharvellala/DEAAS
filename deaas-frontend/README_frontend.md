# DEaaS Frontend (React + Socket.IO)

## Quick Start

1. Create the app

```bash
npm create vite@latest deaas-frontend -- --template react
cd deaas-frontend
```

2. Install deps

```bash
npm i
npm i socket.io-client
```

3. Configure backend URL
   Create a `.env` file in the project root:

```
VITE_API_URL=http://localhost:5001
```

4. Add the source files

- Replace `index.html` with the one above (or keep Vite's default).
- Create `src/App.jsx` and paste the App code from this canvas.
- Create `src/main.jsx` and paste the snippet above.

5. Run it

```bash
npm run dev
```

Visit the dev URL (usually http://localhost:5173).

## What you get

- Asset management: add/remove Panels & Inverters via REST
- Live telemetry: Socket.IO pushes real-time metrics into UI
- Circuit view: simple SVG with wires, panels, inverters
- Sidebar: numeric metrics for quick inspection
