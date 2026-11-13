# Pinnacle

Pinnacle is a local-first bookmark manager for saving, organizing, and revisiting links. Bookmark data stays in the current browser profile; there are no accounts, backend, or cross-device sync.

## Features

- Save bookmarks with an optional name, description, and tags.
- Search and filter bookmarks, and sort active bookmarks by recommended order, recent views, or name.
- Archive bookmarks without losing their history, then restore them later.
- Track bookmark opens and persist the view before navigating.
- Load favicons from providers using only the bookmark's origin or hostname, with a local fallback.
- Expose bookmark actions as WebMCP tools for connected AI clients.

Bookmark data is persisted in browser `localStorage`; clearing site data or using another browser profile or device will not carry it over.

## Tech stack

React 19, TypeScript 7, Vite 8, Zustand, UnoCSS with the Wind 4 preset, and ShadCN/Radix UI components.

Using `@mcp-b/global`, `@mcp-b/react-webmcp` and Zod for WebMCP support.

## Requirements

- Node.js 24
- npm

## Getting started

With the requirements installed:

```sh
npm install # Install dependencies
npm run dev # Run dev server
```

Available project commands:

```sh
npm run build  # Type-check and create a production build
npm run test   # Run unit tests
npm run lint   # Check linting
npm run fmt    # Check formatting
```

## WebMCP integration

Pinnacle uses `@mcp-b/global` to initialize the WebMCP runtime for non-supported browsers and `@mcp-b/react-webmcp` to register these tools:

- `list_bookmarks`
- `create_bookmark`
- `update_bookmark`
- `partial_update_bookmark`
- `archive_bookmark`
- `restore_bookmark`
- `delete_bookmark`
- `open_bookmark`

To connect WebMCP via local harness, install local relay MCP server to your harness and start Pinnacle and open it in a browser while the local relay MCP server is running.

**Install local relay MCP server via one-click**

[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_WebMCP_Relay-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://vscode.dev/redirect/mcp/install?name=webmcp-local-relay&config=%7B%22type%22%3A%22stdio%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40mcp-b%2Fwebmcp-local-relay%406%22%5D%7D) [![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install_WebMCP_Relay-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=webmcp-local-relay&config=%7B%22type%22%3A%22stdio%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40mcp-b%2Fwebmcp-local-relay%406%22%5D%7D&quality=insiders) [![Install in Visual Studio](https://img.shields.io/badge/Visual_Studio-Install_WebMCP_Relay-C16FDE?style=flat-square&logo=visualstudio&logoColor=white)](https://aka.ms/vs/mcp-install?%7B%22name%22%3A%22webmcp-local-relay%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40mcp-b%2Fwebmcp-local-relay%406%22%5D%7D)

**Or manually setup local relay MCP server**

```jsonc
// <projectRoot>/.mcp.json
{
  "mcpServers": {
    "webmcp-local-relay": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@mcp-b/webmcp-local-relay@6"],
    },
  },
}
```

<br/>

Initial prompt to test WebMCP:

```txt
Connect to http://localhost:5173 and list all WebMCP tools
```

```txt
Connect to asim-tahir.github.io/pinnacle/ and list all WebMCP tools
```

Use these prompts to test each bookmark WebMCP tool. For mutation tests, use the disposable bookmark named **WebMCP Tool Test** created by the `create_bookmark` prompt below. Run the archive, restore, and delete tests in order; delete permanently removes the test bookmark.

To test `create_bookmark` WebMCP tool:

```txt
Create a bookmark for https://example.com/ named "WebMCP Tool Test" with description "Disposable bookmark for testing WebMCP tools" and tags ["WebMCP", "Test"].
```

To test `list_bookmarks` WebMCP tool:

```txt
Search all bookmarks for "WebMCP Tool Test" and show whether the matching bookmark is active or archived.
```

To test `partial_update_bookmark` WebMCP tool:

```txt
For the bookmark named "WebMCP Tool Test", change its description to "Updated by the partial update tool" and replace its tags with ["WebMCP", "Updated"]. Leave its URL and name unchanged.
```

To test `update_bookmark` WebMCP tool:

```txt
For the bookmark named "WebMCP Tool Test", replace all editable fields: set its URL to https://example.org/, its name to "WebMCP Full Update Test", its description to "Updated by the full update tool", and its tags to ["WebMCP", "Full Update"].
```

To test `open_bookmark` WebMCP tool:

```txt
Open the bookmark named "WebMCP Full Update Test" in a new tab and confirm that its view count was recorded.
```

To test `archive_bookmark` WebMCP tool:

```txt
Archive the bookmark named "WebMCP Full Update Test" and confirm it is now archived.
```

To test `restore_bookmark` WebMCP tool:

```txt
Restore the archived bookmark named "WebMCP Full Update Test" and confirm it is active again.
```

To test `delete_bookmark` WebMCP tool:

```txt
Permanently delete the disposable bookmark named "WebMCP Full Update Test". Confirm the deletion and verify that it no longer appears in the bookmark list.
```
