# Build Your Own AI Chatbot

A hands-on tutorial to build an AI chatbot with RAG, Agents, and LLM - step by step.

---

## What We're Building

By the end, you'll have a chatbot that works like this:

```
You: "hello"           → RAG: "Hi! How can I help?"
You: "what time is it" → Agent: calls get_time → "It's 3:45 PM"
You: "what is AI?"     → LLM: generates a response
```

**Three layers:**
1. **RAG** - Fast keyword responses
2. **Agent** - Uses tools to do things
3. **LLM** - Generates answers with AI

---

## Prerequisites

- Node.js 18+
- Terminal access

---

## Step 0: Setup

Create a new folder and initialize the project:

```bash
mkdir my-ai-chatbot
cd my-ai-chatbot
npm init -y
npm install typescript @types/node tsx ollama -D
npm install ollama
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true
  }
}
```

Create a `src` folder:

```bash
mkdir src
```

---

## Step 1: Basic Chatbot (Echo)

Let's start with the simplest chatbot - it just echoes what you say.

Create `src/index.ts`:

```typescript
const input = process.argv.slice(2).join(" ");
console.log(`You said: ${input}`);
```

Test it:

```bash
npx tsx src/index.ts "hello world"
```

**Expected output:**
```
You said: hello world
```

---

## Step 2: Add RAG Responses

RAG (Retrieval-Augmented Generation) means checking a list of known responses first.

Create `src/rag/responses.ts`:

```typescript
export const responses = [
  {
    keywords: ["hello", "hi", "hey"],
    response: "Hello! How can I help you today?"
  },
  {
    keywords: ["how are you"],
    response: "I'm doing great! Thanks for asking."
  },
  {
    keywords: ["bye", "goodbye"],
    response: "Goodbye! Come back soon!"
  },
  {
    keywords: ["help"],
    response: "I can answer questions, tell time, do math, or check weather. Just ask!"
  }
];

export function findResponse(input: string): string | null {
  const lower = input.toLowerCase();
  for (const entry of responses) {
    for (const keyword of entry.keywords) {
      if (lower.includes(keyword)) {
        return entry.response;
      }
    }
  }
  return null;
}
```

Update `src/index.ts`:

```typescript
import { findResponse } from "./rag/responses";

const input = process.argv.slice(2).join(" ");

const response = findResponse(input);

if (response) {
  console.log(`Bot: ${response}`);
} else {
  console.log("Bot: I don't understand. (No RAG match)");
}
```

Test it:

```bash
npx tsx src/index.ts "hello"
npx tsx src/index.ts "how are you"
npx tsx src/index.ts "what is AI"
```

**Expected outputs:**
```
Bot: Hello! How can I help you today?
Bot: I'm doing great! Thanks for asking.
Bot: I don't understand. (No RAG match)
```

---

## Step 3: Add Ollama LLM

Now let's add an AI that can answer anything. We need **Ollama** running.

First, start Ollama (in a separate terminal):

```bash
ollama serve
ollama pull llama3.2
```

Create `src/llm/ollama.ts`:

```typescript
import Ollama from "ollama";

export async function chat(messages: { role: string; content: string }[]): Promise<string> {
  const response = await Ollama.chat({
    model: "llama3.2",
    messages,
  });
  return response.message.content;
}

export async function isOllamaRunning(): Promise<boolean> {
  try {
    await Ollama.list();
    return true;
  } catch {
    return false;
  }
}
```

Update `src/index.ts` to use LLM when RAG fails:

```typescript
import { findResponse } from "./rag/responses";
import { chat, isOllamaRunning } from "./llm/ollama";

async function main() {
  const input = process.argv.slice(2).join(" ");

  // Step 1: Check RAG
  const ragResponse = findResponse(input);
  if (ragResponse) {
    console.log(`Bot: ${ragResponse}`);
    return;
  }

  // Step 2: Use LLM
  const ollamaRunning = await isOllamaRunning();
  if (!ollamaRunning) {
    console.log("Bot: Ollama not running. Start it with: ollama serve");
    return;
  }

  console.log("Bot: (thinking...)");
  const llmResponse = await chat([{ role: "user", content: input }]);
  console.log(`Bot: ${llmResponse}`);
}

main();
```

Test it (with Ollama running):

```bash
npx tsx src/index.ts "what is machine learning"
```

**Expected output:**
```
Bot: (thinking...)
Bot: Machine learning is a type of artificial intelligence...
```

---

## Step 4: Add Agent Tools

An agent can use tools. Let's add some useful tools.

Create `src/agent/tools.ts`:

```typescript
export interface Tool {
  name: string;
  description: string;
  execute: (params: Record<string, string>) => Promise<string>;
}

export const tools: Tool[] = [
  {
    name: "get_time",
    description: "Get the current time",
    execute: async () => new Date().toISOString()
  },
  {
    name: "calculate",
    description: "Do math calculations",
    execute: async ({ expression }) => {
      try {
        const result = Function(`"use strict"; return (${expression})`)();
        return String(result);
      } catch {
        return "Error: invalid expression";
      }
    }
  },
  {
    name: "get_weather",
    description: "Get weather for a city",
    execute: async ({ city }) => {
      const conditions = ["sunny", "cloudy", "rainy"];
      const temp = Math.floor(Math.random() * 30) + 10;
      return `${city}: ${conditions[Math.floor(Math.random() * conditions.length)]}, ${temp}°C`;
    }
  }
];

export function getToolDefs(): string {
  return tools.map(t => `- ${t.name}: ${t.description}`).join("\n");
}

export async function runTool(name: string, params: Record<string, string>): Promise<string> {
  const tool = tools.find(t => t.name === name);
  if (!tool) return `Unknown tool: ${name}`;
  return tool.execute(params);
}
```

Test the tools directly:

```typescript
import { runTool } from "./agent/tools";

async function test() {
  console.log(await runTool("get_time", {}));
  console.log(await runTool("calculate", { expression: "2 + 2" }));
  console.log(await runTool("get_weather", { city: "Tokyo" }));
}

test();
```

Run:

```bash
npx tsx src/index.ts
```

---

## Step 5: Build the Agent

The agent decides WHEN to use tools. It asks the LLM to choose.

Create `src/agent/runner.ts`:

```typescript
import { chat } from "../llm/ollama";
import { getToolDefs, runTool } from "./tools";

const SYSTEM_PROMPT = `You are an assistant with tools.

Available tools:
${getToolDefs()}

Instructions:
- If the user asks for time, weather, or math, respond with JSON:
  {"tool": "tool_name", "params": {"param": "value"}}
- Otherwise, respond normally (no JSON)

Example:
User: What time is it?
Assistant: {"tool": "get_time", "params": {}}

User: What's 2+2?
Assistant: {"tool": "calculate", "params": {"expression": "2+2"}}

User: Hello!
Assistant: Hello! How can I help?`;

export async function runAgent(input: string): Promise<string> {
  const response = await chat([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: input }
  ]);

  // Try to find tool call in response
  const match = response.match(/\{"tool":\s*"(\w+)".*?"params":\s*(\{.*?\})\}/);
  
  if (match) {
    const toolName = match[1];
    const params = JSON.parse(match[2]);
    
    console.log(`→ Using tool: ${toolName}`);
    const result = await runTool(toolName, params);
    console.log(`→ Result: ${result}`);
    
    // Ask LLM to give final answer with result
    const final = await chat([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: input },
      { role: "assistant", content: response },
      { role: "user", content: `Tool result: ${result}. Give final answer.` }
    ]);
    
    return final;
  }

  return response;
}
```

---

## Step 6: Full Chatbot

Now let's put it all together - RAG → Agent → LLM.

Update `src/index.ts`:

```typescript
import { findResponse } from "./rag/responses";
import { isOllamaRunning } from "./llm/ollama";
import { runAgent } from "./agent/runner";

async function main() {
  const input = process.argv.slice(2).join(" ");
  if (!input) {
    console.log("Usage: npx tsx src/index.ts \"your message\"");
    return;
  }

  console.log(`You: ${input}`);

  // Step 1: RAG
  const ragResponse = findResponse(input);
  if (ragResponse) {
    console.log(`Bot: ${ragResponse}`);
    return;
  }

  // Step 2: Agent
  const ollamaRunning = await isOllamaRunning();
  if (!ollamaRunning) {
    console.log("Bot: Ollama not running. Start with: ollama serve");
    return;
  }

  const response = await runAgent(input);
  console.log(`Bot: ${response}`);
}

main();
```

---

## Step 7: Test Everything

Run these tests:

```bash
# RAG - predefined response
npx tsx src/index.ts "hello"

# Agent - uses tool
npx tsx src/index.ts "what time is it"
npx tsx src/index.ts "what is 25 * 4"
npx tsx src/index.ts "weather in Sydney"

# LLM - generates response
npx tsx src/index.ts "what is Python"
```

**Expected outputs:**
```
You: hello
Bot: Hello! How can I help you today?

You: what time is it
→ Using tool: get_time
→ Result: 2024-01-15T10:30:00.000Z
Bot: The current time is 2024-01-15T10:30:00.000Z.

You: what is Python
Bot: Python is a high-level, interpreted programming language...
```

---

## Summary

You built a chatbot with three layers:

| Layer | File | Purpose |
|-------|------|---------|
| RAG | `src/rag/responses.ts` | Fast keyword responses |
| Agent | `src/agent/runner.ts` | Decides to use tools |
| Tools | `src/agent/tools.ts` | get_time, calculate, etc |
| LLM | `src/llm/ollama.ts` | Generates answers |

---

## Extensions to Try

1. **Add more RAG responses** in `src/rag/responses.ts`
2. **Add new tools** in `src/agent/tools.ts` (file reading, API calls)
3. **Try different models**: Change `"llama3.2"` to `"mistral"` or `"codellama"`
4. **Add chat history**: Store messages and pass to LLM

Happy building!
