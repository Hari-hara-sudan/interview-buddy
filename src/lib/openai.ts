import OpenAI from "openai";

export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";

export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for frontend usage
});
