import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MonacoEditor from "@monaco-editor/react";
import { groq } from "@/lib/groq";
import { executeCode } from "@/lib/piston";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import JobMarketStats from "@/components/JobMarketStats";
import ResumeAssessmentStats from "@/components/ResumeAssessmentStats";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

// Use local worker via Vite's URL import
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// ── Storage Keys ───────────────────────────────────────────────────────
const STORAGE_KEY = "resumeAssessment";

// ── Types ──────────────────────────────────────────────────────────────
interface ParsedResume {
    name: string;
    email: string;
    skills: string[];
    experience: string;
    education: string;
    summary: string;
}

interface Question {
    id: number;
    question: string;
    options?: string[];
    correctAnswer?: string;
    type: "mcq" | "code";
    userAnswer?: string;
    testCases?: { input: string; expected: string }[];
    defaultCode?: { javascript: string; python: string; java: string };
    selectedLanguage?: "javascript" | "python" | "java";
    runResult?: {
        status: "success" | "error" | "failed" | "running";
        output: string;
        passed: number;
        total: number;
        testResults?: { input: string; expected: string; actual: string; passed: boolean }[];
    };
}

interface AssessmentConfig {
    aptitude: number;
    programming: number;
    verbal: number;
}

interface AssessmentState {
    phase: "upload" | "preview" | "assessment" | "results";
    parsedResume: ParsedResume | null;
    config: AssessmentConfig;
    questions: Record<"aptitude" | "programming" | "verbal", Question[]>;
    submitted: boolean;
    scores: Record<"aptitude" | "programming" | "verbal", number>;
    activeTab: "aptitude" | "programming" | "verbal";
    currentProgPage: number;
}

type AssessmentTab = "aptitude" | "programming" | "verbal";

// ── Utility Functions ──────────────────────────────────────────────────
const saveToLocalStorage = (state: AssessmentState) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
        console.error("Failed to save to localStorage", err);
    }
};

const loadFromLocalStorage = (): AssessmentState | null => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (err) {
        console.error("Failed to load from localStorage", err);
        return null;
    }
};

const clearLocalStorage = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
        console.error("Failed to clear localStorage", err);
    }
};

// ── Firestore Functions ────────────────────────────────────────────────
const saveAssessmentToFirestore = async (userId: string, state: AssessmentState, assessmentId: string) => {
    try {
        const assessmentRef = doc(collection(db, "users", userId, "assessments"), assessmentId);
        await setDoc(assessmentRef, {
            ...state,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
        });
    } catch (err) {
        console.error("Failed to save assessment to Firestore", err);
    }
};

const loadAssessmentFromFirestore = async (userId: string, assessmentId: string): Promise<AssessmentState | null> => {
    try {
        // Optional: load from Firestore if needed
        // For now, we'll rely on localStorage for current session
        return null;
    } catch (err) {
        console.error("Failed to load assessment from Firestore", err);
        return null;
    }
};

// ── Main Component ─────────────────────────────────────────────────────
export default function ResumeAssessmentPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const assessmentIdRef = useRef<string>(new Date().getTime().toString()); // Unique ID for this assessment session

    // Phase states
    const [phase, setPhase] = useState<"upload" | "preview" | "assessment" | "results">("upload");

    // Upload states
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileText, setFileText] = useState("");
    const [parsing, setParsing] = useState(false);
    const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);

    // Config
    const [config, setConfig] = useState<AssessmentConfig>({ aptitude: 5, programming: 5, verbal: 5 });

    // Assessment states
    const [generating, setGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<AssessmentTab>("aptitude");
    const [currentProgPage, setCurrentProgPage] = useState(0);
    const [questions, setQuestions] = useState<Record<AssessmentTab, Question[]>>({
        aptitude: [], programming: [], verbal: [],
    });
    const [submitted, setSubmitted] = useState(false);
    const [scores, setScores] = useState<Record<AssessmentTab, number>>({ aptitude: 0, programming: 0, verbal: 0 });

    // ── Load from localStorage on mount ────────────────────────────────
    useEffect(() => {
        const savedState = loadFromLocalStorage();
        if (savedState) {
            setPhase(savedState.phase);
            setParsedResume(savedState.parsedResume);
            setConfig(savedState.config);
            setQuestions(savedState.questions);
            setSubmitted(savedState.submitted);
            setScores(savedState.scores);
            setActiveTab(savedState.activeTab);
            setCurrentProgPage(savedState.currentProgPage);
        }
    }, []);

    // ── Save to localStorage whenever state changes ────────────────────
    useEffect(() => {
        const state: AssessmentState = {
            phase,
            parsedResume,
            config,
            questions,
            submitted,
            scores,
            activeTab,
            currentProgPage,
        };
        saveToLocalStorage(state);
    }, [phase, parsedResume, config, questions, submitted, scores, activeTab, currentProgPage]);

    // ── Save to Firestore when assessment is submitted ───────────────────
    useEffect(() => {
        if (submitted && user && phase === "results") {
            const state: AssessmentState = {
                phase,
                parsedResume,
                config,
                questions,
                submitted,
                scores,
                activeTab,
                currentProgPage,
            };
            saveAssessmentToFirestore(user.uid, state, assessmentIdRef.current);
        }
    }, [submitted, user, phase]);

    // ── Auto-save to Firestore during assessment (every 30 seconds) ──────
    useEffect(() => {
        if (!user || phase !== "assessment" || !questions.aptitude.length) return;

        const autoSaveInterval = setInterval(() => {
            const state: AssessmentState = {
                phase,
                parsedResume,
                config,
                questions,
                submitted,
                scores,
                activeTab,
                currentProgPage,
            };
            saveAssessmentToFirestore(user.uid, state, assessmentIdRef.current);
        }, 30000); // Save every 30 seconds

        return () => clearInterval(autoSaveInterval);
    }, [user, phase]);

    // ── File Handling ────────────────────────────────────────────────────
    const handleFile = useCallback(async (f: File) => {
        setFile(f);
        setParsing(true);
        let extractedText = "";

        try {
            if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) {
                const arrayBuffer = await f.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    // @ts-ignore
                    const pageText = textContent.items.map((item) => item.str).join(" ");
                    extractedText += pageText + "\n";
                }
            } else {
                extractedText = await f.text();
            }
        } catch (err) {
            console.error("Failed to read file", err);
            extractedText = "Error reading file content.";
        }

        setFileText(extractedText);
        parseResume(extractedText);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
    }, [handleFile]);

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);

    // ── Parse Resume via Groq LLaMA ──────────────────────────────────────
    const parseResume = async (text: string) => {
        setParsing(true);
        // Generate a new unique ID for this assessment session
        assessmentIdRef.current = new Date().getTime().toString();
        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are an expert resume parser. Respond strictly with a raw JSON object string. Do not include markdown code blocks like ```json."
                    },
                    {
                        role: "user",
                        content: `Parse this resume text and extract structured information. Return ONLY valid JSON with these fields:
{
  "name": "candidate full name",
  "email": "email if found, else empty string",
  "skills": ["skill1", "skill2", ...],
  "experience": "brief experience summary (2-3 lines max)",
  "education": "education summary (1-2 lines)",
  "summary": "1-line professional summary"
}

Resume text:
${text.slice(0, 4000)}`
                    }
                ],
                model: "llama-3.1-8b-instant",
                temperature: 0.1,
                response_format: { type: "json_object" }
            });

            const raw = completion.choices[0]?.message?.content || "{}";
            const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const parsed = JSON.parse(jsonStr) as ParsedResume;
            setParsedResume(parsed);
        } catch (err: any) {
            console.error("Resume parse error:", err);
            const isRateLimit = err?.message?.includes("429") || err?.message?.includes("quota");

            setParsedResume({
                name: isRateLimit ? "API Rate Limit Exceeded" : "Could not parse",
                email: "",
                skills: [isRateLimit ? "Wait ~15s and try again" : "Unable to extract skills"],
                experience: isRateLimit
                    ? "You have hit the Gemini API free tier rate limit (15 requests/min). Please wait a few seconds and re-upload the file."
                    : "Parsing failed — please try a different file format.",
                education: "",
                summary: "",
            });
        }
        setParsing(false);
    };

    // ── Generate Questions via Groq LLaMA ────────────────────────────────
    const generateAssessment = async () => {
        if (!parsedResume) return;
        setGenerating(true);
        try {
            const skillList = parsedResume.skills.join(", ");

            const prompt = `You are an expert assessment creator. Based on a candidate's resume, generate a customized assessment with THREE question types.

CANDIDATE SKILLS: ${skillList}
CANDIDATE EXPERIENCE: ${parsedResume.experience}

YOU MUST GENERATE EXACTLY these numbers of questions - no more, no fewer:
1️⃣ APTITUDE: ${config.aptitude} questions (quantitative, logical reasoning, patterns)
2️⃣ PROGRAMMING: ${config.programming} questions (coding challenges with test cases)
3️⃣ VERBAL: ${config.verbal} questions (reading, grammar, vocabulary, communication)

CRITICAL: ALL THREE SECTIONS MUST BE PRESENT IN YOUR RESPONSE. If you cannot generate enough, fill with basic alternatives.

STRICT FORMAT — Return ONLY valid JSON (no markdown):
{
  "aptitude": [
    { "id": 1, "question": "What is 5 + 3?", "options": ["A) 8", "B) 9", "C) 7", "D) 10"], "correctAnswer": "A", "type": "mcq" },
    ... (exactly ${config.aptitude} items)
  ],
  "programming": [
    {
      "id": 1,
      "question": "Reverse a string",
      "type": "code",
      "testCases": [
        { "input": "hello", "expected": "olleh" }
      ],
      "defaultCode": {
        "javascript": "function solve(input) {\\n  // Write code here\\n}",
        "python": "def solve(input):\\n    pass",
        "java": "class Solution {\\n    public String solve(String input) {\\n        return null;\\n    }\\n}"
      }
    },
    ... (exactly ${config.programming} items)
  ],
  "verbal": [
    { "id": 1, "question": "Which word is a synonym of happy?", "options": ["A) Sad", "B) Joyful", "C) Angry", "D) Tired"], "correctAnswer": "B", "type": "mcq" },
    ... (exactly ${config.verbal} items)
  ]
}

DO NOT OMIT ANY SECTION. Each section must have EXACTLY the number of items specified.`;

            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are an expert assessment generator. Return strictly valid JSON object. Do not include markdown."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: "llama-3.1-8b-instant",
                temperature: 0.3,
                response_format: { type: "json_object" }
            });

            const raw = completion.choices[0]?.message?.content || "{}";
            const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const data = JSON.parse(jsonStr);

            console.log("📊 Generated Assessment Data:", {
                aptitude: data.aptitude?.length || 0,
                programming: data.programming?.length || 0,
                verbal: data.verbal?.length || 0,
                rawData: data
            });

            // ── ENFORCE EXACT COUNTS ──────────────────────────────────────
            // Slice arrays to match config exactly (handle both excess and shortage)
            let aptitudeQuestions = (data.aptitude || []).slice(0, config.aptitude);
            let programmingQuestions = (data.programming || []).slice(0, config.programming);
            let verbalQuestions = (data.verbal || []).slice(0, config.verbal);

            // ── FALLBACK: Generate missing verbal questions ────────────────
            if (verbalQuestions.length < config.verbal) {
                console.warn(`⚠️ Verbal questions incomplete. Generated: ${verbalQuestions.length}, Expected: ${config.verbal}`);
                const needed = config.verbal - verbalQuestions.length;
                const basicVerbalQuestions = [
                    { id: 1, question: "What is the antonym of 'begin'?", options: ["A) Start", "B) End", "C) Continue", "D) Resume"], correctAnswer: "B", type: "mcq" },
                    { id: 2, question: "Choose the correct sentence:", options: ["A) She go to school", "B) She goes to school", "C) She going to school", "D) She gone to school"], correctAnswer: "B", type: "mcq" },
                    { id: 3, question: "What does 'eloquent' mean?", options: ["A) Silent", "B) Expressive and fluent", "C) Confused", "D) Angry"], correctAnswer: "B", type: "mcq" },
                    { id: 4, question: "Identify the subject: 'The cat sat on the mat'", options: ["A) mat", "B) sat", "C) cat", "D) on"], correctAnswer: "C", type: "mcq" },
                    { id: 5, question: "Which word is spelled correctly?", options: ["A) Occassion", "B) Ocasion", "C) Occasion", "D) Ocasyon"], correctAnswer: "C", type: "mcq" },
                ];
                for (let i = 0; i < needed && i < basicVerbalQuestions.length; i++) {
                    verbalQuestions.push({
                        ...basicVerbalQuestions[i],
                        id: verbalQuestions.length + i + 1
                    });
                }
                console.log(`✅ Added ${needed} fallback verbal questions`);
            }

            console.log("✅ Final Question Counts:", {
                expectedAptitude: config.aptitude,
                actualAptitude: aptitudeQuestions.length,
                expectedProgramming: config.programming,
                actualProgramming: programmingQuestions.length,
                expectedVerbal: config.verbal,
                actualVerbal: verbalQuestions.length,
            });

            setQuestions({
                aptitude: aptitudeQuestions.map((q: Question, i: number) => ({ ...q, id: i + 1, userAnswer: "", type: "mcq" })),
                programming: programmingQuestions.map((q: Question, i: number) => ({
                    ...q,
                    id: i + 1,
                    userAnswer: q.defaultCode?.javascript || "",
                    type: "code",
                    selectedLanguage: "javascript"
                })),
                verbal: verbalQuestions.map((q: Question, i: number) => ({ ...q, id: i + 1, userAnswer: "", type: "mcq" })),
            });
            
            // ── VALIDATE COUNT ───────────────────────────────────────────────
            const expectedTotal = config.aptitude + config.programming + config.verbal;
            const actualTotal = aptitudeQuestions.length + programmingQuestions.length + verbalQuestions.length;
            
            if (actualTotal < expectedTotal) {
                console.warn(`⚠️ Question count mismatch: Expected ${expectedTotal}, got ${actualTotal}. Some fallback questions were applied.`);
            }
            
            setPhase("preview");
        } catch (err: any) {
            console.error("Question generation error:", err);
            const isRateLimit = err?.message?.includes("429") || err?.message?.includes("quota");
            if (isRateLimit) {
                alert("API Rate Limit Exceeded: You have hit the Gemini free tier limit. Please wait 15 seconds and try again.");
            } else {
                alert("Failed to generate assessment. Please check the console for details.");
            }
        }
        setGenerating(false);
    };

    // ── Answer & Score ───────────────────────────────────────────────────
    const setAnswer = (tab: AssessmentTab, questionId: number, answer: string) => {
        setQuestions(prev => ({
            ...prev,
            [tab]: prev[tab].map(q => q.id === questionId ? { ...q, userAnswer: answer } : q),
        }));
    };

    const runCode = async (tab: AssessmentTab, questionId: number) => {
        const q = questions[tab].find(qu => qu.id === questionId);
        if (!q || !q.userAnswer) return;

        setQuestions(prev => ({
            ...prev,
            [tab]: prev[tab].map(qu => qu.id === questionId ? { ...qu, runResult: { status: "running" as const, output: "⏳ Compiling and running code...", passed: 0, total: 0 } as any } : qu)
        }));

        try {
            const lang = (q.selectedLanguage || "javascript") as "javascript" | "python" | "java";
            
            // Execute code using Piston API (real compiler)
            const result = await executeCode(lang, q.userAnswer, q.testCases || []);

            console.log("✅ Code Execution Result:", result);

            setQuestions(prev => ({
                ...prev,
                [tab]: prev[tab].map(qu => qu.id === questionId ? {
                    ...qu,
                    runResult: {
                        status: result.passed === result.total && result.total > 0 ? "success" : result.status === "error" ? "error" : "failed",
                        output: result.stderr || result.stdout || "Execution completed",
                        passed: result.passed || 0,
                        total: result.total || 0,
                        testResults: result.testResults || []
                    }
                } : qu)
            }));
        } catch (err: any) {
            console.error("❌ Code execution error:", err);
            setQuestions(prev => ({
                ...prev,
                [tab]: prev[tab].map(qu => qu.id === questionId ? {
                    ...qu,
                    runResult: { status: "error", output: err.message || "Failed to execute code", passed: 0, total: q.testCases?.length || 0 }
                } : qu)
            }));
        }
    };

    const submitAssessment = () => {
        const calcScore = (tab: AssessmentTab) => {
            const qs = questions[tab];
            if (qs.length === 0) return 0;
            
            // For MCQ: normalize answers by extracting just the first letter
            const correct = qs.filter(q => {
                if (q.type === "mcq") {
                    // Extract first letter from both answers for comparison
                    const userLetter = q.userAnswer?.charAt(0)?.toUpperCase() || "";
                    const correctLetter = (q.correctAnswer || "")?.charAt(0)?.toUpperCase() || "";
                    return userLetter && correctLetter && userLetter === correctLetter;
                }
                // For code questions, compare the exact code submission
                return q.userAnswer === q.correctAnswer;
            }).length;
            
            return Math.round((correct / qs.length) * 100);
        };
        setScores({
            aptitude: calcScore("aptitude"),
            programming: calcScore("programming"),
            verbal: calcScore("verbal"),
        });
        setSubmitted(true);
        setPhase("results");
    };

    const totalAnswered = Object.values(questions).flat().filter(q => q.userAnswer).length;
    const totalQuestions = Object.values(questions).flat().length;

    // ── PHASE: Upload & Configure ────────────────────────────────────────
    if (phase === "upload") {
        return (
            <div className="container max-w-5xl mx-auto px-4 py-8 animate-fade-in">
                {/* Header Section - Like HomePage */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">
                            Resume <span className="animated-gradient-text">Assessment</span>
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Upload your resume and get a customized assessment tailored to your skills
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/")}
                        className="px-5 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-secondary transition-all"
                    >
                        Back
                    </button>
                </div>

                {/* Job Market Stats */}
                <JobMarketStats />

                {/* Main Content - Centered Card */}
                <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                        {/* Left: Drop Zone */}
                        <div
                            className={cn(
                                "p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 lg:border-r border-gray-200 min-h-[380px]",
                                isDragging ? "bg-blue-50 border-blue-300" : "bg-gray-50 hover:bg-gray-100"
                            )}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.docx,.txt,.doc"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                            />

                            {file ? (
                                <div className="text-center space-y-3">
                                    <div className="w-16 h-16 mx-auto rounded-2xl bg-green-100 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="font-semibold text-foreground">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setFile(null); setParsedResume(null); setFileText(""); }}
                                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                                    >
                                        ✕ Remove
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-blue-50 flex items-center justify-center border-2 border-dashed border-blue-300">
                                        <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Drag & drop your resume</p>
                                        <p className="text-sm text-gray-500 mt-1">or click to browse — PDF, DOCX, TXT supported</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Parsed Preview */}
                        <div className="p-8 min-h-[380px] flex flex-col justify-center bg-white border-l border-gray-100">
                            {parsing ? (
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm font-medium text-gray-600">Parsing resume with AI...</p>
                                </div>
                            ) : parsedResume ? (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                            {parsedResume.name?.[0]?.toUpperCase() || "?"}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground text-lg">{parsedResume.name}</p>
                                            {parsedResume.email && <p className="text-xs text-gray-500">{parsedResume.email}</p>}
                                        </div>
                                    </div>

                                    {parsedResume.summary && (
                                        <p className="text-sm text-gray-600 italic border-l-2 border-blue-300 pl-3">{parsedResume.summary}</p>
                                    )}

                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Skills Detected</h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {parsedResume.skills.map((skill, i) => (
                                                <span key={i} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {parsedResume.experience && (
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Experience</h4>
                                            <p className="text-sm text-foreground">{parsedResume.experience}</p>
                                        </div>
                                    )}

                                    {parsedResume.education && (
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Education</h4>
                                            <p className="text-sm text-foreground">{parsedResume.education}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
                                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-sm font-medium">Resume preview will appear here</p>
                                    <p className="text-xs mt-1">Upload a file to get started</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Configuration Panel */}
                {parsedResume && (
                    <div className="border border-border rounded-2xl bg-card p-6 shadow-lg animate-fade-in space-y-6">
                        <h2 className="text-lg font-bold text-foreground">Configure Assessment</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {([
                                { key: "aptitude" as const, label: "Aptitude", icon: "🧠", color: "from-blue-500 to-cyan-500", description: "Logic, reasoning & math skills" },
                                { key: "programming" as const, label: "Programming", icon: "💻", color: "from-green-500 to-emerald-500", description: "Coding challenges & algorithms" },
                                { key: "verbal" as const, label: "Verbal Ability", icon: "📝", color: "from-purple-500 to-pink-500", description: "Communication & language skills" },
                            ]).map(({ key, label, icon, color, description }) => (
                                <div key={key} className="bg-gradient-to-br from-card to-secondary/20 rounded-xl p-6 border border-border/30 hover:border-primary/30 transition-all group">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
                                        <div className="flex-1">
                                            <span className="font-semibold text-foreground text-sm block">{label}</span>
                                            <span className="text-[11px] text-muted-foreground">{description}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <input
                                                type="range"
                                                min={1}
                                                max={20}
                                                value={config[key]}
                                                onChange={(e) => setConfig(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                                                className="flex-1 accent-primary h-2.5 rounded-full cursor-pointer appearance-none bg-gradient-to-r from-gray-200 to-gray-300"
                                                style={{
                                                    background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${(config[key] / 20) * 100}%, #e5e7eb ${(config[key] / 20) * 100}%, #e5e7eb 100%)`
                                                }}
                                            />
                                            <span className={`text-lg font-bold w-10 text-right bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                                                {config[key]}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-muted-foreground">{config[key]} question{config[key] !== 1 ? 's' : ''}</p>
                                            <div className="text-xs font-medium text-muted-foreground">
                                                {config[key] <= 5 && "Essential"}
                                                {config[key] > 5 && config[key] <= 10 && "Moderate"}
                                                {config[key] > 10 && config[key] <= 15 && "Comprehensive"}
                                                {config[key] > 15 && "Intensive"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <p className="text-sm text-muted-foreground">
                                Total: <span className="font-bold text-foreground">{config.aptitude + config.programming + config.verbal}</span> questions
                            </p>
                            <button
                                onClick={generateAssessment}
                                disabled={generating}
                                className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                {generating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Generating...
                                    </>
                                ) : (
                                    "Generate Assessment"
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── PHASE: Preview ───────────────────────────────────────────────────
    if (phase === "preview") {
        const totalQuestions = questions.aptitude.length + questions.programming.length + questions.verbal.length;
        
        return (
            <div className="container max-w-2xl mx-auto px-4 py-8 animate-fade-in">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">Your Assessment is Ready</h1>
                        <p className="text-sm text-muted-foreground mt-1">Review the questions before starting</p>
                    </div>
                    <button
                        onClick={() => setPhase("upload")}
                        className="px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-secondary transition-all"
                    >
                        ← Back
                    </button>
                </div>

                {/* Assessment Preview Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
                    {/* Resume Info */}
                    <div className="mb-8 pb-6 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-foreground mb-2">{parsedResume?.name}'s Assessment</h2>
                        <p className="text-sm text-muted-foreground">{parsedResume?.summary || "Based on your resume"}</p>
                    </div>

                    {/* Questions Breakdown */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {([
                            { key: "aptitude" as const, label: "Aptitude", icon: "🧠", color: "from-blue-500 to-cyan-500" },
                            { key: "programming" as const, label: "Programming", icon: "💻", color: "from-green-500 to-emerald-500" },
                            { key: "verbal" as const, label: "Verbal", icon: "📝", color: "from-purple-500 to-pink-500" },
                        ]).map(({ key, label, icon, color }) => (
                            <div key={key} className="bg-gradient-to-br from-card to-secondary/20 rounded-xl p-5 border border-border/30">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-2xl">{icon}</span>
                                    <span className={`text-2xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                                        {questions[key].length}
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-foreground">{label}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {questions[key].length} question{questions[key].length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Total & Info */}
                    <div className="bg-primary/5 rounded-xl p-5 border border-primary/10 mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Total Questions</p>
                                <p className="text-2xl font-bold text-primary mt-1">{totalQuestions} questions</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Estimated Time</p>
                                <p className="text-lg font-semibold text-foreground mt-1">{Math.round(totalQuestions * 2)} min</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => setPhase("assessment")}
                            className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        >
                            Start Assessment
                        </button>
                        <button
                            onClick={() => {
                                setPhase("upload");
                                setQuestions({ aptitude: [], programming: [], verbal: [] });
                                setGenerating(false);
                            }}
                            className="px-6 py-3 border border-border rounded-xl font-semibold text-sm hover:bg-secondary transition-all"
                        >
                            Regenerate
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── PHASE: Assessment ────────────────────────────────────────────────
    if (phase === "assessment") {
        return (
            <div className="container max-w-4xl mx-auto px-4 py-8 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Your Assessment</h1>
                        <p className="text-sm text-muted-foreground">Based on {parsedResume?.name}'s resume</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground font-medium">
                            {totalAnswered}/{totalQuestions} answered
                            {totalQuestions < (config.aptitude + config.programming + config.verbal) && (
                                <span className="text-xs text-yellow-600 ml-2">⚠️ Some categories generated fewer questions</span>
                            )}
                        </span>
                        <button
                            onClick={submitAssessment}
                            disabled={totalQuestions === 0 || totalAnswered < totalQuestions}
                            title={totalQuestions === 0 ? "No questions generated" : totalAnswered < totalQuestions ? "Answer all questions first" : "Submit your assessment"}
                            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            Submit Assessment
                        </button>
                    </div>
                </div>

                {/* Tab Bar */}
                <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl mb-6 border border-border/30">
                    {([
                        { key: "aptitude" as const, label: "🧠 Aptitude", count: questions.aptitude.length },
                        { key: "programming" as const, label: "💻 Programming", count: questions.programming.length },
                        { key: "verbal" as const, label: "📝 Verbal", count: questions.verbal.length },
                    ]).map(({ key, label, count }) => {
                        const answered = questions[key].filter(q => q.userAnswer).length;
                        return (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={cn(
                                    "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all",
                                    activeTab === key
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {label}
                                <span className="ml-1.5 text-xs opacity-60">{answered}/{count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Questions */}
                <div className="space-y-4">
                    {activeTab === "programming" ? (
                        <div className="animate-fade-in relative pb-16">
                            {[questions.programming[currentProgPage]].filter(Boolean).map((q, idx) => (
                                <div key={q.id} className="bg-card border border-border/40 rounded-xl p-5 transition-all hover:border-primary/20">
                                    <p className="font-semibold text-foreground mb-4">
                                        <span className="text-primary mr-2">Q{currentProgPage + 1}.</span>
                                        {q.question}
                                    </p>

                                    <div className="mt-4 space-y-4">
                                        <div className="bg-secondary/30 rounded-xl p-4 border border-border/40">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Test Cases</h4>
                                            <div className="space-y-2">
                                                {q.testCases?.map((tc, i) => (
                                                    <div key={i} className="bg-card border border-border/30 rounded-lg p-3 text-[13px] font-mono text-muted-foreground break-all">
                                                        <div className="mb-1"><span className="font-bold text-foreground">Input:</span> {tc.input}</div>
                                                        <div><span className="font-bold text-primary">Expected Output:</span> {tc.expected}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between px-1">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Code Editor</h4>
                                            <select
                                                value={q.selectedLanguage || "javascript"}
                                                onChange={(e) => {
                                                    const lang = e.target.value as "javascript" | "python" | "java";
                                                    setQuestions(prev => ({
                                                        ...prev,
                                                        [activeTab]: prev[activeTab].map(qu => qu.id === q.id ? {
                                                            ...qu,
                                                            selectedLanguage: lang,
                                                            userAnswer: qu.defaultCode?.[lang as keyof typeof qu.defaultCode] || ""
                                                        } : qu)
                                                    }));
                                                }}
                                                className="bg-secondary border border-border text-xs font-semibold rounded-lg px-2 py-1 outline-none text-foreground"
                                            >
                                                <option value="javascript">JavaScript</option>
                                                <option value="python">Python</option>
                                                <option value="java">Java</option>
                                            </select>
                                        </div>

                                        <div className="border border-border/40 rounded-xl overflow-hidden shadow-inner h-[300px]">
                                            <MonacoEditor
                                                height="100%"
                                                language={q.selectedLanguage || "javascript"}
                                                theme="vs"
                                                value={q.userAnswer || ""}
                                                onChange={(val) => setAnswer(activeTab, q.id, val || "")}
                                                options={{ minimap: { enabled: false }, fontSize: 13, padding: { top: 16 } }}
                                            />
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <button
                                                onClick={() => runCode(activeTab, q.id)}
                                                disabled={q.runResult?.status === "running"}
                                                className="self-start bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg"
                                            >
                                                {q.runResult?.status === "running" ? "Evaluating..." : "Compile & Run Tests"}
                                            </button>

                                            {q.runResult && (
                                                <div className={cn(
                                                    "w-full p-4 rounded-xl font-mono text-[13px] border",
                                                    q.runResult.status === "error" ? "bg-red-500/10 border-red-500/40 text-red-500" :
                                                        q.runResult.status === "success" ? "bg-green-500/10 border-green-500/40 text-green-500" :
                                                            "bg-black/90 border-border/40 text-white/80"
                                                )}>
                                                    <div className="flex items-center justify-between mb-3 border-b border-current/10 pb-2">
                                                        <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Evaluation Result</span>
                                                        {q.runResult.status !== "running" && q.runResult.status !== "error" && (
                                                            <span className="text-xs font-bold font-sans">
                                                                {q.runResult.passed} / {q.runResult.total} Passed
                                                            </span>
                                                        )}
                                                    </div>

                                                    {q.runResult.status === "error" ? (
                                                        <pre className="whitespace-pre-wrap">{q.runResult.output}</pre>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {q.runResult.testResults?.map((tr, i) => (
                                                                <div key={i} className="bg-black/40 p-3 rounded-lg border border-white/5">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        {tr.passed ? (
                                                                            <span className="text-green-500 font-bold">✓ Test {i + 1}</span>
                                                                        ) : (
                                                                            <span className="text-red-500 font-bold">✗ Test {i + 1}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs opacity-80 mt-2">
                                                                        <div><span className="opacity-50">Input:</span> {tr.input}</div>
                                                                        <div><span className="opacity-50">Expected:</span> {tr.expected}</div>
                                                                        <div className={tr.passed ? "text-green-400" : "text-red-400"}><span className="opacity-50 text-white">Actual:</span> {tr.actual}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {(!q.runResult.testResults || q.runResult.testResults.length === 0) && (
                                                                <pre className="whitespace-pre-wrap text-current">{q.runResult.output}</pre>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Pagination Controls */}
                            {questions.programming.length > 0 && (
                                <div className="absolute flex items-center justify-between w-full pt-4 mt-4">
                                    <button
                                        onClick={() => setCurrentProgPage(prev => Math.max(0, prev - 1))}
                                        disabled={currentProgPage === 0}
                                        className="px-5 py-2.5 bg-card border border-border/40 rounded-xl text-sm font-bold text-foreground hover:bg-secondary disabled:opacity-40 transition-all shadow-sm"
                                    >
                                        ← Previous
                                    </button>
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-secondary/50 px-4 py-2 rounded-lg border border-border/20">
                                        Challenge {currentProgPage + 1} of {questions.programming.length}
                                    </span>
                                    <button
                                        onClick={() => setCurrentProgPage(prev => Math.min(questions.programming.length - 1, prev + 1))}
                                        disabled={currentProgPage === questions.programming.length - 1}
                                        className="px-5 py-2.5 bg-card border border-border/40 rounded-xl text-sm font-bold text-foreground hover:bg-secondary disabled:opacity-40 transition-all shadow-sm"
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        questions[activeTab].map((q, idx) => (
                            <div key={q.id} className="bg-card border border-border/40 rounded-xl p-5 transition-all hover:border-primary/20">
                                <p className="font-semibold text-foreground mb-4">
                                    <span className="text-primary mr-2">Q{idx + 1}.</span>
                                    {q.question}
                                </p>
                                {q.type === "mcq" && q.options && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {q.options.map((opt, i) => {
                                            const optionLetter = opt.charAt(0);
                                            const isSelected = q.userAnswer === optionLetter;
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => setAnswer(activeTab, q.id, optionLetter)}
                                                    className={cn(
                                                        "text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all",
                                                        isSelected
                                                            ? "bg-primary/10 border-primary text-primary ring-1 ring-primary/30"
                                                            : "border-border/40 text-foreground hover:border-primary/30 hover:bg-secondary/30"
                                                    )}
                                                >
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // ── PHASE: Results ───────────────────────────────────────────────────
    return (
        <div className="container max-w-3xl mx-auto px-4 py-8 animate-fade-in">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-foreground">
                    Assessment Complete!
                </h1>
                <p className="text-muted-foreground mt-2">Here's how {parsedResume?.name} performed</p>
            </div>

            {/* Resume Assessment Stats Overview */}
            <ResumeAssessmentStats />

            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {([
                    { key: "aptitude" as const, label: "Aptitude", icon: "🧠", gradient: "from-blue-500 to-cyan-500" },
                    { key: "programming" as const, label: "Programming", icon: "💻", gradient: "from-green-500 to-emerald-500" },
                    { key: "verbal" as const, label: "Verbal", icon: "📝", gradient: "from-purple-500 to-pink-500" },
                ]).map(({ key, label, icon, gradient }) => (
                    <div key={key} className="bg-card border border-border/40 rounded-2xl p-6 text-center">
                        <span className="text-3xl mb-2 block">{icon}</span>
                        <p className="text-sm font-semibold text-muted-foreground mb-3">{label}</p>
                        <p className={cn("text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r", gradient)}>
                            {scores[key]}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {questions[key].filter(q => {
                                if (q.type === "mcq") {
                                    const userLetter = q.userAnswer?.charAt(0)?.toUpperCase() || "";
                                    const correctLetter = (q.correctAnswer || "")?.charAt(0)?.toUpperCase() || "";
                                    return userLetter && correctLetter && userLetter === correctLetter;
                                }
                                return q.userAnswer === q.correctAnswer;
                            }).length}/{questions[key].length} correct
                        </p>
                    </div>
                ))}
            </div>

            {/* Overall */}
            <div className="bg-card border border-border/40 rounded-2xl p-6 text-center mb-8">
                <p className="text-sm font-semibold text-muted-foreground mb-2">Overall Score</p>
                <p className="text-5xl font-black text-primary">
                    {totalQuestions > 0 ? Math.round(
                        Object.values(questions).flat().filter(q => {
                            if (q.type === "mcq") {
                                const userLetter = q.userAnswer?.charAt(0)?.toUpperCase() || "";
                                const correctLetter = (q.correctAnswer || "")?.charAt(0)?.toUpperCase() || "";
                                return userLetter && correctLetter && userLetter === correctLetter;
                            }
                            return q.userAnswer === q.correctAnswer;
                        }).length / totalQuestions * 100
                    ) : 0}%
                </p>
            </div>

            <div className="flex justify-center gap-4">
                <button
                    onClick={() => { 
                        // Reset assessment ID for new session
                        assessmentIdRef.current = new Date().getTime().toString();
                        clearLocalStorage();
                        setPhase("upload"); 
                        setFile(null); 
                        setParsedResume(null); 
                        setConfig({ aptitude: 5, programming: 5, verbal: 5 });
                        setQuestions({ aptitude: [], programming: [], verbal: [] }); 
                        setSubmitted(false); 
                        setScores({ aptitude: 0, programming: 0, verbal: 0 });
                    }}
                    className="px-6 py-2.5 border border-border rounded-xl font-semibold text-sm hover:bg-secondary transition-all"
                >
                    New Assessment
                </button>
                <button
                    onClick={() => navigate("/")}
                    className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
}
