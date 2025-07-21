## Errors Encountered & Fixes

### 1. MCP STDIO Crash – Unexpected Token Error
**Problem:**  
Got error like:  
`SyntaxError: Unexpected token 'p', "  npm help" is not valid JSON`

**Cause:**  
The MCP proxy tried to run `npm server:dev` instead of `npm run server:dev`. `npm server:dev` is invalid, and it printed plain text to STDOUT, which MCP tried to parse as JSON.

**Solution:** 
Update the arguments field from `npm server:dev` to  `run server:dev`,