import React, { useMemo } from "react";
import { useAssessments } from "@/contexts/AssessmentContext";

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bgColor: string;
}

export default function ResumeAssessmentStats() {
  const { assessments } = useAssessments();

  const stats = useMemo(() => {
    if (!assessments || assessments.length === 0) {
      return null;
    }

    // Calculate average scores
    let totalAptitude = 0;
    let totalProgramming = 0;
    let totalVerbal = 0;

    assessments.forEach((assessment) => {
      totalAptitude += assessment.scores?.aptitude || 0;
      totalProgramming += assessment.scores?.programming || 0;
      totalVerbal += assessment.scores?.verbal || 0;
    });

    const count = assessments.length;
    const avgAptitude = Math.round(totalAptitude / count);
    const avgProgramming = Math.round(totalProgramming / count);
    const avgVerbal = Math.round(totalVerbal / count);
    const avgOverall = Math.round((totalAptitude + totalProgramming + totalVerbal) / (count * 3));

    // Categorize by performance level (based on average of three scores)
    let excellent = 0;
    let good = 0;
    let average = 0;
    let needsImprovement = 0;

    assessments.forEach((assessment) => {
      const score = Math.round(
        (assessment.scores.aptitude + assessment.scores.programming + assessment.scores.verbal) / 3
      );
      if (score >= 80) excellent++;
      else if (score >= 60) good++;
      else if (score >= 40) average++;
      else needsImprovement++;
    });

    // Get top skills from all assessments
    const skillsMap = new Map<string, number>();
    assessments.forEach((assessment) => {
      if (assessment.parsedResume?.skills) {
        assessment.parsedResume.skills.forEach((skill) => {
          skillsMap.set(skill, (skillsMap.get(skill) || 0) + 1);
        });
      }
    });

    const topSkills = Array.from(skillsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([skill]) => skill);

    return {
      count,
      avgOverall,
      avgAptitude,
      avgProgramming,
      avgVerbal,
      excellent,
      good,
      average,
      needsImprovement,
      topSkills,
    };
  }, [assessments]);

  if (!stats) {
    return (
      <div className="mb-10 w-full rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
          <p className="text-sm font-bold text-slate-600">No assessments yet</p>
          <p className="text-xs text-slate-500">Complete your first resume assessment to see statistics</p>
        </div>
      </div>
    );
  }

  const cards: StatCard[] = [
    {
      label: "Total Assessments",
      value: stats.count,
      icon: "📋",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Average Score",
      value: `${stats.avgOverall}%`,
      icon: "⭐",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Aptitude",
      value: `${stats.avgAptitude}%`,
      icon: "🧠",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Programming",
      value: `${stats.avgProgramming}%`,
      icon: "💻",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Communication",
      value: `${stats.avgVerbal}%`,
      icon: "💬",
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
  ];

  return (
    <div className="mb-10 w-full relative">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm overflow-hidden glassmorphism relative group transition-all duration-300 hover:shadow-md">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-bl-full -mr-32 -mt-32 opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>

        <div className="flex items-center justify-between mb-6 relative z-10">
          <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Assessment Analytics
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 border border-purple-200 rounded-full">
              <span className="text-xs font-bold text-purple-700">{stats.count}</span>
            </span>
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 relative z-10">
          {cards.map((card) => (
            <div
              key={card.label}
              className={`${card.bgColor} border border-white/50 rounded-2xl p-4 flex flex-col justify-between transition-transform hover:scale-105`}
            >
              <div className="text-2xl mb-2">{card.icon}</div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">
                  {card.label}
                </p>
                <div className={`text-xl font-black ${card.color}`}>{card.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Breakdown & Top Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {/* Performance Breakdown */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-4">
            <p className="text-xs uppercase tracking-widest font-bold text-gray-600 mb-3">Performance Breakdown</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Excellent (≥80%)</span>
                <span className="text-sm font-black text-green-600">{stats.excellent}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Good (60-79%)</span>
                <span className="text-sm font-black text-blue-600">{stats.good}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Average (40-59%)</span>
                <span className="text-sm font-black text-amber-600">{stats.average}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Needs Improvement (&lt;40%)</span>
                <span className="text-sm font-black text-red-600">{stats.needsImprovement}</span>
              </div>
            </div>
          </div>

          {/* Top Skills */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4">
            <p className="text-xs uppercase tracking-widest font-bold text-gray-600 mb-3">Top Skills Demonstrated</p>
            {stats.topSkills.length > 0 ? (
              <div className="space-y-2">
                {stats.topSkills.map((skill, index) => (
                  <div key={skill} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-300 to-teal-400 flex items-center justify-center text-xs font-black text-white">
                      {index + 1}
                    </div>
                    <span className="text-sm font-bold text-gray-700">{skill}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">Skills collected from assessments</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
