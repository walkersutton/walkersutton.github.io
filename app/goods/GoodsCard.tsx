import Link from "next/link";
import Image from "next/image";
import CardImageBox from "@/app/components/CardImageBox";

interface GoodsCardProps {
  slug: string;
  name: string;
  image?: string;
  price: string;
  isSoldOut: boolean;
  details?: string;
}

export default function GoodsCard({ slug, name, image, price, isSoldOut, details }: GoodsCardProps) {
  const href = `/goods/${slug}`;
  return (
    <div className="shop-card" data-soldout={isSoldOut}>
      <Link href={href} className="card-link block" style={{ marginBottom: 12 }}>
        <CardImageBox style={{ aspectRatio: "1 / 1" }}>
          {image && (
            <Image src={image} alt={name} fill className="object-cover" />
          )}
          {isSoldOut && <span className="shop-sold-badge">Sold out</span>}
        </CardImageBox>
      </Link>
      <div className="shop-card-meta">
        <Link href={href} className="shop-card-name">{name}</Link>
        <span className="shop-card-price">{isSoldOut ? "Sold out" : price}</span>
      </div>
      {details && <div className="shop-card-detail">{details}</div>}
    </div>
  );
}
