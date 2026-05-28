UPDATE "payment_status_events"
SET "toStatus" = 'EXPIRED'::"PaymentStatus"
WHERE "toStatus" = 'FAILED'::"PaymentStatus"
  AND "reason" = 'checkout.session.expired';

UPDATE "payments"
SET "status" = 'EXPIRED'::"PaymentStatus"
WHERE "status" = 'FAILED'::"PaymentStatus"
  AND "provider" = 'stripe'
  AND "metadata"->>'checkoutSessionStatus' = 'expired';

UPDATE "orders" o
SET "paymentStatus" = 'EXPIRED'::"PaymentStatus"
WHERE o."paymentStatus" = 'FAILED'::"PaymentStatus"
  AND EXISTS (
    SELECT 1
    FROM "payments" p
    WHERE p."orderId" = o."id"
      AND p."status" = 'EXPIRED'::"PaymentStatus"
      AND p."provider" = 'stripe'
  );
