import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function AptitudePage() {
    const navigate = useNavigate();
    const [selectedAnswer, setSelectedAnswer] = useState<Record<number, string>>({});

    // Real seeded aptitude questions
    const aptitudeQuestions = [
        {
            id: 1,
            category: "Quantitative",
            text: "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?",
            options: ["120 metres", "150 metres", "180 metres", "200 metres"],
            correct: "150 metres"
        },
        {
            id: 2,
            category: "Logical",
            text: "Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?",
            options: ["(1/3)", "(1/8)", "(2/8)", "(1/16)"],
            correct: "(1/8)"
        },
        {
            id: 3,
            category: "Verbal",
            text: "Choose the exact meaning of the idiom: 'To spill the beans'.",
            options: ["To drop something", "To reveal a secret", "To waste food", "To cook poorly"],
            correct: "To reveal a secret"
        },
        {
            id: 4,
            category: "Logical",
            text: "If 1=3, 2=5, 3=7, 4=9, then 5=?",
            options: ["11", "13", "12", "10"],
            correct: "11"
        }
    ];

    const handleSelect = (qId: number, opt: string) => {
        setSelectedAnswer(prev => ({ ...prev, [qId]: opt }));
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8 md:p-16">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-12 animate-fade-in">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-foreground mb-4 drop-shadow-sm">
                            Aptitude Assessments
                        </h1>
                        <p className="text-lg text-muted-foreground font-medium max-w-2xl">
                            Solve the following aptitude questions below. Select the best answer for each.
                        </p>
                    </div>
                </div>

                <div className="space-y-8">
                    {aptitudeQuestions.map((q, idx) => (
                        <div key={q.id} className="group relative bg-card border border-white/10 p-8 rounded-[2rem] hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 glassmorphism">
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-black text-sm">
                                        {idx + 1}
                                    </span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-primary block">
                                        {q.category}
                                    </span>
                                </div>

                                <h3 className="text-xl md:text-2xl font-semibold mb-6 text-foreground leading-snug">
                                    {q.text}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {q.options.map((opt) => {
                                        const isSelected = selectedAnswer[q.id] === opt;
                                        return (
                                            <button
                                                key={opt}
                                                onClick={() => handleSelect(q.id, opt)}
                                                className={cn(
                                                    "px-6 py-4 rounded-xl border text-left font-medium transition-all duration-300",
                                                    isSelected
                                                        ? "bg-primary text-primary-foreground border-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] scale-[1.02]"
                                                        : "bg-black/5 dark:bg-white/5 border-white/5 hover:border-primary/50 hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex justify-end">
                    <button className="px-10 py-5 bg-gradient-to-r from-success to-emerald-500 text-white font-bold rounded-2xl shadow-[0_10px_30px_rgba(var(--success),0.3)] hover:scale-105 transition-all">
                        Submit Aptitude Test
                    </button>
                </div>
            </div>
        </div>
    );
}
