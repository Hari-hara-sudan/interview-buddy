import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

const SECTORS = [
  { term: "Software", label: "Software & IT", color: "from-blue-600 to-indigo-600", bg: "bg-blue-50" },
  { term: "Data", label: "Data & AI", color: "from-purple-500 to-fuchsia-600", bg: "bg-purple-50" },
  { term: "Finance", label: "Finance & Accounting", color: "from-emerald-500 to-teal-500", bg: "bg-emerald-50" },
  { term: "Healthcare", label: "Healthcare", color: "from-rose-500 to-red-500", bg: "bg-rose-50" },
];

export default function JobMarketStats() {
  const navigate = useNavigate();

  const fetchStats = async () => {
    const appId = import.meta.env.VITE_ADZUNA_APP_ID;
    const appKey = import.meta.env.VITE_ADZUNA_APP_KEY;

    if (!appId || !appKey) {
      console.warn("Adzuna API keys not found. Job market stats unavailable.");
      throw new Error("API keys required");
    }

    try {
      // Use Vite dev server proxy to bypass CORS restrictions
      // Fetch total jobs for all positions
      const totalResponse = await fetch(
        `/api/adzuna/in/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=1&content-type=application/json`
      );
      
      if (!totalResponse.ok) throw new Error("Failed to fetch total jobs");
      const totalData = await totalResponse.json();
      const total = totalData.count || 0;

      // Fetch sector-specific data in parallel
      const sectorPromises = SECTORS.map(async (sector) => {
        try {
          const response = await fetch(
            `/api/adzuna/in/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=1&what=${encodeURIComponent(sector.term)}&content-type=application/json`
          );
          
          if (response.ok) {
            const data = await response.json();
            return { ...sector, count: data.count || 0 };
          }
          return { ...sector, count: 0 };
        } catch (err) {
          console.error(`Failed to fetch ${sector.term} jobs:`, err);
          return { ...sector, count: 0 };
        }
      });

      const sectors = await Promise.all(sectorPromises);
      
      return { total, sectors };
    } catch (err) {
      console.error("Failed to fetch job market stats:", err);
      throw err;
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["jobMarketStats"],
    queryFn: fetchStats,
    retry: false,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  if (isLoading) {
    return (
      <div className="mb-10 w-full rounded-3xl bg-white border border-gray-100 p-6 flex flex-col gap-4 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="h-24 bg-gray-100 rounded-2xl md:col-span-1 col-span-2"></div>
          <div className="h-24 bg-gray-100 rounded-2xl"></div>
          <div className="h-24 bg-gray-100 rounded-2xl"></div>
          <div className="h-24 bg-gray-100 rounded-2xl"></div>
          <div className="h-24 bg-gray-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mb-10 w-full rounded-3xl bg-amber-50 border border-amber-200 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <p className="text-sm font-bold text-amber-900">Job Market Stats Unavailable</p>
            <p className="text-xs text-amber-800 mt-1">Add your Adzuna API keys to .env to see live job market statistics</p>
            <button
              onClick={() => navigate('/jobs')}
              className="mt-3 text-xs font-bold text-amber-700 hover:text-amber-800 underline"
            >
              View Jobs Board →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10 w-full relative">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm overflow-hidden glassmorphism relative group transition-all duration-300 hover:shadow-md">
        
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-bl-full -mr-32 -mt-32 opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>

        <div className="flex items-center justify-between mb-5 relative z-10">
          <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Live Market Trends (India)
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-green-700">Real-time</span>
            </span>
          </h2>
          <button 
            onClick={() => navigate('/jobs')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
          >
            Explore Jobs →
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
          
          {/* Total Jobs Global Block */}
          <div className="md:col-span-1 col-span-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-4 text-white shadow-lg flex flex-col justify-center">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-blue-100 mb-0.5 opacity-90">Total Openings</p>
            <div className="text-2xl font-black">{data.total.toLocaleString()}</div>
          </div>

          {/* Individual Sectors Block */}
          {data.sectors.map((sector) => (
            <div key={sector.term} className={`${sector.bg} border border-white/50 rounded-2xl p-4 flex flex-col justify-center`}>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-0.5">{sector.label}</p>
              <div className={`text-xl font-black text-transparent bg-clip-text bg-gradient-to-br ${sector.color}`}>
                {sector.count.toLocaleString()}
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
