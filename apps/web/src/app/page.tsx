import { Suspense } from "react";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default function HomePage() {
  return (
    <PageWrapper>
      <div className="overflow-y-auto">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"/></div>}>
          <CatalogPage />
        </Suspense>
      </div>
    </PageWrapper>
  );
}
