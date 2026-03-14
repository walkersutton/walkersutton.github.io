import { formatPrice } from "@/lib/products";

interface OrderSummaryProps {
  totalPrice: number;
  shippingCost: number;
  shippingCountry: string;
}

export default function OrderSummary({ totalPrice, shippingCost, shippingCountry }: OrderSummaryProps) {
  const finalTotal = totalPrice + shippingCost;

  return (
    <div className="pt-8 space-y-3">
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-bold tracking-wider uppercase">Subtotal</span>
        <span className="text-sm font-bold uppercase tracking-wide">{formatPrice(totalPrice)} USD</span>
      </div>
      
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-bold tracking-wider uppercase">Shipping ({shippingCountry})</span>
        <span className="text-sm font-bold uppercase tracking-wide">{formatPrice(shippingCost)} USD</span>
      </div>

      <div className="flex justify-between items-baseline pt-4 border-t border-neutral-800 dark:border-neutral-200">
        <span className="text-sm font-bold tracking-wider uppercase">Order Total</span>
        <span className="text-sm font-bold uppercase tracking-wide">{formatPrice(finalTotal)} USD</span>
      </div>
    </div>
  );
}
