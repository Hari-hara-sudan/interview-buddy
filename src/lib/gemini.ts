import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
export const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
