## Errors Encountered & Fixes

### 1. MCP STDIO Crash – Unexpected Token Error
**Problem:**  
Got error like:  
`SyntaxError: Unexpected token 'p', "  npm help" is not valid JSON`

**Cause:**  
The MCP proxy tried to run `npm server:dev` instead of `npm run server:dev`. `npm server:dev` is invalid, and it printed plain text to STDOUT, which MCP tried to parse as JSON.

**Solution:** 
Update the arguments field from `npm server:dev` to  `run server:dev`,

## MCP Error: MODULE_NOT_FOUND During Server Startup

### Error Message
code: 'MODULE_NOT_FOUND'
Server exited before responding to initialize request.

---

### What Happened

- The MCP server was configured to run `build/server.js`.
- But `build/server.js` did not exist when the server was started.
- Because of that, Node.js threw a MODULE_NOT_FOUND error and exited.
- Since the process exited immediately, MCP never received an `initialize` response.

---

### Cause

- TypeScript was compiling the source files into a folder named `dist/` by default.
- But the MCP configuration expected the output in the `build/` folder.
- This mismatch caused the MCP server to fail on startup because it couldn't find the expected file.

---

### How I Fixed It

1. Opened `tsconfig.json`.
2. Changed the compiler output directory from `dist` to `build`:
   ```json
   {
     "compilerOptions": {
       "outDir": "build"
     }
   }

