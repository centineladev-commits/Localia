import { notFound } from "next/navigation";
import { getProductById, getShopByProductId } from "@/lib/demo-data";
import { ProductDetail } from "@/components/product/ProductDetail";

interface Props {
  params: { id: string };
}

export default function ProductPage({ params }: Props) {
  const product = getProductById(params.id);
  const shop = getShopByProductId(params.id);
  if (!product || !shop) notFound();

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <ProductDetail product={product} shop={shop} />
    </div>
  );
}
