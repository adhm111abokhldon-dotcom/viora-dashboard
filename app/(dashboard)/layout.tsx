"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const pageNames: Record<string, string> = {
  "/dashboard": "Overview",
  "/products": "Products",
  "/products/add-product": "Add Product",
  "/orders": "Orders",
  "/orders/add-order": "Add Order",
  "/reports": "Reports",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const currentPage = pageNames[pathname] ?? "Dashboard";

  return (
    <SidebarProvider>
      <AppSidebar />

      <main className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b bg-background px-4">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="-ml-1" />

            <div className="h-5 w-px shrink-0 bg-border" />

            <Breadcrumb className="min-w-0">
              <BreadcrumbList className="flex-nowrap">
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={
                      <Link href="/dashboard" className="text-muted-foreground">
                        Dashboard
                      </Link>
                    }
                  ></BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbSeparator />

                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="truncate font-medium">
                    {currentPage}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="ml-auto flex items-center">
            <ThemeSwitcher />
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
