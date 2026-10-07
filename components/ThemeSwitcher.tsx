"use client";

import { useSyncExternalStore } from "react";
import { Check, Moon, Palette, Sparkles, Sun, } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

function subscribeToMount() {
  return () => {};
}

function getClientMountSnapshot() {
  return true;
}

function getServerMountSnapshot() {
  return false;
}

const themes = [
  {
    value: "light",
    labelKey: "light",
    icon: Sun,
  },
  {
    value: "shadcn-light",
    labelKey: "shadcnLight",
    icon: Palette,
  },
  {
    value: "shadcn-dark",
    labelKey: "shadcnDark",
    icon: Palette,
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
  {
    value: "nord",
    labelKey: "nord",
    icon: Palette,
  },

  {
    value: "dracula",
    labelKey: "dracula",
    icon: Palette,
  },
  {
    value: "tokyo-night",
    labelKey: "tokyoNight",
    icon: Palette,
  },
  {
    value: "catppuccin",
    labelKey: "catppuccin",
    icon: Palette,
  },
  {
    value: "one-dark",
    labelKey: "oneDark",
    icon: Palette,
  },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("theme");
  const mounted = useSyncExternalStore(
    subscribeToMount,
    getClientMountSnapshot,
    getServerMountSnapshot,
  );

  const active = mounted
    ? themes.find((item) => item.value === theme) ?? themes[0]
    : themes[0];

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

      <DropdownMenuContent align="end" className="w-44">
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
