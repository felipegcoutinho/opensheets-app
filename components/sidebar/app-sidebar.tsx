"use client";
import { Logo } from "@/components/logo";
import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import * as React from "react";
import { createSidebarNavData, type PagadorLike } from "./nav-link";

type AppUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: AppUser;
  pagadorAvatarUrl: string | null;
  pagadores: PagadorLike[];
  pendingCount?: number;
}

export function AppSidebar({
  user,
  pagadorAvatarUrl,
  pagadores,
  pendingCount,
  ...props
}: AppSidebarProps) {
  if (!user) {
    throw new Error("AppSidebar requires a user but received undefined.");
  }

  const navigation = React.useMemo(
    () => createSidebarNavData(pagadores, pendingCount),
    [pagadores, pendingCount]
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/dashboard">
                <LogoContent />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain sections={navigation.navMain} />
        <NavSecondary items={navigation.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} pagadorAvatarUrl={pagadorAvatarUrl} />
      </SidebarFooter>
    </Sidebar>
  );
}

function LogoContent() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return <Logo variant={isCollapsed ? "small" : "full"} />;
}
