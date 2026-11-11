# F.O (Forever Open)

F.O is a free, community-run gateway that lets **Claude Code** and **OpenCode CLI**
use OpenCode's free models — even when the free tier answers with
`429 FreeUsageLimitError`.

There are two ways to use it:

| Way | What it is | Best for |
| --- | --- | --- |
| **Run it locally** *(recommended)* | Download the app, run it on your own machine, pick a proxy. You get a private gateway at `http://127.0.0.1:20130`. | Almost everyone. Private, steady, no shared queue. |
| **Use a shared host** | Point your CLI at a public F.O endpoint. Nothing to install. | Trying it out quickly, or a machine where you can't install anything. |

Not affiliated with OpenCode or Anthropic. See [Disclaimer](#disclaimer).

---

## Run it locally (recommended)

You download one file. There is no Node, Bun, or Python to install first — the app
brings everything it needs.

### 1. Download the app

Open the [Releases page](https://github.com/tekdt/9fo/releases/latest) and get the
file that matches your system:

| Your system | Download this file |
| --- | --- |
| Windows (64-bit) | `fo_amd64.exe` |
| Linux (64-bit — Debian, Ubuntu, Mint, Kali, Fedora, Arch…) | `fo_amd64` |
| Linux — Alpine / OpenWrt | `fo_amd64_musl` |
| Debian / Ubuntu (installer) | `fo_amd64.deb` |

### 2. Start it

- **Windows:** double-click `fo_amd64.exe`. (If SmartScreen warns you, choose
  *More info → Run anyway*; the file is unsigned.)
- **Linux (glibc):**
  ```bash
  chmod +x fo_amd64
  ./fo_amd64
  ```
- **Alpine / OpenWrt:** use `fo_amd64_musl` the same way. If it complains about a
  missing library: `apk add libstdc++`.
- **Debian / Ubuntu installer:**
  ```bash
  sudo dpkg -i fo_amd64.deb
  fo
  ```

A menu appears in the terminal.

### 3. Pick a proxy

Choose one number from the menu. F.O will start that proxy for you and begin
serving requests.

| # | Mode | Start here if… |
| --- | --- | --- |
| **5** | **WARP (Cloudflare)** | You want the easiest option. It sets itself up. |
| **3** | **Lantern** | WARP didn't work, or you want another simple option. Downloads its engine on first use. |
| **4** | **Proxy list** | You already have your own proxies in `proxies.txt`. |
| **2** | **Psiphon** | You already run the Psiphon client. |
| 1 | Tor | Nothing else works. Slow, and often blocked. |
| 6 | WireGuard | WARP userspace, or your own `wg/*.conf`. |
| 7 | V2Ray (Xray) | You want free vmess / vless / trojan / ss nodes. |
| 8 | sing-box | Free hysteria2 / tuic nodes. |
| 9 | Outline | Shadowsocks (SIP002) keys. |
| 10 | I2P | You already run an I2P router. |
| 11 | Hola VPN | HTTP proxy, datacenter + residential IPs. |
| 12 | Opera VPN | HTTP proxy, pick a region (EU / AS / AM). |
| 13 | Help | Flags, short commands, hosting tips. |
| 14 | Settings | Switch between Direct mode (default) and zen-proxy mode. |
| 15 | Exit | Quit. |

Most modes download a small helper program the first time you use them. That is
normal, and it is cached for next time.

When it is ready, F.O prints a banner like this:

```
Listen:     http://127.0.0.1:20130
Mode:       Direct
Proxies:    1 loaded
```

That address — `http://127.0.0.1:20130` — is your private gateway. Keep this window
open while you work; closing it stops the gateway.

### 4. Point your CLI at it

F.O automatically updates your OpenCode config to use itself. For Claude Code, or if
you want to do it by hand, see [Connect your CLI](#connect-your-cli). Use
`http://127.0.0.1:20130` as the **BASE** everywhere that section says `BASE`.

If you open `http://127.0.0.1:20130/` in a browser, you get a small setup page with a
ready-made config you can copy.

The gateway only listens on `127.0.0.1` (your own machine). Nothing is exposed to
the network, and your proxy settings stay on your disk.

### Where your files live

| What | Location |
| --- | --- |
| Settings & state — Windows | `%LOCALAPPDATA%\fo\` |
| Settings & state — Linux | `~/.local/share/fo/` (or `$XDG_DATA_HOME/fo`) |
| OpenCode config (edited for you) | `~/.config/opencode/opencode.json` — Windows: `%USERPROFILE%\.config\opencode\opencode.json` |
| Your optional proxy list | `proxies.txt` inside the settings folder above |

Helper programs that get downloaded on first use (Lantern, WARP, Xray…) are cached
under `bin/` in the same folder. Deleting the settings folder resets the app to
defaults.

---

## Use a shared host (nothing to install)

Prefer not to run anything? Pick one of these public endpoints and point your CLI at
it. Every host serves the same API, but each reaches OpenCode through a different
proxy provider. If one is slow or down, try another.

| Host | Base URL | Provider (egress) | Region | Status |
| --- | --- | --- | --- | --- |
| KeritCloud (usa6) | `http://usa6.kerit.cloud:9253` | WARP | Global | Live |
| OptikLink | `http://160.191.77.60:8223` | Sing-Box (hysteria2 / tuic) | Global | Live |
| Bot-Hosting | `https://fo.apps.bot-hosting.cloud/` | V2Ray (Xray) | Global | Live |
| KataBump | `http://51.83.6.7:20305` | Proxy list (rotating residential) | Rotating | Live |

More hosts are planned. Open any host in a browser to copy a ready-made config, or
use the samples in [Connect your CLI](#connect-your-cli) with `BASE` set to the host
URL.

Shared hosts are free and shared, so they can be slower or busier than running your
own copy. Want your own public host? The source archive `bun-proxy-src.zip` is on the
same Releases page.

---

## Connect your CLI

Replace **BASE** with either your local gateway (`http://127.0.0.1:20130`) or one of
the shared host URLs above.

### OpenCode CLI

Config file: `~/.config/opencode/opencode.json`
(Windows: `%USERPROFILE%\.config\opencode\opencode.json`)

> When you run F.O locally, it usually writes this file for you — just open
> `/models` inside OpenCode and pick a model.

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

If the file already exists, just add the `provider` entry and the `model` line.

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

`ANTHROPIC_BASE_URL` is the origin only — Claude Code adds `/v1/messages` itself. The
token value is ignored by the gateway, so any placeholder works.

---

## Endpoints

| Path | Purpose |
| --- | --- |
| `/` | Setup page with a live config generator. |
| `/v1/models` | Available models, OpenAI-compatible format. |
| `/v1/chat/completions` | OpenAI-compatible chat. Used by OpenCode CLI. |
| `/v1/messages` | Anthropic-compatible messages. Used by Claude Code. |
| `/health` | Quick status of the gateway, its proxies, and its helper process. |

The gateway figures out which client you are from the path, so one base URL works for
both CLIs.

## Models

The list is read live from OpenCode at `BASE/v1/models` and can change without
notice. Typical entries include:

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

## Proxy providers

Any host — and your local app — can reach OpenCode through one of these. A local run
uses whichever one you pick in the menu; a shared host uses one of them at a time.

| Provider | Type | Notes |
| --- | --- | --- |
| Proxy list | HTTP / SOCKS5 pool | Your own rotating pool. |
| Tor | SOCKS5 | Slow, high latency, frequently blocked. |
| Psiphon | SOCKS5 / HTTP | Auto-detects the local tunnel. |
| Lantern | HTTP / SOCKS5 | Downloads a headless build per platform. |
| WARP (Cloudflare) | SOCKS5 | Via `warp-cli`, `warp-plus`, or `wireproxy`. |
| WireGuard | WireGuard tunnels | WARP userspace, or your `wg/*.conf` files. |
| V2Ray (Xray) | SOCKS5 local | vmess / vless / trojan / shadowsocks nodes. |
| sing-box | SOCKS5 local | hysteria2 / tuic nodes. |
| Outline | Shadowsocks (SIP002) | Via `sslocal`, across `outline.txt`. |
| Nym mixnet | SOCKS5 | Needs an exit gateway address. |
| I2P | HTTP / HTTPS | Requires an I2P router. |
| Hola VPN | HTTP | Datacenter and residential exit IPs. |
| Opera VPN | HTTP | Region selectable (EU / AS / AM). |

## What to expect

This is a personal, free project. It is not professional infrastructure.

| Thing | Reality |
| --- | --- |
| Uptime | No guarantee. Hosts and proxy sources can be down or slow without notice. |
| 429s | Still possible. Free quota is counted per exit IP, and the pool is limited. When it runs out, you may have to wait. |
| Latency | Not stable. Proxy quality varies, and the app switches proxies when one fails. |
| Request spacing | To stay gentle on the shared free quota, the local app starts requests about 30 seconds apart. You can raise this in **Settings → Advanced Options**. |
| Privacy | Requests pass through an intermediate proxy. Conversation content may go through third parties — don't send secrets or sensitive data. |

If a host fails, switch to another. If every option returns `429`, the free quota for
that proxy is used up — wait, or switch proxy.

## If something goes wrong

| Symptom | What to try |
| --- | --- |
| `502` when sending a request | The proxy is not really connected. Pick a different mode (try 5 or 3), or check your proxy in menu **4**. |
| `429` / "usage limit reached" | That exit IP's free quota is used up. Switch proxy (menu **1–12**), or wait. |
| The CLI can't connect | Make sure the F.O window is still open and shows `Listen: http://127.0.0.1:20130`. |
| Changed something and it broke | Delete the settings folder (see [Where your files live](#where-your-files-live)) and start again. |
| Unsure which proxy works | Start with **5 (WARP)**, then **3 (Lantern)**. Both set themselves up. |

## How it works

A small forwarder sits in front of OpenCode's inference endpoint. It:

- accepts OpenAI-style and Anthropic-style requests and forwards them to OpenCode,
- presents each request so it matches a real free-tier client,
- spreads requests across a rotating proxy pool and retries when one fails,
- keeps every proxy in the rotation instead of benching one permanently.

## Support

Optional support helps cover hosting and the proxy pool. It also removes the
request-spacing wait in the local app. Details are on the setup page — entirely
optional, and everything keeps working without it.

## Disclaimer

- Not affiliated with, endorsed by, or sponsored by OpenCode or Anthropic. All
  product names and trademarks belong to their respective owners.
- Provided free and as-is, with no warranty and no guarantee of uptime.
- Use at your own risk. Do not send secrets or sensitive data through it.
- This is a temporary stopgap. Expect downtime, instability, and overload,
  especially as more people use it.
