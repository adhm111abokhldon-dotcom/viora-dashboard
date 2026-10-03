"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Calculator,
  ClipboardList,
  Plus,
  Save,
  Trash2,
  Truck,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

import { createOrder, getProducts } from "@/lib/api";
import { useRouter } from "@/i18n/navigation";
import { formatCurrency, formatNumber } from "@/lib/format";
import { apiErrorMessage } from "@/lib/errors";
import AddProductLoading from "@/components/AddProductLoading";

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

export default function NewOrderPage() {
  const t = useTranslations("orderForm");
  const tv = useTranslations("orderForm.validation");
  const te = useTranslations("errors");
  const locale = useLocale() as "en" | "ar";

  const queryClient = useQueryClient();
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

  // --------------------------------------------------------------------------
  // Live calculation
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // Mutation
  // --------------------------------------------------------------------------

  const createOrderMutation = useMutation({
    mutationFn: createOrder,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });

      queryClient.invalidateQueries({
        queryKey: ["products"],
      });

      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
      });

      queryClient.invalidateQueries({
        queryKey: ["reports"],
      });

      router.push("/orders");
    },
  });

  if (isLoading) {
    return <AddProductLoading />;
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

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

    // السعر الافتراضي للمنتج،
    // وبعدها المستخدم حر يعدله للمكاسرة.
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

  // --------------------------------------------------------------------------
  // Submit
  // --------------------------------------------------------------------------

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

    // مجموع الكمية المطلوبة لكل منتج.
    // مهم إذا نفس المنتج موجود بأكثر من row.
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
    <div className="mx-auto w-full max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            nativeButton={false}
            variant="outline"
            size="icon"
            className="mt-0.5 shrink-0"
            render={<Link href="/orders" />}
            aria-label={t("backAria")}
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" />
          </Button>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("addTitle")}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {t("addDescription")}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer */}
        <Card className="shadow-none">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg border bg-muted/50">
                <ClipboardList className="size-4 text-muted-foreground" />
              </div>

              <div>
                <CardTitle className="text-base">
                  {t("customerInformation")}
                </CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  {t("customerInformationDescription")}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="customer">{t("customerName")}</FieldLabel>

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
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">{t("products")}</CardTitle>

            <p className="text-sm text-muted-foreground">
              {t("productsDescription")}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {lines.map(({ row, product }, index) => (
              <div key={row.id} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {t("productNumber", { number: index + 1 })}
                  </span>

                  {rows.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(row.id)}
                      aria-label={t("productNumber", { number: index + 1 })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>

                <FieldGroup>
                  <div className="grid gap-5 sm:grid-cols-3">
                    <Field className="sm:col-span-3">
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
                          aria-invalid={!!rowErrors[row.id]}
                        >
                          <SelectValue placeholder={t("selectProduct")}>
                            {product
                              ? `${product.name} — ${formatCurrency(
                                  product.price,
                                  locale,
                                )}`
                              : undefined}
                          </SelectValue>
                        </SelectTrigger>

                        <SelectContent>
                          {products.map((item) => (
                            <SelectItem
                              key={item._id}
                              value={item._id}
                              disabled={item.stock === 0}
                            >
                              {item.name} — {formatCurrency(item.price, locale)}
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
                    </Field>

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

                    <Field className="sm:col-span-2">
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

                  {rowErrors[row.id] && (
                    <p className="text-sm text-destructive">
                      {rowErrors[row.id]}
                    </p>
                  )}
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
        <Card className="shadow-none">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg border bg-muted/50">
                <Truck className="size-4 text-muted-foreground" />
              </div>

              <div>
                <CardTitle className="text-base">{t("delivery")}</CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  {t("deliveryDescription")}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <FieldGroup>
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
                    <FieldDescription>{t("deliveryChargedHint")}</FieldDescription>
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
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="shadow-none">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg border bg-muted/50">
                <Calculator className="size-4 text-muted-foreground" />
              </div>

              <div>
                <CardTitle className="text-base">{t("summary")}</CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  {t("summaryDescription")}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {validLines.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("selectForSummary")}
                </p>
              ) : (
                validLines.map((line) => (
                  <div
                    key={line.row.id}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-sm text-muted-foreground">
                      {line.product?.name} × {formatNumber(line.quantity, locale)}
                    </span>

                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(
                        line.quantity * line.unitPrice,
                        locale,
                      )}
                    </span>
                  </div>
                ))
              )}

              <div className="flex items-center justify-between gap-4 border-t pt-4">
                <span className="text-sm text-muted-foreground">
                  {t("deliveryCustomerPays")}
                </span>

                <span className="text-sm font-medium tabular-nums">
                  {formatCurrency(deliveryChargedNumber, locale)}
                </span>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">{t("total")}</span>

                  <span className="text-2xl font-semibold tracking-tight tabular-nums">
                    {formatCurrency(total, locale)}
                  </span>
                </div>

                {validLines.length > 0 && (
                  <>
                    <div className="mt-2 flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">
                        {t("deliveryCostRow")}
                      </span>

                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(deliveryCostNumber, locale)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">
                        {t("estimatedProfit")}
                      </span>

                      <span
                        className={
                          estimatedProfit < 0
                            ? "text-sm font-medium text-destructive tabular-nums"
                            : "text-sm font-medium text-success tabular-nums"
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

        {createOrderMutation.isError && (
          <p className="text-sm text-destructive" role="alert">
            {apiErrorMessage(createOrderMutation.error, te, te("createOrder"))}
          </p>
        )}

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
