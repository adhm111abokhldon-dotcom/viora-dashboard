"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function Pagination({
  currentPage,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPrevious,
  onNext,
}: PaginationProps) {
  const t = useTranslations("pagination");

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <p className="text-sm text-muted-foreground">
        {t("pageOf", { current: currentPage, total: totalPages })}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          disabled={!hasPreviousPage}
          onClick={onPrevious}
        >
          {t("previous")}
        </Button>

        <Button variant="outline" disabled={!hasNextPage} onClick={onNext}>
          {t("next")}
        </Button>
      </div>
    </div>
  );
}
