import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { InterviewProvider } from "@/contexts/InterviewContext";
import { AssessmentProvider } from "@/contexts/AssessmentContext";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import GenerateInterviewPage from "@/pages/GenerateInterviewPage";
import InterviewPage from "@/pages/InterviewPage";
import FeedbackPage from "@/pages/FeedbackPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

import AptitudePage from "@/pages/AptitudePage";
import ProgrammingPage from "@/pages/ProgrammingPage";
import ResumeAssessmentPage from "@/pages/ResumeAssessmentPage";
import JobsPage from "@/pages/JobsPage";

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-50 relative overflow-hidden transition-colors duration-500">
      {/* Soft gradient orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[10%] w-[55%] h-[55%] rounded-full bg-blue-300/20 blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[5%] w-[45%] h-[45%] rounded-full bg-purple-300/20 blur-[100px]" />
        <div className="absolute top-[35%] left-[30%] w-[35%] h-[35%] rounded-full bg-indigo-200/15 blur-[90px]" />
      </div>

      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/generate" element={<ProtectedRoute><GenerateInterviewPage /></ProtectedRoute>} />
            <Route path="/interview/:id" element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />
            <Route path="/feedback/:id" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/aptitude" element={<ProtectedRoute><AptitudePage /></ProtectedRoute>} />
            <Route path="/programming" element={<ProtectedRoute><ProgrammingPage /></ProtectedRoute>} />
            <Route path="/resume-assessment" element={<ProtectedRoute><ResumeAssessmentPage /></ProtectedRoute>} />
            <Route path="/jobs" element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <InterviewProvider>
          <AssessmentProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </TooltipProvider>
          </AssessmentProvider>
        </InterviewProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
