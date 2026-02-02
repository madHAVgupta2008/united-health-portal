import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DatabaseProvider } from "@/contexts/DatabaseContext";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AccountInfo from "./pages/AccountInfo";
import InsuranceUpload from "./pages/InsuranceUpload";
import BillUpload from "./pages/BillUpload";
import AIChat from "./pages/AIChat";
import InsuranceHistory from "./pages/InsuranceHistory";
import BillHistory from "./pages/BillHistory";
import DashboardLayout from "./components/layout/DashboardLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DatabaseProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected Dashboard Routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/account" element={<AccountInfo />} />
              <Route path="/insurance-upload" element={<InsuranceUpload />} />
              <Route path="/bill-upload" element={<BillUpload />} />
              <Route path="/chat" element={<AIChat />} />
              <Route path="/insurance-history" element={<InsuranceHistory />} />
              <Route path="/bill-history" element={<BillHistory />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </DatabaseProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
