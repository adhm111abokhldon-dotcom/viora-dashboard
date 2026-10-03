import type { Order } from "@/lib/api";

export function shortId(id: string) {
  return id.slice(-6);
}

type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export function summarizeItems(
  order: Pick<Order, "items">,
  t: Translator = () => "",
) {
  const [first, ...rest] = order.items;

  const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const label = !first
    ? "—"
    : rest.length > 0
      ? t("itemsMore", { name: first.name, count: rest.length })
      : first.name;

  return { label, quantity };
}
