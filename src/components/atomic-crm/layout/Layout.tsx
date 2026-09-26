import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Notification } from "@/components/admin/notification";
import { Error } from "@/components/admin/error";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, BriefcaseBusiness, Building2, FileText, Home, MapPinned, Settings, ShieldCheck, Users } from "lucide-react";
import { Link, useLocation } from "react-router";

import { DataImportProvider } from "../dataImport/DataImportProvider";
import { useConfigurationLoader } from "../root/useConfigurationLoader";
import Header from "./Header";

const sidebarItems = [
  { label: "Dashboard", to: "/", icon: Home },
  { label: "Leads", to: "/leads", icon: FileText },
  { label: "Contacts", to: "/contacts", icon: Users },
  { label: "Companies", to: "/companies", icon: Building2 },
  { label: "Deals", to: "/deals", icon: BriefcaseBusiness },
  { label: "Tasks", to: "/tasks", icon: BarChart3 },
];

const managementItems = [
  { label: "Users & Roles", to: "/users", icon: ShieldCheck },
  { label: "Regions", to: "/regions", icon: MapPinned },
];

export const Layout = ({ children }: { children: ReactNode }) => {
  useConfigurationLoader();
  const location = useLocation();

  return (
    <DataImportProvider>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.08),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#f4f7fb_100%)] text-foreground">
        <div className="mx-auto flex max-w-[1600px] gap-4 p-3 md:p-5 xl:p-6">
          <aside className="hidden w-[240px] shrink-0 lg:block">
            <div className="flex h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#071a33] shadow-[0_30px_80px_rgba(7,26,51,0.22)]">
              <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
                  <span className="text-sm font-bold text-white">F</span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200/80">CRM</p>
                  <h2 className="text-lg font-semibold tracking-[-0.03em] text-white">FINLONEXA</h2>
                </div>
              </div>

              <nav className="flex-1 space-y-3 px-3 py-4">
                <div className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Sales</div>
                {sidebarItems.map(({ label, to, icon: Icon }) => {
                  const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-primary text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)]"
                          : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  );
                })}

                <div className="mt-6 px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Management</div>
                {managementItems.map(({ label, to, icon: Icon }) => {
                  const isActive = location.pathname === to || location.pathname.startsWith(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-primary text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)]"
                          : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-white/10 px-3 py-3">
                <Link
                  to="/settings"
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white"
                >
                  <Settings className="size-4" />
                  Settings
                </Link>
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <Header />
            <main className="crm-shell pt-2" id="main-content">
              <ErrorBoundary FallbackComponent={Error}>
                <Suspense fallback={<Skeleton className="h-12 w-12 rounded-full" />}>
                  {children}
                </Suspense>
              </ErrorBoundary>
            </main>
          </div>
        </div>
        <Notification />
      </div>
    </DataImportProvider>
  );
};
