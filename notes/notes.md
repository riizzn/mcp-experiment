### MCP Server - Methods & What They Do

- **`server.tool(name, schema, handler)`**  
  Adds a tool (like a function) that the client can call.

- **`server.resource(uriTemplate, options, handler)`**  
  Adds a resource (like a file or endpoint) that the client can read.

- **`server.prompt(name, handler)`**  
  Adds a prompt template that the client can use.

- **`server.connect(transport)`**  
  Starts the server.

- **`server.close()`**  
  Stops the server and cleans up.

- **`server.on('error', cb)`**  
  Listens for server-level errors.

- **`server.removeTool(name)` / `.disable()` / `.enable()`**  
  Removes or toggles tools while the server is running. The client gets a `listChanged` update.

### Common Places to Use `await` in Node / MCP

You only use `await` when you're dealing with something **asynchronous** (like reading files, making requests, or starting servers). Here's where you'll see it 95% of the time:

- **File System (fs/promises)**

  - `readFile`, `writeFile`, `readdir`, `mkdir`, `stat`

- **Network / HTTP**

  - `fetch`, `axios.get/post`, database calls like `prisma.user.create`, `pg.query`

- **Timers / Delays**

  - `setTimeout` wrapped in a promise → `await sleep(1000)`
  - Custom `setInterval` wrappers

- **Child Processes**

  - `exec`, `spawn` (Promise versions)

- **Dynamic Imports**

  - `await import('./file.js')`

- **MCP-specific**
  - `server.connect(transport)`
  - Any `async` handlers you write in `server.tool` or `server.resource`

**No `await` needed** for:  
math, string work, loops over arrays, or building plain objects.


### How `server.tool(...)` Works (Think of it Like Filling 5 Small Forms)

When adding a tool in MCP, you're basically filling out 5 parts:

1. **Name**  
   - Example: `"create-user"`  
   - This is the command name the client will call.

2. **Description**  
   - Example: `"create a new user in the database"`  
   - Shown in UI (like Claude/Cursor) to explain what the tool does.

3. **Input Schema**  
   - Example: `{ name: z.string(), email: z.string() }`  
   - Defines **required fields** and types using `zod`.  
   - Client checks input before calling.

4. **Hints** (Extra tool behavior info)

   | Hint              | Example Value   | Meaning                                  |
   |-------------------|-----------------|------------------------------------------|
   | `title`           | `"Create User"` | Display name in tool menu                |
   | `readOnlyHint`    | `false`         | This tool **modifies** data              |
   | `destructiveHint` | `false`         | Doesn’t **delete** anything              |
   | `idempotentHint`  | `false`         | Running it twice = 2 users, not 1        |
   | `openWorldHint`   | `true`          | Tool may call APIs or touch outside data |

5. **Handler Function**  
   - Looks like: `async (params) => { ... }`  
   - Gets **validated input** from the client  
   - Runs your real logic (e.g., `createUser(params)`)  
   - Returns something like:  
     ```js
     {
       content: [{ type: "text", text: "User created" }]
     }
     ```

---

So in short:  
You're telling MCP **what the tool is**, **what input it needs**, **how safe it is**, and **what code to run**.

### Why Use `node` Instead of `npm` in MCP Projects (in mcp.json)

#### Reasons to prefer `node`:

| Reason                | Explanation                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| Clean output          | `node` runs scripts without adding extra logs to STDOUT                     |
| npm adds noise        | `npm run` adds banners and script messages that confuse MCP's parser        |
| Safe for STDIO        | MCP expects clean JSON, not extra output                                    |
| Direct control        | `node` runs your compiled file directly (e.g., `build/server.js`)           |

#### When to use which:

| Approach             | Clean for MCP? | Best used for                      |
|----------------------|----------------|------------------------------------|
| `npm run ...`        | No             | Local dev/testing where logs help  |
| `node build/file.js` | Yes            | Production or STDIO-based usage    |

### MCP Proxy Config - Key Pieces Explained

| Key         | What it does                                                             |
|-------------|--------------------------------------------------------------------------|
| `command`   | Runs the agent using Node.js                                             |
| `args`      | Path to your compiled server file (e.g., `build/server.js`)              |
| `cwd`       | Sets the working directory so Node starts in the right folder            |
| `type: "stdio"` | Tells MCP to use stdin/stdout for communication                      |
| `watch`     | Automatically restarts the server when code changes                      |
| `debug`     | Enables debugging (useful in VS Code)                                    |
| `inputs`    | Manual UI fields you can pass in (none in this case)                     |

### Why We Build TypeScript Before Running

Node.js **can’t run TypeScript (.ts) directly**, so we need to **transpile** it to JavaScript (.js).

When you run:

```bash
npm run server:build:watch









