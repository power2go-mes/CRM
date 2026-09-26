import { FileText, Import, MapPinned, Settings, User, Users } from "lucide-react";
import { CanAccess, useTranslate, useUserMenu } from "ra-core";
import { Link, matchPath, useLocation } from "react-router";
import { RefreshButton } from "@/components/admin/refresh-button";
import { ThemeModeToggle } from "@/components/admin/theme-mode-toggle";
import { UserMenu } from "@/components/admin/user-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { ImportPage } from "../misc/ImportPage";
import { ChangelogPage } from "../misc/ChangelogPage";

const Header = () => {
  const { darkModeLogo, lightModeLogo, title } = useConfigurationContext();
  const location = useLocation();
  const translate = useTranslate();

  let currentPath: string | boolean = "/";
  if (matchPath("/", location.pathname)) {
    currentPath = "/";
  } else if (matchPath("/contacts/*", location.pathname)) {
    currentPath = "/contacts";
  } else if (matchPath("/companies/*", location.pathname)) {
    currentPath = "/companies";
  } else if (matchPath("/deals/*", location.pathname)) {
    currentPath = "/deals";
  } else if (matchPath("/leads/*", location.pathname)) {
    currentPath = "/leads";
  } else {
    currentPath = false;
  }

  return (
    <header className="rounded-[24px] border border-border/80 bg-white/80 px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.05)] backdrop-blur-md">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 text-secondary-foreground no-underline">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
              <img className="[.light_&]:hidden h-6 w-6 object-contain" src={darkModeLogo} alt={title} />
              <img className="[.dark_&]:hidden h-6 w-6 object-contain" src={lightModeLogo} alt={title} />
            </div>
            <div className="leading-none">
              <div className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-primary/80">FINLONEXA</div>
              <h1 className="text-lg font-semibold tracking-[-0.03em] text-foreground">{title}</h1>
            </div>
          </Link>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeModeToggle />
            <RefreshButton />
            <UserMenu>
              <ProfileMenu />
              <CanAccess resource="users" action="list">
                <UsersMenu />
              </CanAccess>
              <CanAccess resource="configuration" action="edit">
                <RegionsMenu />
                <SettingsMenu />
              </CanAccess>
              <ImportFromJsonMenuItem />
              <ChangelogMenuItem />
            </UserMenu>
          </div>
        </div>

        <nav className="hidden flex-1 items-center justify-center lg:flex">
          <div className="flex items-center gap-2 rounded-full border border-border bg-slate-50/80 p-1.5 shadow-[0_6px_18px_rgba(15,23,42,0.03)]">
            <NavigationTab label={translate("ra.page.dashboard")} to="/" isActive={currentPath === "/"} />
            <NavigationTab label={translate("resources.contacts.name", { smart_count: 2 })} to="/contacts" isActive={currentPath === "/contacts"} />
            <NavigationTab label={translate("resources.companies.name", { smart_count: 2 })} to="/companies" isActive={currentPath === "/companies"} />
            <NavigationTab label={translate("resources.deals.name", { smart_count: 2 })} to="/deals" isActive={currentPath === "/deals"} />
            <NavigationTab label="Leads" to="/leads" isActive={currentPath === "/leads"} />
          </div>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeModeToggle />
          <RefreshButton />
          <UserMenu>
            <ProfileMenu />
            <CanAccess resource="users" action="list">
              <UsersMenu />
            </CanAccess>
            <CanAccess resource="configuration" action="edit">
              <RegionsMenu />
              <SettingsMenu />
            </CanAccess>
            <ImportFromJsonMenuItem />
            <ChangelogMenuItem />
          </UserMenu>
        </div>
      </div>
    </header>
  );
};

const RegionsMenu = () => {
  const userMenuContext = useUserMenu();
  if (!userMenuContext) throw new Error("<RegionsMenu> must be used inside <UserMenu>");
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to="/regions" className="flex items-center gap-2"><MapPinned />Regions</Link>
    </DropdownMenuItem>
  );
};

const NavigationTab = ({
  label,
  to,
  isActive,
}: {
  label: string;
  to: string;
  isActive: boolean;
}) => (
  <Link
    to={to}
    className={`rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 lg:px-4 ${
      isActive
        ? "bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(79,70,229,0.22)]"
        : "text-foreground/70 hover:bg-accent hover:text-foreground"
    }`}
  >
    {label}
  </Link>
);

const UsersMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<UsersMenu> must be used inside <UserMenu?");
  }
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to="/users" className="flex items-center gap-2">
        <Users />
        {translate("resources.sales.name", { smart_count: 2 })}
      </Link>
    </DropdownMenuItem>
  );
};

const ProfileMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<ProfileMenu> must be used inside <UserMenu?");
  }
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to="/profile" className="flex items-center gap-2">
        <User />
        {translate("crm.profile.title")}
      </Link>
    </DropdownMenuItem>
  );
};

const SettingsMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<SettingsMenu> must be used inside <UserMenu>");
  }
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to="/settings" className="flex items-center gap-2">
        <Settings />
        {translate("crm.settings.title")}
      </Link>
    </DropdownMenuItem>
  );
};

const ImportFromJsonMenuItem = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<ImportFromJsonMenuItem> must be used inside <UserMenu>");
  }
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to={ImportPage.path} className="flex items-center gap-2">
        <Import />
        {translate("crm.header.import_data")}
      </Link>
    </DropdownMenuItem>
  );
};

const ChangelogMenuItem = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<ChangelogMenuItem> must be used inside <UserMenu>");
  }
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to={ChangelogPage.path} className="flex items-center gap-2">
        <FileText />
        {translate("crm.changelog.title")}
      </Link>
    </DropdownMenuItem>
  );
};
export default Header;
