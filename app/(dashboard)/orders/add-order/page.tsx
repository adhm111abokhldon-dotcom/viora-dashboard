"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Calculator, ClipboardList, Save } from "lucide-react";
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

import { createOrder, getProducts, type OrderStatus } from "@/lib/api";
import { useRouter } from "next/navigation";
import AddProductLoading from "@/components/AddProductLoading";

type FormErrors = {
  customer?: string;
  phone?: string;
  product?: string;
  quantity?: string;
  price?: string;
  status?: string;
};

export default function NewOrderPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<OrderStatus>("Pending");
  const [errors, setErrors] = useState<FormErrors>({});

  const { data, isLoading } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => getProducts(1, 100),
  });

  const products = data?.products ?? [];

  const selectedProduct = products.find((product) => product._id === productId);

  const quantityNumber = Number(quantity);
  const priceNumber = Number(price);

  const total =
    quantityNumber > 0 && priceNumber > 0 ? quantityNumber * priceNumber : 0;

  const estimatedProfit =
    selectedProduct && quantityNumber > 0 && priceNumber > 0
      ? (priceNumber - selectedProduct.cost) * quantityNumber
      : 0;

  const createOrderMutation = useMutation({
    mutationFn: createOrder,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });

      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
      router.push("/orders");
    },
  });
  if (isLoading) return <AddProductLoading />;

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

  function handleProductChange(value: string) {
    setProductId(value);

    const product = products.find((product) => product._id === value);

    setPrice(product ? String(product.price) : "");

    clearError("product");
    clearError("price");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!customer.trim()) {
      nextErrors.customer = "Customer name is required.";
    }

    if (!phone.trim()) {
      nextErrors.phone = "Customer phone number is required.";
    }

    if (!productId) {
      nextErrors.product = "Please select a product.";
    }

    if (!quantity || quantityNumber <= 0 || !Number.isInteger(quantityNumber)) {
      nextErrors.quantity = "Quantity must be a positive whole number.";
    }

    if (!price || priceNumber <= 0) {
      nextErrors.price = "Price must be greater than 0.";
    }

    if (selectedProduct && quantityNumber > selectedProduct.stock) {
      nextErrors.quantity = `Only ${selectedProduct.stock} units are available.`;
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    createOrderMutation.mutate({
      customer: customer.trim(),
      phone: phone.trim(),
      productId,
      quantity: quantityNumber,
      price: priceNumber,
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
            aria-label="Back to orders"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              New Order
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Create a new customer order.
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
                  Customer Information
                </CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the customer&apos;s contact details.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="customer">Customer Name</FieldLabel>

                  <Input
                    id="customer"
                    value={customer}
                    onChange={bindInput("customer", setCustomer)}
                    placeholder="e.g. Ahmad Khalil"
                    aria-invalid={!!errors.customer}
                  />

                  {errors.customer ? (
                    <p className="text-sm text-destructive">
                      {errors.customer}
                    </p>
                  ) : (
                    <FieldDescription>
                      Enter the customer&apos;s full name.
                    </FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone">Phone Number</FieldLabel>

                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={bindInput("phone", setPhone)}
                    placeholder="e.g. 03 123 456"
                    aria-invalid={!!errors.phone}
                  />

                  {errors.phone ? (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  ) : (
                    <FieldDescription>
                      Customer phone number for delivery.
                    </FieldDescription>
                  )}
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Order Details</CardTitle>

            <p className="text-sm text-muted-foreground">
              Select the product and specify the order quantity.
            </p>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="product">Product</FieldLabel>

                  <Select
                    value={productId}
                    onValueChange={(value) => handleProductChange(value ?? "")}
                  >
                    <SelectTrigger id="product" aria-invalid={!!errors.product}>
                      {/* بدون children هون كانت عم تعرض الـ id الخام؛
                          هلق عم نعطيها النص الجاهز يلي بدنا نعرضه */}
                      <SelectValue placeholder="Select a product">
                        {selectedProduct
                          ? `${selectedProduct.name} — $${selectedProduct.price}`
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>

                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem
                          key={product._id}
                          value={product._id}
                          disabled={product.stock === 0}
                        >
                          {product.name} — ${product.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {errors.product ? (
                    <p className="text-sm text-destructive">{errors.product}</p>
                  ) : selectedProduct ? (
                    <FieldDescription>
                      Available stock: {selectedProduct.stock}
                    </FieldDescription>
                  ) : (
                    <FieldDescription>
                      Select the product being ordered.
                    </FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="quantity">Quantity</FieldLabel>

                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={bindInput("quantity", setQuantity)}
                    aria-invalid={!!errors.quantity}
                  />

                  {errors.quantity ? (
                    <p className="text-sm text-destructive">
                      {errors.quantity}
                    </p>
                  ) : selectedProduct ? (
                    <FieldDescription>
                      Maximum available: {selectedProduct.stock}
                    </FieldDescription>
                  ) : (
                    <FieldDescription>
                      Number of units ordered.
                    </FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="price">Selling Price</FieldLabel>

                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={bindInput("price", setPrice)}
                    aria-invalid={!!errors.price}
                  />

                  {errors.price ? (
                    <p className="text-sm text-destructive">{errors.price}</p>
                  ) : (
                    <FieldDescription>
                      Price per unit. You can adjust it for special orders.
                    </FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="status">Order Status</FieldLabel>

                  <Select
                    value={status}
                    onValueChange={(value) =>
                      setStatus((value ?? "Pending") as OrderStatus)
                    }
                  >
                    <SelectTrigger id="status" aria-invalid={!!errors.status}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>

                    <SelectContent>
                      {/* Cancelled متشالة: ما في منطق تنشئ طلب "ملغى" من الأساس */}
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>

                  {errors.status ? (
                    <p className="text-sm text-destructive">{errors.status}</p>
                  ) : (
                    <FieldDescription>
                      Current status of this order.
                    </FieldDescription>
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
                <CardTitle className="text-base">Order Summary</CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Review the calculated order values.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Product</span>

                <span className="text-sm font-medium">
                  {selectedProduct?.name ?? "—"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Quantity</span>

                <span className="text-sm font-medium tabular-nums">
                  {quantityNumber > 0 ? quantityNumber : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Unit Price
                </span>

                <span className="text-sm font-medium tabular-nums">
                  {priceNumber > 0 ? `$${priceNumber.toFixed(2)}` : "—"}
                </span>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">Total</span>

                  <span className="text-2xl font-semibold tracking-tight tabular-nums">
                    ${total.toFixed(2)}
                  </span>
                </div>

                {selectedProduct && quantityNumber > 0 && priceNumber > 0 && (
                  <div className="mt-2 flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">
                      Estimated Profit
                    </span>

                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                      ${estimatedProfit.toFixed(2)}
                    </span>
                  </div>
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
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={createOrderMutation.isPending}
            className="w-full sm:w-auto"
          >
            <Save className="size-4" />
            {createOrderMutation.isPending ? "Creating..." : "Create Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}
