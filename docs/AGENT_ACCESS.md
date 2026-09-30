# Agent Access & Model Context Protocol (MCP) Guide

Quiet Goals provides a built-in **Model Context Protocol (MCP)** server endpoint that allows external AI agents (such as Claude Desktop, Cursor, Antigravity, Windsurf, or custom AI agents) to securely read and manage your goals on your behalf.

---

## 🧭 Architecture & Overview

- **Protocol Version:** MCP `2024-11-05`
- **Transport:** HTTP (JSON-RPC 2.0 with optional Server-Sent Events / `text/event-stream`)
- **Endpoint:** `/api/mcp` (e.g. `https://quietgoals.vercel.app/api/mcp` or `http://localhost:3000/api/mcp`)
- **Authentication:** Bearer token (`Authorization: Bearer qg_live_...`)
- **Rate Limit:** 60 requests per minute per user
- **Security:** Personal API tokens are hashed with **SHA-256** prior to database storage; raw tokens are displayed only once upon generation and never stored in plaintext. All operations are strictly scoped to the authenticated user's account.

---

## 🔑 Generating an Agent Access Token

1. Open **Quiet Goals** in your browser.
2. Click your user avatar in the top-right corner to open the **Account Menu**.
3. Select **Agent Access** (or click the Settings option).
4. Toggle **Agent access** to **ON**.
5. Copy your newly generated token (starts with `qg_live_...`).
   > **Important:** Save this token immediately. Because it is securely hashed with SHA-256, it cannot be recovered or viewed again once the modal is closed.
6. To revoke or rotate access at any time, toggle **Agent access** OFF (or click **Revoke token**).

---

## ⚙️ Client Configurations

### 1. Claude Desktop

Add Quiet Goals to your `claude_desktop_config.json`:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "quiet-goals": {
      "url": "https://quietgoals.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer qg_live_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

Restart Claude Desktop. You will now see the `quiet-goals` tools available in your conversation.

---

### 2. Cursor / Windsurf / Antigravity

In your IDE settings or MCP configuration file (`~/.gemini/antigravity-ide/mcp_config.json` or `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "quiet-goals": {
      "url": "https://quietgoals.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer qg_live_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

---

### 3. Direct HTTP / cURL (JSON-RPC 2.0)

You can call the MCP endpoint directly using standard HTTP requests:

#### Check Server Status
```bash
curl -X GET "https://quietgoals.vercel.app/api/mcp"
```

Response:
```json
{
  "status": "ok",
  "name": "quiet-goals-mcp",
  "version": "1.0.0",
  "protocolVersion": "2024-11-05",
  "tools": [
    "list_goals",
    "add_goal",
    "update_goal",
    "complete_goal",
    "kill_goal",
    "restore_goal"
  ]
}
```

#### Call a Tool (`list_goals`)
```bash
curl -X POST "https://quietgoals.vercel.app/api/mcp" \
  -H "Authorization: Bearer qg_live_YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_goals",
      "arguments": {
        "status": "active"
      }
    }
  }'
```

Response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[{\"id\":\"84ff3c06-5179-4814-9faf-e8e7225149f6\",\"title\":\"Hello\",\"priority\":\"low\",\"status\":\"active\",\"position\":\"a1\",\"isPinned\":false,\"createdAt\":\"2026-09-30 17:19:43\"}]"
      }
    ]
  }
}
```

---

## 🛠 Available MCP Tools

| Tool Name | Description | Arguments |
| :--- | :--- | :--- |
| `list_goals` | Lists goals for the authenticated user, ordered by list position. | `status` *(optional)*: `'active'`, `'completed'`, `'killed'`, or `'all'` (default: `'active'`) |
| `add_goal` | Adds a new goal to the user's active list with fractional position. | `title` *(required, string, 1–200 chars)*<br>`priority` *(optional)*: `'none'`, `'low'`, `'medium'`, `'high'` |
| `update_goal` | Updates the title or priority of an existing goal. | `id` *(required, UUID string)*<br>`title` *(optional, string, 1–200 chars)*<br>`priority` *(optional)*: `'none'`, `'low'`, `'medium'`, `'high'` |
| `complete_goal` | Marks an active goal as completed and moves it to the archive. | `id` *(required, UUID string)* |
| `kill_goal` | Marks an active goal as killed/abandoned and moves it to the archive. | `id` *(required, UUID string)* |
| `restore_goal` | Restores an archived (completed or killed) goal back to active. | `id` *(required, UUID string)* |

---

## 🔒 Security & Privacy Guarantees

1. **User Isolation:** All operations through the MCP server are strictly scoped to the user account that owns the provided token. An agent cannot view, edit, or delete goals of any other user.
2. **Safe Storage:** Tokens are hashed with SHA-256 before being written to the database. Even if the database were compromised, raw tokens cannot be retrieved.
3. **Instant Revocation:** Toggling Agent Access off in the UI immediately sets `revoked_at = CURRENT_TIMESTAMP`, rejecting all subsequent agent requests.
4. **Rate Limiting:** A sliding window rate limiter protects the endpoint with a quota of 60 requests/minute.
