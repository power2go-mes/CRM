import {
  FileText,
  Import,
  LogOut,
  MapPinned,
  Menu,
  Settings,
  User,
  Users,
} from "lucide-react";
import {
  CanAccess,
  useGetIdentity,
  useLogout,
  useTranslate,
} from "ra-core";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ChangelogPage } from "../misc/ChangelogPage";
import { ImportPage } from "../misc/ImportPage";

export const MobileUserMenu = () => {
  const translate = useTranslate();
  const { data: identity } = useGetIdentity();
  const logout = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl" aria-label="Open menu">
          <Menu />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60 rounded-2xl border-border/80 p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.14)]" align="end">
        <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {identity?.fullName}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <MobileMenuLink to="/profile" icon={<User />}>
          {translate("crm.profile.title")}
        </MobileMenuLink>
        <CanAccess resource="users" action="list">
          <MobileMenuLink to="/users" icon={<Users />}>
            {translate("resources.sales.name", { smart_count: 2 })}
          </MobileMenuLink>
        </CanAccess>
        <CanAccess resource="configuration" action="edit">
          <MobileMenuLink to="/regions" icon={<MapPinned />}>
            Regions
          </MobileMenuLink>
          <MobileMenuLink to="/settings" icon={<Settings />}>
            {translate("crm.settings.title")}
          </MobileMenuLink>
        </CanAccess>
        <MobileMenuLink to={ImportPage.path} icon={<Import />}>
          {translate("crm.header.import_data")}
        </MobileMenuLink>
        <MobileMenuLink to={ChangelogPage.path} icon={<FileText />}>
          {translate("crm.changelog.title")}
        </MobileMenuLink>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()}>
          <LogOut />
          {translate("ra.auth.logout", { _: "Log out" })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const MobileMenuLink = ({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <DropdownMenuItem asChild>
    <Link to={to} className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm">
      {icon}
      {children}
    </Link>
  </DropdownMenuItem>
);
