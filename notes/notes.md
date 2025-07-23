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
```

### URIs in `server.resource` — You Make Them Up

- You can **invent the URI** — it just needs to be:
  - **Unique** within your server
  - Start with a **scheme** (like `letters://`)

---

#### Examples of Custom URIs:
todo://all
stats://cpu
random://joke

- The **client doesn’t care** what the URI means.
- It just sends the **exact URI** back to your server when requested.

# MCP Code Notes - Complete Reference

## MCP Sampling Code - Line by Line Breakdown

### Tool Definition
- **`server.tool("create-random-user", "description", config, handler)`**  
  Creates a new tool that the server can use. Like creating a new button or function.

- **`"create-random-user"`**  
  Tool name/identifier. Other parts of the system use this to call the tool.

- **`"Create a random user with fake data"`**  
  Human-readable description of what this tool does.

### Tool Configuration Object
- **`title: "Create Random User"`**  
  Display name for the tool.

- **`readOnlyHint: false`**  
  This tool WILL change/modify data (creates new users).

- **`destructiveHint: false`**  
  This tool WON'T delete or destroy existing data.

- **`idempotentHint: false`**  
  Running this tool multiple times will give DIFFERENT results each time.

- **`openWorldHint: true`**  
  This tool can work with any kind of data/situation (it's flexible).

### Main Function Structure
- **`async () => { ... }`**  
  The actual function that runs when someone uses this tool. `async` means it can wait for other operations to finish.

### AI Request Methods
- **`server.server.request(params, schema)`**  
  Asks another part of the system (AI model) to do something. `await` means wait for this to finish.

- **`method: "sampling/createMessage"`**  
  Specifies what kind of request we're making - we want to create a message/response.

- **`role: "user"`**  
  Pretending to be a user asking a question to the AI.

- **`maxTokens: 1024`**  
  Limits how long the AI's response can be (roughly 700-800 words).

- **`CreateMessageResultSchema`**  
  Validates that the response follows the expected format.

### Error Checking Methods
- **`if (res.content.type !== "text")`**  
  Checks if we got text back. If not, returns an error message.

- **`try { ... } catch { ... }`**  
  If anything goes wrong in processing, returns error instead of crashing.

### Response Processing Methods
- **`.trim()`**  
  Removes extra spaces at the beginning and end of text.

- **`.replace(/^```json/, "")`**  
  Removes "```json" if it's at the start of the response.

- **`.replace(/```$/, "")`**  
  Removes "```" if it's at the end of the response.

- **`JSON.parse(cleanedText)`**  
  Converts the cleaned text into a JavaScript object we can use.

### User Creation Methods
- **`await createUser(fakeUser)`**  
  Takes the fake user data and creates an actual user record in the system.

- **`return { content: [{ type: "text", text: message }] }`**  
  Returns a response message (success or failure) back to whoever called the tool.

## Common Errors & Solutions

### CreateMessageResultSchema Error
- **`Cannot find name 'CreateMessageResultSchema'`**  
  The schema isn't defined or imported in your code.

### Solutions:
- **Import the Schema:**  
  `import { CreateMessageResultSchema } from '@modelcontextprotocol/sdk/types.js';`

- **Use Different Schema:**  
  Replace with `CreateMessageRequestSchema` if that's what you meant.

- **Remove Schema Completely:**  
  Remove the third parameter from `server.server.request()` call.

- **Define Your Own Schema:**  
  Create a custom validation object for the expected response format.

## Understanding server.server Syntax

### Why Two "server"s?
- **First `server`:**  
  Your MCP server instance (the main object).

- **Second `server`:**  
  A property/method inside that server instance for internal communication.

### Server Object Structure
- **`server.tool()`**  
  For defining tools that clients can call.

- **`server.server.request()`**  
  For making internal requests to other services (like AI models).

### Where It Comes From
- **`import { Server } from '@modelcontextprotocol/sdk/server/index.js'`**  
  Imports the MCP Server class.

- **`const server = new Server(config, capabilities)`**  
  Creates your server instance with the nested structure.

## Purpose of CreateMessageResultSchema

### Response Validation
- **Ensures Correct Structure:**  
  Makes sure the AI response has the expected format with content.type and content.text.

### Runtime Type Checking  
- **Prevents Crashes:**  
  Catches bad responses before they break your code later.

### Early Error Detection
- **Fails Fast:**  
  If response doesn't match schema, it fails immediately with clear error instead of mysterious crashes.

### TypeScript Support
- **Type Safety:**  
  Provides type hints and autocomplete if you're using TypeScript.

### Documentation
- **Living Contract:**  
  Acts as documentation showing what response format you expect from the AI.

## Expected Response Format
```javascript
{
  content: {
    type: "text",
    text: "actual generated content here"
  }
}
```

## What the Tool Actually Does
1. **Asks AI to create fake user data**
2. **Cleans up the AI's response** (removes code formatting)
3. **Converts response to usable JavaScript object**
4. **Creates a real user record** with that data
5. **Reports success or failure** back to the caller


# Understanding the handleTool Function

## My Questions and Explanations

### Q1: Can you explain the handleTool function in detail?

**The Function:**
```javascript
async function handleTool(tool:Tool){
    const args:Record<string,string>={}
    for(const[key,value]of Object.entries(tool.inputSchema.properties??{})){
        args[key]=await input({
            message:`Enter value for ${key} (${(value as {type:string}).type}):`
        })
    }
    
    const res=await mcp.callTool(
        {
            name:tool.name,
            arguments:args
        }
    )
    
    console.log((res.content as [{text:string}])[0].text)
}
```

**What this function does:**
This function takes a tool and helps you use it by:
1. Asking you what information the tool needs
2. Collecting that information from you  
3. Running the tool with your information
4. Showing you the result

**Step-by-step breakdown:**

1. **Create empty box:** `const args: Record<string,string> = {}`
   - Creates empty container to store information
   - Like an empty box for sticky notes with labels and values

2. **Look at tool requirements:** The for loop reads what the tool needs
   - `tool.inputSchema.properties` is like a recipe that says what info is needed
   - `Object.entries()` turns requirements into pairs like `[["name", {type: "string"}]]`

3. **Ask user for each piece:** Inside the loop, asks for each requirement
   - Shows message like "Enter value for name (string):"
   - Stores answer in the args box

4. **Use the tool:** `mcp.callTool()` runs the tool with collected information

5. **Show result:** Prints the tool's response to screen

### Q2: Why the `?? {}` syntax?

**Question:** `tool.inputSchema.properties ?? {}` - why the `{}`?

**Answer:** 
The `??` is called the "nullish coalescing operator" - it's a safety net.

Sometimes `tool.inputSchema.properties` might not exist (null/undefined). If you try to use `Object.entries()` on nothing, the program crashes.

`?? {}` means: "If the properties don't exist, use an empty object `{}` instead."

It's like saying: "If there's no requirements list, pretend there's an empty list so the program doesn't break."

### Q3: Explain the message template syntax

**Question:** Explain `message: \`Enter value for ${key} (${(value as { type: string }).type}):\``

**Answer:**
This uses **template literals** (backticks \` \`). The `${}` puts variables inside text.

Breaking it down:
- `${key}` - puts the name of what we need (like "name")
- `${(value as { type: string }).type}` - gets the data type

Remember `value` looks like `{ type: "string" }`. We want just the "string" part.
- `(value as { type: string })` tells TypeScript "this object has a type property"  
- `.type` gets just that type value

Example result: "Enter value for name (string):"

### Q4: Explain the console.log syntax

**Question:** Explain `console.log((res.content as [{ text: string }])[0].text);`

**Answer:**
This digs into a nested structure to get the result text.

`res.content` contains the tool's response, which looks like:
```javascript
[
  { text: "Hello John!" }
]
```

Breaking it down:
- `(res.content as [{ text: string }])` - tells TypeScript the expected format
- `[0]` - gets the first item from the array  
- `.text` - gets just the text part

It's like reaching into a box, grabbing the first envelope, and reading the message inside.

## Key Takeaway

This function is **flexible** - it works with any tool because:
- It doesn't care what the tool does
- It reads what the tool needs and asks for it
- Works whether tool needs 1 thing or 10 things  
- Like a universal helper that reads instruction manuals and operates any device for you
```

Just copy and paste this into your notes.md file!

```markdown
# JavaScript Operators Explanation

## The `?.` (Question Mark + Dot) - Optional Chaining
This is called **optional chaining**. It's like asking "if this thing exists, then get its property, otherwise give me nothing."

**Without `?.` (the old way):**
```javascript
// This could crash if resource is undefined!
const uri = resources.find((r) => r.uri === resourceUri).uri;
```

**With `?.` (the safe way):**
```javascript
// This won't crash - if find() returns nothing, uri becomes undefined
const uri = resources.find((r) => r.uri === resourceUri)?.uri;
```

Think of it like this:
- "Hey, do you have a box?" 
- If yes: "What's inside the box?"
- If no box exists: "Okay, nothing then" (instead of crashing)

## The `??` (Double Question Mark) - Nullish Coalescing
This is called the **nullish coalescing operator**. It means "use the backup option if the first thing is null or undefined."

```javascript
const result = firstOption ?? backupOption;
```

It's like saying: "Try the first thing, but if it's empty/missing, use the backup instead."

## Breaking Down the Code Step by Step

```javascript
const uri =
  resources.find((r) => r.uri === resourceUri)?.uri ??
  resourceTemplates.find((r) => r.uriTemplate === resourceUri)?.uriTemplate;
```

**Step 1:** `resources.find((r) => r.uri === resourceUri)`
- Look through the `resources` list
- Find one where `r.uri` matches what the user picked
- This might return a resource object, or `undefined` if not found

**Step 2:** `?.uri`
- IF we found a resource, get its `uri` property
- IF we didn't find anything, return `undefined`

**Step 3:** `??`
- IF the first part gave us something, use that
- IF the first part was `undefined`, try the backup option

**Step 4:** `resourceTemplates.find(...)`
- Same as step 1, but look in templates instead
- Find a template where `uriTemplate` matches what user picked

**Step 5:** `?.uriTemplate`
- IF we found a template, get its `uriTemplate` property
- IF not found, return `undefined`

## Real Example
Let's say:
- User picked "user-db"
- `resources` = `[{name: "files", uri: "file://docs"}, {name: "users", uri: "user-db"}]`
- `resourceTemplates` = `[{name: "temp", uriTemplate: "temp://something"}]`

**What happens:**
1. `resources.find(...)` finds `{name: "users", uri: "user-db"}`
2. `?.uri` gets `"user-db"`
3. Since we got something, `??` doesn't need the backup
4. Final result: `uri = "user-db"`

**If user picked something not in resources:**
1. `resources.find(...)` returns `undefined`
2. `?.uri` returns `undefined`
3. `??` says "try the backup!"
4. `resourceTemplates.find(...)` tries to find it there
5. If found there, use that; if not, `uri` becomes `undefined`

## The Final Check
```javascript
if (uri == null) {
  console.error("Resource not found.");
} else {
  await handleResource(uri);
}
```

- `uri == null` checks if `uri` is `null` OR `undefined`
- If it's empty, show error
- If it has a value, use it with `handleResource()`

It's like having two backup plans before giving up!
```







