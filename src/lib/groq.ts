import Groq from "groq-sdk";

export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

export const groq = new Groq({
    apiKey: GROQ_API_KEY,
    dangerouslyAllowBrowser: true // Required for frontend usage
});
