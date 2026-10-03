"use client";

import { Check, Moon, Sparkles, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

const themes = [
  {
    value: "light",
    labelKey: "light",
    icon: Sun,
  },
  {
    value: "dark",
    labelKey: "dark",
    icon: Moon,
  },
  {
    value: "viora",
    labelKey: "viora",
    icon: Sparkles,
  },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("theme");

  const active = themes.find((item) => item.value === theme) ?? themes[0];
  const ActiveIcon = active.icon;
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
            <ActiveIcon className="size-4" />
          </Button>
        }
      ></DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-40">
        {themes.map((item) => {
          const Icon = item.icon;
          const isActive = theme === item.value;

          return (
            <DropdownMenuItem
              key={item.value}
              onClick={() => setTheme(item.value)}
              className="gap-2"
              aria-checked={isActive}
            >
              <Icon className="size-4" />

              <span className="flex-1">{t(item.labelKey)}</span>

              {isActive && <Check className="size-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
