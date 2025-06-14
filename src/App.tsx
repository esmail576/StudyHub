import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Hello from "./components/Hello";
import WelcomePage from "./pages/WelcomePage";
import { ErrorBoundary } from './components/ErrorBoundary';
import CoursesTab from "./components/CoursesTab";
import NotesTab from "./components/NotesTab";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ThemeProvider>
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/welcome" element={<WelcomePage />} />
                <Route path="/hello" element={<Hello />} />
                <Route path="/courses" element={<CoursesTab />} />
                <Route path="/notes" element={<NotesTab />} />
                <Route path="/courses/*" element={<Navigate to="/courses" replace />} />
                <Route path="/notes/*" element={<Navigate to="/notes" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
