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
  },
  {
    keywords: ["selfridges"],
    response: "Voted the best department store in the world, Selfridges has all the latest designer collections, must-have toys & gifts for all the family."
  },
  {
    keywords: ["selfridges returns"],
    response: "Selfridges offers complimentary returns for online purchases within 14 days of delivery or collection, either via post, courier, or in-store."
  },
  {
    keywords: ["tanda"],
    response: "Tanda is great!"
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