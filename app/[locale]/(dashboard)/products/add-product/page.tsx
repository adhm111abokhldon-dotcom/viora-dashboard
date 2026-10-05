"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Package, Save, X } from "lucide-react";

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
import { uploadProductImage } from "@/lib/cloudinary";
import { formatCurrency, formatPercent } from "@/lib/format";
import { isKnownCategory } from "@/lib/categories";
import { useAppToast } from "@/lib/toast";
import { useInvalidateAll } from "@/lib/queries";
import AddProductLoading from "@/components/AddProductLoading";
import Image from "next/image";

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
  const locale = useLocale() as "en" | "ar";

  const categoryLabel = (value: string) =>
    isKnownCategory(value) ? t(`categories.${value}`) : value;

  const invalidateAll = useInvalidateAll();
  const toast = useAppToast();
  const router = useRouter();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const createProductMutation = useMutation({
    mutationFn: async () => {
      let imageUrl: string | undefined;

      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }

      return createProduct({
        name: name.trim(),
        category,
        price: sellingPrice,
        cost: productCost,
        stock: Number(stock),
        imageUrl,
      });
    },

    onSuccess: async () => {
      toast.success("productCreated");

      setName("");
      setCategory("");
      setPrice("");
      setCost("");
      setStock("");
      setImageFile(null);
      setImagePreview(null);

      await invalidateAll();

      router.push("/products");
    },

    onError: (error) => {
      toast.error(error, "createProduct");
    },
  });

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      event.target.value = "";
      return;
    }

    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(null);
    setImagePreview(null);
  }

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

    createProductMutation.mutate();
  }

  if (createProductMutation.isPending) {
    return <AddProductLoading />;
  }

  return (
    <div className="mx-auto w-full max-w-400 space-y-7 overflow-x-hidden">
      {/* Header */}
      <div className="space-y-4">
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
          <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            {t("addTitle")}
          </h1>

          <p className="mt-1.5 text-sm text-text-muted">
            {t("addDescription")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="overflow-hidden rounded-lg border border-border bg-card shadow-none">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Package className="size-4" />
              </div>

              <div className="min-w-0">
                <CardTitle className="text-base font-semibold text-text">
                  {t("basicInformation")}
                </CardTitle>

                <p className="mt-1 text-sm text-text-muted">
                  {t("basicInformationDescription")}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-5 p-5 sm:grid-cols-2">
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

            {/* Product Image */}
            <div className="space-y-2">
              <Label htmlFor="product-image">Product Image</Label>

              {imagePreview ? (
                <div className="relative size-32 overflow-hidden rounded-md border border-border bg-surface">
                  <Image
                    src={imagePreview}
                    alt={name || "Product preview"}
                    width={128}
                    height={128}
                    className="h-full w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute inset-e-2 top-2 flex size-7 items-center justify-center rounded-md border border-border bg-card text-text transition-colors hover:bg-surface-raised"
                    aria-label="Remove image"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="product-image"
                  className="flex size-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface text-text-muted transition-colors hover:bg-surface-raised"
                >
                  <ImagePlus className="size-6" />

                  <span className="text-xs font-medium">Upload image</span>
                </label>
              )}

              <input
                id="product-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="sr-only"
              />

              {imagePreview && (
                <label
                  htmlFor="product-image"
                  className="block w-fit cursor-pointer text-xs font-medium text-text-muted hover:text-text"
                >
                  Change image
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Inventory */}
        <Card className="overflow-hidden rounded-lg border border-border bg-card shadow-none">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-semibold text-text">
              {t("pricingInventory")}
            </CardTitle>

            <p className="text-sm text-text-muted">
              {t("pricingInventoryDescription")}
            </p>
          </CardHeader>

          <CardContent className="grid gap-5 p-5 sm:grid-cols-3">
            {/* Selling Price */}
            <div className="space-y-2">
              <Label htmlFor="price">{t("sellingPrice")}</Label>

              <div className="relative">
                <span className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
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
                <span className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
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
        <Card className="overflow-hidden rounded-lg border border-border border-s-4 border-s-success bg-card shadow-none">
          <CardContent className="p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text">
                  {t("estimatedMargin")}
                </p>

                <p className="mt-1 text-sm text-text-muted">
                  {t("marginDescription")}
                </p>
              </div>

              <div className="shrink-0 sm:text-end">
                <p
                  className={`text-2xl font-bold tracking-tight tabular-nums ${
                    margin > 0
                      ? "text-success"
                      : margin < 0
                        ? "text-destructive"
                        : "text-text"
                  }`}
                >
                  {formatCurrency(margin, locale)}
                </p>

                <p className="mt-1 text-sm text-text-muted tabular-nums">
                  {t("marginPercent", {
                    value: formatPercent(marginPercentage, locale),
                  })}
                </p>
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

            {createProductMutation.isPending ? tc("saving") : t("saveProduct")}
          </Button>
        </div>
      </form>
    </div>
  );
}
