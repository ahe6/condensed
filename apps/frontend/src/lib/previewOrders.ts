import type { Order, User } from "./api";

const now = "2026-07-01T12:00:00.000Z";

function previewAddress(orderId: string, type: "SHIPPING" | "BILLING") {
  return {
    id: `preview-address-${type.toLowerCase()}`,
    orderId,
    type,
    recipientName: "Preview Patient",
    line1: "123 Health Street",
    city: "Austin",
    state: "TX",
    postalCode: "78701",
    country: "US",
    phone: "555-0100",
    createdAt: now
  };
}

export const previewUser: User = {
  id: "preview-user",
  externalAuthId: null,
  email: "preview@condensed.health",
  name: "Preview Patient",
  phone: null,
  createdAt: now,
  updatedAt: now
};

export const previewOrders: Order[] = [
  {
    id: "preview-order-1",
    userId: previewUser.id,
    orderNumber: "CH-10024",
    email: previewUser.email,
    status: "PLACED",
    paymentStatus: "PAID",
    fulfillmentStatus: "PARTIAL",
    currency: "USD",
    subtotal: "249.00",
    discountTotal: "0.00",
    shippingTotal: "0.00",
    taxTotal: "0.00",
    total: "249.00",
    reservationExpiresAt: null,
    inventoryReleasedAt: null,
    placedAt: now,
    createdAt: now,
    updatedAt: now,
    addresses: [previewAddress("preview-order-1", "SHIPPING"), previewAddress("preview-order-1", "BILLING")],
    items: [
      {
        id: "preview-item-1",
        orderId: "preview-order-1",
        productId: "preview-product-1",
        variantId: "preview-variant-1",
        productName: "General Health Check Labs",
        variantTitle: "Standard panel",
        sku: "PREVIEW-GENERAL-HEALTH",
        unitPrice: "129.00",
        quantity: 1,
        total: "129.00",
        createdAt: now
      },
      {
        id: "preview-item-2",
        orderId: "preview-order-1",
        productId: "preview-product-2",
        variantId: "preview-variant-2",
        productName: "Hormone Testing Review",
        variantTitle: "Written review",
        sku: "PREVIEW-HORMONE-REVIEW",
        unitPrice: "120.00",
        quantity: 1,
        total: "120.00",
        createdAt: now
      }
    ],
    payments: [
      {
        id: "preview-payment-1",
        orderId: "preview-order-1",
        provider: "STRIPE",
        providerPaymentId: "pi_preview_paid",
        amount: "249.00",
        currency: "USD",
        status: "PAID",
        processedAt: now,
        metadata: null,
        createdAt: now,
        updatedAt: now,
        attempts: [],
        statusEvents: []
      }
    ],
    shipments: [
      {
        id: "preview-shipment-1",
        orderId: "preview-order-1",
        status: "SHIPPED",
        carrier: "UPS",
        trackingNumber: "1ZPREVIEW123",
        shippedAt: now,
        deliveredAt: null,
        createdAt: now,
        updatedAt: now,
        statusEvents: [],
        trackingEvents: [],
        items: [
          {
            id: "preview-shipment-item-1",
            shipmentId: "preview-shipment-1",
            orderItemId: "preview-item-1",
            quantity: 1,
            createdAt: now,
            updatedAt: now,
            orderItem: {
              id: "preview-item-1",
              orderId: "preview-order-1",
              productId: "preview-product-1",
              variantId: "preview-variant-1",
              productName: "General Health Check Labs",
              variantTitle: "Standard panel",
              sku: "PREVIEW-GENERAL-HEALTH",
              unitPrice: "129.00",
              quantity: 1,
              total: "129.00",
              createdAt: now
            }
          }
        ]
      }
    ]
  },
  {
    id: "preview-order-2",
    userId: previewUser.id,
    orderNumber: "CH-10025",
    email: previewUser.email,
    status: "PENDING",
    paymentStatus: "UNPAID",
    fulfillmentStatus: "UNFULFILLED",
    currency: "USD",
    subtotal: "89.00",
    discountTotal: "0.00",
    shippingTotal: "0.00",
    taxTotal: "0.00",
    total: "89.00",
    reservationExpiresAt: "2099-07-01T12:00:00.000Z",
    inventoryReleasedAt: null,
    placedAt: null,
    createdAt: now,
    updatedAt: now,
    addresses: [previewAddress("preview-order-2", "SHIPPING"), previewAddress("preview-order-2", "BILLING")],
    items: [
      {
        id: "preview-item-3",
        orderId: "preview-order-2",
        productId: "preview-product-3",
        variantId: "preview-variant-3",
        productName: "Vitamin D Recheck",
        variantTitle: "Lab order",
        sku: "PREVIEW-VITAMIN-D",
        unitPrice: "89.00",
        quantity: 1,
        total: "89.00",
        createdAt: now
      }
    ],
    payments: [],
    shipments: []
  }
];

export function getPreviewOrder(orderNumber: string) {
  return previewOrders.find((order) => order.orderNumber === orderNumber) ?? previewOrders[0];
}
