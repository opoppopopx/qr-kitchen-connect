import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RestaurantProvider } from "@/contexts/RestaurantContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import OrdersPage from "./pages/OrdersPage";
import TablesPage from "./pages/TablesPage";
import KitchenPage from "./pages/KitchenPage";
import MenuManagementPage from "./pages/MenuManagementPage";
import CustomersPage from "./pages/CustomersPage";
import StaffPage from "./pages/StaffPage";
import LoginPage from "./pages/LoginPage";
import CustomerOrderPage from "./pages/CustomerOrderPage";
import QRCodesPage from "./pages/QRCodesPage";
import KitchenDisplayPage from "./pages/KitchenDisplayPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RestaurantProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              {/* Public QR page for customers, one URL per table */}
              <Route path="/t/:tableId" element={<CustomerOrderPage />} />
              {/* Standalone kitchen display (separate from the admin web app) */}
              <Route path="/kd" element={<KitchenDisplayPage />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
              <Route path="/tables" element={<ProtectedRoute><TablesPage /></ProtectedRoute>} />
              <Route path="/qr" element={<ProtectedRoute><QRCodesPage /></ProtectedRoute>} />

              <Route path="/kitchen" element={<ProtectedRoute><KitchenPage /></ProtectedRoute>} />
              <Route path="/menu" element={<ProtectedRoute><MenuManagementPage /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
              <Route path="/staff" element={<ProtectedRoute><StaffPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RestaurantProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
