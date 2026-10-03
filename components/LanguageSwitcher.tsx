"use client";

import { Check, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";

const languages = [
  { value: "en", labelKey: "en" },
  { value: "ar", labelKey: "ar" },
] as const;

/*
 * Locale switcher styled to match ThemeSwitcher.
 *
 * The selected locale lives in the URL (/en/..., /ar/...), so the choice
 * persists automatically across navigation — no extra state needed.
 */
export function LanguageSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const active =
    languages.find((item) => item.value === locale) ?? languages[0];
  const activeLabel = t(active.labelKey);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            aria-label={t("label", { current: activeLabel })}
          >
            <Languages className="size-4" />
          </Button>
        }
      ></DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-40">
        {languages.map((item) => {
          const isActive = locale === item.value;
          const label = t(item.labelKey);

          return (
            <DropdownMenuItem
              key={item.value}
              onClick={() => router.replace(pathname, { locale: item.value })}
              className="gap-2"
              aria-checked={isActive}
              aria-current={isActive}
            >
              <span className="flex-1">{label}</span>

              {isActive && <Check className="size-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
