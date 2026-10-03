"use client";

import { useTranslations } from "next-intl";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  ShoppingCart,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

const navigation = [
  {
    titleKey: "overview",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    titleKey: "products",
    url: "/products",
    icon: Boxes,
  },
  {
    titleKey: "orders",
    url: "/orders",
    icon: ShoppingCart,
  },
  {
    titleKey: "reports",
    url: "/reports",
    icon: BarChart3,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");

  function handleLogout() {
    sessionStorage.removeItem("isLoggedIn");
    router.replace("/");
  }

  return (
    <Sidebar>
      {/* Brand */}
      <SidebarHeader className="px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <PackagePlus className="size-4" />
          </div>

          <div className="flex flex-col leading-none">
            <span className="font-semibold tracking-tight">Viora Beauty</span>

            <span className="mt-1 text-[11px] text-muted-foreground">
              {t("tagline")}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("main")}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/dashboard" &&
                    pathname.startsWith(`${item.url}/`));

                const title = t(item.titleKey);

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      render={
                        <Link href={item.url}>
                          <item.icon className="size-4" />
                          <span>{title}</span>
                        </Link>
                      }
                      isActive={isActive}
                      tooltip={title}
                    ></SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton className="h-12">
                <Avatar className="size-8 rounded-md">
                  <AvatarFallback className="rounded-md bg-muted text-xs font-medium">
                    AD
                  </AvatarFallback>
                </Avatar>

                <div className="flex min-w-0 flex-1 flex-col items-start text-start">
                  <span className="w-full truncate text-sm font-medium">
                    Adham
                  </span>

                  <span className="w-full truncate text-xs text-muted-foreground">
                    {t("role")}
                  </span>
                </div>
              </SidebarMenuButton>
            }
          ></DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem>{t("account")}</DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
