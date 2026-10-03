"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { createProduct } from "@/lib/api";
import { useRouter } from "@/i18n/navigation";
import { formatCurrency, formatPercent } from "@/lib/format";
import { isKnownCategory } from "@/lib/categories";
import { apiErrorMessage } from "@/lib/errors";
import AddProductLoading from "@/components/AddProductLoading";

type FormErrors = {
  name?: string;
  category?: string;
  price?: string;
  cost?: string;
  stock?: string;
};

export default function AddProductPage() {
  const t = useTranslations("products");
  const tv = useTranslations("products.validation");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const locale = useLocale() as "en" | "ar";

  const categoryLabel = (value: string) =>
    isKnownCategory(value) ? t(`categories.${value}`) : value;

  const queryClient = useQueryClient();
  const router = useRouter();
  const createProductMutation = useMutation({
    mutationFn: createProduct,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
      setName("");
      setCategory("");
      setPrice("");
      setCost("");
      setStock("");
      router.push("/products");
    },
  });
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

  if (createProductMutation.isPending) return <AddProductLoading />;
  function validate() {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = tv("nameRequired");
    }

    if (!category) {
      newErrors.category = tv("categoryRequired");
    }

    if (!price) {
      newErrors.price = tv("priceRequired");
    } else if (sellingPrice <= 0) {
      newErrors.price = tv("pricePositive");
    }

    if (!cost) {
      newErrors.cost = tv("costRequired");
    } else if (productCost < 0) {
      newErrors.cost = tv("costNegative");
    } else if (productCost >= sellingPrice && sellingPrice > 0) {
      newErrors.cost = tv("costLowerThanPrice");
    }

    if (!stock) {
      newErrors.stock = tv("stockRequired");
    } else if (Number(stock) < 0) {
      newErrors.stock = tv("stockNegative");
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
    };

    createProductMutation.mutate(productData);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          render={<Link href="/products" />}
          className="-ms-2 w-fit"
        >
          <ArrowLeft className="size-4 rtl:-scale-x-100" />
          {t("backToProducts")}
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="shadow-none">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md border bg-muted">
                <Package className="size-4 text-muted-foreground" />
              </div>

              <div>
                <CardTitle className="text-base">
                  {t("basicInformation")}
                </CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  {t("basicInformationDescription")}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-5 sm:grid-cols-2">
            {/* Product Name */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">{t("name")}</Label>

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
                placeholder={t("namePlaceholder")}
                aria-invalid={!!errors.name}
              />

              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">{t("category")}</Label>

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
                  <SelectValue placeholder={t("selectCategory")} />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Beauty">
                    {categoryLabel("Beauty")}
                  </SelectItem>
                  <SelectItem value="Gifts">
                    {categoryLabel("Gifts")}
                  </SelectItem>
                  <SelectItem value="Accessories">
                    {categoryLabel("Accessories")}
                  </SelectItem>
                  <SelectItem value="Other">
                    {categoryLabel("Other")}
                  </SelectItem>
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
            <CardTitle className="text-base">{t("pricingInventory")}</CardTitle>

            <p className="text-sm text-muted-foreground">
              {t("pricingInventoryDescription")}
            </p>
          </CardHeader>

          <CardContent className="grid gap-5 sm:grid-cols-3">
            {/* Selling Price */}
            <div className="space-y-2">
              <Label htmlFor="price">{t("sellingPrice")}</Label>

              <div className="relative">
                <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
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
                  className="ps-7"
                  aria-invalid={!!errors.price}
                />
              </div>

              {errors.price && (
                <p className="text-xs text-destructive">{errors.price}</p>
              )}
            </div>

            {/* Cost */}
            <div className="space-y-2">
              <Label htmlFor="cost">{t("productCost")}</Label>

              <div className="relative">
                <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
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
                  className="ps-7"
                  aria-invalid={!!errors.cost}
                />
              </div>

              {errors.cost && (
                <p className="text-xs text-destructive">{errors.cost}</p>
              )}
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label htmlFor="stock">{t("stockQuantity")}</Label>

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
                <p className="text-sm font-medium">{t("estimatedMargin")}</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {t("marginDescription")}
                </p>
              </div>

              <div className="sm:text-end">
                <p
                  className={`text-2xl font-semibold tracking-tight tabular-nums ${
                    margin > 0
                      ? "text-success"
                      : margin < 0
                        ? "text-destructive"
                        : "text-foreground"
                  }`}
                >
                  {formatCurrency(margin, locale)}
                </p>

                <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                  {t("marginPercent", {
                    value: formatPercent(marginPercentage, locale),
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {createProductMutation.isError && (
          <p className="text-sm text-destructive" role="alert">
            {apiErrorMessage(createProductMutation.error, te, te("createProduct"))}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            nativeButton={false}
            type="button"
            variant="outline"
            render={<Link href="/products" />}
            className="w-full sm:w-auto"
          >
            {tc("cancel")}
          </Button>

          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={createProductMutation.isPending}
          >
            <Save className="size-4" />
            {createProductMutation.isPending
              ? tc("saving")
              : t("saveProduct")}
          </Button>
        </div>
      </form>
    </div>
  );
}
