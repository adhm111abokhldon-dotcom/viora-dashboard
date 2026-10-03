"use client";

import { useTranslations } from "next-intl";

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
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import AuthGuard from "@/components/AuthGuard";
import { Link, usePathname } from "@/i18n/navigation";

const pageKeys: Record<string, string> = {
  "/dashboard": "overview",
  "/products": "products",
  "/products/add-product": "addProduct",
  "/orders": "orders",
  "/orders/add-order": "addOrder",
  "/reports": "reports",
};

function getPageName(
  pathname: string,
  t: (key: string) => string,
): string {
  if (pageKeys[pathname]) return t(pageKeys[pathname]);

  if (/^\/orders\/[^/]+\/edit$/.test(pathname)) return t("editOrder");
  if (/^\/orders\/[^/]+\/delete$/.test(pathname)) return t("deleteOrder");
  if (/^\/products\/[^/]+$/.test(pathname)) return t("editProduct");

  return t("dashboard");
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const t = useTranslations("breadcrumbs");

  const currentPage = getPageName(pathname, t);

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />

        <div className="flex min-h-svh min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b bg-background px-4">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger className="-ms-1" />

              <div className="h-5 w-px shrink-0 bg-border" />

              <Breadcrumb className="min-w-0">
                <BreadcrumbList className="flex-nowrap">
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      render={
                        <Link
                          href="/dashboard"
                          className="text-muted-foreground"
                        >
                          {t("dashboard")}
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

            <div className="ms-auto flex items-center">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-6">{children}</div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
