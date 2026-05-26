export function formatMoney(value: string, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency
  }).format(Number(value));
}

export function statusClass(value: string) {
  return value.toLowerCase().replace(/_/g, "-");
}

export function actionButtonClass(isActive: boolean) {
  return isActive ? "status-action active" : "status-action";
}
