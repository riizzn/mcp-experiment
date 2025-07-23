"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const prompts_1 = require("@inquirer/prompts");
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const google_1 = require("@ai-sdk/google");
const ai_1 = require("ai");
const mcp = new index_js_1.Client({
    name: "test-client",
    version: "1.0.0",
}, { capabilities: { sampling: {} } });
const transport = new stdio_js_1.StdioClientTransport({
    command: "node",
    args: ["build/server.js"],
    stderr: "ignore",
});
const google = (0, google_1.createGoogleGenerativeAI)({
    apiKey: process.env.GEMINI_API_KEY,
});
async function main() {
    var _a, _b, _c;
    await mcp.connect(transport);
    const [{ tools }, { prompts }, { resources }, { resourceTemplates }] = await Promise.all([
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
            case "Resources":
                const resourceUri = await (0, prompts_1.select)({
                    message: "Select a resource",
                    choices: [
                        ...resources.map((resource) => ({
                            name: resource.name,
                            value: resource.uri,
                            description: resource.description,
                        })),
                        ...resourceTemplates.map((template) => ({
                            name: template.name,
                            value: template.uriTemplate,
                            description: template.description,
                        })),
                    ],
                });
                const uri = (_b = (_a = resources.find((r) => r.uri === resourceUri)) === null || _a === void 0 ? void 0 : _a.uri) !== null && _b !== void 0 ? _b : (_c = resourceTemplates.find((r) => r.uriTemplate === resourceUri)) === null || _c === void 0 ? void 0 : _c.uriTemplate;
                if (uri == null) {
                    console.error("Resource not found.");
                }
                else {
                    await handleResource(uri);
                }
                break;
            case "Prompts":
                const promptName = await (0, prompts_1.select)({
                    message: "Select a prompt",
                    choices: prompts.map((prompt) => ({
                        name: prompt.name,
                        value: prompt.name,
                        description: prompt.description,
                    })),
                });
                const prompt = prompts.find((p) => p.name === promptName);
                if (prompt == null) {
                    console.error("Prompt not found");
                }
                else {
                    await handlePrompt(prompt);
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
async function handleResource(uri) {
    let finalUri = uri;
    const paramMatches = uri.match(/{([^}]+)}/g);
    if (paramMatches != null) {
        for (const paramMatch of paramMatches) {
            const paramName = paramMatch.replace("{", "").replace("}", "");
            const paramValue = await (0, prompts_1.input)({
                message: `Enter value for ${paramName}:`,
            });
            finalUri = finalUri.replace(paramMatch, paramValue);
        }
    }
    const res = await mcp.readResource({
        uri: finalUri,
    });
    console.log(JSON.stringify(JSON.parse(res.contents[0].text), null, 2));
}
async function handlePrompt(prompt) {
    var _a;
    const args = {};
    for (const arg of (_a = prompt.arguments) !== null && _a !== void 0 ? _a : []) {
        args[arg.name] = await (0, prompts_1.input)({
            message: `Enter value for ${arg.name}:`,
        });
    }
    const res = await mcp.getPrompt({
        name: prompt.name,
        arguments: args,
    });
    for (const message of res.messages) {
        console.log(await handleServerMessagePrompt(message));
    }
}
async function handleServerMessagePrompt(message) {
    if (message.content.type !== "text")
        return;
    console.log(message.content.text);
    const run = await (0, prompts_1.confirm)({
        message: "Would you like to run the above prompt",
        default: true,
    });
    if (!run)
        return;
    const { text } = await (0, ai_1.generateText)({
        model: google("gemini-2.0-flash"),
        prompt: message.content.text,
    });
    return text;
}
main();
//# sourceMappingURL=client.js.map