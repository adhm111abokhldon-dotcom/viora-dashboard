"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  createAdvertisingExpense,
  updateAdvertisingExpense,
  type AdvertisingExpense,
} from "@/lib/api";
import { apiErrorMessage } from "@/lib/errors";

const SUGGESTED_PLATFORMS = ["Meta", "Facebook", "Instagram", "TikTok"] as const;

type FormErrors = Partial<Record<"date" | "amount" | "platform", string>>;

/** YYYY-MM-DD in the local timezone (avoids the UTC off-by-one of toISOString). */
function todayIsoDate(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

function expenseToDateInput(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return todayIsoDate();

  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");

  return `${parsed.getFullYear()}-${month}-${day}`;
}

/**
 * The fields, mounted fresh for every open.
 *
 * The dialog shell keys this component on the edited expense, so switching
 * between "create" and "edit X" re-initialises the form from props instead of
 * syncing it with an effect (which would cause a cascading render).
 */
function ExpenseFields({
  expense,
  onDone,
  onSaved,
}: {
  /** Null means "create a new expense". */
  expense: AdvertisingExpense | null;
  onDone: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("advertising");
  const tv = useTranslations("advertising.validation");
  const tc = useTranslations("common");
  const te = useTranslations("errors");

  const [date, setDate] = useState(() =>
    expense ? expenseToDateInput(expense.date) : todayIsoDate(),
  );
  const [amount, setAmount] = useState(() =>
    expense ? String(expense.amount) : "",
  );
  const [platform, setPlatform] = useState(() => expense?.platform ?? "");
  const [campaign, setCampaign] = useState(() => expense?.campaign ?? "");
  const [note, setNote] = useState(() => expense?.note ?? "");
  const [errors, setErrors] = useState<FormErrors>({});

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        date,
        amount: Number(amount),
        platform: platform.trim(),
        campaign: campaign.trim() || undefined,
        note: note.trim() || undefined,
      };

      return expense
        ? updateAdvertisingExpense(expense._id, payload)
        : createAdvertisingExpense(payload);
    },
    onSuccess: () => {
      onSaved();
      onDone();
    },
  });

  function validate(): boolean {
    const next: FormErrors = {};

    if (!date) next.date = tv("dateRequired");
    else if (Number.isNaN(Date.parse(date))) next.date = tv("dateInvalid");

    const amountValue = Number(amount);

    if (!amount.trim()) next.amount = tv("amountRequired");
    else if (Number.isNaN(amountValue)) next.amount = tv("amountInvalid");
    else if (amountValue <= 0) next.amount = tv("amountPositive");

    if (!platform.trim()) next.platform = tv("platformRequired");

    setErrors(next);

    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (validate()) {
      mutation.mutate();
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ads-date">{t("date")}</Label>
        <Input
          id="ads-date"
          type="date"
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            setErrors((current) => ({ ...current, date: undefined }));
          }}
          aria-invalid={!!errors.date}
        />

        {errors.date && (
          <p className="text-xs text-destructive">{errors.date}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ads-amount">{t("amount")}</Label>
        <Input
          id="ads-amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value);
            setErrors((current) => ({ ...current, amount: undefined }));
          }}
          placeholder="0.00"
          aria-invalid={!!errors.amount}
        />

        {errors.amount && (
          <p className="text-xs text-destructive">{errors.amount}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ads-form-platform">{t("platform")}</Label>
        <Input
          id="ads-form-platform"
          list="ads-platform-options"
          value={platform}
          onChange={(event) => {
            setPlatform(event.target.value);
            setErrors((current) => ({ ...current, platform: undefined }));
          }}
          placeholder={t("platformPlaceholder")}
          aria-invalid={!!errors.platform}
        />

        <datalist id="ads-platform-options">
          {SUGGESTED_PLATFORMS.map((value) => (
            <option key={value} value={value} />
          ))}

          <option value={t("platforms.Other")} />
        </datalist>

        {errors.platform && (
          <p className="text-xs text-destructive">{errors.platform}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ads-campaign">{t("campaign")}</Label>
        <Input
          id="ads-campaign"
          value={campaign}
          onChange={(event) => setCampaign(event.target.value)}
          placeholder={t("campaignPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ads-note">{t("note")}</Label>
        <Input
          id="ads-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t("notePlaceholder")}
        />
      </div>

      {mutation.isError && (
        <div
          className="border-s-4 border-destructive bg-destructive px-4 py-3 text-sm font-medium text-destructive-foreground"
          role="alert"
        >
          {apiErrorMessage(
            mutation.error,
            te,
            te(expense ? "updateAdvertising" : "createAdvertising"),
          )}
        </div>
      )}

      <DialogFooter className="gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={mutation.isPending}
        >
          {tc("cancel")}
        </Button>

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? tc("saving") : expense ? tc("save") : t("create")}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Add / edit a single advertising expense.
 *
 * Platform is free text with suggestions rather than a fixed enum, so a new
 * channel can be recorded without a code change.
 */
export default function AdvertisingExpenseForm({
  open,
  expense,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  /** Null means "create a new expense". */
  expense: AdvertisingExpense | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const t = useTranslations("advertising");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-card">
        <DialogHeader>
          <DialogTitle>
            {expense ? t("editTitle") : t("addTitle")}
          </DialogTitle>

          {expense && <DialogDescription>{t("editDescription")}</DialogDescription>}
        </DialogHeader>

        <ExpenseFields
          key={expense?._id ?? "new"}
          expense={expense}
          onDone={() => onOpenChange(false)}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}
