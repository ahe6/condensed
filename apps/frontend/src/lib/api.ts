export type ApiStatus = "checking" | "online" | "offline";

export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  title: string;
  price: string;
  currency: string;
  inventoryQuantity: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductImage = {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  createdAt: string;
};

export type Category = {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[];
  images: ProductImage[];
  categories: Array<{
    productId: string;
    categoryId: string;
    createdAt: string;
    category: Category;
  }>;
};

export type CartItem = {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  variant: ProductVariant & {
    product: Product;
  };
};

export type Cart = {
  id: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
  totals: {
    itemCount: number;
    subtotal: string;
    total: string;
  };
};

export type AddressInput = {
  recipientName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
};

export type CheckoutInput = {
  cartId: string;
  email: string;
  shippingAddress: AddressInput;
  billingAddress: AddressInput;
};

export type PaymentStatus = "UNPAID" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED";

export type Payment = {
  id: string;
  orderId: string;
  provider: string;
  providerPaymentId: string | null;
  status: PaymentStatus;
  amount: string;
  currency: string;
  processedAt: string | null;
  metadata: unknown | null;
  createdAt: string;
  updatedAt: string;
};

export type ShipmentStatus = "PENDING" | "SHIPPED" | "DELIVERED" | "RETURNED";

export type Shipment = {
  id: string;
  orderId: string;
  carrier: string | null;
  trackingNumber: string | null;
  status: ShipmentStatus;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: string;
  userId: string | null;
  orderNumber: string;
  email: string;
  status: "PENDING" | "PLACED" | "CANCELLED" | "REFUNDED";
  paymentStatus: PaymentStatus;
  fulfillmentStatus: "UNFULFILLED" | "PARTIAL" | "FULFILLED" | "RETURNED";
  currency: string;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  total: string;
  placedAt: string | null;
  createdAt: string;
  updatedAt: string;
  addresses: Array<AddressInput & { id: string; orderId: string; type: "SHIPPING" | "BILLING"; createdAt: string }>;
  items: Array<{
    id: string;
    orderId: string;
    productId: string | null;
    variantId: string | null;
    productName: string;
    variantTitle: string | null;
    sku: string;
    unitPrice: string;
    quantity: number;
    total: string;
    createdAt: string;
  }>;
  payments: Payment[];
  shipments: Shipment[];
};

export type PaymentWithOrder = Payment & {
  order: Order;
};

export type ShipmentWithOrder = Shipment & {
  order: Order;
};

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getReadiness() {
  return request<{ ok: boolean }>("/ready");
}

export async function listProducts() {
  return request<Product[]>("/products");
}

export async function createCart() {
  return request<Cart>("/carts", {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function getCart(cartId: string) {
  return request<Cart>(`/carts/${cartId}`);
}

export async function addCartItem(cartId: string, variantId: string, quantity: number) {
  return request<Cart>(`/carts/${cartId}/items`, {
    method: "POST",
    body: JSON.stringify({
      variantId,
      quantity
    })
  });
}

export async function updateCartItem(cartId: string, itemId: string, quantity: number) {
  return request<Cart>(`/carts/${cartId}/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({
      quantity
    })
  });
}

export async function removeCartItem(cartId: string, itemId: string) {
  return request<Cart>(`/carts/${cartId}/items/${itemId}`, {
    method: "DELETE"
  });
}

export async function clearCart(cartId: string) {
  return request<Cart>(`/carts/${cartId}/items`, {
    method: "DELETE"
  });
}

export async function checkoutCart(input: CheckoutInput) {
  return request<Order>("/checkout", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function getOrder(orderNumber: string) {
  return request<Order>(`/orders/${encodeURIComponent(orderNumber)}`);
}

export async function listAdminOrders() {
  return request<Order[]>("/admin/orders");
}

export async function createManualPayment(order: Order) {
  return request<PaymentWithOrder>(`/admin/orders/${order.id}/payments`, {
    method: "POST",
    body: JSON.stringify({
      provider: "manual",
      providerPaymentId: `manual-${order.orderNumber}-${Date.now()}`,
      amount: order.total,
      currency: order.currency
    })
  });
}

export async function authorizePayment(paymentId: string) {
  return request<PaymentWithOrder>(`/admin/payments/${paymentId}/authorize`, {
    method: "POST"
  });
}

export async function markPaymentPaid(paymentId: string) {
  return request<PaymentWithOrder>(`/admin/payments/${paymentId}/pay`, {
    method: "POST"
  });
}

export async function markPaymentFailed(paymentId: string) {
  return request<PaymentWithOrder>(`/admin/payments/${paymentId}/fail`, {
    method: "POST"
  });
}

export async function refundPayment(paymentId: string) {
  return request<PaymentWithOrder>(`/admin/payments/${paymentId}/refund`, {
    method: "POST"
  });
}

export async function createShipment(orderId: string, input: { carrier?: string; trackingNumber?: string }) {
  return request<ShipmentWithOrder>(`/admin/orders/${orderId}/shipments`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateShipmentTracking(
  shipmentId: string,
  input: { carrier?: string; trackingNumber?: string }
) {
  return request<ShipmentWithOrder>(`/admin/shipments/${shipmentId}/tracking`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function markShipmentShipped(shipmentId: string) {
  return request<ShipmentWithOrder>(`/admin/shipments/${shipmentId}/ship`, {
    method: "POST"
  });
}

export async function markShipmentDelivered(shipmentId: string) {
  return request<ShipmentWithOrder>(`/admin/shipments/${shipmentId}/deliver`, {
    method: "POST"
  });
}

export async function markShipmentReturned(shipmentId: string) {
  return request<ShipmentWithOrder>(`/admin/shipments/${shipmentId}/return`, {
    method: "POST"
  });
}
