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
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getProducts(
  page: number,
  limit: number,
): Promise<ProductsResponse> {
  const response = await fetch(
    `${API_URL}/products?page=${page}&limit=${limit}`,
  );

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

export type Order = {
  _id: string;
  customer: string;
  phone: string;
  productId: string;
  product: string;
  quantity: number;
  price: number;
  total: number;
  profit: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
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
};

export type CreateOrderData = {
  customer: string;
  phone: string;
  productId: string;
  quantity: number;
  price: number;
};

export async function getOrders(
  page: number,
  limit: number,
): Promise<OrdersResponse> {
  const response = await fetch(`${API_URL}/orders?page=${page}&limit=${limit}`);

  if (!response.ok) {
    throw new Error("Failed to fetch orders");
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
    throw new Error("Failed to create order");
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
    throw new Error("Failed to update order status");
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
    throw new Error("Failed to update order");
  }

  return response.json();
}

// Reports
export type ReportSalesData = {
  day: string;
  sales: number;
  profit: number;
};

export type ReportTopProduct = {
  name: string;
  orders: number;
  revenue: number;
  profit: number;
};

export type ReportOrderStatus = {
  name: "Delivered" | "Pending" | "Cancelled";
  value: number;
};

export type ReportsResponse = {
  summary: {
    totalSales: number;
    totalProfit: number;
    totalOrders: number;
    averageOrderValue: number;
  };

  salesData: ReportSalesData[];

  topProducts: ReportTopProduct[];

  orderStatus: ReportOrderStatus[];

  snapshot: {
    deliveredOrders: number;
    deliveryRate: number;
    profitMargin: number;
  };
};

export async function getReports(): Promise<ReportsResponse> {
  const response = await fetch(`${API_URL}/reports`);

  if (!response.ok) {
    throw new Error("Failed to fetch reports");
  }

  return response.json();
}

// Dashboard
export type DashboardOrder = {
  _id: string;
  customer: string;
  phone: string;
  productId: string;
  product: string;
  quantity: number;
  price: number;
  total: number;
  profit: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

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
