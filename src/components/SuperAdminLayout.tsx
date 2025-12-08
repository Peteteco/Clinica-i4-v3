import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Shield, Building2, BarChart3, Settings, LogOut, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const menuItems = [
  { path: "/super-admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { path: "/super-admin/organizations", label: "Organizações", icon: Building2 },
  { path: "/super-admin/plans", label: "Planos", icon: Crown },
  { path: "/super-admin/settings", label: "Configurações", icon: Settings },
];

export default function SuperAdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      // Sempre navegar para login, mesmo com erro
      navigate("/login");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-purple-950 via-slate-900 to-slate-950">
      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 transform border-r border-purple-800/30 bg-gradient-to-b from-purple-900/40 to-slate-900/40 backdrop-blur-xl transition-transform duration-300 lg:relative lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-purple-800/30 px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-400" />
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Super Admin
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-purple-300 hover:text-purple-100 hover:bg-purple-800/30"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        <div className="border-b border-purple-800/30 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold text-purple-100">
                {profile?.full_name || "Admin"}
              </p>
              <p className="text-xs text-purple-400">Administrador Master</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                    : "text-purple-300 hover:bg-purple-800/30 hover:text-purple-100"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-purple-800/30 p-4">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-purple-300 hover:bg-red-900/30 hover:text-red-300"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 items-center border-b border-purple-800/30 bg-slate-900/40 backdrop-blur-xl px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 text-purple-300 hover:text-purple-100 hover:bg-purple-800/30 lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-400" />
            <h2 className="text-sm font-semibold text-purple-100">
              Painel Administrativo
            </h2>
          </div>

          <div className="ml-auto">
            <span className="inline-flex items-center rounded-full bg-purple-600/20 px-3 py-1 text-xs font-semibold text-purple-300 ring-1 ring-purple-500/30">
              Super Admin
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

