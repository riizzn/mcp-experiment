"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = __importDefault(require("zod"));
const promises_1 = __importDefault(require("node:fs/promises"));
const server = new mcp_js_1.McpServer({
    name: "test",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
        prompts: {},
    },
});
server.resource("users", "users://all", {
    description: "Get all users data from the database",
    title: "Users",
    mimeType: "application/json",
}, async (uri) => {
    const users = await import("./data/users.json", {
        with: { type: "json" },
    }).then((m) => m.default);
    return {
        contents: [
            {
                uri: uri.href,
                text: JSON.stringify(users),
                mimeType: "application/json",
            },
        ],
    };
});
server.tool("create-user", "create a new user in the database", {
    name: zod_1.default.string(),
    email: zod_1.default.string(),
    address: zod_1.default.string(),
    phone: zod_1.default.string(),
}, {
    title: "Create User",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
}, async (params) => {
    try {
        const id = await createUser(params);
        return {
            content: [{ type: "text", text: `User ${id} created successfully` }],
        };
    }
    catch (_a) {
        return {
            content: [{ type: "text", text: "Failed to save user" }],
        };
    }
});
server.tool("delete-user", "delete an existing user", {
    id: zod_1.default.number(),
}, {
    title: "Delete a User",
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: true,
}, async (params) => {
    try {
        const id = await deleteUser(params.id);
        return {
            content: [{ type: "text", text: `User ${id} deleted successfully` }],
        };
    }
    catch (_a) {
        return {
            content: [{ type: "text", text: "Failed to delete user" }],
        };
    }
});
async function createUser(user) {
    const users = await import("./data/users.json", {
        with: { type: "json" },
    }).then((m) => m.default);
    const id = users.length + 1;
    users.push({ id, ...user });
    await promises_1.default.writeFile("./src/data/users.json", JSON.stringify(users, null, 2));
    return id;
}
async function deleteUser(id) {
    const users = await import("./data/users.json", {
        with: { type: "json" },
    }).then((m) => m.default);
    const updatedUsers = users.filter((user) => user.id !== id);
    await promises_1.default.writeFile("./src/data/users.json", JSON.stringify(updatedUsers, null, 2));
    return id;
}
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
}
main();
//# sourceMappingURL=server.js.map