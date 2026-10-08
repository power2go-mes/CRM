import { type ReactNode } from "react";

export const MobileContent = ({ children }: { children: ReactNode }) => (
  <main
    className="mx-auto min-h-screen max-w-screen-xl overflow-y-auto px-4 pb-24 pt-20"
    id="main-content"
  >
    {children}
  </main>
);
