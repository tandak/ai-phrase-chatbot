

import { responses } from "./rag/responses"

function chatbot() {
  const userInput = process.argv.slice(2).join(" ")

  if (!userInput) {
    console.log("chatbot: Please provide a message.")
    console.log('chatbot: Example: npx tsx chatbot.ts "hello"')
    process.exit(0)
  }


const normalized=userInput.toLowerCase();
return `chatbot: ${responses[normalized]}`||"chatbot: Sorry, I don't understand.";
}

console.log(chatbot());
