"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, Package, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormErrors = {
  name?: string;
  category?: string;
  price?: string;
  cost?: string;
  stock?: string;
};

export default function AddProductPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});

  const sellingPrice = Number(price) || 0;
  const productCost = Number(cost) || 0;

  const margin = useMemo(() => {
    return sellingPrice - productCost;
  }, [sellingPrice, productCost]);

  const marginPercentage = useMemo(() => {
    if (sellingPrice <= 0) return 0;

    return (margin / sellingPrice) * 100;
  }, [margin, sellingPrice]);

  function validate() {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = "Product name is required.";
    }

    if (!category) {
      newErrors.category = "Please select a category.";
    }

    if (!price) {
      newErrors.price = "Selling price is required.";
    } else if (sellingPrice <= 0) {
      newErrors.price = "Selling price must be greater than 0.";
    }

    if (!cost) {
      newErrors.cost = "Product cost is required.";
    } else if (productCost < 0) {
      newErrors.cost = "Product cost cannot be negative.";
    } else if (productCost >= sellingPrice && sellingPrice > 0) {
      newErrors.cost = "Cost must be lower than the selling price.";
    }

    if (!stock) {
      newErrors.stock = "Stock quantity is required.";
    } else if (Number(stock) < 0) {
      newErrors.stock = "Stock cannot be negative.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) return;

    const productData = {
      name: name.trim(),
      category,
      price: sellingPrice,
      cost: productCost,
      stock: Number(stock),
      margin,
      marginPercentage,
    };

    console.log("Product:", productData);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/products" />}
          className="-ml-2 w-fit"
        >
          <ArrowLeft className="size-4" />
          Back to Products
        </Button>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Add Product
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Add a new product to your inventory.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="shadow-none">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md border bg-muted">
                <Package className="size-4 text-muted-foreground" />
              </div>

              <div>
                <CardTitle className="text-base">Basic Information</CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the basic details of your product.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-5 sm:grid-cols-2">
            {/* Product Name */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Product Name</Label>

              <Input
                id="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);

                  if (errors.name) {
                    setErrors((current) => ({
                      ...current,
                      name: undefined,
                    }));
                  }
                }}
                placeholder="e.g. LED Bear"
                aria-invalid={!!errors.name}
              />

              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>

              <Select
                value={category}
                onValueChange={(value) => {
                  setCategory(value ?? "");

                  if (errors.category) {
                    setErrors((current) => ({
                      ...current,
                      category: undefined,
                    }));
                  }
                }}
              >
                <SelectTrigger
                  id="category"
                  className="w-full"
                  aria-invalid={!!errors.category}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Beauty">Beauty</SelectItem>
                  <SelectItem value="Gifts">Gifts</SelectItem>
                  <SelectItem value="Accessories">Accessories</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              {errors.category && (
                <p className="text-xs text-destructive">{errors.category}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Inventory */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Pricing & Inventory</CardTitle>

            <p className="text-sm text-muted-foreground">
              Set the selling price, product cost, and available stock.
            </p>
          </CardHeader>

          <CardContent className="grid gap-5 sm:grid-cols-3">
            {/* Selling Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Selling Price</Label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>

                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) => {
                    setPrice(event.target.value);

                    if (errors.price) {
                      setErrors((current) => ({
                        ...current,
                        price: undefined,
                      }));
                    }
                  }}
                  placeholder="0.00"
                  className="pl-7"
                  aria-invalid={!!errors.price}
                />
              </div>

              {errors.price && (
                <p className="text-xs text-destructive">{errors.price}</p>
              )}
            </div>

            {/* Cost */}
            <div className="space-y-2">
              <Label htmlFor="cost">Product Cost</Label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>

                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={cost}
                  onChange={(event) => {
                    setCost(event.target.value);

                    if (errors.cost) {
                      setErrors((current) => ({
                        ...current,
                        cost: undefined,
                      }));
                    }
                  }}
                  placeholder="0.00"
                  className="pl-7"
                  aria-invalid={!!errors.cost}
                />
              </div>

              {errors.cost && (
                <p className="text-xs text-destructive">{errors.cost}</p>
              )}
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity</Label>

              <Input
                id="stock"
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(event) => {
                  setStock(event.target.value);

                  if (errors.stock) {
                    setErrors((current) => ({
                      ...current,
                      stock: undefined,
                    }));
                  }
                }}
                placeholder="0"
                aria-invalid={!!errors.stock}
              />

              {errors.stock && (
                <p className="text-xs text-destructive">{errors.stock}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Margin */}
        <Card className="shadow-none">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Estimated Margin</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Based on the selling price and product cost.
                </p>
              </div>

              <div className="sm:text-right">
                <p
                  className={`text-2xl font-semibold tracking-tight tabular-nums ${
                    margin > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : margin < 0
                        ? "text-destructive"
                        : "text-foreground"
                  }`}
                >
                  ${margin.toFixed(2)}
                </p>

                <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                  {marginPercentage.toFixed(1)}% margin
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
            render={<Link href="/products" />}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button type="submit" className="w-full sm:w-auto">
            <Save className="size-4" />
            Save Product
          </Button>
        </div>
      </form>
    </div>
  );
}
