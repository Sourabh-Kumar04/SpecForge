# SpecForge Production Deployment Guide 🚀
**Autonomous Spec-to-Code and Test Verification Engine**  
*Nebius x NVIDIA Global AI Hackathon (Track: Coding & Agentic Engineering)*

---

This guide provides a step-by-step walkthrough to deploy SpecForge to a public, verifiable URL in under **15 minutes**.

SpecForge runs as a self-contained, unified container architecture:
1. **Frontend**: High-performance React 19 + TypeScript SPA built with Vite.
2. **Backend**: FastAPI 0.110+ ASGI service powered by NVIDIA Nemotron-3 (Super 120B & Ultra 550B via Nebius Token Factory) and Tavily AI Search grounding.
3. **Static File Server**: Uvicorn serves the production SPA directly at `/`, eliminating the need for complex multi-container networking.
4. **Execution Sandbox**: Subprocess/Docker runner with timeout and isolated package scoping.

---

## Prerequisites

Before starting, ensure your deployment target has:
- **Docker Engine** (24.0+) & **Docker Compose** (v2.20+) OR **Python 3.12** + **Node.js 20+**
- **Nebius Token Factory API Key** (`https://studio.nebius.ai`)
- **Tavily AI Search API Key** (`https://tavily.com`) for live doc grounding (bonus track)

---

## 1. Environment Configuration

Clone the repository and copy the environment template:

```bash
git clone https://github.com/Sourabh-Kumar04/SpecForge.git
cd SpecForge
cp .env.example .env
```

Edit `.env` and supply your API keys:

```ini
# ==============================================================================
# Nebius Token Factory Configuration
# ==============================================================================
NEBIUS_BASE_URL=https://api.studio.nebius.ai/v1
NEBIUS_API_KEY=your-actual-nebius-api-key-here

# Verified active NVIDIA Nemotron models on Nebius Token Factory
NEBIUS_MODEL_FAST=nvidia/nemotron-3-super-120b-a12b
NEBIUS_MODEL_REASONING=nvidia/Nemotron-3-Ultra-550b-a55b

# Nebius spend cap in USD (default: $2.00 per job, graceful pause)
NEBIUS_SPEND_CAP_USD=2.00

# ==============================================================================
# Tavily AI Search (Documentation Grounding)
# ==============================================================================
TAVILY_API_KEY=tvly-your-actual-tavily-api-key-here

# ==============================================================================
# Runtime Configuration
# ==============================================================================
MOCK_LLM=false
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
SANDBOX_TIMEOUT_SECONDS=35
DOCKER_SANDBOX_ENABLED=true
STORAGE_DIR=/app/data
```

> [!NOTE]
> If `NEBIUS_API_KEY` is omitted or contains placeholder values (`your-...`), SpecForge will automatically fall back to its deterministic test sandbox mode so features remain navigable. For live evaluation, configure real keys.

---

## 2. One-Command Deployment (Docker Compose)

Launch the full-stack container in detached mode:

```bash
docker compose up -d --build
```

Monitor container boot and health status:

```bash
docker compose logs -f specforge-demo
```

Verify local health:

```bash
curl -s http://localhost:8000/api/health
```

Expected output:
```json
{
  "status": "healthy",
  "service": "SpecForge",
  "mock_mode": false,
  "models": {
    "fast": "nvidia/nemotron-3-super-120b-a12b",
    "reasoning": "nvidia/Nemotron-3-Ultra-550b-a55b"
  },
  "tavily_enabled": true
}
```

---

## 3. Exposing a Public Demo URL (Choose Option A, B, or C)

The hackathon submission requires a publicly accessible, working demo URL. Choose the option best suited for your setup:

### Option A: Cloudflare Tunnel (Instant, Free, Zero-Config HTTPS) — **Recommended**

Cloudflare Tunnels create an encrypted, publicly routable HTTPS URL to your local or VPS port 8000 without opening firewall ports or purchasing a domain.

1. **Install `cloudflared`**:
   ```bash
   # Debian / Ubuntu
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared.deb

   # macOS (Homebrew)
   brew install cloudflared
   ```

2. **Start quick tunnel pointing to SpecForge**:
   ```bash
   cloudflared tunnel --url http://localhost:8000
   ```

3. **Get your URL**:
   The command output will display a live URL:
   ```text
   +--------------------------------------------------------------------------------------------+
   |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
   |  https://specforge-review-abc123xyz.trycloudflare.com                                      |
   +--------------------------------------------------------------------------------------------+
   ```
   Submit this HTTPS URL in your Devpost submission!

---

### Option B: ngrok (5-Minute Quick Link)

1. **Install ngrok** (`https://ngrok.com/download`):
   ```bash
   curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
   echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
   sudo apt update && sudo apt install ngrok
   ```

2. **Authenticate & Tunnel**:
   ```bash
   ngrok config add-authtoken <YOUR_NGROK_AUTHTOKEN>
   ngrok http 8000
   ```

3. Use the generated `https://xxxx.ngrok-free.app` URL.

---

### Option C: Production VPS with Nginx + SSL (Custom Domain)

If deploying to a cloud VM (AWS EC2, Hetzner, DigitalOcean, or Nebius Cloud compute):

1. **Point your DNS A-Record** (`specforge.yourdomain.com`) to your VM's public IP.

2. **Install Nginx & Certbot**:
   ```bash
   sudo apt update
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

3. **Create Nginx Configuration** (`/etc/nginx/sites-available/specforge`):
   ```nginx
   server {
       server_name specforge.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_http_version 1.1;

           # Essential for Server-Sent Events (SSE) live pipeline streaming:
           proxy_set_header Connection '';
           proxy_buffering off;
           proxy_cache off;
           proxy_read_timeout 86400s;
           proxy_send_timeout 86400s;

           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Enable site and issue free SSL**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/specforge /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d specforge.yourdomain.com --non-interactive --agree-tos -m admin@yourdomain.com
   ```

---

## 4. Post-Deployment Verification Checklist

Run these automated commands against your public domain:

1. **Health Check Endpoint**:
   ```bash
   curl -I https://<YOUR-DEMO-URL>/api/health
   # Must return HTTP 200 OK
   ```

2. **SPA Root Servicing**:
   ```bash
   curl -s https://<YOUR-DEMO-URL>/ | grep -i "SpecForge"
   # Must output HTML containing SpecForge branding
   ```

3. **Live Preset Trigger (Smoke Test)**:
   ```bash
   curl -X POST https://<YOUR-DEMO-URL>/api/jobs \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "Create a minimal Python CLI calculator with add and subtract",
       "project_type": "python_cli",
       "enable_research": true,
       "require_plan_approval": false
     }'
   # Must return HTTP 201 with job_id
   ```

4. **SSE Event Stream Verification**:
   ```bash
   curl -N https://<YOUR-DEMO-URL>/api/jobs/<JOB_ID>/events
   # Must stream pipeline events (planner, researcher, coder, tester, sandbox)
   ```

---

## 5. Maintenance & Diagnostics

| Command | Action |
| :--- | :--- |
| `docker compose restart backend` | Restart application service without rebuilding |
| `docker compose logs -f --tail=100` | Stream recent container logs |
| `docker compose down -v` | Stop containers and wipe ephemeral volume storage |
| `docker compose up -d --build` | Re-pull and rebuild from latest git commit |

---

## 6. Security & Cost Protection

SpecForge includes built-in safeguards for public hackathon evaluation:
- **Spend Caps**: Real-time token usage is calculated per inference call. If spend reaches `NEBIUS_SPEND_CAP_USD` (default $2.00), the job is paused gracefully and recorded in job state.
- **BYOK (Bring Your Own Key)**: Users can supply temporary custom Nebius or Tavily keys in the UI via the `Settings` modal.
- **Process Isolation**: All code execution occurs inside time-limited subprocesses or unprivileged Docker sandboxes with strict execution timeouts.
