import { MobileRefreshButton } from "./MobileRefreshButton";
import { MobileUserMenu } from "./MobileUserMenu";

const MobileHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 h-14 w-full border-b border-border/80 bg-card/90 px-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)] backdrop-blur-md flex items-center justify-between">
      {children}
      <div className="flex items-center gap-1">
        <MobileRefreshButton />
        <MobileUserMenu />
      </div>
    </header>
  );
};

export default MobileHeader;
