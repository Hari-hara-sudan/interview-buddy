import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  redirect_url: string;
  created: string;
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
}

// Extract domain from URL
const extractDomain = (url: string): string => {
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    return domain;
  } catch {
    return "";
  }
};

// Company logo name mapping for better results
const COMPANY_LOGO_MAP: Record<string, string> = {
  "bambinos": "bambinos.live",
  "infosys": "infosys.com",
  "tcs": "tcs.com",
  "cognizant": "cognizant.com",
  "accenture": "accenture.com",
  "capgemini": "capgemini.com",
  "wipro": "wipro.com",
  "technotion": "technomtion.com",
  "amazon": "amazon.com",
  "google": "google.com",
  "microsoft": "microsoft.com",
  "apple": "apple.com",
  "meta": "meta.com",
};

// Get company logo URL with multiple fallback services
const getCompanyLogoUrl = (redirectUrl: string, companyName?: string): string => {
  const domain = extractDomain(redirectUrl);
  const normalizedName = (companyName || 'company').toLowerCase().trim();
  
  // Check if we have a mapping for this company
  for (const [key, logoUrl] of Object.entries(COMPANY_LOGO_MAP)) {
    if (normalizedName.includes(key) || normalizedName.startsWith(key)) {
      // Try Google favicon service first
      return `https://www.google.com/s2/favicons?sz=128&domain=${logoUrl}`;
    }
  }
  
  // Primary: Google Favicon API (most reliable, no auth needed)
  if (domain) {
    return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
  }
  
  // Secondary: Try Clearbit with company name (free tier, no auth)
  const slugifiedName = (companyName || 'company')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `https://logo.clearbit.com/${slugifiedName}.com`;
};

// Job Card Component
function JobCard({ job }: { job: AdzunaJob }) {
  const [logoError, setLogoError] = useState(false);
  const isRecent = (new Date().getTime() - new Date(job.created).getTime()) < (3 * 24 * 60 * 60 * 1000); // within 3 days
  const companyName = job.company?.display_name || 'Company';
  const logoUrl = getCompanyLogoUrl(job.redirect_url, companyName);
  
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity z-0 pointer-events-none"></div>
      
      <div className="flex items-start justify-between gap-2 z-10 mb-4">
        {/* Company Logo with fallback to initials */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
          {logoError ? (
            // Fallback: Show company initials
            <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600 uppercase">
              {companyName.charAt(0)}{companyName.charAt(1) || ""}
            </span>
          ) : (
            // Real logo from service
            <img 
              src={logoUrl} 
              alt={companyName}
              onError={() => setLogoError(true)}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        {isRecent && (
          <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100 shrink-0 uppercase tracking-wide">
            New
          </span>
        )}
      </div>

      <div className="z-10 flex-1">
        <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2" title={job.title}>
          {job.title}
        </h3>
        <p className="text-sm font-semibold text-gray-500 mt-1 truncate">
          {companyName}
        </p>
        
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 text-xs font-medium px-2 py-1 rounded-lg border border-gray-200">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
            {job.location.display_name}
          </span>
          {job.contract_type && (
            <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-lg border border-blue-100 capitalize">
              {job.contract_type.replace('_', ' ')}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-4 line-clamp-3 leading-relaxed border-t border-gray-50 pt-3">
          {job.description.replace(/<[^>]*>?/gm, '')}
        </p>
      </div>

      <div className="mt-5 pt-4 z-10 flex items-center justify-between">
        <div className="text-xs font-bold text-gray-900">
           {job.salary_min ? `₹${job.salary_min.toLocaleString('en-IN')} - ₹${job.salary_max?.toLocaleString('en-IN')}` : <span className="text-gray-400 font-medium">Salary Unknown</span>}
        </div>

        <a 
          href={job.redirect_url} 
          target="_blank" 
          rel="noreferrer"
          className="btn-gradient text-[11px] px-4 py-2 rounded-xl shrink-0"
        >
          Apply Now
        </a>
      </div>
    </div>
  );
}

// Fallback dummy data if no API keys are provided
const DUMMY_JOBS: AdzunaJob[] = [];

export default function JobsPage() {
  const [searchTerm, setSearchTerm] = useState("Software Developer");
  const [queryTerm, setQueryTerm] = useState("Software Developer");
  const [country, setCountry] = useState("in"); // default india
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Advanced filter states
  const [minSalary, setMinSalary] = useState<number | null>(null);
  const [maxSalary, setMaxSalary] = useState<number | null>(null);
  const [contractType, setContractType] = useState<string>("");
  const [sortBy, setSortBy] = useState<"relevance" | "salary_asc" | "salary_desc" | "recent">("relevance");
  const [daysPosted, setDaysPosted] = useState<number | null>(null);
  
  const resultsPerPage = 50; // Adzuna API maximum per page

  const loadJobs = async () => {
    const appId = import.meta.env.VITE_ADZUNA_APP_ID;
    const appKey = import.meta.env.VITE_ADZUNA_APP_KEY;

    if (!appId || !appKey) {
      throw new Error("Adzuna API keys not configured. Please add VITE_ADZUNA_APP_ID and VITE_ADZUNA_APP_KEY to your .env file.");
    }

    const encodeSearch = encodeURIComponent(queryTerm);
    // Use Vite dev server proxy instead of CORS proxy
    const response = await fetch(
      `/api/adzuna/in/search/${currentPage}?app_id=${appId}&app_key=${appKey}&results_per_page=${resultsPerPage}&what=${encodeSearch}&content-type=application/json`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch jobs");
    }
    const data = await response.json();
    
    // Apply client-side filtering and sorting
    let results = (data.results || []) as AdzunaJob[];
    
    if (minSalary) {
      results = results.filter(j => (j.salary_min || 0) >= minSalary);
    }
    if (maxSalary) {
      results = results.filter(j => (j.salary_max || Infinity) <= maxSalary);
    }
    if (contractType) {
      results = results.filter(j => j.contract_type === contractType);
    }
    if (daysPosted) {
      const now = new Date();
      results = results.filter(j => {
        const jobDate = new Date(j.created);
        const daysDiff = (now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= daysPosted;
      });
    }
    
    // Apply sorting
    if (results.length > 0) {
      if (sortBy === "salary_asc") {
        results.sort((a, b) => (a.salary_min || 0) - (b.salary_min || 0));
      } else if (sortBy === "salary_desc") {
        results.sort((a, b) => (b.salary_max || 0) - (a.salary_max || 0));
      } else if (sortBy === "recent") {
        results.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
      }
    }
    
    // Set total results from API count (total available jobs)
    setTotalResults(data.count || 0);
    return results;
  };

  const { data: jobs, isLoading, isError, error } = useQuery({
    queryKey: ["jobs", queryTerm, country, currentPage, minSalary, maxSalary, contractType, sortBy, daysPosted],
    queryFn: loadJobs,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setQueryTerm(searchTerm.trim());
      setCurrentPage(1); // Reset to first page on new search
    }
  };

  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Live Job <span className="animated-gradient-text">Openings</span>
            </h1>
            <p className="text-sm font-medium text-gray-500 mt-1">
              Find and apply for roles curated from global job boards.
            </p>
          </div>
        </div>

        {/* Search Bar & Filters */}
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm glassmorphism space-y-4">
          {/* Primary Search & Location */}
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Job title, keywords, or company" 
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 transition-shadow outline-none text-gray-800 font-medium placeholder:font-normal"
              />
            </div>
            
            <div className="w-full md:w-48 relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <select 
                value={country}
                onChange={(e) => { setCountry(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-8 py-3 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 transition-shadow outline-none text-gray-800 font-medium appearance-none"
              >
                <option value="in">India</option>
                <option value="us">United States</option>
                <option value="gb">United Kingdom</option>
                <option value="ca">Canada</option>
                <option value="au">Australia</option>
              </select>
            </div>

            <button type="submit" className="btn-gradient px-8 py-3 rounded-2xl md:w-auto w-full">
              Search
            </button>
            
            <button 
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-6 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all flex items-center gap-2 md:w-auto w-full justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Filters
            </button>
          </form>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
              {/* Sort By */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Sort By</label>
                <select 
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1); }}
                  className="w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="recent">Most Recent</option>
                  <option value="salary_desc">Highest Salary</option>
                  <option value="salary_asc">Lowest Salary</option>
                </select>
              </div>

              {/* Job Type */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Job Type</label>
                <select 
                  value={contractType}
                  onChange={(e) => { setContractType(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                >
                  <option value="">All Types</option>
                  <option value="permanent">Permanent</option>
                  <option value="contract">Contract</option>
                  <option value="temporary">Temporary</option>
                  <option value="part_time">Part-time</option>
                </select>
              </div>

              {/* Min Salary */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Min Salary (₹)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 font-semibold text-sm">₹</span>
                  <input 
                    type="number" 
                    placeholder="Any"
                    value={minSalary || ""}
                    onChange={(e) => { setMinSalary(e.target.value ? parseInt(e.target.value) : null); setCurrentPage(1); }}
                    className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Max Salary */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Max Salary (₹)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 font-semibold text-sm">₹</span>
                  <input 
                    type="number" 
                    placeholder="Any"
                    value={maxSalary || ""}
                    onChange={(e) => { setMaxSalary(e.target.value ? parseInt(e.target.value) : null); setCurrentPage(1); }}
                    className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Posted Within */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Posted Within</label>
                <select 
                  value={daysPosted || ""}
                  onChange={(e) => { setDaysPosted(e.target.value ? parseInt(e.target.value) : null); setCurrentPage(1); }}
                  className="w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                >
                  <option value="">Any Time</option>
                  <option value="7">Last 7 Days</option>
                  <option value="14">Last 14 Days</option>
                  <option value="30">Last 30 Days</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setMinSalary(null);
                    setMaxSalary(null);
                    setContractType("");
                    setSortBy("relevance");
                    setDaysPosted(null);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-300 transition-all"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {(!import.meta.env.VITE_ADZUNA_APP_ID || !import.meta.env.VITE_ADZUNA_APP_KEY) && (
            <div className="mt-4 px-4 py-2 bg-red-50 rounded-xl border border-red-200 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <p className="text-xs text-red-800 font-medium leading-relaxed">
                ⚠️ API Keys Required: To view live job listings, you must sign up at <a href="https://www.adzuna.com/api" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-red-900">Adzuna API</a> and add <span className="font-bold bg-red-100 px-1 rounded">VITE_ADZUNA_APP_ID</span> and <span className="font-bold bg-red-100 px-1 rounded">VITE_ADZUNA_APP_KEY</span> to your <code className="font-mono bg-red-100 px-1 rounded">.env</code> file.
              </p>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-gray-500 animate-pulse">Scouring the web for jobs...</p>
            </div>
          ) : isError ? (
            <div className="text-center p-10 bg-red-50 rounded-3xl border border-red-100 text-red-600">
              <p className="font-bold">Failed to load jobs.</p>
              <p className="text-sm mt-1">{(error as Error)?.message || "Check your API keys or internet connection."}</p>
            </div>
          ) : jobs?.length === 0 ? (
            <div className="text-center p-20 bg-white rounded-3xl border border-gray-100 glassmorphism">
              <h3 className="text-lg font-bold text-gray-800">No jobs found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your search keywords or location.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs?.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalResults > 0 && (
          <div className="flex items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-gray-100 glassmorphism">
            <div className="text-sm font-semibold text-gray-600">
              Page <span className="text-blue-600">{currentPage}</span> of <span className="text-blue-600">{totalPages || 1}</span>
              {totalResults > 0 && (
                <span className="ml-2 text-gray-500">
                  • Showing <span className="text-blue-600">{Math.min(currentPage * resultsPerPage, totalResults)}</span> of <span className="text-blue-600">{totalResults.toLocaleString()}</span> jobs
                </span>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={!hasPrevPage}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-blue-50 enabled:text-blue-600 bg-gray-50 border border-gray-200"
              >
                ← Previous
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  const pageNum = i + Math.max(1, currentPage - 2);
                  if (pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 rounded-lg font-semibold text-sm transition-all ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-blue-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={!hasNextPage}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-blue-50 enabled:text-blue-600 bg-gray-50 border border-gray-200"
              >
                Next →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
