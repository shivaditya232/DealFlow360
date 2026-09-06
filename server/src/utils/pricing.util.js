// Shared line/order pricing math — used anywhere a quotation line's dollar
// value is shown or billed (Quotation Builder totals, Approvals queue,
// Customer Portal, invoices/subscriptions, reports).
//
// Bug fix: every one of those call sites used to compute
//   quantity * unitPrice * (1 - discountPercent / 100)
// and stop there — Product.taxRate was collected on the "New Product" form
// and stored, but nothing downstream ever multiplied it back in, so every
// quoted/billed/reported amount was silently pre-tax. This is now the one
// place that formula lives; taxRate must be passed in from the line's
// product (include/select it wherever this is called).
export function computeLineTotal({ quantity, unitPrice, discountPercent, taxRate = 0 }) {
  const discounted = Number(quantity) * Number(unitPrice) * (1 - Number(discountPercent) / 100);
  return discounted * (1 + Number(taxRate) / 100);
}

export function roundMoney(amount) {
  return Math.round(Number(amount) * 100) / 100;
}
