import { getIdToken } from "./auth";

export type ApiStatus = "checking" | "online" | "offline";

export type User = {
  id: string;
  externalAuthId: string | null;
  email: string;
  name: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateProfileInput = Partial<{
  name: string | null;
  phone: string | null;
}>;

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

export type ProductStatus = Product["status"];

export type CreateCategoryInput = {
  slug: string;
  name: string;
  parentId?: string;
};

export type CreateProductInput = {
  slug: string;
  name: string;
  description?: string;
  status?: ProductStatus;
  categoryIds?: string[];
  images?: Array<{
    url: string;
    altText?: string;
    sortOrder?: number;
  }>;
  variants?: Array<{
    sku: string;
    title: string;
    price: string;
    currency?: string;
    inventoryQuantity?: number;
  }>;
};

export type UpdateProductInput = Partial<{
  slug: string;
  name: string;
  description: string | null;
  status: ProductStatus;
}>;

export type CreateProductVariantInput = {
  sku: string;
  title: string;
  price: string;
  currency?: string;
  inventoryQuantity?: number;
};

export type UpdateProductVariantInput = Partial<{
  sku: string;
  title: string;
  price: string;
  currency: string;
  inventoryQuantity: number;
}>;

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

export type Address = {
  id: string;
  userId: string;
  label: string | null;
  recipientName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAddressInput = AddressInput & {
  label?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
};

export type UpdateAddressInput = Partial<CreateAddressInput>;

export type CheckoutInput = {
  cartId: string;
  email: string;
  shippingAddress: AddressInput;
  billingAddress: AddressInput;
};

export type CheckoutWithStripeInput = CheckoutInput & {
  returnBaseUrl: string;
};

export type PaymentStatus =
  | "UNPAID"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "REFUNDED"
  | "DISPUTED";
export type PaymentStatusEventSource = "SYSTEM" | "ADMIN_MANUAL" | "ADMIN_SYNC" | "STRIPE_WEBHOOK";
export type PaymentAttemptStatus = "OPEN" | "COMPLETED" | "EXPIRED" | "FAILED" | "CANCELED";

export type PaymentAttempt = {
  id: string;
  paymentId: string;
  orderId: string;
  provider: string;
  providerAttemptId: string;
  providerPaymentIntentId: string | null;
  status: PaymentAttemptStatus;
  amount: string;
  currency: string;
  expiresAt: string | null;
  completedAt: string | null;
  expiredAt: string | null;
  failedAt: string | null;
  canceledAt: string | null;
  metadata: unknown | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentStatusEvent = {
  id: string;
  paymentId: string;
  paymentAttemptId: string | null;
  orderId: string;
  fromStatus: PaymentStatus | null;
  toStatus: PaymentStatus;
  source: PaymentStatusEventSource;
  providerEventId: string | null;
  providerObjectId: string | null;
  reason: string | null;
  metadata: unknown | null;
  createdAt: string;
};

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
  attempts: PaymentAttempt[];
  statusEvents: PaymentStatusEvent[];
};

export type ShipmentStatus = "PENDING" | "SHIPPED" | "DELIVERED" | "RETURNED";
export type ShipmentStatusEventSource = "SYSTEM" | "ADMIN_MANUAL";
export type ShipmentTrackingEventSource = "SYSTEM" | "ADMIN_MANUAL";

export type ShipmentStatusEvent = {
  id: string;
  shipmentId: string;
  orderId: string;
  fromStatus: ShipmentStatus | null;
  toStatus: ShipmentStatus;
  source: ShipmentStatusEventSource;
  reason: string | null;
  metadata: unknown | null;
  createdAt: string;
};

export type ShipmentTrackingEvent = {
  id: string;
  shipmentId: string;
  orderId: string;
  fromCarrier: string | null;
  toCarrier: string | null;
  fromTrackingNumber: string | null;
  toTrackingNumber: string | null;
  source: ShipmentTrackingEventSource;
  reason: string | null;
  metadata: unknown | null;
  createdAt: string;
};

export type ShipmentItem = {
  id: string;
  shipmentId: string;
  orderItemId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  orderItem: Order["items"][number];
};

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
  items: ShipmentItem[];
  statusEvents: ShipmentStatusEvent[];
  trackingEvents: ShipmentTrackingEvent[];
};

export type NotificationType = "SHIPMENT_DELIVERED";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "SKIPPED";

export type NotificationEvent = {
  id: string;
  orderId: string;
  shipmentId: string | null;
  type: NotificationType;
  recipientEmail: string;
  status: NotificationStatus;
  provider: string | null;
  providerMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  metadata: unknown | null;
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
  inventoryReleasedAt: string | null;
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
  notes?: OrderNote[];
  shipments: Shipment[];
  notificationEvents?: NotificationEvent[];
};

export type OrderNote = {
  id: string;
  orderId: string;
  body: string;
  authorEmail: string | null;
  createdAt: string;
};

export type AdminOrderQuery = {
  search?: string;
  payment?: "ALL" | PaymentStatus;
  fulfillment?: "ALL" | Order["fulfillmentStatus"];
  dateField?:
    | "ANY"
    | "ORDER_CREATED"
    | "ORDER_PLACED"
    | "ORDER_UPDATED"
    | "SHIPMENT_CREATED"
    | "SHIPMENT_SHIPPED"
    | "SHIPMENT_DELIVERED";
  dateFrom?: string;
  dateTo?: string;
  sort?:
    | "CREATED_DESC"
    | "CREATED_ASC"
    | "UPDATED_DESC"
    | "PLACED_DESC"
    | "SHIPPED_DESC"
    | "DELIVERED_DESC"
    | "TOTAL_DESC"
    | "TOTAL_ASC";
  page?: number;
  pageSize?: number;
};

export type AdminOrdersResponse = {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type PaymentWithOrder = Payment & {
  order: Order;
};

export type ShipmentWithOrder = Shipment & {
  order: Order;
};

export type StripeCheckoutSession = {
  clientSecret: string;
  checkoutSessionId: string;
  paymentAttempt: PaymentAttempt;
  payment: PaymentWithOrder;
};

export type CheckoutWithStripeResult = {
  order: Order;
  checkoutSession: StripeCheckoutSession;
};

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const idToken = getIdToken();

  if (init?.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (idToken && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${idToken}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers
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

export async function getMe() {
  return request<User>("/me");
}

export async function updateMe(input: UpdateProfileInput) {
  return request<User>("/me", {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function getMyOrders() {
  return request<Order[]>("/me/orders");
}

export async function getMyAddresses() {
  return request<Address[]>("/me/addresses");
}

export async function createMyAddress(input: CreateAddressInput) {
  return request<Address>("/me/addresses", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateMyAddress(addressId: string, input: UpdateAddressInput) {
  return request<Address>(`/me/addresses/${addressId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function deleteMyAddress(addressId: string) {
  return request<{ ok: true }>(`/me/addresses/${addressId}`, {
    method: "DELETE"
  });
}

export async function listProducts() {
  return request<Product[]>("/products");
}

export async function getProduct(slug: string) {
  return request<Product>(`/products/${encodeURIComponent(slug)}`);
}

export async function listCategories() {
  return request<Category[]>("/categories");
}

export async function listAdminProducts() {
  return request<Product[]>("/admin/products");
}

export async function createCategory(input: CreateCategoryInput) {
  return request<Category>("/admin/categories", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function createProduct(input: CreateProductInput) {
  return request<Product>("/admin/products", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateProduct(productId: string, input: UpdateProductInput) {
  return request<Product>(`/admin/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function publishProduct(productId: string) {
  return request<Product>(`/admin/products/${productId}/publish`, {
    method: "POST"
  });
}

export async function archiveProduct(productId: string) {
  return request<Product>(`/admin/products/${productId}/archive`, {
    method: "POST"
  });
}

export async function assignProductCategory(productId: string, categoryId: string) {
  return request<Product>(`/admin/products/${productId}/categories`, {
    method: "POST",
    body: JSON.stringify({
      categoryId
    })
  });
}

export async function removeProductCategory(productId: string, categoryId: string) {
  return request<Product>(`/admin/products/${productId}/categories/${categoryId}`, {
    method: "DELETE"
  });
}

export async function addProductImage(
  productId: string,
  input: { url: string; altText?: string; sortOrder?: number }
) {
  return request<ProductImage>(`/admin/products/${productId}/images`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function createProductVariant(productId: string, input: CreateProductVariantInput) {
  return request<ProductVariant>(`/admin/products/${productId}/variants`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateProductVariant(variantId: string, input: UpdateProductVariantInput) {
  return request<ProductVariant>(`/admin/variants/${variantId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function setVariantInventory(variantId: string, inventoryQuantity: number) {
  return request<ProductVariant>(`/admin/variants/${variantId}/inventory`, {
    method: "PATCH",
    body: JSON.stringify({
      inventoryQuantity
    })
  });
}

export async function createCart() {
  return request<Cart>("/carts", {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function getMyCart(cartId?: string) {
  return request<Cart>("/me/cart", {
    method: "POST",
    body: JSON.stringify({
      cartId
    })
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

export async function checkoutCartWithStripe(input: CheckoutWithStripeInput) {
  return request<CheckoutWithStripeResult>("/checkout/stripe", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function getOrder(orderNumber: string) {
  return request<Order>(`/orders/${encodeURIComponent(orderNumber)}`);
}

export async function listAdminOrders(query: AdminOrderQuery = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  const queryString = params.toString();

  return request<AdminOrdersResponse>(`/admin/orders${queryString ? `?${queryString}` : ""}`);
}

export async function createOrderNote(orderId: string, body: string) {
  return request<Order>(`/admin/orders/${orderId}/notes`, {
    method: "POST",
    body: JSON.stringify({
      body
    })
  });
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

export async function createStripeCheckoutSession(orderId: string, returnUrl: string) {
  return request<StripeCheckoutSession>(`/orders/${orderId}/stripe-checkout-session`, {
    method: "POST",
    body: JSON.stringify({
      returnUrl
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

export async function syncStripePayment(paymentId: string) {
  return request<PaymentWithOrder>(`/admin/payments/${paymentId}/sync-stripe`, {
    method: "POST"
  });
}

export async function createShipment(
  orderId: string,
  input: {
    carrier?: string;
    trackingNumber?: string;
    items?: Array<{
      orderItemId: string;
      quantity: number;
    }>;
  }
) {
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
