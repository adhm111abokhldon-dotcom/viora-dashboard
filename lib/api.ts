export type Product = {
  _id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;

  /**
   * Business performance over Delivered orders only, computed on the backend.
   * Pending and Cancelled orders are never counted here.
   */
  performance?: ProductPerformance;
};

/** Product-level business metrics (the backend owns the calculation). */
export type ProductPerformance = {
  unitsSold: number;
  /** Distinct delivered orders containing this product. */
  orders: number;
  /** sum(quantity * unitPrice) over delivered orders. Excludes delivery. */
  sales: number;
  /** sum(quantity * unitCost) over delivered orders. */
  cost: number;
  /** This product's allocated share of delivery cost. */
  deliveryCost: number;
  /** sales - cost - deliveryCost */
  profit: number;
  averageSellingPrice: number;
  profitMargin: number;
  realisedMargin: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type ProductsResponse = {
  products: Product[];
  pagination: {
    currentPage: number;
    limit: number;
    totalProducts: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  stats: {
    totalProducts: number;
    totalStock: number;
    lowStockCount: number;
  };
};

export async function getProducts(
  page: number,
  limit: number,
  search = "",
): Promise<ProductsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search) params.set("search", search);

  const response = await fetch(`${API_URL}/products?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
}

export type CreateProductData = {
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  imageUrl?: string;
};

export async function createProduct(
  productData: CreateProductData,
): Promise<Product> {
  const response = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    throw new Error("Failed to create product");
  }

  return response.json();
}

export async function deleteProduct(productId: string): Promise<void> {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete product");
  }
}

export async function getProductById(productId: string): Promise<Product> {
  const response = await fetch(`${API_URL}/products/${productId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch product");
  }

  return response.json();
}

export async function updateProduct(
  productId: string,
  productData: CreateProductData,
): Promise<Product> {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    throw new Error("Failed to update product");
  }

  return response.json();
}

// Product detail

/** A delivered order line for one product, as shown on the detail page. */
export type ProductRecentOrder = {
  _id: string;
  customer: string;
  createdAt: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  orderTotal: number;
  orderDeliveryCost: number;
};

export type ProductStatsResponse = {
  product: {
    _id: string;
    name: string;
    category: string;
    imageUrl?: string;
    price: number;
    cost: number;
    stock: number;
  };

  performance: {
    unitsSold: number;
    orders: number;
    /** Product revenue. deliveryCharged is NOT included. */
    sales: number;
    /** Capital consumed by the units actually sold. */
    cost: number;
    /** This product's allocated share of delivery cost. */
    deliveryCost: number;
    /** sales - cost - deliveryCost */
    profit: number;
    profitMargin: number;
    averageSellingPrice: number;
    averageCost: number;
    deliveryCostPerUnit: number;
    /** Shown for transparency; never part of product sales. */
    deliveryCollected: number;
  };

  pricing: {
    defaultPrice: number;
    defaultCost: number;
    averageSellingPrice: number;
    /** averageSellingPrice - defaultPrice (negative = sold below list). */
    difference: number;
    differencePercent: number;
    soldBelowDefault: boolean;
  };

  inventory: {
    currentStock: number;
    lowStockThreshold: number;
    outOfStock: boolean;
    lowStock: boolean;
    /** Stock divided by the recent average daily sales rate, or null. */
    daysOfStockLeft: number | null;
  };

  /** Operational only - never counted as completed sales. */
  pending: {
    orders: number;
    units: number;
  };

  trendDays: number;
  salesTrend: Array<{ date: string; units: number; sales: number }>;
  recentOrders: ProductRecentOrder[];

  /** Verifiable facts only - no invented recommendations. */
  attention: {
    outOfStock: boolean;
    lowStock: boolean;
    neverSold: boolean;
    soldBelowDefaultPrice: boolean;
    profitNegative: boolean;
    otherProductsNeedingRestock: Array<{
      _id: string;
      name: string;
      stock: number;
    }>;
  };
};

export async function getProductStats(
  productId: string,
  days?: 7 | 30 | 90,
): Promise<ProductStatsResponse> {
  const params = days ? `?days=${days}` : "";
  const response = await fetch(`${API_URL}/products/${productId}/stats${params}`);

  if (!response.ok) {
    throw new Error(await errorMessage(response, "Failed to fetch product"));
  }

  return response.json();
}

// Advertising expenses

export type AdvertisingExpense = {
  _id: string;
  date: string;
  amount: number;
  platform: string;
  campaign?: string;
  note?: string;
  /** Missing on rows created before the field existed = manual. */
  source?: "manual" | "windsor";
  externalKey?: string;
  messages?: number;
  clicks?: number;
  /** Raw amount as the source reported it (Windsor rows: AED). */
  originalAmount?: number;
  originalCurrency?: string;
  store?: "viora" | "trendora";
  connectionId?: string;
  accountId?: string;
  accountName?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdvertisingExpenseData = {
  date: string;
  amount: number;
  platform: string;
  campaign?: string;
  note?: string;
};

export type AdvertisingResponse = {
  expenses: AdvertisingExpense[];
  pagination: {
    currentPage: number;
    limit: number;
    totalExpenses: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  summary: {
    /** Totals over the FULL filtered set - independent of the current page. */
    totalSpend: number;
    expenseCount: number;
    averageExpense: number;
  };
};

export async function getAdvertisingExpenses(params: {
  page: number;
  limit: number;
  /** USER-CONTROLLED date filter: omitted = all available data. */
  from?: string;
  to?: string;
  platform?: string;
  /** Omit for every record; "manual" keeps the list manual-only. */
  source?: "manual" | "windsor";
  store?: AdStore;
  /** Business account key, resolved server-side (see lib/adAccounts.ts). */
  account?: AdAccountKey;
  /** Matches campaign, platform or note - never interpreted as a regex. */
  search?: string;
}): Promise<AdvertisingResponse> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.platform) query.set("platform", params.platform);
  if (params.source) query.set("source", params.source);
  if (params.store) query.set("store", params.store);
  if (params.account) query.set("account", params.account);
  if (params.search) query.set("search", params.search);

  const response = await fetch(`${API_URL}/advertising?${query}`);

  if (!response.ok) {
    throw new Error(await errorMessage(response, "Failed to fetch advertising expenses"));
  }

  return response.json();
}

export async function createAdvertisingExpense(
  data: CreateAdvertisingExpenseData,
): Promise<AdvertisingExpense> {
  const response = await fetch(`${API_URL}/advertising`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await errorMessage(response, "Failed to create advertising expense"),
    );
  }

  return response.json();
}

export async function updateAdvertisingExpense(
  expenseId: string,
  data: CreateAdvertisingExpenseData,
): Promise<AdvertisingExpense> {
  const response = await fetch(`${API_URL}/advertising/${expenseId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await errorMessage(response, "Failed to update advertising expense"),
    );
  }

  return response.json();
}

export async function deleteAdvertisingExpense(expenseId: string): Promise<void> {
  const response = await fetch(`${API_URL}/advertising/${expenseId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete advertising expense");
  }
}

/* -------------------------------------------------------------------------- */
/* Windsor sync + advertising summary                                          */
/* -------------------------------------------------------------------------- */

export type AdStore = "viora" | "trendora";

/**
 * Business account keys - the ONLY account identities the UI renders.
 * Mirrors backend/src/lib/adAccounts.ts.
 */
export type AdAccountKey =
  | "viora"
  | "trendora_facebook"
  | "trendora_instagram"
  /** Fallback bucket for a Trendora ad account the backend cannot map. */
  | "trendora_other";

/** One Windsor ad account discovered during preview / sync. */
export type AdSource = {
  store: AdStore;
  connectionId: string;
  connectionLabel: string;
  /** Business account resolved by the backend - the UI labels by THIS. */
  accountKey: AdAccountKey;
  accountId: string;
  accountName: string;
  /** Period actually returned by Windsor for this account. */
  from: string | null;
  to: string | null;
  rowCount: number;
  /** Amount as Windsor reported it, before conversion. */
  sourceSpend: number;
  /** Normalized amount (USD) - what gets stored and displayed. */
  spend: number;
  messages: number;
  clicks: number;
  costPerMessage: number | null;
  /** Account seen by Windsor but with no usable rows (e.g. disabled). */
  empty?: boolean;
};

/** One campaign, aggregated over ALL stored days. */
export type AdCampaign = {
  campaign: string;
  spend: number;
  messages: number;
  clicks: number;
  costPerMessage: number | null;
};

/** One business advertising account with its all-time totals. */
export type AdAccountSummary = {
  key: AdAccountKey;
  spend: number;
  messages: number;
  clicks: number;
  costPerMessage: number | null;
  campaignCount: number;
  /** Highest spend first; fully deterministic order. */
  campaigns: AdCampaign[];
};

/**
 * GET /advertising/insights - the ALL-TIME business summary.
 * There is deliberately no date window: everything covers all available data.
 */
export type AdSummary = {
  /** Windsor (every account) + manual, counted exactly once each. */
  grandTotal: number;
  manual: { spend: number; count: number };
  /** Fixed order: viora, trendora_facebook, trendora_instagram (+ fallback). */
  accounts: AdAccountSummary[];
};

export async function getAdSummary(): Promise<AdSummary> {
  const response = await fetch(`${API_URL}/advertising/insights`);

  if (!response.ok) {
    throw new Error(await errorMessage(response, "Failed to fetch ad summary"));
  }

  return response.json();
}

/**
 * POST /advertising/performance?range=7|30 - period-scoped analytics behind
 * the Advertising page's "Ads performance" verdict and the "Ads vs delivered
 * orders" funnel.
 *
 * The window is the Beirut business day range (same helper as Reports), so
 * the verdict always answers "for the last N days". Delivered orders and
 * product profit come from Delivered orders only; ad spend and messages come
 * from every stored advertising row in the window (manual + Windsor, each
 * counted exactly once).
 */
export type AdPerformanceResponse = {
  range: 7 | 30;
  summary: {
    deliveredOrders: number;
    productSales: number;
    productProfit: number;
    adSpend: number;
    adMessages: number;
    adCount: number;
  };
  financials: {
    productSales: number;
    productProfit: number;
    adSpend: number;
    adMessages: number;
    netProfitAfterAds: number;
  };
  verdict: {
    /**
     * cost-per-order vs profit-per-order:
     *   < 1/2 -> scale, <= 1 -> watch, > 1 -> losing,
     *   not enough data -> noData (see `reason`).
     */
    type: "scale" | "watch" | "losing" | "noData";
    /** Why the verdict is `noData`; null for scored verdicts. */
    reason: "noAdSpend" | "noProfitBaseline" | "noDeliveredOrders" | null;
    costPerOrder: number | null;
    profitPerOrder: number | null;
    /** Total ad spend expressed in delivered orders' profit. */
    breakEvenPerOrder: number | null;
    adSpentPerMessage: number | null;
  };
  /** Fixed order: viora, trendora_facebook, trendora_instagram (+ fallback). */
  accounts: Array<{
    key: AdAccountKey;
    spend: number;
    messages: number;
    accountId: string | null;
    accountStatus: string;
  }>;
  dailyAdSpend: Array<{ date: string; spend: number }>;
  dailyAdMessages: Array<{ date: string; messages: number }>;
  /** Latest business day of the window (YYYY-MM-DD, Beirut). */
  availableTo: string;
};

export async function getAdPerformance(
  range: 7 | 30,
): Promise<AdPerformanceResponse> {
  const response = await fetch(
    `${API_URL}/advertising/performance?range=${range}`,
    { method: "POST" },
  );

  if (!response.ok) {
    throw new Error(
      await errorMessage(response, "Failed to fetch ad performance"),
    );
  }

  return response.json();
}

export type WindsorPreviewRow = {
  store: string;
  accountId: string;
  accountName: string;
  date: string;
  campaign: string;
  /** Raw amount as Windsor reported it (AED). */
  sourceSpend: number;
  /** Converted to USD - what will be stored. */
  spend: number;
  clicks: number;
  messages: number;
  costPerMessage: number | null;
};

export type WindsorPreview = {
  rate: string;
  currency: string;
  /** Actual period Windsor holds data for. */
  availableFrom: string | null;
  availableTo: string | null;
  connections: Array<{
    id: string;
    store: string;
    label: string;
    rowCount: number;
    accountCount: number;
  }>;
  errors: Array<{ connectionId: string; message: string }>;
  sources: AdSource[];
  rows: WindsorPreviewRow[];
  totals: { sourceSpend: number; spend: number; clicks: number; messages: number };
  created: number;
  updated: number;
  unchanged: number;
  /** Manual spend in USD - a separate account, added to (never blocking) Windsor. */
  manual: { total: number; count: number };
};

/** No date range: Windsor returns its full available period. */
export async function previewWindsorSync(): Promise<WindsorPreview> {
  const response = await fetch(`${API_URL}/advertising/windsor/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(
      await errorMessage(response, "Failed to preview Windsor data"),
    );
  }

  return response.json();
}

export type WindsorSyncResult = WindsorPreview & {
  totalSourceSpend: number;
  totalSpend: number;
  totalMessages: number;
  totalClicks: number;
};

export async function syncWindsorAds(): Promise<WindsorSyncResult> {
  const response = await fetch(`${API_URL}/advertising/windsor/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(await errorMessage(response, "Failed to sync from Windsor"));
  }

  return response.json();
}

// Orders

export type OrderStatus = "Pending" | "Delivered" | "Cancelled";

export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number; // السعر الفعلي بعد المكاسرة
  unitCost: number; // كلفة المنتج وقت الأوردر
  imageUrl?: string; // موجود في response فقط، لا يتم تخزينه داخل Order
};

export type Order = {
  _id: string;
  customer: string;
  phone: string;
  items: OrderItem[];
  deliveryCharged: number; // اللي دفعو الزبون كتوصيل
  deliveryCost: number; // اللي دفعتو لشركة التوصيل
  total: number;
  profit: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

export type OrdersStats = {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  revenue: number;
  profit: number;
};

export type OrdersResponse = {
  orders: Order[];
  pagination: {
    currentPage: number;
    limit: number;
    totalOrders: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  stats: OrdersStats;
};

export type CreateOrderItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type CreateOrderData = {
  customer: string;
  phone: string;
  items: CreateOrderItem[];
  deliveryCharged: number;
  deliveryCost: number;
};

// بيرجّع رسالة السيرفر (مثلاً "Not enough stock for ...") بدل رسالة عامة
async function errorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return data.message ?? fallback;
  } catch {
    return fallback;
  }
}

export type OrdersQuery = {
  search?: string;
  status?: string;
};

export async function getOrders(
  page: number,
  limit: number,
  { search, status }: OrdersQuery = {},
): Promise<OrdersResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search) params.set("search", search);
  if (status && status !== "all") params.set("status", status);

  const response = await fetch(`${API_URL}/orders?${params}`);

  if (!response.ok) {
    throw new Error(await errorMessage(response, "Failed to fetch orders"));
  }

  return response.json();
}

export async function getOrderById(orderId: string): Promise<Order> {
  const response = await fetch(`${API_URL}/orders/${orderId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch order");
  }

  return response.json();
}

export async function createOrder(
  createOrderData: CreateOrderData,
): Promise<Order> {
  const response = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createOrderData),
  });

  if (!response.ok) {
    throw new Error(await errorMessage(response, "Failed to create order"));
  }

  return response.json();
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<Order> {
  const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(
      await errorMessage(response, "Failed to update order status"),
    );
  }

  return response.json();
}

export async function deleteOrder(orderId: string): Promise<void> {
  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete order");
  }
}

export async function updateOrder(
  orderId: string,
  orderData: CreateOrderData,
): Promise<Order> {
  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    throw new Error(await errorMessage(response, "Failed to update order"));
  }

  return response.json();
}

// Reports
export type ReportSalesData = {
  date: string;
  day: string;
  sales: number;
  profit: number;
};

export type ReportTopProduct = {
  name: string;
  units: number;
  orders: number;
  revenue: number;
  profit: number;
};

export type ReportOrderStatus = {
  name: "Delivered" | "Pending" | "Cancelled";
  value: number;
};

export type ReportsResponse = {
  range: number;

  summary: {
    /** Delivered orders only. Excludes deliveryCharged. */
    productSales: number;
    productCost: number;
    deliveryCost: number;
    productProfit: number;
    unitsSold: number;
    /** Delivered orders inside the selected window. */
    deliveredOrdersInRange: number;
    averageOrderValue: number;
    profitMargin: number;
    advertisingSpend: number;

    /** Operational view: every order ever, regardless of window. */
    totalOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;

    deliveryCollected: number;
    deliveryNet: number;
    deliveryRate: number;
  };

  /**
   * Where the money goes, over the selected window:
   * productSales - productCost - deliveryCost - advertisingSpend
   */
  financials: {
    productSales: number;
    productCost: number;
    deliveryCost: number;
    productProfit: number;
    deliveryCollected: number;
    advertisingSpend: number;
    advertisingCount: number;
    netProfitAfterAds: number;
    netMargin: number;
  };

  salesData: ReportSalesData[];

  topProducts: ReportTopProduct[];

  orderStatus: ReportOrderStatus[];
};

export async function getReports(range = 7): Promise<ReportsResponse> {
  const response = await fetch(`${API_URL}/reports?range=${range}`);

  if (!response.ok) {
    throw new Error("Failed to fetch reports");
  }

  return response.json();
}

// Dashboard
export type DashboardOrder = Order;

export type DashboardResponse = {
  stats: {
    todaySales: number;
    todayProfit: number;
    todayOrders: number;
    todayPendingOrders: number;

    yesterdaySales: number;
    yesterdayProfit: number;
    yesterdayOrders: number;
    yesterdayPendingOrders: number;
  };

  salesData: {
    date: string;
    sales: number;
  }[];

  orderStatus: {
    label: "Delivered" | "Pending" | "Cancelled";
    value: number;
  }[];

  recentOrders: DashboardOrder[];
  totalOrders: number;
};

export async function getDashboard(): Promise<DashboardResponse> {
  const response = await fetch(`${API_URL}/dashboard`);

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard");
  }

  return response.json();
}
