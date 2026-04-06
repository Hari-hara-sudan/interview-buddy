import React, { useState } from "react";
import { cn } from "@/lib/utils";

type Category = "All" | "Quantitative" | "Logical" | "Verbal" | "Data Interpretation";

interface Question {
    id: number;
    category: Exclude<Category, "All">;
    text: string;
    options: string[];
    correct: string;
}

const questions: Question[] = [
    // ── QUANTITATIVE (25) ──
    { id: 1, category: "Quantitative", text: "A train at 60 km/hr crosses a pole in 9 sec. Length of train?", options: ["120 m", "150 m", "180 m", "200 m"], correct: "150 m" },
    { id: 2, category: "Quantitative", text: "Man buys for ₹80, sells for ₹100. Profit %?", options: ["20%", "25%", "30%", "15%"], correct: "25%" },
    { id: 3, category: "Quantitative", text: "6 workers build a wall in 12 days. 9 workers take?", options: ["6", "8", "10", "9"], correct: "8" },
    { id: 4, category: "Quantitative", text: "Simple interest on ₹5000 @ 8% for 3 years?", options: ["₹1200", "₹1400", "₹1000", "₹1600"], correct: "₹1200" },
    { id: 5, category: "Quantitative", text: "Pipe A fills tank in 4 hrs, pipe B in 6 hrs. Together?", options: ["2 h 24 min", "2 h 30 min", "3 h", "2 h"], correct: "2 h 24 min" },
    { id: 6, category: "Quantitative", text: "Average of 5 numbers is 28. If one number is removed, avg becomes 25. Removed number?", options: ["40", "35", "30", "45"], correct: "40" },
    { id: 7, category: "Quantitative", text: "(17 × 17 − 13 × 13) = ?", options: ["110", "120", "130", "140"], correct: "120" },
    { id: 8, category: "Quantitative", text: "A book costs ₹180 after 10% discount. Original price?", options: ["₹198", "₹200", "₹210", "₹220"], correct: "₹200" },
    { id: 9, category: "Quantitative", text: "A is 40% more than B. B is what % less than A?", options: ["28.57%", "30%", "25%", "33.33%"], correct: "28.57%" },
    { id: 10, category: "Quantitative", text: "Speed of a boat in still water is 15 km/hr, stream is 3 km/hr. Upstream speed?", options: ["18", "12", "10", "16"], correct: "12" },
    { id: 11, category: "Quantitative", text: "The ratio of A to B is 3:5. If A = 24, B = ?", options: ["30", "35", "40", "45"], correct: "40" },
    { id: 12, category: "Quantitative", text: "What is 15% of 280?", options: ["36", "40", "42", "45"], correct: "42" },
    { id: 13, category: "Quantitative", text: "LCM of 12 and 18?", options: ["24", "36", "54", "72"], correct: "36" },
    { id: 14, category: "Quantitative", text: "Area of a circle with radius 7 cm? (π=22/7)", options: ["154 cm²", "144 cm²", "132 cm²", "176 cm²"], correct: "154 cm²" },
    { id: 15, category: "Quantitative", text: "A shopkeeper sells at 20% profit. If CP is ₹250, SP is?", options: ["₹280", "₹290", "₹300", "₹310"], correct: "₹300" },
    { id: 16, category: "Quantitative", text: "If P = 2Q and Q = 3R, P : Q : R = ?", options: ["6:3:1", "2:1:3", "3:2:1", "6:2:1"], correct: "6:3:1" },
    { id: 17, category: "Quantitative", text: "Sum of first 20 natural numbers?", options: ["200", "210", "190", "220"], correct: "210" },
    { id: 18, category: "Quantitative", text: "HCF of 36 and 48?", options: ["6", "8", "12", "24"], correct: "12" },
    { id: 19, category: "Quantitative", text: "A car travels 300 km in 5 hrs. Speed in m/s?", options: ["15.67", "16.67", "17.67", "18.67"], correct: "16.67" },
    { id: 20, category: "Quantitative", text: "Compound interest on ₹1000 @ 10% for 2 years?", options: ["₹210", "₹200", "₹220", "₹190"], correct: "₹210" },
    { id: 21, category: "Quantitative", text: "Perimeter of a rectangle: L=12 cm, B=8 cm?", options: ["40 cm", "38 cm", "42 cm", "36 cm"], correct: "40 cm" },
    { id: 22, category: "Quantitative", text: "A number is 35% of 200. What is it?", options: ["60", "65", "70", "75"], correct: "70" },
    { id: 23, category: "Quantitative", text: "√(1024) = ?", options: ["30", "32", "34", "36"], correct: "32" },
    { id: 24, category: "Quantitative", text: "3/4 of a number is 48. The number is?", options: ["60", "64", "72", "80"], correct: "64" },
    { id: 25, category: "Quantitative", text: "A walks 4 km North, turns right, walks 3 km. Distance from start?", options: ["5 km", "7 km", "6 km", "4 km"], correct: "5 km" },

    // ── LOGICAL (25) ──
    { id: 26, category: "Logical", text: "Series: 2, 1, 1/2, 1/4, ... next?", options: ["1/3", "1/8", "2/8", "1/16"], correct: "1/8" },
    { id: 27, category: "Logical", text: "If 1=3, 2=5, 3=7, 4=9, then 5=?", options: ["11", "13", "12", "10"], correct: "11" },
    { id: 28, category: "Logical", text: "Find odd one out: 25, 36, 49, 63, 81", options: ["25", "36", "63", "81"], correct: "63" },
    { id: 29, category: "Logical", text: "A is B's sister. C is B's mother. D is C's father. How is D related to A?", options: ["Grandfather", "Father", "Uncle", "Grandmother"], correct: "Grandfather" },
    { id: 30, category: "Logical", text: "Pointing to a man, a woman says 'his mother is the only daughter of my mother'. How?", options: ["Son", "Father", "Nephew", "Brother"], correct: "Son" },
    { id: 31, category: "Logical", text: "Series: 5, 10, 20, 40, ... next?", options: ["60", "70", "80", "90"], correct: "80" },
    { id: 32, category: "Logical", text: "If FRIEND is coded as HUMJGF, how is CANDLE coded?", options: ["EDROHG", "EDRPGF", "EFRPOJ", "DCQLJQ"], correct: "EDROHG" },
    { id: 33, category: "Logical", text: "All cats are dogs. All dogs are birds. Conclusion: All cats are birds?", options: ["True", "False", "Uncertain", "Partially true"], correct: "True" },
    { id: 34, category: "Logical", text: "Book is to Reading as Fork is to?", options: ["Drawing", "Writing", "Eating", "Cooking"], correct: "Eating" },
    { id: 35, category: "Logical", text: "Mirror image: 12:45 on a clockface. What does the mirror show?", options: ["11:15", "12:15", "1:15", "11:45"], correct: "11:15" },
    { id: 36, category: "Logical", text: "Series: B, E, H, K, ... next?", options: ["M", "N", "O", "P"], correct: "N" },
    { id: 37, category: "Logical", text: "How many triangles in a triangle divided into 4 rows?", options: ["10", "13", "15", "16"], correct: "16" },
    { id: 38, category: "Logical", text: "North → Right → Right → Left. Facing?", options: ["North", "South", "East", "West"], correct: "East" },
    { id: 39, category: "Logical", text: "Odd one out: ABDC, EFHG, IJLK, MNOP", options: ["ABDC", "EFHG", "IJLK", "MNOP"], correct: "MNOP" },
    { id: 40, category: "Logical", text: "10 people shake hands with each other once. Total handshakes?", options: ["40", "45", "50", "55"], correct: "45" },
    { id: 41, category: "Logical", text: "A > B, C < D, B = C. Which is greatest?", options: ["A", "B", "C", "D"], correct: "A" },
    { id: 42, category: "Logical", text: "If TAP = 54, BACK = ?", options: ["26", "25", "24", "27"], correct: "25" },
    { id: 43, category: "Logical", text: "Cube has 6 faces painted. Cut into 27 small cubes. How many have no face painted?", options: ["1", "4", "8", "12"], correct: "1" },
    { id: 44, category: "Logical", text: "Complete: CMM, EOO, GQQ, ... next?", options: ["ISS", "IRS", "HSS", "IST"], correct: "ISS" },
    { id: 45, category: "Logical", text: "All roses are flowers. Some flowers fade. Do roses fade?", options: ["Yes", "No", "Maybe", "Always"], correct: "Maybe" },
    { id: 46, category: "Logical", text: "Statement: Some books are pens. All pens are erasers. Conclusion: Some books are erasers?", options: ["True", "False", "Uncertain", "Neither"], correct: "True" },
    { id: 47, category: "Logical", text: "Dice: 1 opposite 6, 2 opposite 5. 3 is opposite?", options: ["1", "2", "4", "6"], correct: "4" },
    { id: 48, category: "Logical", text: "Series: 0, 3, 8, 15, 24, ... next?", options: ["33", "35", "36", "40"], correct: "35" },
    { id: 49, category: "Logical", text: "20 men take 10 days. 10 men take how many days?", options: ["15", "20", "25", "30"], correct: "20" },
    { id: 50, category: "Logical", text: "The day before yesterday was Tuesday. What is tomorrow?", options: ["Friday", "Saturday", "Sunday", "Monday"], correct: "Friday" },

    // ── VERBAL (25) ──
    { id: 51, category: "Verbal", text: "Idiom: 'To spill the beans' means?", options: ["Drop something", "Reveal a secret", "Waste food", "Cook poorly"], correct: "Reveal a secret" },
    { id: 52, category: "Verbal", text: "Antonym of BENEVOLENT?", options: ["Kind", "Generous", "Malevolent", "Charitable"], correct: "Malevolent" },
    { id: 53, category: "Verbal", text: "'She is ___ honest woman.' (Fill in)", options: ["a", "an", "the", "no article"], correct: "an" },
    { id: 54, category: "Verbal", text: "Synonym of VERBOSE?", options: ["Concise", "Wordy", "Silent", "Logical"], correct: "Wordy" },
    { id: 55, category: "Verbal", text: "Correct sentence: 'She doesn't knows / know / knew / known him.'", options: ["knows", "know", "knew", "known"], correct: "know" },
    { id: 56, category: "Verbal", text: "Antonym of ZENITH?", options: ["Apex", "Nadir", "Peak", "Summit"], correct: "Nadir" },
    { id: 57, category: "Verbal", text: "Idiom: 'Bite the bullet' means?", options: ["Eat something", "Endure pain", "Shoot someone", "Avoid trouble"], correct: "Endure pain" },
    { id: 58, category: "Verbal", text: "Choose the correctly spelt word:", options: ["Accomodate", "Accommodate", "Acommodate", "Acomodate"], correct: "Accommodate" },
    { id: 59, category: "Verbal", text: "Synonym of EPHEMERAL?", options: ["Permanent", "Transient", "Eternal", "Robust"], correct: "Transient" },
    { id: 60, category: "Verbal", text: "One word for 'A person who walks in sleep'?", options: ["Somnolent", "Insomniac", "Somnambulist", "Narcissist"], correct: "Somnambulist" },
    { id: 61, category: "Verbal", text: "Passive voice of 'She writes a letter'?", options: ["A letter is written by her", "A letter was written by her", "A letter wrote by her", "A letter has been written"], correct: "A letter is written by her" },
    { id: 62, category: "Verbal", text: "Analogy: Petal : Flower :: Brick : ?", options: ["Cement", "Wall", "House", "Door"], correct: "Wall" },
    { id: 63, category: "Verbal", text: "Antonym of LUCID?", options: ["Clear", "Transparent", "Obscure", "Bright"], correct: "Obscure" },
    { id: 64, category: "Verbal", text: "Select the correctly punctuated sentence:", options: ["Its my bag.", "It's my bag.", "Its' my bag.", "It's, my bag."], correct: "It's my bag." },
    { id: 65, category: "Verbal", text: "Idiom: 'Call it a day' means?", options: ["Start work", "Sleep early", "Stop working", "Take a break"], correct: "Stop working" },
    { id: 66, category: "Verbal", text: "Synonym of DILIGENT?", options: ["Lazy", "Hardworking", "Reckless", "Timid"], correct: "Hardworking" },
    { id: 67, category: "Verbal", text: "Analogy: Doctor : Hospital :: Teacher : ?", options: ["School", "Student", "Book", "Exam"], correct: "School" },
    { id: 68, category: "Verbal", text: "'Neither he nor his friends ___ present.' (Fill in)", options: ["was", "were", "is", "are"], correct: "were" },
    { id: 69, category: "Verbal", text: "What is a 'synonym' of MELANCHOLY?", options: ["Joyful", "Sorrow", "Anger", "Indifference"], correct: "Sorrow" },
    { id: 70, category: "Verbal", text: "Identify the error: 'He is one of the best student in class.'", options: ["He is", "one of", "best student", "in class"], correct: "best student" },
    { id: 71, category: "Verbal", text: "Antonym of FRUGAL?", options: ["Thrifty", "Spendthrift", "Economical", "Careful"], correct: "Spendthrift" },
    { id: 72, category: "Verbal", text: "Select correct meaning: 'Pyrrhic victory'", options: ["Easy win", "Win at too great a cost", "Moral victory", "Unexpected win"], correct: "Win at too great a cost" },
    { id: 73, category: "Verbal", text: "Collective noun for a group of lions?", options: ["Herd", "Pack", "Pride", "Flock"], correct: "Pride" },
    { id: 74, category: "Verbal", text: "Report speech: She said, 'I am happy.' →", options: ["She said she was happy.", "She said she is happy.", "She told she was happy.", "She said she were happy."], correct: "She said she was happy." },
    { id: 75, category: "Verbal", text: "Antonym of AUDACIOUS?", options: ["Bold", "Brave", "Timid", "Reckless"], correct: "Timid" },

    // ── DATA INTERPRETATION (25) ──
    { id: 76, category: "Data Interpretation", text: "Class of 50: 30 play cricket, 25 football, 10 play both. How many play neither?", options: ["5", "10", "15", "20"], correct: "5" },
    { id: 77, category: "Data Interpretation", text: "Pie chart: 25% blue, 35% red, 20% green. What % is other?", options: ["10%", "20%", "15%", "25%"], correct: "20%" },
    { id: 78, category: "Data Interpretation", text: "Sales Jan:200, Feb:250, Mar:300. Average?", options: ["225", "250", "275", "300"], correct: "250" },
    { id: 79, category: "Data Interpretation", text: "Bar graph shows 2020: 400 units, 2021: 560 units. % increase?", options: ["30%", "35%", "40%", "45%"], correct: "40%" },
    { id: 80, category: "Data Interpretation", text: "Ratio of boys to girls is 3:2. Total = 500. Girls?", options: ["150", "175", "200", "250"], correct: "200" },
    { id: 81, category: "Data Interpretation", text: "A table shows scores: 70, 85, 90, 60, 75. Mean score?", options: ["74", "76", "78", "80"], correct: "76" },
    { id: 82, category: "Data Interpretation", text: "90% students passed; 18 passed. Total students?", options: ["18", "20", "22", "25"], correct: "20" },
    { id: 83, category: "Data Interpretation", text: "Product sold for ₹450 with 10% profit. Cost price?", options: ["₹395", "₹400", "₹405", "₹410"], correct: "₹405" },
    { id: 84, category: "Data Interpretation", text: "Graph: 2018: 120, 2019: 150, 2020: 180. Trend?", options: ["Declining", "Constant", "Increasing by 30", "Irregular"], correct: "Increasing by 30" },
    { id: 85, category: "Data Interpretation", text: "Company spent 40% on salaries, 25% on rent. What % is left?", options: ["25%", "30%", "35%", "40%"], correct: "35%" },
    { id: 86, category: "Data Interpretation", text: "Out of 400 applicants, 1/4 shortlisted. Shortlisted count?", options: ["80", "90", "100", "120"], correct: "100" },
    { id: 87, category: "Data Interpretation", text: "Mode of: 2, 3, 4, 3, 2, 3, 5, 3?", options: ["2", "3", "4", "5"], correct: "3" },
    { id: 88, category: "Data Interpretation", text: "Median of: 4, 7, 2, 9, 1, 5, 8?", options: ["5", "6", "7", "4"], correct: "5" },
    { id: 89, category: "Data Interpretation", text: "Survey: 60% prefer tea, 30% coffee, rest water. Out of 200?", options: ["10", "15", "20", "25"], correct: "20" },
    { id: 90, category: "Data Interpretation", text: "Revenue grew from ₹2L to ₹2.5L. Growth %?", options: ["20%", "25%", "30%", "15%"], correct: "25%" },
    { id: 91, category: "Data Interpretation", text: "Histogram peak at 30–40 range. What does this mean?", options: ["Least frequent", "Most frequent", "Average", "No data"], correct: "Most frequent" },
    { id: 92, category: "Data Interpretation", text: "Table shows marks: English 80, Math 90, Science 70. Avg?", options: ["78", "80", "82", "75"], correct: "80" },
    { id: 93, category: "Data Interpretation", text: "If variance is 25, standard deviation is?", options: ["5", "10", "15", "25"], correct: "5" },
    { id: 94, category: "Data Interpretation", text: "5 items cost ₹150 total. What is cost of 8 items?", options: ["₹220", "₹230", "₹240", "₹250"], correct: "₹240" },
    { id: 95, category: "Data Interpretation", text: "Line graph drops from 100 to 60. % decrease?", options: ["30%", "35%", "40%", "45%"], correct: "40%" },
    { id: 96, category: "Data Interpretation", text: "Set A = {1,2,3}, B = {3,4,5}. A ∩ B = ?", options: ["{3}", "{1,2}", "{4,5}", "{1,2,3,4,5}"], correct: "{3}" },
    { id: 97, category: "Data Interpretation", text: "P(A) = 0.4, P(B) = 0.3, P(A∩B) = 0.12. P(A∪B) = ?", options: ["0.58", "0.60", "0.62", "0.70"], correct: "0.58" },
    { id: 98, category: "Data Interpretation", text: "Scatter plot shows positive correlation. As X increases, Y?", options: ["Decreases", "Stays same", "Increases", "Cannot say"], correct: "Increases" },
    { id: 99, category: "Data Interpretation", text: "Cumulative frequency at 50th percentile represents?", options: ["Mean", "Mode", "Median", "Range"], correct: "Median" },
    { id: 100, category: "Data Interpretation", text: "If r = 0 in a scatter plot, the two variables are?", options: ["Positively correlated", "Negatively correlated", "Uncorrelated", "Perfectly correlated"], correct: "Uncorrelated" },
];

const categories: Category[] = ["All", "Quantitative", "Logical", "Verbal", "Data Interpretation"];

const categoryMeta: Record<Exclude<Category, "All">, { icon: string; color: string }> = {
    Quantitative:       { icon: "📐", color: "text-blue-600" },
    Logical:            { icon: "🧩", color: "text-purple-600" },
    Verbal:             { icon: "📝", color: "text-indigo-600" },
    "Data Interpretation": { icon: "📊", color: "text-violet-600" },
};

export default function AptitudePage() {
    const [activeCategory, setActiveCategory] = useState<Category>("All");
    const [selectedAnswer, setSelectedAnswer] = useState<Record<number, string>>({});
    const [submitted, setSubmitted] = useState(false);

    const filtered = activeCategory === "All" ? questions : questions.filter(q => q.category === activeCategory);
    const totalAnswered = Object.keys(selectedAnswer).length;
    const score = submitted ? questions.filter(q => selectedAnswer[q.id] === q.correct).length : 0;

    const handleSelect = (qId: number, opt: string) => {
        if (submitted) return;
        setSelectedAnswer(prev => ({ ...prev, [qId]: opt }));
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-6">

                {/* Header */}
                <div className="mb-5">
                    <h1 className="text-xl font-bold text-gray-900">
                        Aptitude <span className="animated-gradient-text">Assessment</span>
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        100 questions · 4 categories · {totalAnswered} answered
                    </p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 mb-5">
                    {(Object.keys(categoryMeta) as Exclude<Category, "All">[]).map(cat => {
                        const total = 25;
                        const answered = questions.filter(q => q.category === cat && selectedAnswer[q.id]).length;
                        return (
                            <div key={cat} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                                <div className="flex items-center gap-1 mb-1">
                                    <span className="text-sm">{categoryMeta[cat].icon}</span>
                                    <span className={cn("text-[10px] font-bold truncate", categoryMeta[cat].color)}>{cat}</span>
                                </div>
                                <div className="text-base font-bold text-gray-900">
                                    {answered}<span className="text-[10px] font-normal text-gray-400">/{total}</span>
                                </div>
                                <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
                                        style={{ width: `${(answered / total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Category Tabs */}
                <div className="flex gap-1.5 flex-wrap mb-4">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all duration-150",
                                activeCategory === cat
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-sm"
                                    : "bg-white border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600"
                            )}
                        >
                            {cat === "All" ? `All (100)` : `${categoryMeta[cat as Exclude<Category, "All">].icon} ${cat} (25)`}
                        </button>
                    ))}
                </div>

                {/* Questions */}
                <div className="space-y-3">
                    {filtered.map((q, idx) => {
                        const answered = selectedAnswer[q.id];
                        const isCorrect = submitted && answered === q.correct;
                        const isWrong = submitted && answered && answered !== q.correct;
                        return (
                            <div
                                key={q.id}
                                className={cn(
                                    "bg-white border rounded-xl p-4 shadow-sm",
                                    isCorrect ? "border-green-200" : isWrong ? "border-red-200" : "border-gray-200"
                                )}
                            >
                                <div className="flex items-start gap-2.5 mb-3">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
                                        {q.id}
                                    </span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className={cn("text-[9px] font-bold uppercase tracking-wider", categoryMeta[q.category].color)}>
                                                {q.category}
                                            </span>
                                            {submitted && (
                                                <span className={cn("text-[9px] font-bold", isCorrect ? "text-green-600" : "text-red-500")}>
                                                    {isCorrect ? "✓ Correct" : "✗ Wrong"}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-medium text-gray-800 leading-snug">{q.text}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5 pl-7">
                                    {q.options.map(opt => {
                                        const isSelected = selectedAnswer[q.id] === opt;
                                        const isCorrectOpt = submitted && opt === q.correct;
                                        const isWrongOpt = submitted && isSelected && opt !== q.correct;
                                        return (
                                            <button
                                                key={opt}
                                                onClick={() => handleSelect(q.id, opt)}
                                                className={cn(
                                                    "text-left text-[11px] px-3 py-1.5 rounded-lg border font-medium transition-all duration-150",
                                                    isCorrectOpt
                                                        ? "bg-green-50 border-green-400 text-green-700"
                                                        : isWrongOpt
                                                        ? "bg-red-50 border-red-400 text-red-600"
                                                        : isSelected
                                                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent"
                                                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                                                )}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>

                                {submitted && !isCorrect && (
                                    <p className="mt-1.5 pl-7 text-[10px] text-green-600 font-medium">
                                        ✓ Answer: <strong>{q.correct}</strong>
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer bar */}
                <div className="mt-5 flex items-center justify-between sticky bottom-4">
                    {submitted ? (
                        <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
                            <div className="text-sm font-semibold text-gray-700">
                                Score: <span className="animated-gradient-text font-bold text-base">{score}/100</span>
                                <span className="ml-2 text-xs text-gray-400">({Math.round(score)}%)</span>
                            </div>
                            <button
                                onClick={() => { setSubmitted(false); setSelectedAnswer({}); setActiveCategory("All"); }}
                                className="text-xs text-gray-400 hover:text-gray-700 underline transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <span className="text-xs text-gray-400 bg-white border border-gray-200 px-3 py-1.5 rounded-lg">
                            {totalAnswered} / 100 answered
                        </span>
                    )}

                    {!submitted && (
                        <button
                            onClick={() => setSubmitted(true)}
                            disabled={totalAnswered === 0}
                            className="btn-gradient px-5 py-2 rounded-lg text-sm disabled:opacity-40"
                        >
                            Submit Assessment
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
