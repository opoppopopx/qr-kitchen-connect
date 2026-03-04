import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RestaurantProvider } from "@/contexts/RestaurantContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import OrdersPage from "./pages/OrdersPage";
import TablesPage from "./pages/TablesPage";
import KitchenPage from "./pages/KitchenPage";
import MenuManagementPage from "./pages/MenuManagementPage";
import CustomerOrderPage from "./pages/CustomerOrderPage";
import StaffPage from "./pages/StaffPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RestaurantProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/orders" element={<AppLayout><OrdersPage /></AppLayout>} />
            <Route path="/tables" element={<AppLayout><TablesPage /></AppLayout>} />
            <Route path="/kitchen" element={<AppLayout><KitchenPage /></AppLayout>} />
            <Route path="/menu" element={<AppLayout><MenuManagementPage /></AppLayout>} />
            <Route path="/customer" element={<AppLayout><CustomerOrderPage /></AppLayout>} />
            <Route path="/staff" element={<AppLayout><StaffPage /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </RestaurantProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
