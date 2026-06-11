"use client";

import { PaymentElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout";
import { FormEvent, useEffect, useState } from "react";
import type { Order } from "../lib/api";
import { formatMoney } from "../lib/format";

function stripePhoneNumber(order: Order) {
  const phone = order.addresses.find((address) => address.type === "SHIPPING")?.phone?.trim();

  if (!phone) {
    return undefined;
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return phone;
}

export function StripePaymentForm({
  onError,
  onSubmitted,
  order
}: {
  onError: (message: string | null) => void;
  onSubmitted: () => Promise<void>;
  order: Order;
}) {
  const checkoutState = useCheckoutElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const canSubmitPayment = checkoutState.type === "success" && isPaymentElementReady && !isSubmitting;

  useEffect(() => {
    setIsPaymentElementReady(false);
  }, [order.id]);

  async function handlePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmitPayment || checkoutState.type !== "success") {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    onError(null);

    try {
      const result = await checkoutState.checkout.confirm({
        phoneNumber: stripePhoneNumber(order),
        redirect: "if_required"
      });

      if (result.type === "error") {
        onError(result.error.message ?? "Payment failed");
      } else {
        setMessage("Payment submitted");
        await new Promise((resolve) => window.setTimeout(resolve, 1200));
        await onSubmitted();
      }
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Payment failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="payment-form" onSubmit={handlePayment}>
      <PaymentElement onReady={() => setIsPaymentElementReady(true)} />
      <button type="submit" disabled={!canSubmitPayment}>
        {isSubmitting
          ? "Paying"
          : isPaymentElementReady
            ? `Pay ${formatMoney(order.total, order.currency)}`
            : "Loading Payment"}
      </button>
      {checkoutState.type === "error" ? <p className="error">{checkoutState.error.message}</p> : null}
      {message ? <p className="notice">{message}</p> : null}
    </form>
  );
}
