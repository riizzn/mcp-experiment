"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prompts_1 = require("@inquirer/prompts");
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const mcp = new index_js_1.Client({
    name: "test-client",
    version: "1.0.0",
}, { capabilities: { sampling: {} } });
const transport = new stdio_js_1.StdioClientTransport({
    command: "node",
    args: ["build/server.js"],
    stderr: "ignore",
});
async function main() {
    await mcp.connect(transport);
    const [{ tools }, { prompts }, { resources }, { ResourceTemplate }] = await Promise.all([
        mcp.listTools(),
        mcp.listPrompts(),
        mcp.listResources(),
        mcp.listResourceTemplates(),
    ]);
    console.log("You are connected!");
    while (true) {
        const option = await (0, prompts_1.select)({
            message: "What would you like to do",
            choices: ["Query", "Tools", "Resources", "Prompts"],
        });
        switch (option) {
            case "Tools":
                const toolName = await (0, prompts_1.select)({
                    message: "Select a tool",
                    choices: tools.map((tool) => {
                        var _a;
                        return ({
                            name: ((_a = tool.annotations) === null || _a === void 0 ? void 0 : _a.title) || tool.name,
                            value: tool.name,
                            description: tool.description,
                        });
                    }),
                });
                const tool = tools.find((t) => t.name === toolName);
                if (tool == null) {
                    console.error("Tool not found");
                }
                else {
                    await handleTool(tool);
                }
                break;
        }
    }
}
async function handleTool(tool) {
    var _a;
    const args = {};
    for (const [key, value] of Object.entries((_a = tool.inputSchema.properties) !== null && _a !== void 0 ? _a : {})) {
        args[key] = await (0, prompts_1.input)({
            message: `Enter value for ${key} (${value.type}):`,
        });
    }
    const res = await mcp.callTool({
        name: tool.name,
        arguments: args,
    });
    console.log(res.content[0].text);
}
main();
//# sourceMappingURL=client.js.map