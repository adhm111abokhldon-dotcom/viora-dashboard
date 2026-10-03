export type Product = {
  _id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
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

// Orders

export type OrderStatus = "Pending" | "Delivered" | "Cancelled";

export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number; // السعر الفعلي بعد المكاسرة
  unitCost: number; // كلفة المنتج وقت الأوردر
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

export async function createOrder(orderData: CreateOrderData): Promise<Order> {
  const response = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
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
    totalSales: number;
    totalProfit: number;
    totalOrders: number;
    activeOrders: number;
    averageOrderValue: number;
    pendingOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    deliveryRevenue: number;
    deliveryCost: number;
    profitMargin: number;
    deliveryRate: number;
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
