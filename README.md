# F.O (Forever Open)

A free, community-run gateway that lets **Claude Code** and **OpenCode CLI** reach
OpenCode's free models when the free tier answers with `429 FreeUsageLimitError`.

Free-tier limits got much stricter lately, and small request tweaks are no longer
enough. F.O sends requests through a rotating pool of egress proxies and retries
across that pool, so a single exhausted IP does not end the session. It is shared
for free, offered as-is.

Not affiliated with OpenCode or Anthropic. See [Disclaimer](#disclaimer).

## Live endpoints

Every host serves the same API. Each one reaches OpenCode through a different proxy
provider, so if one host is throttled or down, try another.

| Host | Base URL | Provider (egress) | Region | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| KeritCloud (usa6) | `http://usa6.kerit.cloud:9253` | Proxy list (rotating residential) | Rotating egress | Degraded | Primary endpoint. Claude Code and OpenCode CLI.| 
| OptikLink | `http://160.191.77.60:8223` | Sing-Box (use hysteria2 / tuic nodes) | Global | Live | Primary endpoint. Claude Code and OpenCode CLI.|
| Bot-Hosting | `https://fo.apps.bot-hosting.cloud/` | V2Ray (Xray) | Global | Live | Primary endpoint. Claude Code and OpenCode CLI.|
| N/A | `Not Available` | WARP | Global | Unknown | Primary endpoint. Claude Code and OpenCode CLI.|

More hosts are planned. Each new host will run a different provider from the list
below, which is the set the runner already supports.

## Proxy providers

The runners can pull egress from any of these sources. A given host uses one of
them at a time.

| Provider | Type | Notes |
| --- | --- | --- |
| Proxy list | HTTP / SOCKS5 pool | Rotating pool. Used by the live host today. |
| Tor | SOCKS5 | Slow, high latency, and frequently blocked. |
| Psiphon | SOCKS5 / HTTP | Auto-detects the local tunnel. |
| Lantern | HTTP / SOCKS5 | Headless build per platform. |
| WARP (Cloudflare) | SOCKS5 | Via `warp-cli` or `wireproxy`. |
| WireGuard | WireGuard tunnels | Rotates across `wg/*.conf` configs. |
| V2Ray (Xray) | SOCKS5 local | vmess / vless / trojan / shadowsocks nodes. |
| sing-box | SOCKS5 local | hysteria2 / tuic nodes. |
| Outline | Shadowsocks (SIP002) | Via `sslocal`, rotates across `outline.txt`. |
| Nym mixnet | SOCKS5 | Needs an exit gateway address. |
| I2P | HTTP / HTTPS | Requires an I2P router. |
| Hola VPN | HTTP | Datacenter and residential exit IPs. |
| Opera VPN | HTTP | Region selectable (EU / AS / AM). |

## Quick start

Open the host in a browser and copy the ready-made config, or use the samples
below. Replace `BASE` with one of the Live endpoints, for example
`http://usa6.kerit.cloud:9253`.

### OpenCode CLI

Config file: `~/.config/opencode/opencode.json`
(Windows: `%USERPROFILE%\.config\opencode\opencode.json`)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "fo": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "F.O Free",
      "options": {
        "baseURL": "BASE/v1",
        "apiKey": "fo"
      },
      "models": {
        "deepseek-v4.1-flash-free": {
          "name": "DeepSeek V4.1 Flash Free"
        }
      }
    }
  },
  "model": "fo/deepseek-v4.1-flash-free"
}
```

If the file already exists, merge the `provider` entry and the `model` line.
Then run `/models` inside OpenCode and pick the model.

### Claude Code

Config file: `~/.claude/settings.json`
(Windows: `%USERPROFILE%\.claude\settings.json`)

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "BASE",
    "ANTHROPIC_AUTH_TOKEN": "fo",
    "ANTHROPIC_MODEL": "deepseek-v4.1-flash-free",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "deepseek-v4.1-flash-free",
    "CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY": "1"
  }
}
```

`ANTHROPIC_BASE_URL` is the origin only. Claude Code appends `/v1/messages` itself.
The token value is ignored by the gateway, so any placeholder works.

## Endpoints

| Path | Purpose |
| --- | --- |
| `/` | Setup page with a live config generator. |
| `/v1/models` | Available models, OpenAI-compatible format. |
| `/v1/chat/completions` | OpenAI-compatible chat. Used by OpenCode CLI. |
| `/v1/messages` | Anthropic-compatible messages. Used by Claude Code. |

The gateway detects the client from the path and protocol, so one base URL works
for both CLIs.

## Models

The model list is read live from OpenCode at `BASE/v1/models` and can change
without notice. Typical entries include:

| Model ID | Name |
| --- | --- |
| `deepseek-v4.1-flash-free` | DeepSeek V4.1 Flash Free |
| `beam-free` | Beam Free |
| `glm-5.3-flash-free` | GLM-5.3-Flash Free |
| `big-pickle` | Big Pickle |
| `flint-40b-free` | Flint 40B Free |
| `mimo-v2.6-flash-free` | MiMo-V2.6-Flash Free |
| `nemotron-3.5-lightning-free` | Nemotron 3.5 Lightning Free |
| `nemotron-3.5-super-vl-free` | Nemotron 3.5 Super VL Free |
| `pulse-alpha-free` | Pulse Alpha Free |

## What to expect

This is a personal, free setup. It is not production infrastructure.

| Thing | Reality |
| --- | --- |
| Uptime | No SLA. Hosts may be down, slow, or change without notice. |
| 429s | Still possible. Free quota is counted per egress IP, and the pool is finite. When it runs out, the wait can stretch for hours. |
| Latency | Not stable. Proxy quality varies, and the pool rotates on failure. |
| Capacity | Shared. Expect a few users per exit IP, a few dozen per free host. Past that it saturates. |
| Privacy | Requests pass through an intermediate proxy. Conversation content may pass through third parties, so do not send sensitive data or credentials. |

If one host fails, switch to another host in the table. If every host returns
`429`, the free quota is exhausted and it is best to wait.

## How it works

A small forwarder sits in front of OpenCode's inference endpoint. It:

- accepts OpenAI-style and Anthropic-style requests and forwards them to OpenCode,
- presents the request so it matches a real free-tier client,
- spreads requests across a rotating proxy pool and retries on failure,
- keeps every proxy in the rotation instead of benching one permanently.

The workaround itself is intentionally not published, because it would be patched
quickly. This repository only documents the public endpoints and how to point a CLI
at them.

## Support

Optional support for hosting and the proxy pool is available on the setup page of
any live host.

## Disclaimer

- Not affiliated with, endorsed by, or sponsored by OpenCode or Anthropic. All
  product names and trademarks belong to their respective owners.
- Provided free and as-is, with no warranty and no guarantee of uptime.
- Use at your own risk. Do not send secrets or sensitive data through it.
- This is a temporary stopgap. Expect downtime, instability, and overload,
  especially as more people use it.
