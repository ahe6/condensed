"use client";

import { useEffect, useState } from "react";
import type { Order } from "../lib/api";

const payablePaymentStatuses = new Set(["UNPAID", "FAILED"]);

export function canPayOrder(order: Order, now = Date.now()) {
  return (
    payablePaymentStatuses.has(order.paymentStatus) &&
    order.status !== "CANCELLED" &&
    isReservationActive(order, now)
  );
}

export function isReservationActive(order: Order, now = Date.now()) {
  if (!order.reservationExpiresAt) {
    return true;
  }

  return new Date(order.reservationExpiresAt).getTime() > now;
}

export function useReservationNow(order: Order | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!order?.reservationExpiresAt || !payablePaymentStatuses.has(order.paymentStatus)) {
      return undefined;
    }

    const interval = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, [order?.paymentStatus, order?.reservationExpiresAt]);

  return now;
}

export function OrderReservationStatus({ order, compact = false }: { order: Order; compact?: boolean }) {
  const now = useReservationNow(order);

  if (!order.reservationExpiresAt || !payablePaymentStatuses.has(order.paymentStatus)) {
    return null;
  }

  const expiresAt = new Date(order.reservationExpiresAt).getTime();
  const remainingMs = expiresAt - now;

  if (remainingMs <= 0 || order.status === "CANCELLED") {
    return (
      <p className={compact ? "reservation-countdown compact expired" : "reservation-countdown expired"}>
        Reservation expired
      </p>
    );
  }

  return (
    <p className={compact ? "reservation-countdown compact" : "reservation-countdown"}>
      Reserved for {formatRemainingTime(remainingMs)}
    </p>
  );
}

function formatRemainingTime(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}
