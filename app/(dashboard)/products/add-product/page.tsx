"use client";

import Link from "next/link";
import { SetStateAction, useMemo, useState } from "react";
import { ArrowLeft, Package, Save } from "lucide-react";

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

type FormErrors = {
  name?: string;
  category?: string;
  price?: string;
  cost?: string;
  stock?: string;
};

export default function AddProductPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string | null>("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});

  const margin = useMemo(() => {
    const sellingPrice = Number(price);
    const productCost = Number(cost);

    if (!price || !cost || sellingPrice <= 0 || productCost < 0) {
      return null;
    }

    return sellingPrice - productCost;
  }, [price, cost]);

  const marginPercentage = useMemo(() => {
    const sellingPrice = Number(price);

    if (margin === null || sellingPrice <= 0) {
      return null;
    }

    return (margin / sellingPrice) * 100;
  }, [price, margin]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    const sellingPrice = Number(price);
    const productCost = Number(cost);
    const stockQuantity = Number(stock);

    if (!name.trim()) {
      nextErrors.name = "Product name is required.";
    }

    if (!category) {
      nextErrors.category = "Please select a category.";
    }

    if (price === "" || sellingPrice <= 0) {
      nextErrors.price = "Selling price must be greater than 0.";
    }

    if (cost === "" || productCost < 0) {
      nextErrors.cost = "Product cost cannot be negative.";
    }

    if (stock === "" || stockQuantity < 0) {
      nextErrors.stock = "Stock cannot be negative.";
    }

    if (
      price !== "" &&
      cost !== "" &&
      sellingPrice > 0 &&
      productCost >= sellingPrice
    ) {
      nextErrors.cost = "Product cost should be lower than the selling price.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const productData = {
      name: name.trim(),
      category,
      price: sellingPrice,
      cost: productCost,
      stock: stockQuantity,
      margin: sellingPrice - productCost,
      marginPercentage: ((sellingPrice - productCost) / sellingPrice) * 100,
    };

    console.log("Product:", productData);
  }

  function clearError(field: keyof FormErrors) {
    if (!errors[field]) {
      return;
    }

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            className="mt-0.5 shrink-0"
            render={<Link href="/products" />}
            aria-label="Back to products"
          >
            <ArrowLeft className="size-4" />
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
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="shadow-none">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg border bg-muted/50">
                <Package className="size-4 text-muted-foreground" />
              </div>

              <div>
                <CardTitle className="text-base">Basic Information</CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Basic details about your product.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              {/* Product Name */}
              <Field>
                <FieldLabel htmlFor="name">Product Name</FieldLabel>

                <Input
                  id="name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    clearError("name");
                  }}
                  placeholder="e.g. LED Bear"
                  aria-invalid={!!errors.name}
                />

                {errors.name ? (
                  <p className="text-sm text-destructive">{errors.name}</p>
                ) : (
                  <FieldDescription>
                    Use a short and recognizable product name.
                  </FieldDescription>
                )}
              </Field>

              {/* Category */}
              <Field>
                <FieldLabel htmlFor="category">Category</FieldLabel>

                <Select
                  value={category}
                  onValueChange={(value) => {
                    setCategory(value);
                    clearError("category");
                  }}
                >
                  <SelectTrigger id="category" aria-invalid={!!errors.category}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="beauty">Beauty</SelectItem>

                    <SelectItem value="gifts">Gifts</SelectItem>

                    <SelectItem value="accessories">Accessories</SelectItem>

                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                {errors.category ? (
                  <p className="text-sm text-destructive">{errors.category}</p>
                ) : (
                  <FieldDescription>
                    Choose the category that best matches this product.
                  </FieldDescription>
                )}
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Pricing & Inventory */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Pricing & Inventory</CardTitle>

            <p className="text-sm text-muted-foreground">
              Set your product pricing and available stock.
            </p>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Selling Price */}
                <Field>
                  <FieldLabel htmlFor="price">Selling Price</FieldLabel>

                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(event) => {
                      setPrice(event.target.value);
                      clearError("price");
                    }}
                    placeholder="21.00"
                    aria-invalid={!!errors.price}
                  />

                  {errors.price ? (
                    <p className="text-sm text-destructive">{errors.price}</p>
                  ) : (
                    <FieldDescription>
                      The price customers will pay.
                    </FieldDescription>
                  )}
                </Field>

                {/* Product Cost */}
                <Field>
                  <FieldLabel htmlFor="cost">Product Cost</FieldLabel>

                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={cost}
                    onChange={(event) => {
                      setCost(event.target.value);
                      clearError("cost");
                    }}
                    placeholder="6.00"
                    aria-invalid={!!errors.cost}
                  />

                  {errors.cost ? (
                    <p className="text-sm text-destructive">{errors.cost}</p>
                  ) : (
                    <FieldDescription>
                      Your cost for purchasing or producing the product.
                    </FieldDescription>
                  )}
                </Field>

                {/* Stock */}
                <Field>
                  <FieldLabel htmlFor="stock">Stock Quantity</FieldLabel>

                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={stock}
                    onChange={(event) => {
                      setStock(event.target.value);
                      clearError("stock");
                    }}
                    placeholder="50"
                    aria-invalid={!!errors.stock}
                  />

                  {errors.stock ? (
                    <p className="text-sm text-destructive">{errors.stock}</p>
                  ) : (
                    <FieldDescription>
                      Number of units currently available.
                    </FieldDescription>
                  )}
                </Field>
              </div>

              {/* Margin Preview */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Estimated Margin</p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Calculated from selling price minus product cost.
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    {margin !== null ? (
                      <>
                        <p className="text-2xl font-semibold tracking-tight tabular-nums">
                          ${margin.toFixed(2)}
                        </p>

                        {marginPercentage !== null && (
                          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                            {marginPercentage.toFixed(1)}% margin
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Enter pricing
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </FieldGroup>
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
