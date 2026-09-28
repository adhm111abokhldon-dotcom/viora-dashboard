"use client";

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
  return (
    <div className="flex items-center justify-between border-t pt-4">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          disabled={!hasPreviousPage}
          onClick={onPrevious}
        >
          Previous
        </Button>

        <Button variant="outline" disabled={!hasNextPage} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
