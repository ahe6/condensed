export function formatMoney(value: string, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency
  }).format(Number(value));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function statusClass(value: string) {
  return value.toLowerCase().replace(/_/g, "-");
}

export function actionButtonClass(isActive: boolean) {
  return isActive ? "status-action active" : "status-action";
}

export function trackingUrl(carrier: string | null | undefined, trackingNumber: string | null | undefined) {
  const number = trackingNumber?.trim();

  if (!number) {
    return null;
  }

  const encodedNumber = encodeURIComponent(number);

  switch (normalizeCarrier(carrier)) {
    case "ups":
      return `https://www.ups.com/track?tracknum=${encodedNumber}`;
    case "usps":
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodedNumber}`;
    case "fedex":
      return `https://www.fedex.com/fedextrack/?trknbr=${encodedNumber}`;
    case "dhl":
      return `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encodedNumber}`;
    default:
      return null;
  }
}

function normalizeCarrier(carrier: string | null | undefined) {
  const value = carrier?.trim().toLowerCase() ?? "";

  if (value.includes("ups") || value.includes("united parcel")) {
    return "ups";
  }

  if (value.includes("usps") || value.includes("postal")) {
    return "usps";
  }

  if (value.includes("fedex") || value.includes("federal express")) {
    return "fedex";
  }

  if (value.includes("dhl")) {
    return "dhl";
  }

  return "unknown";
}
