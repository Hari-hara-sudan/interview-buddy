import Vapi from "@vapi-ai/web";

export const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY || "";
export const VAPI_ASSISTANT_ID_ONBOARDING = import.meta.env.VITE_PUBLIC_VAPI_ASSISTANT_ID || "";
export const VAPI_ASSISTANT_ID_INTERVIEW = import.meta.env.VITE_PUBLIC_VAPI_INTERVIEW_ASSISTANT_ID || "";

const vapi = new Vapi(VAPI_PUBLIC_KEY);

export default vapi;
