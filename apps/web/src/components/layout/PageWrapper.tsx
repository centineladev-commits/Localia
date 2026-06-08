import { Footer } from "./Footer";

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex-1 min-h-0">{children}</div>
      <Footer />
    </>
  );
}
