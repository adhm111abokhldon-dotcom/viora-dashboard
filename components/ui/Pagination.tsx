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
  /** Jump straight to the first / last page. Omit to hide those buttons. */
  onFirst?: () => void;
  onLast?: () => void;
  /** Disables every button while the next page is loading. */
  isFetching?: boolean;
};

export function Pagination({
  currentPage,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPrevious,
  onNext,
  onFirst,
  onLast,
  isFetching = false,
}: PaginationProps) {
  const t = useTranslations("pagination");

  return (
    <div
      className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
      aria-busy={isFetching}
    >
      <p className="text-sm text-muted-foreground">
        {t("pageOf", { current: currentPage, total: totalPages })}
      </p>

      {/* Text labels instead of chevrons: they stay correct in Arabic RTL. */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
        {onFirst ? (
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPreviousPage || isFetching}
            onClick={onFirst}
          >
            {t("first")}
          </Button>
        ) : null}

        <Button
          variant="outline"
          size="sm"
          disabled={!hasPreviousPage || isFetching}
          onClick={onPrevious}
        >
          {t("previous")}
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={!hasNextPage || isFetching}
          onClick={onNext}
        >
          {t("next")}
        </Button>

        {onLast ? (
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNextPage || isFetching}
            onClick={onLast}
          >
            {t("last")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
