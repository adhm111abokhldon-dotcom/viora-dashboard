"use client";

import { useTranslations } from "next-intl";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  Megaphone,
  ShoppingCart,
} from "lucide-react";

import LogoImg from "@/public/logo.jpeg";

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

import { Avatar } from "@/components/ui/avatar";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { useAppToast } from "@/lib/toast";
import { endLocalSession } from "@/lib/fakeAuth";

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
  {
    titleKey: "advertising",
    url: "/advertising",
    icon: Megaphone,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const toast = useAppToast();

  async function handleLogout() {
    try {
      endLocalSession();
      router.replace("/");
    } catch (error) {
      toast.error(error, "logout");
    }
  }

  return (
    <Sidebar>
      {/* Brand */}
      <SidebarHeader className="px-4 py-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md overflow-hidden text-primary-foreground">
            <Image src={LogoImg} alt="Viora Logo" width={40} height={40} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight">
              Viora Beauty
            </p>

            <p className="mt-1 truncate text-xs text-sidebar-foreground/70">
              {t("tagline")}
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup className="px-1 py-5">
          <SidebarGroupLabel className="mb-2 h-7 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            {t("main")}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
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
                          <item.icon className="size-[18px]" />
                          <span>{title}</span>
                        </Link>
                      }
                      isActive={isActive}
                      tooltip={title}
                      className={`h-11 gap-3 rounded-md px-3 text-sm font-medium ${
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground "
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton className="h-12 overflow-hidden  px-2">
                <Avatar className="overflow-hidden ">
                  <Image
                    src={LogoImg}
                    alt="Viora Logo"
                    width={40}
                    height={40}
                  />
                </Avatar>

                <div className="flex min-w-0 flex-1 flex-col items-start text-start">
                  <span className="w-full truncate text-sm font-medium">
                    Viora
                  </span>

                  <span className="w-full truncate text-xs text-sidebar-foreground/60">
                    {t("role")}
                  </span>
                </div>
              </SidebarMenuButton>
            }
          />

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
