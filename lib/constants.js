export const FREE_SHIPPING_THRESHOLD = 100;
export const SHIPPING_FEE = 10;

export function calculateShipping(subtotal) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}
