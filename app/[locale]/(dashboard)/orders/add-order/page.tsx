"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Calculator,
  ClipboardList,
  ImageIcon,
  Plus,
  Save,
  Trash2,
  Truck,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { createOrder, getProducts, Product } from "@/lib/api";
import { useAppToast } from "@/lib/toast";
import { useInvalidateAll } from "@/lib/queries";
import { formatCurrency, formatNumber } from "@/lib/format";
import AddProductLoading from "@/components/AddProductLoading";
import Image from "next/image";

type FormErrors = {
  customer?: string;
  phone?: string;
  deliveryCharged?: string;
  deliveryCost?: string;
};

type Row = {
  id: number;
  productId: string;
  quantity: string;
  unitPrice: string;
};

function ProductThumbnail({
  product,
  size = "sm",
}: {
  product: Product;
  size?: "sm" | "md";
}) {
  const iconClass = size === "md" ? "size-5" : "size-4";

  if (product.imageUrl) {
    return (
      <div
        className={`shrink-0 size-10 relative overflow-hidden rounded-md border border-border bg-surface`}
      >
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={40}
          height={40}
          className="max-w-full max-h-full  object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-md border border-border bg-surface text-text-muted size-10`}
      aria-hidden="true"
    >
      <ImageIcon className={iconClass} />
    </div>
  );
}

export default function NewOrderPage() {
  const t = useTranslations("orderForm");
  const tv = useTranslations("orderForm.validation");
  const locale = useLocale() as "en" | "ar";

  const invalidateAll = useInvalidateAll();
  const toast = useAppToast();
  const router = useRouter();

  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");

  const [rows, setRows] = useState<Row[]>([
    {
      id: 0,
      productId: "",
      quantity: "1",
      unitPrice: "",
    },
  ]);

  const [deliveryCharged, setDeliveryCharged] = useState("0");
  const [deliveryCost, setDeliveryCost] = useState("0");

  const [errors, setErrors] = useState<FormErrors>({});
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});

  const nextRowId = useRef(1);

  const { data, isLoading } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => getProducts(1, 100),
  });

  const products = data?.products ?? [];

  const lines = rows.map((row) => ({
    row,
    product: products.find((product) => product._id === row.productId),
    quantity: Number(row.quantity),
    unitPrice: Number(row.unitPrice),
  }));

  const validLines = lines.filter(
    (line) => line.product && line.quantity > 0 && line.unitPrice > 0,
  );

  const itemsTotal = validLines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0,
  );

  const itemsCost = validLines.reduce(
    (sum, line) => sum + line.quantity * (line.product?.cost ?? 0),
    0,
  );

  const deliveryChargedNumber = Number(deliveryCharged) || 0;

  const deliveryCostNumber = Number(deliveryCost) || 0;

  const total = itemsTotal + deliveryChargedNumber;

  const estimatedProfit = total - itemsCost - deliveryCostNumber;

  const createOrderMutation = useMutation({
    mutationFn: createOrder,

    onSuccess: async () => {
      toast.success("orderCreated");

      await invalidateAll();

      router.push("/orders");
    },

    onError: (error) => {
      toast.error(error, "createOrder");
    },
  });

  if (isLoading) {
    return <AddProductLoading />;
  }

  function clearError(field: keyof FormErrors) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function bindInput(field: keyof FormErrors, setter: (value: string) => void) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value);
      clearError(field);
    };
  }

  function updateRow(id: number, patch: Partial<Row>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );

    setRowErrors((current) => {
      const rest = { ...current };
      delete rest[id];
      return rest;
    });
  }

  function handleProductChange(id: number, value: string) {
    const product = products.find((product) => product._id === value);

    updateRow(id, {
      productId: value,
      unitPrice: product ? String(product.price) : "",
    });
  }

  function addRow() {
    setRows((current) => [
      ...current,
      {
        id: nextRowId.current++,
        productId: "",
        quantity: "1",
        unitPrice: "",
      },
    ]);
  }

  function removeRow(id: number) {
    setRows((current) => current.filter((row) => row.id !== id));

    setRowErrors((current) => {
      const rest = { ...current };
      delete rest[id];
      return rest;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    const nextRowErrors: Record<number, string> = {};

    if (!customer.trim()) {
      nextErrors.customer = tv("customerRequired");
    }

    if (!phone.trim()) {
      nextErrors.phone = tv("phoneRequired");
    }

    if (deliveryChargedNumber < 0) {
      nextErrors.deliveryCharged = tv("mustBeZeroOrMore");
    }

    if (deliveryCostNumber < 0) {
      nextErrors.deliveryCost = tv("mustBeZeroOrMore");
    }

    const quantityByProduct = new Map<string, number>();

    for (const row of rows) {
      if (!row.productId) continue;

      const quantity = Number(row.quantity);

      quantityByProduct.set(
        row.productId,
        (quantityByProduct.get(row.productId) ?? 0) + quantity,
      );
    }

    for (const { row, product, quantity, unitPrice } of lines) {
      if (!row.productId || !product) {
        nextRowErrors[row.id] = tv("selectProduct");
        continue;
      }

      if (!row.quantity || quantity <= 0 || !Number.isInteger(quantity)) {
        nextRowErrors[row.id] = tv("quantityWhole");
        continue;
      }

      if (!row.unitPrice || unitPrice <= 0) {
        nextRowErrors[row.id] = tv("unitPricePositive");
        continue;
      }

      const requestedQuantity = quantityByProduct.get(row.productId) ?? 0;

      if (requestedQuantity > product.stock) {
        nextRowErrors[row.id] = tv("onlyAvailable", {
          count: formatNumber(product.stock, locale),
          name: product.name,
        });
      }
    }

    setErrors(nextErrors);
    setRowErrors(nextRowErrors);

    if (
      Object.keys(nextErrors).length > 0 ||
      Object.keys(nextRowErrors).length > 0
    ) {
      return;
    }

    createOrderMutation.mutate({
      customer: customer.trim(),
      phone: phone.trim(),

      items: rows.map((row) => ({
        productId: row.productId,
        quantity: Number(row.quantity),
        unitPrice: Number(row.unitPrice),
      })),

      deliveryCharged: deliveryChargedNumber,

      deliveryCost: deliveryCostNumber,
    });
  }

  return (
    <div className="mx-auto w-full max-w-400 space-y-7 overflow-x-hidden">
      {/* Header */}
      <div className="space-y-4">
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          render={<Link href="/orders" />}
          className="-ms-2 w-fit"
        >
          <ArrowLeft className="size-4 rtl:-scale-x-100" />
          {t("backToOrders")}
        </Button>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            {t("addTitle")}
          </h1>

          <p className="mt-1.5 text-sm text-text-muted">
            {t("addDescription")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer */}
        <Card className="overflow-hidden rounded-lg border border-border bg-card shadow-none">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <ClipboardList className="size-4" />
              </div>

              <div>
                <CardTitle className="text-base font-semibold text-text">
                  {t("customerInformation")}
                </CardTitle>

                <p className="mt-1 text-sm text-text-muted">
                  {t("customerInformationDescription")}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <FieldGroup>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="customer">
                    {t("customerName")}
                  </FieldLabel>

                  <Input
                    id="customer"
                    value={customer}
                    onChange={bindInput("customer", setCustomer)}
                    placeholder={t("customerNamePlaceholder")}
                    aria-invalid={!!errors.customer}
                  />

                  {errors.customer ? (
                    <p className="text-sm text-destructive">
                      {errors.customer}
                    </p>
                  ) : (
                    <FieldDescription>{t("customerNameHint")}</FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone">{t("phone")}</FieldLabel>

                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={bindInput("phone", setPhone)}
                    placeholder={t("phonePlaceholder")}
                    aria-invalid={!!errors.phone}
                  />

                  {errors.phone ? (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  ) : (
                    <FieldDescription>{t("phoneHint")}</FieldDescription>
                  )}
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Products */}
        <Card className="overflow-hidden rounded-lg border border-border bg-card shadow-none">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-semibold text-text">
              {t("products")}
            </CardTitle>

            <p className="text-sm text-text-muted">
              {t("productsDescription")}
            </p>
          </CardHeader>

          <CardContent className="space-y-4 p-5">
            {lines.map(({ row, product }, index) => (
              <div
                key={row.id}
                className="space-y-5 rounded-md border border-border p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-text">
                    {t("productNumber", {
                      number: index + 1,
                    })}
                  </span>

                  {rows.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(row.id)}
                      aria-label={t("productNumber", {
                        number: index + 1,
                      })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>

                <FieldGroup>
                  <Field className="max-w-1/2">
                    <FieldLabel htmlFor={`product-${row.id}`}>
                      {t("product")}
                    </FieldLabel>

                    <Select
                      value={row.productId}
                      onValueChange={(value) =>
                        handleProductChange(row.id, value ?? "")
                      }
                    >
                      <SelectTrigger
                        id={`product-${row.id}`}
                        className="h-auto min-h-12 w-full py-2"
                        aria-invalid={!!rowErrors[row.id]}
                      >
                        {product ? (
                          <div className="flex min-w-0 items-center gap-3">
                            <ProductThumbnail product={product} size="md" />

                            <div className="min-w-0 text-start">
                              <p className="truncate text-sm font-semibold text-text">
                                {product.name}
                              </p>

                              <p className="text-xs text-text-muted">
                                {formatCurrency(product.price, locale)}
                                {" · "}
                                {formatNumber(product.stock, locale)} available
                              </p>
                            </div>
                          </div>
                        ) : (
                          <SelectValue placeholder={t("selectProduct")} />
                        )}
                      </SelectTrigger>

                      <SelectContent>
                        {products.map((item) => (
                          <SelectItem
                            key={item._id}
                            value={item._id}
                            disabled={item.stock === 0}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <ProductThumbnail product={item} />

                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {item.name}
                                </p>

                                <p className="text-xs text-text-muted">
                                  {formatCurrency(item.price, locale)}
                                  {" · "}
                                  {formatNumber(item.stock, locale)} available
                                </p>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {product && (
                      <FieldDescription>
                        {t("availableStock", {
                          count: formatNumber(product.stock, locale),
                        })}
                      </FieldDescription>
                    )}

                    {rowErrors[row.id] && (
                      <p className="text-sm text-destructive">
                        {rowErrors[row.id]}
                      </p>
                    )}
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor={`quantity-${row.id}`}>
                        {t("quantity")}
                      </FieldLabel>

                      <Input
                        id={`quantity-${row.id}`}
                        type="number"
                        min="1"
                        step="1"
                        value={row.quantity}
                        onChange={(event) =>
                          updateRow(row.id, {
                            quantity: event.target.value,
                          })
                        }
                        aria-invalid={!!rowErrors[row.id]}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor={`unit-price-${row.id}`}>
                        {t("sellingPriceUnit")}
                      </FieldLabel>

                      <Input
                        id={`unit-price-${row.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.unitPrice}
                        onChange={(event) =>
                          updateRow(row.id, {
                            unitPrice: event.target.value,
                          })
                        }
                        aria-invalid={!!rowErrors[row.id]}
                      />
                    </Field>
                  </div>
                </FieldGroup>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addRow}
              className="w-full sm:w-auto"
            >
              <Plus className="size-4" />
              {t("addAnotherProduct")}
            </Button>
          </CardContent>
        </Card>

        {/* Delivery */}
        <Card className="overflow-hidden rounded-lg border border-border bg-card shadow-none">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Truck className="size-4" />
              </div>

              <div>
                <CardTitle className="text-base font-semibold text-text">
                  {t("delivery")}
                </CardTitle>

                <p className="mt-1 text-sm text-text-muted">
                  {t("deliveryDescription")}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="deliveryCharged">
                  {t("deliveryCharged")}
                </FieldLabel>

                <Input
                  id="deliveryCharged"
                  type="number"
                  min="0"
                  step="0.01"
                  value={deliveryCharged}
                  onChange={bindInput("deliveryCharged", setDeliveryCharged)}
                  aria-invalid={!!errors.deliveryCharged}
                />

                {errors.deliveryCharged ? (
                  <p className="text-sm text-destructive">
                    {errors.deliveryCharged}
                  </p>
                ) : (
                  <FieldDescription>
                    {t("deliveryChargedHint")}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="deliveryCost">
                  {t("deliveryCost")}
                </FieldLabel>

                <Input
                  id="deliveryCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={deliveryCost}
                  onChange={bindInput("deliveryCost", setDeliveryCost)}
                  aria-invalid={!!errors.deliveryCost}
                />

                {errors.deliveryCost ? (
                  <p className="text-sm text-destructive">
                    {errors.deliveryCost}
                  </p>
                ) : (
                  <FieldDescription>{t("deliveryCostHint")}</FieldDescription>
                )}
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="overflow-hidden rounded-lg border border-border border-s-success bg-card shadow-none">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-success text-success-foreground">
                <Calculator className="size-4" />
              </div>

              <div>
                <CardTitle className="text-base font-semibold text-text">
                  {t("summary")}
                </CardTitle>

                <p className="mt-1 text-sm text-text-muted">
                  {t("summaryDescription")}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <div className="space-y-4">
              {validLines.length === 0 ? (
                <p className="text-sm text-text-muted">
                  {t("selectForSummary")}
                </p>
              ) : (
                validLines.map((line) => (
                  <div
                    key={line.row.id}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {line.product && (
                        <ProductThumbnail product={line.product} />
                      )}

                      <span className="truncate text-sm text-text-muted">
                        {line.product?.name} ×{" "}
                        {formatNumber(line.quantity, locale)}
                      </span>
                    </div>

                    <span className="shrink-0 text-sm font-semibold tabular-nums text-text">
                      {formatCurrency(line.quantity * line.unitPrice, locale)}
                    </span>
                  </div>
                ))
              )}

              <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                <span className="text-sm text-text-muted">
                  {t("deliveryCustomerPays")}
                </span>

                <span className="text-sm font-semibold tabular-nums text-text">
                  {formatCurrency(deliveryChargedNumber, locale)}
                </span>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-text">{t("total")}</span>

                  <span className="text-2xl font-bold tracking-tight tabular-nums text-text">
                    {formatCurrency(total, locale)}
                  </span>
                </div>

                {validLines.length > 0 && (
                  <>
                    <div className="mt-3 flex items-center justify-between gap-4">
                      <span className="text-sm text-text-muted">
                        {t("deliveryCostRow")}
                      </span>

                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(deliveryCostNumber, locale)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4">
                      <span className="text-sm text-text-muted">
                        {t("estimatedProfit")}
                      </span>

                      <span
                        className={
                          estimatedProfit < 0
                            ? "text-sm font-semibold text-destructive tabular-nums"
                            : "text-sm font-semibold text-success tabular-nums"
                        }
                      >
                        {formatCurrency(estimatedProfit, locale)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            nativeButton={false}
            type="button"
            variant="outline"
            render={<Link href="/orders" />}
            className="w-full sm:w-auto"
          >
            {t("cancel")}
          </Button>

          <Button
            type="submit"
            disabled={createOrderMutation.isPending}
            className="w-full sm:w-auto"
          >
            <Save className="size-4" />

            {createOrderMutation.isPending ? t("creating") : t("createOrder")}
          </Button>
        </div>
      </form>
    </div>
  );
}
