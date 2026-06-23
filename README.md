# Feature Flag SaaS

Multi-tenant feature flag system with Express + MongoDB backend and React + Vite frontend.

## Prerequisites

- Node.js 18+
- MongoDB running on `mongodb://localhost:27017`

## Run (development)

Open **two terminals**:

```powershell
# Terminal 1 — Backend (port 5000)
cd server
npm install
npm run dev

# Terminal 2 — Frontend (port 3000, proxies /api → 5000)
cd client
npm install
npm run dev
```

Open **http://localhost:3000**

### Health check

```powershell
curl http://localhost:5000/api/health
```

If MongoDB is down, the backend will not start and the client shows a clear error message.

## Default credentials

| Role        | Username     | Password   |
|-------------|--------------|------------|
| Super Admin | `superadmin` | `admin123` |

## Portals

1. **Super Admin** — Create/delete organizations
2. **Org Admin** — Register, login, manage feature flags per org
3. **End User** — Public flag checker (no login)

## Theme feature (multi-tenant demo)

Org admins can gate the **light/dark theme toggle** with a feature flag:

1. Super Admin → create an organization
2. Org Admin → register/login → create flag key `theme_toggle` → enable it
3. End User → select that org → theme toggle appears in the nav bar

Each organization controls this independently via the flag system.

## Project structure

```
server/   Express API + MongoDB
client/   React UI (Vite dev server proxies API)
```
