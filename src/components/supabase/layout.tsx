import * as React from "react";
import { Notification } from "@/components/admin/notification";
import { useConfigurationContext } from "@/components/atomic-crm/root/ConfigurationContext";

export const Layout = ({ children }: React.PropsWithChildren) => {
  const { darkModeLogo, title } = useConfigurationContext();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#f1f5f9_100%)] lg:p-6">
      <div className="container relative grid min-h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-[2rem] border border-border/80 bg-card/85 shadow-[0_30px_80px_rgba(15,23,42,0.12)] sm:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col overflow-hidden bg-[#071a33] p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.5),_transparent_42%),linear-gradient(145deg,_#071a33_0%,_#0b2345_65%,_#12366a_100%)]" />
          <div className="relative z-20 flex flex-col gap-1">
            <div className="flex items-center text-lg font-semibold">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                <img className="h-6 w-6 object-contain" src={darkModeLogo} alt={title} />
              </div>
              {title}
            </div>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-blue-200/70">FINLONEXA workspace</p>
          </div>
          <div className="relative z-20 mt-auto max-w-sm">
            <p className="text-4xl font-semibold leading-tight tracking-[-0.04em]">Clarity for every customer conversation.</p>
            <p className="mt-4 text-sm leading-6 text-blue-100/70">Keep teams aligned, follow-ups visible, and revenue moving from one calm workspace.</p>
          </div>
        </div>
        <div className="flex items-center p-5 sm:p-8 lg:p-12">
          <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-6">
            {children}
          </div>
        </div>
      </div>
      <Notification />
    </div>
  );
};
