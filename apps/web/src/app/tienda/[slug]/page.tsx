import { notFound } from "next/navigation";
import { getShopBySlug } from "@/lib/demo-data";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { ProductGrid } from "@/components/shop/ProductGrid";

interface Props {
  params: { slug: string };
}

export default function ShopPage({ params }: Props) {
  const shop = getShopBySlug(params.slug);
  if (!shop) notFound();

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <ShopHeader shop={shop} />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Catálogo ({shop.products.length} productos)
        </h2>
        <ProductGrid products={shop.products} shop={shop} />
      </div>
    </div>
  );
}

export function generateStaticParams() {
  const { DEMO_SHOPS } = require("@/lib/demo-data");
  return DEMO_SHOPS.map((s: { slug: string }) => ({ slug: s.slug }));
}
