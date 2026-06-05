import { Footer } from "./Footer";

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
