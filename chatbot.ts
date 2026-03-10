

function chatbot() {
const userInput = process.argv.slice(2).join(" ")

if (!userInput) {
  console.log("Please provide a message.")
  console.log('Example: npx tsx chatbot.ts "hello"')
  process.exit(0)
}

// Lightweight RAG-style responses
const customResponses: Record<string, string> = {
  hello: "Hi there 👋"
}

const lowerInput = userInput.toLowerCase()

for (const phrase in customResponses) {
  if (lowerInput.includes(phrase)) {
    console.log("Bot:", customResponses[phrase])
    process.exit(0)
  }
}
}

askLLM()
