"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  type CreateOrderData,
  getOrderById,
  getProducts,
  updateOrder,
} from "@/lib/api";
import { useRouter } from "@/i18n/navigation";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useAppToast } from "@/lib/toast";
import { useInvalidateAll } from "@/lib/queries";

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

  // نستخدمها فقط للحساب داخل الصفحة.
  // ما منرسلها للـ backend.
  unitCost: number;
};

export default function EditOrderPage() {
  const t = useTranslations("orders.edit");
  const tOrders = useTranslations("orders");
  const tf = useTranslations("orderForm");
  const tv = useTranslations("orderForm.validation");
  const tStatus = useTranslations("status");
  const tp = useTranslations("products");
  const tc = useTranslations("common");
  const locale = useLocale() as "en" | "ar";

  const params = useParams();
  const router = useRouter();
  const invalidateAll = useInvalidateAll();
  const toast = useAppToast();

  const orderId = params.id as string;

  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");

  const [rows, setRows] = useState<Row[]>([]);

  const [deliveryCharged, setDeliveryCharged] = useState("0");

  const [deliveryCost, setDeliveryCost] = useState("0");

  const [errors, setErrors] = useState<FormErrors>({});

  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});

  const nextRowId = useRef(1);

  const {
    data: order,
    isLoading: isOrderLoading,
    isError: isOrderError,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrderById(orderId),
    enabled: Boolean(orderId),
  });

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ["products", "order-edit"],
    queryFn: () => getProducts(1, 100),
  });

  const products = productsData?.products ?? [];

  /*
   * Load existing order into the form.
   *
   * مهم:
   * unitCost مأخوذ من order.items وليس من Product.
   * لأن الربح التاريخي لازم يعتمد على كلفة المنتج وقت الأوردر.
   */
  /* eslint-disable react-hooks/set-state-in-effect */
  /*
   * Load the fetched order into the local, editable form state.
   * Syncing server data into a form is a legitimate use of an effect,
   * so the set-state-in-effect rule is disabled for this block.
   */
  useEffect(() => {
    if (!order) return;

    setCustomer(order.customer);
    setPhone(order.phone);

    setRows(
      order.items.map((item) => ({
        id: nextRowId.current++,
        productId: item.productId,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
        unitCost: item.unitCost,
      })),
    );

    setDeliveryCharged(String(order.deliveryCharged));

    setDeliveryCost(String(order.deliveryCost));
  }, [order]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /*
   * --------------------------------------------------------------------------
   * Live calculations
   * --------------------------------------------------------------------------
   */

  const lines = rows.map((row) => ({
    row,
    product: products.find((product) => product._id === row.productId),
    quantity: Number(row.quantity),
    unitPrice: Number(row.unitPrice),
    unitCost: row.unitCost,
  }));

  const validLines = lines.filter(
    (line) => line.product && line.quantity > 0 && line.unitPrice > 0,
  );

  const itemsTotal = validLines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0,
  );

  const itemsCost = validLines.reduce(
    (sum, line) => sum + line.quantity * line.unitCost,
    0,
  );

  const deliveryChargedNumber = Number(deliveryCharged) || 0;

  const deliveryCostNumber = Number(deliveryCost) || 0;

  const total = itemsTotal + deliveryChargedNumber;

  const profit = total - itemsCost - deliveryCostNumber;

  /*
   * --------------------------------------------------------------------------
   * Mutation
   * --------------------------------------------------------------------------
   */

  const updateOrderMutation = useMutation({
    mutationFn: (data: CreateOrderData) => updateOrder(orderId, data),

    onSuccess: async () => {
      toast.success("orderUpdated");

      await invalidateAll();

      router.push("/orders");
    },

    onError: (error) => {
      toast.error(error, "updateOrder");
    },
  });

  /*
   * --------------------------------------------------------------------------
   * Helpers
   * --------------------------------------------------------------------------
   */

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

  function handleProductChange(id: number, productId: string) {
    const product = products.find((item) => item._id === productId);
    const currentRow = rows.find((row) => row.id === id);

    updateRow(id, {
      productId,
      unitPrice: product ? String(product.price) : "",
      unitCost:
        currentRow?.productId === productId
          ? currentRow.unitCost
          : (product?.cost ?? 0),
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
        unitCost: 0,
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

  /*
   * --------------------------------------------------------------------------
   * Validation
   * --------------------------------------------------------------------------
   */

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    const nextRowErrors: Record<number, string> = {};

    if (!customer.trim()) {
      nextErrors.customer = tv("customerRequired");
    }

    if (!phone.trim()) {
      nextErrors.phone = tv("phoneRequiredShort");
    }

    if (deliveryChargedNumber < 0) {
      nextErrors.deliveryCharged = tv("mustBeZeroOrMore");
    }

    if (deliveryCostNumber < 0) {
      nextErrors.deliveryCost = tv("mustBeZeroOrMore");
    }

    if (rows.length === 0) {
      nextRowErrors[0] = tv("addAtLeastOne");
    }

    /*
     * نحسب الكمية المطلوبة لكل product.
     */
    const quantityByProduct = new Map<string, number>();

    for (const row of rows) {
      if (!row.productId) continue;

      const quantity = Number(row.quantity);

      quantityByProduct.set(
        row.productId,
        (quantityByProduct.get(row.productId) ?? 0) + quantity,
      );
    }

    /*
     * في Pending order:
     *
     * Product.stock حالياً لا يحتوي على الكمية
     * المحجوزة لهذا الأوردر.
     *
     * لذلك نضيف كمية الأوردر القديمة حتى نعرف
     * الكمية الحقيقية المتاحة للتعديل.
     *
     * مثال:
     * stock = 2
     * old order = 3
     *
     * المتاح فعلياً لهذا التعديل = 5
     */
    const oldQuantityByProduct = new Map<string, number>();

    if (order?.status === "Pending") {
      for (const item of order.items) {
        const productId = item.productId;

        oldQuantityByProduct.set(
          productId,
          (oldQuantityByProduct.get(productId) ?? 0) + item.quantity,
        );
      }
    }

    for (const line of lines) {
      const { row, product, quantity, unitPrice } = line;

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

      /*
       * Cancelled order:
       * مخزونه أصلاً رجع، لذلك نستخدم stock مباشرة.
       *
       * Pending order:
       * نضيف كمية الأوردر القديمة للمخزون المتاح.
       */
      const availableStock =
        order?.status === "Pending"
          ? product.stock + (oldQuantityByProduct.get(row.productId) ?? 0)
          : product.stock;

      const requestedQuantity = quantityByProduct.get(row.productId) ?? 0;

      if (requestedQuantity > availableStock) {
        nextRowErrors[row.id] = tv("onlyAvailable", {
          count: formatNumber(availableStock, locale),
          name: product.name,
        });
      }
    }

    setErrors(nextErrors);
    setRowErrors(nextRowErrors);

    return (
      Object.keys(nextErrors).length === 0 &&
      Object.keys(nextRowErrors).length === 0
    );
  }

  /*
   * --------------------------------------------------------------------------
   * Submit
   * --------------------------------------------------------------------------
   */

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) return;

    updateOrderMutation.mutate({
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

  /*
   * --------------------------------------------------------------------------
   * Loading / error
   * --------------------------------------------------------------------------
   */

  if (isOrderLoading || isProductsLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground">{tOrders("loading")}</p>
      </div>
    );
  }

  if (isOrderError || !order) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">{t("notFound")}</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {t("notFoundDescription")}
          </p>

          <Button className="mt-4" onClick={() => router.push("/orders")}>
            {t("backToOrders")}
          </Button>
        </div>
      </div>
    );
  }

  /*
   * Only pending orders are editable.
   * Delivered and cancelled orders are historical records, so a direct
   * visit to this URL must never render an editable form.
   *
   * The backend enforces the same rule in PUT /api/orders/:id.
   */
  if (order.status !== "Pending") {
    const statusLabel = {
      Pending: tStatus("pending"),
      Delivered: tStatus("delivered"),
      Cancelled: tStatus("cancelled"),
    }[order.status];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex min-h-[400px] items-center justify-center"
      >
        <div className="max-w-md text-center">
          <h2 className="text-xl font-semibold">
            {t("cannotEditTitle", { status: statusLabel })}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {t("cannotEditDescription", { status: statusLabel })}
          </p>

          <Button
            className="mt-5"
            variant="outline"
            onClick={() => router.push("/orders")}
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" />
            {t("backToOrders")}
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            variant="ghost"
            className="mb-2 -ms-2"
            onClick={() => router.push("/orders")}
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" />
            {t("backToOrders")}
          </Button>

          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main */}
          <div className="space-y-6">
            {/* Customer */}
            <Card>
              <CardHeader>
                <CardTitle>{t("orderInformation")}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="customer" className="text-sm font-medium">
                    {tf("customerName")}
                  </label>

                  <Input
                    id="customer"
                    value={customer}
                    onChange={(event) => setCustomer(event.target.value)}
                    placeholder={tf("customerNamePlaceholder")}
                  />

                  {errors.customer && (
                    <p className="text-xs text-destructive">
                      {errors.customer}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    {tf("phone")}
                  </label>

                  <Input
                    id="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder={tf("phonePlaceholder")}
                  />

                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Products */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{tf("products")}</CardTitle>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("productsDescription")}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRow}
                  >
                    <Plus className="size-4" />
                    {tf("add")}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {rows.map((row, index) => {
                  const product = products.find(
                    (item) => item._id === row.productId,
                  );

                  return (
                    <div key={row.id} className="rounded-lg border p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {tf("productNumber", { number: index + 1 })}
                        </span>

                        {rows.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRow(row.id)}
                            aria-label={tf("productNumber", {
                              number: index + 1,
                            })}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            {tf("product")}
                          </label>

                          <Select
                            value={row.productId}
                            onValueChange={(value) =>
                              handleProductChange(row.id, value ?? "")
                            }
                          >
                            <SelectTrigger aria-invalid={!!rowErrors[row.id]}>
                              <SelectValue
                                placeholder={tf("selectProduct")}
                              >
                                {product?.name}
                              </SelectValue>
                            </SelectTrigger>

                            <SelectContent>
                              {products.map((item) => {
                                /*
                                 * Pending order may have stock = 0
                                 * because this order itself owns
                                 * the reserved stock.
                                 *
                                 * لذلك المنتج الحالي يبقى selectable.
                                 */
                                const isCurrentProduct =
                                  item._id === row.productId;

                                const hasOldQuantity =
                                  order.status === "Pending" &&
                                  order.items.some(
                                    (orderItem) =>
                                      orderItem.productId === item._id,
                                  );

                                const disabled =
                                  item.stock === 0 &&
                                  !isCurrentProduct &&
                                  !hasOldQuantity;

                                return (
                                  <SelectItem
                                    key={item._id}
                                    value={item._id}
                                    disabled={disabled}
                                  >
                                    {item.name} — {formatCurrency(item.price, locale)}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>

                          {product && (
                            <p className="text-xs text-muted-foreground">
                              {t("currentStock", {
                                count: formatNumber(product.stock, locale),
                              })}
                            </p>
                          )}

                          {rowErrors[row.id] && (
                            <p className="text-xs text-destructive">
                              {rowErrors[row.id]}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label
                              htmlFor={`quantity-${row.id}`}
                              className="text-sm font-medium"
                            >
                              {tf("quantity")}
                            </label>

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
                            />
                          </div>

                          <div className="space-y-2">
                            <label
                              htmlFor={`unit-price-${row.id}`}
                              className="text-sm font-medium"
                            >
                              {tf("sellingPrice")}
                            </label>

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
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {rows.length === 0 && (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      {t("noProducts")}
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3"
                      onClick={addRow}
                    >
                      <Plus className="size-4" />
                      {tp("add")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery */}
            <Card>
              <CardHeader>
                <CardTitle>{tf("delivery")}</CardTitle>

                <p className="text-sm text-muted-foreground">
                  {tf("deliveryDescription")}
                </p>
              </CardHeader>

              <CardContent>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="deliveryCharged"
                      className="text-sm font-medium"
                    >
                      {t("deliveryCharged")}
                    </label>

                    <Input
                      id="deliveryCharged"
                      type="number"
                      min="0"
                      step="0.01"
                      value={deliveryCharged}
                      onChange={(event) =>
                        setDeliveryCharged(event.target.value)
                      }
                    />

                    {errors.deliveryCharged && (
                      <p className="text-xs text-destructive">
                        {errors.deliveryCharged}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {t("deliveryChargedHint")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="deliveryCost"
                      className="text-sm font-medium"
                    >
                      {t("deliveryCost")}
                    </label>

                    <Input
                      id="deliveryCost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={deliveryCost}
                      onChange={(event) => setDeliveryCost(event.target.value)}
                    />

                    {errors.deliveryCost && (
                      <p className="text-xs text-destructive">
                        {errors.deliveryCost}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {t("deliveryCostHint")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/orders")}
                disabled={updateOrderMutation.isPending}
              >
                {tf("cancel")}
              </Button>

              <Button type="submit" disabled={updateOrderMutation.isPending}>
                <Save className="size-4" />

                {updateOrderMutation.isPending
                  ? tc("saving")
                  : tf("saveChanges")}
              </Button>
            </div>
          </div>

          {/* Summary */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>{tf("summary")}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("status")}</span>

                <span className="font-medium">
                  {
                    {
                      Pending: tStatus("pending"),
                      Delivered: tStatus("delivered"),
                      Cancelled: tStatus("cancelled"),
                    }[order.status]
                  }
                </span>
              </div>

              {validLines.map((line) => (
                <div key={line.row.id} className="space-y-2 border-t pt-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {line.product?.name}
                    </span>

                    <span className="font-medium tabular-nums">
                      × {formatNumber(line.quantity, locale)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("unitPrice")}
                    </span>

                    <span className="font-medium tabular-nums">
                      {formatCurrency(line.unitPrice, locale)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("subtotal")}
                    </span>

                    <span className="font-medium tabular-nums">
                      {formatCurrency(line.quantity * line.unitPrice, locale)}
                    </span>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("deliveryCharged")}
                  </span>

                  <span className="font-medium tabular-nums">
                    {formatCurrency(deliveryChargedNumber, locale)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("deliveryCost")}
                  </span>

                  <span className="font-medium tabular-nums">
                    {formatCurrency(deliveryCostNumber, locale)}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{tf("total")}</span>

                  <span className="text-xl font-semibold tabular-nums">
                    {formatCurrency(total, locale)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("profit")}
                  </span>

                  <span
                    className={
                      profit < 0
                        ? "text-lg font-semibold text-destructive tabular-nums"
                        : "text-lg font-semibold text-success tabular-nums"
                    }
                  >
                    {formatCurrency(profit, locale)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </motion.div>
  );
}
