import { formatPrice } from "@/lib/products";

interface OrderSummaryProps {
  totalPrice: number;
  shippingCost: number;
  shippingCountry: string;
}

export default function OrderSummary({ totalPrice, shippingCost, shippingCountry }: OrderSummaryProps) {
  const finalTotal = totalPrice + shippingCost;

  return (
    <div className="bag-summary">
      <div className="bag-sumrow">
        <span>Subtotal</span>
        <span>{formatPrice(totalPrice)}</span>
      </div>
      <div className="bag-sumrow">
        <span>Shipping · {shippingCountry}</span>
        <span>{formatPrice(shippingCost)}</span>
      </div>
      <div className="bag-sumrow bag-total">
        <span>Total</span>
        <span>{formatPrice(finalTotal)}</span>
      </div>
    </div>
  );
}
