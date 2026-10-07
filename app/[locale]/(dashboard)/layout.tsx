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

function getBreadcrumbs(pathname: string, t: (key: string) => string) {
  if (pathname === "/dashboard") {
    return [
      {
        key: "dashboard",
        label: t("dashboard"),
        href: "/dashboard",
      },
    ];
  }

  const breadcrumbs = [
    {
      key: "dashboard",
      label: t("dashboard"),
      href: "/dashboard",
    },
  ];

  if (pathname === "/products") {
    breadcrumbs.push({
      key: "products",
      label: t("products"),
      href: "/products",
    });

    return breadcrumbs;
  }

  if (pathname === "/products/add-product") {
    breadcrumbs.push(
      {
        key: "products",
        label: t("products"),
        href: "/products",
      },
      {
        key: "add-product",
        label: t("addProduct"),
        href: "",
      },
    );

    return breadcrumbs;
  }

  if (/^\/products\/[^/]+$/.test(pathname)) {
    breadcrumbs.push(
      {
        key: "products",
        label: t("products"),
        href: "/products",
      },
      {
        key: "product-detail",
        label: t("productDetail"),
        href: "",
      },
    );

    return breadcrumbs;
  }

  if (/^\/products\/[^/]+\/edit$/.test(pathname)) {
    breadcrumbs.push(
      {
        key: "products",
        label: t("products"),
        href: "/products",
      },
      {
        key: "product-detail",
        label: t("productDetail"),
        href: "",
      },
      {
        key: "edit-product",
        label: t("editProduct"),
        href: "",
      },
    );

    return breadcrumbs;
  }

  if (/^\/products\/[^/]+\/performance$/.test(pathname)) {
    breadcrumbs.push(
      {
        key: "products",
        label: t("products"),
        href: "/products",
      },
      {
        key: "product-performance",
        label: t("productPerformance"),
        href: "",
      },
    );

    return breadcrumbs;
  }

  if (pathname === "/orders") {
    breadcrumbs.push({
      key: "orders",
      label: t("orders"),
      href: "/orders",
    });

    return breadcrumbs;
  }

  if (pathname === "/orders/add-order") {
    breadcrumbs.push(
      {
        key: "orders",
        label: t("orders"),
        href: "/orders",
      },
      {
        key: "add-order",
        label: t("addOrder"),
        href: "",
      },
    );

    return breadcrumbs;
  }

  if (/^\/orders\/[^/]+\/edit$/.test(pathname)) {
    breadcrumbs.push(
      {
        key: "orders",
        label: t("orders"),
        href: "/orders",
      },
      {
        key: "edit-order",
        label: t("editOrder"),
        href: "",
      },
    );

    return breadcrumbs;
  }

  if (/^\/orders\/[^/]+\/delete$/.test(pathname)) {
    breadcrumbs.push(
      {
        key: "orders",
        label: t("orders"),
        href: "/orders",
      },
      {
        key: "delete-order",
        label: t("deleteOrder"),
        href: "",
      },
    );

    return breadcrumbs;
  }

  if (pathname === "/advertising") {
    breadcrumbs.push({
      key: "advertising",
      label: t("advertising"),
      href: "",
    });

    return breadcrumbs;
  }

  if (/^\/advertising\/campaigns\/.+/.test(pathname)) {
    breadcrumbs.push(
      {
        key: "advertising",
        label: t("advertising"),
        href: "/advertising",
      },
      {
        key: "campaign-details",
        label: t("campaignDetails"),
        href: "",
      },
    );

    return breadcrumbs;
  }

  if (pathname === "/reports") {
    breadcrumbs.push({
      key: "reports",
      label: t("reports"),
      href: "/reports",
    });

    return breadcrumbs;
  }

  return breadcrumbs;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const t = useTranslations("breadcrumbs");

  const breadcrumbs = getBreadcrumbs(pathname, t);

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
                  {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    return (
                      <div
                        key={item.key}
                        className="flex min-w-0 items-center gap-2"
                      >
                        {index > 0 && <BreadcrumbSeparator />}

                        <BreadcrumbItem className="min-w-0">
                          {isLast ? (
                            <BreadcrumbPage className="truncate font-medium">
                              {item.label}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink
                              render={
                                <Link
                                  href={item.href}
                                  className="text-muted-foreground"
                                >
                                  {item.label}
                                </Link>
                              }
                            ></BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </div>
                    );
                  })}
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
