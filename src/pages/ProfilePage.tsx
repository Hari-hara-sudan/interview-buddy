import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useInterviews } from "@/contexts/InterviewContext";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"];

const ProfilePage: React.FC = () => {
  const { user, loginWithGitHub, loginWithLinkedIn, refreshGitHubRepos, disconnectGitHub, disconnectLinkedIn } = useAuth();
  const { interviews } = useInterviews();
  const [connectingGithub, setConnectingGithub] = useState(false);
  const [connectingLinkedin, setConnectingLinkedin] = useState(false);
  const [refreshingRepos, setRefreshingRepos] = useState(false);
  const [disconnectingGithub, setDisconnectingGithub] = useState(false);
  const [disconnectingLinkedin, setDisconnectingLinkedin] = useState(false);
  const [error, setError] = useState<string>("");
  const [autoFetchAttempted, setAutoFetchAttempted] = useState(false);

  // Auto-fetch repos if GitHub is connected but repos are missing
  useEffect(() => {
    const shouldAutoFetch =
      user?.socialProfiles?.github &&
      !autoFetchAttempted &&
      (!user.socialProfiles.github.repos || user.socialProfiles.github.repos.length === 0);

    if (shouldAutoFetch) {
      console.log("Auto-fetching GitHub repos...");
      setAutoFetchAttempted(true);
      setRefreshingRepos(true);
      
      refreshGitHubRepos()
        .catch((err) => {
          console.error("Auto-fetch failed:", err);
        })
        .finally(() => {
          setRefreshingRepos(false);
        });
    }
  }, [user?.socialProfiles?.github?.username, autoFetchAttempted, refreshGitHubRepos]);

  const handleConnectGithub = async () => {
    setError("");
    setConnectingGithub(true);
    try {
      await loginWithGitHub();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to connect GitHub";
      setError(errorMsg);
      console.error("GitHub connection error:", err);
    } finally {
      setConnectingGithub(false);
    }
  };

  const handleRefreshRepos = async () => {
    setError("");
    setRefreshingRepos(true);
    try {
      await refreshGitHubRepos();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to refresh repos";
      setError(errorMsg);
      console.error("Refresh error:", err);
    } finally {
      setRefreshingRepos(false);
    }
  };

  const handleConnectLinkedin = async () => {
    setError("");
    setConnectingLinkedin(true);
    try {
      await loginWithLinkedIn();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to connect LinkedIn";
      setError(errorMsg);
      console.error("LinkedIn connection error:", err);
    } finally {
      setConnectingLinkedin(false);
    }
  };

  const handleDisconnectGithub = async () => {
    setError("");
    if (!window.confirm("Are you sure you want to disconnect GitHub? This will remove your repositories from your profile.")) {
      return;
    }
    
    setDisconnectingGithub(true);
    try {
      await disconnectGitHub();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to disconnect GitHub";
      setError(errorMsg);
      console.error("Disconnect error:", err);
    } finally {
      setDisconnectingGithub(false);
    }
  };

  const handleDisconnectLinkedin = async () => {
    setError("");
    if (!window.confirm("Are you sure you want to disconnect LinkedIn? This will remove your LinkedIn profile from your account.")) {
      return;
    }
    
    setDisconnectingLinkedin(true);
    try {
      await disconnectLinkedIn();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to disconnect LinkedIn";
      setError(errorMsg);
      console.error("Disconnect error:", err);
    } finally {
      setDisconnectingLinkedin(false);
    }
  };

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

      {/* Top Section: User Profile & Stats */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* User Card with Social Connections */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-start gap-6 mb-6 pb-6 border-b border-gray-200">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0">
              {user?.displayName?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-gray-900 truncate mb-1">{user?.displayName}</h2>
              <p className="text-sm text-gray-500 truncate mb-3">{user?.email}</p>
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-blue-100">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                Pro Member
              </div>
            </div>
          </div>

          {/* Social Connections Section */}
          <div>
            <h3 className="text-sm font-bold text-gray-600 mb-4 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
              Connected Accounts
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {/* GitHub */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900">GitHub</p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.socialProfiles?.github?.username ? `@${user.socialProfiles.github.username}` : 'Not connected'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleConnectGithub}
                  disabled={connectingGithub}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ml-2 ${
                    user?.socialProfiles?.github?.username
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                  } disabled:opacity-50`}
                >
                  {connectingGithub ? 'Connecting...' : user?.socialProfiles?.github?.username ? '✓' : 'Connect'}
                </button>
              </div>

              {/* LinkedIn */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.004 1.418-.103.249-.129.597-.129.946v5.441h-3.554s.047-8.733 0-9.652h3.554v1.366c.43-.664 1.199-1.608 2.918-1.608 2.135 0 3.755 1.395 3.755 4.397v5.497zM5.337 8.855c-1.144 0-1.915-.758-1.915-1.708 0-.951.77-1.708 1.915-1.708 1.144 0 1.915.757 1.915 1.708 0 .95-.771 1.708-1.915 1.708zm1.595 11.597H3.762V9.558h3.17v10.894zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900">LinkedIn</p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.socialProfiles?.linkedin?.profileUrl ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                {user?.socialProfiles?.linkedin?.profileUrl ? (
                  <button
                    onClick={handleDisconnectLinkedin}
                    disabled={disconnectingLinkedin}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ml-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                  >
                    {disconnectingLinkedin ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                ) : (
                  <button
                    onClick={handleConnectLinkedin}
                    disabled={connectingLinkedin}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ml-2 bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 disabled:opacity-50"
                  >
                    {connectingLinkedin ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-3 p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0016zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">Connection Failed</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                  <button
                    onClick={() => setError("")}
                    className="text-red-700 hover:text-red-900 flex-shrink-0"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full -mr-3 -mt-3 opacity-50 group-hover:scale-110 transition-transform"></div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 relative z-10">Total Interviews</p>
            <div className="text-3xl font-black text-gray-900 relative z-10">{interviews.length}</div>
          </div>
          
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-full -mr-3 -mt-3 opacity-50 group-hover:scale-110 transition-transform"></div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 relative z-10">Completed</p>
            <div className="text-3xl font-black text-purple-600 relative z-10">{completedCount}</div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-full -mr-3 -mt-3 opacity-50 group-hover:scale-110 transition-transform"></div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 relative z-10">Avg. Score</p>
            <div className="text-3xl font-black text-emerald-500 relative z-10">{avgScore}<span className="text-sm text-emerald-300">/100</span></div>
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

      {/* GitHub Projects Section */}
      {user?.socialProfiles?.github && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              My GitHub Projects
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshRepos}
                disabled={refreshingRepos}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                {refreshingRepos ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
              <button
                onClick={handleDisconnectGithub}
                disabled={disconnectingGithub}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-all disabled:opacity-50"
              >
                {disconnectingGithub ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-300 border-t-red-700 rounded-full animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Disconnect
                  </>
                )}
              </button>
            </div>
          </div>

          {/* No repos found */}
          {(!user.socialProfiles.github.repos || user.socialProfiles.github.repos.length === 0) && !refreshingRepos && (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No repositories found</h3>
              <p className="text-sm text-gray-500 mb-4">
                {user.socialProfiles.github.username ? `Couldn't find any public repositories for @${user.socialProfiles.github.username}` : 'Unable to load repositories'}
              </p>
              <a
                href={user.socialProfiles.github.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Visit GitHub Profile
              </a>
            </div>
          )}

          {/* Loading state during auto-fetch */}
          {refreshingRepos && (!user.socialProfiles.github.repos || user.socialProfiles.github.repos.length === 0) && (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm">
              <div className="flex justify-center mb-4">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-sm text-gray-600 font-medium">Loading your repositories...</p>
            </div>
          )}

          {/* Repos grid */}
          {user.socialProfiles.github.repos && user.socialProfiles.github.repos.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-4">
              {user.socialProfiles.github.repos.map((repo) => (
                <a
                  key={repo.id}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all transform hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {repo.name}
                      </h3>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10">
                    {repo.description || 'No description provided'}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      {repo.language && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-xs font-semibold text-blue-700 border border-blue-200">
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                          {repo.language}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2l-2.81 6.63L2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                      <span className="font-semibold">{repo.stars}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
