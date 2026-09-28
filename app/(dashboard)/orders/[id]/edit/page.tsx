"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
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
  CreateOrderData,
  getOrderById,
  getProducts,
  updateOrder,
} from "@/lib/api";

type FormErrors = {
  customer?: string;
  phone?: string;
  productId?: string;
  quantity?: string;
  price?: string;
};

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const orderId = params.id as string;

  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

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

  useEffect(() => {
    if (!order) return;

    setCustomer(order.customer);
    setPhone(order.phone);
    setProductId(order.productId);
    setQuantity(String(order.quantity));
    setPrice(String(order.price));
  }, [order]);

  const selectedProduct = products.find((product) => product._id === productId);

  const quantityNumber = Number(quantity) || 0;
  const priceNumber = Number(price) || 0;

  const total = priceNumber * quantityNumber;

  const profit = selectedProduct
    ? (priceNumber - selectedProduct.cost) * quantityNumber
    : 0;

  const updateOrderMutation = useMutation({
    mutationFn: (data: CreateOrderData) => updateOrder(orderId, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });

      queryClient.invalidateQueries({
        queryKey: ["order", orderId],
      });

      queryClient.invalidateQueries({
        queryKey: ["products"],
      });

      router.push("/orders");
    },
  });

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!customer.trim()) {
      newErrors.customer = "Customer name is required";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!productId) {
      newErrors.productId = "Product is required";
    }

    if (!Number.isInteger(quantityNumber) || quantityNumber <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    if (priceNumber <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) return;

    updateOrderMutation.mutate({
      customer: customer.trim(),
      phone: phone.trim(),
      productId,
      quantity: quantityNumber,
      price: priceNumber,
    });
  }

  if (isOrderLoading || isProductsLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading order...</p>
      </div>
    );
  }

  if (isOrderError || !order) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Order not found</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            The order could not be loaded.
          </p>

          <Button className="mt-4" onClick={() => router.push("/orders")}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            variant="ghost"
            className="mb-2 -ml-2"
            onClick={() => router.push("/orders")}
          >
            <ArrowLeft className="size-4" />
            Back to Orders
          </Button>

          <h1 className="text-2xl font-semibold tracking-tight">Edit Order</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Update order information and product details.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="customer" className="text-sm font-medium">
                  Customer Name
                </label>

                <Input
                  id="customer"
                  value={customer}
                  onChange={(event) => setCustomer(event.target.value)}
                  placeholder="Enter customer name"
                />

                {errors.customer && (
                  <p className="text-xs text-destructive">{errors.customer}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </label>

                <Input
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Enter phone number"
                />

                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Product</label>

                <Select
                  value={productId}
                  onValueChange={(value) => setProductId(value ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product">
                      {(value: string) =>
                        products.find((product) => product._id === value)?.name
                      }
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem
                        key={product._id}
                        value={product._id}
                        disabled={
                          product.stock === 0 && product._id !== order.productId
                        }
                      >
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {errors.productId && (
                  <p className="text-xs text-destructive">{errors.productId}</p>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="quantity" className="text-sm font-medium">
                    Quantity
                  </label>

                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />

                  {errors.quantity && (
                    <p className="text-xs text-destructive">
                      {errors.quantity}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="price" className="text-sm font-medium">
                    Price
                  </label>

                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                  />

                  {errors.price && (
                    <p className="text-xs text-destructive">{errors.price}</p>
                  )}
                </div>
              </div>

              {updateOrderMutation.isError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {updateOrderMutation.error instanceof Error
                    ? updateOrderMutation.error.message
                    : "Failed to update order"}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/orders")}
                  disabled={updateOrderMutation.isPending}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={updateOrderMutation.isPending}>
                  <Save className="size-4" />

                  {updateOrderMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>

                <span className="font-medium">{order.status}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Quantity</span>

                <span className="font-medium tabular-nums">
                  {quantityNumber}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Price</span>

                <span className="font-medium tabular-nums">
                  ${priceNumber.toFixed(2)}
                </span>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>

                  <span className="text-lg font-semibold tabular-nums">
                    ${total.toFixed(2)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Profit</span>

                  <span className="text-lg font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                    ${profit.toFixed(2)}
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
