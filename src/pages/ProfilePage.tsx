import React, { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useInterviews } from "@/contexts/InterviewContext";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"];

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { interviews } = useInterviews();

  const completedInterviews = interviews.filter((i) => i.completed);
  const completedCount = completedInterviews.length;

  const avgScore = completedCount > 0
    ? Math.round(completedInterviews.reduce((sum, i) => sum + (i.feedback?.score || 0), 0) / completedCount)
    : 0;

  // 1. Performance Trend Data (Line Chart)
  const scoreTrendData = useMemo(() => {
    return completedInterviews
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((inv, index) => ({
        name: `Inv ${index + 1}`,
        score: inv.feedback?.score || 0,
        role: inv.role
      }));
  }, [completedInterviews]);

  // 2. Interview Type Distribution (Pie Chart)
  const typeDistributionData = useMemo(() => {
    const counts = interviews.reduce((acc, curr) => {
      const t = curr.interviewType || "unknown";
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace("-", " "),
      value
    }));
  }, [interviews]);

  // 3. Experience Level Breakdown (Bar Chart)
  const expDistributionData = useMemo(() => {
    const counts = interviews.reduce((acc, curr) => {
      const e = curr.experienceLevel || "unknown";
      acc[e] = (acc[e] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count: value
    }));
  }, [interviews]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-lg">
          <p className="text-sm font-bold text-gray-800">{label}</p>
          <p className="text-xs text-blue-600 font-semibold mt-1">
            Score: {payload[0].value}/100
          </p>
          {payload[0].payload.role && (
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{payload[0].payload.role}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-6xl mx-auto animate-fade-in pb-12">
      <h1 className="text-3xl font-black text-gray-900 mb-8">
        Your <span className="animated-gradient-text">Analytics</span> Dashboard
      </h1>

      {/* Top Section: User & Core Stats */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* User Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0">
            {user?.displayName?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">{user?.displayName}</h2>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Pro Member
            </div>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="lg:col-span-2 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-1 relative z-10">Total Interviews</p>
            <div className="text-4xl font-black text-gray-900 relative z-10">{interviews.length}</div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-1 relative z-10">Completed</p>
            <div className="text-4xl font-black text-purple-600 relative z-10">{completedCount}</div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-1 relative z-10">Avg. Score</p>
            <div className="text-4xl font-black text-emerald-500 relative z-10">{avgScore}<span className="text-lg text-emerald-300">/100</span></div>
          </div>
        </div>
      </div>

      {interviews.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Data Yet</h3>
          <p className="text-gray-500">Take your first interview to generate beautiful analytics!</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Main Chart: Performance Trend */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm lg:col-span-2">
            <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
              Performance Over Time
            </h3>
            {scoreTrendData.length >= 1 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 2, strokeDasharray: '5 5' }} />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="url(#colorGradient)" 
                      strokeWidth={4}
                      dot={{ r: 6, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }}
                      activeDot={{ r: 8, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-gray-400 text-sm font-medium">
                Complete at least one interview to see your trend data.
              </div>
            )}
          </div>

          {/* Sub Chart: Type Distribution (Pie) */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
              Interview Breakdown
            </h3>
            <div className="h-64 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {typeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                    itemStyle={{ color: '#1f2937', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Custom Legend Overlay next to donut */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-none">
                 {typeDistributionData.map((entry, index) => (
                   <div key={entry.name} className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                     <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                     {entry.name} ({entry.value})
                   </div>
                 ))}
              </div>
            </div>
          </div>

          {/* Sub Chart: Experience Level Breakdown (Bar) */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-500"></div>
              Target Experience Level
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expDistributionData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} stroke="#6b7280" fontWeight={600} width={80} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {expDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
