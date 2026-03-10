# Building a Simple AI Chatbot

This project shows how to run a **local Large Language Model (LLM)** and build a simple chatbot using **Node.js and Ollama**.

The goal is to demonstrate that experimenting with AI **doesn't have to be complicated**.

Instead of building a full production AI system, we implement a small example that includes three important concepts used in real AI products:

- Custom responses (a lightweight **RAG-style pattern**)
- A **system prompt** to control behaviour
- A fallback to an **LLM for generated responses**

---

# How the Chatbot Works

The chatbot follows a simple flow:
```
User Input
↓
Check Custom Responses (RAG-style lookup)
↓
If match found → return predefined response
↓
If no match → send prompt to LLM
↓
Return generated response
```

This mirrors how many real AI systems work. Instead of relying entirely on the LLM, the system first checks known information.

## First step:
#### Run the existing Chatbot
Run the chatbot and pass an input message:
```
npx tsx chatbot.ts "Tanda"
```
