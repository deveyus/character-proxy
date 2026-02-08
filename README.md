# Character Proxy

Resilient enriched cache and discovery engine for EVE Online.

## Overview
This service acts as a proxy and cache for the EVE Online API (ESI), providing rate-limit protection, proactive entity discovery, and a historical ledger of character, corporation, and alliance data.

## Getting Started

### Prerequisites
- [Nix](https://nixos.org/download.html) (with Flakes enabled)

### Local Development

1. **Enter the environment:**
   ```bash
   nix develop
   ```
   This sets up Deno, PostgreSQL, and all dependencies.

2. **Start the server:**
   ```bash
   deno task dev
   ```

3. **Manage API Keys:**
   ```bash
   deno task manage:keys add "My Local App"
   ```

## Production

### Container Images
Images are automatically published to the GitHub Container Registry.

- **Image:** `ghcr.io/deveyus/character-proxy`
- **Tags:**
    - `latest`: The most recent build from the master branch.
    - `sha-<commit>`: Build for a specific commit.

```bash
docker pull ghcr.io/deveyus/character-proxy:latest
```

### Configuration
The application is configured via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP Port | `4321` |
| `DATABASE_URL` | PostgreSQL Connection String | (Required in Prod) |
| `MASTER_KEY` | Admin Secret Key (enforced for admin RPC) | (Required in Prod) |
| `WORKER_COUNT` | Number of discovery workers | `1` |
| `LOG_FORMAT` | `json` or `pretty` | `json` |

## License
MIT
