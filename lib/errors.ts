/*
 * Maps the static, English error messages thrown by the API layer to their
 * localized equivalents. Anything else (dynamic messages coming from the
 * backend) is passed through untouched so API contracts stay intact.
 *
 * `te` is a translator bound to the "errors" namespace.
 */
const API_ERROR_KEYS: Record<string, string> = {
  "Failed to fetch products": "fetchProducts",
  "Failed to create product": "createProduct",
  "Failed to delete product": "deleteProduct",
  "Failed to fetch product": "fetchProduct",
  "Failed to update product": "updateProduct",
  "Failed to fetch orders": "fetchOrders",
  "Failed to fetch order": "fetchOrder",
  "Failed to create order": "createOrder",
  "Failed to delete order": "deleteOrder",
  "Failed to update order status": "updateOrderStatus",
  "Failed to update order": "updateOrder",
  "Failed to fetch reports": "fetchReports",
  "Failed to fetch dashboard": "fetchDashboard",
};

export function apiErrorMessage(
  error: unknown,
  te: (key: string) => string,
  fallback: string,
): string {
  if (!(error instanceof Error) || !error.message) {
    return fallback;
  }

  const key = API_ERROR_KEYS[error.message];

  return key ? te(key) : error.message;
}
