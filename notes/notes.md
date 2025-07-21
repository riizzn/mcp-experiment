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

