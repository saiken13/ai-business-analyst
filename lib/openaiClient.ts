// lib/openaiClient.ts
import OpenAI from "openai"

if (!process.env.OPENAI_API_KEY) {
  // This is just to fail fast in dev if you forget the key
  // You can remove this throw if you prefer
  throw new Error("OPENAI_API_KEY is not set in .env")
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
