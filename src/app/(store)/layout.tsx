import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MiniCart } from '@/components/layout/MiniCart';
import { TelemetryProvider } from '@/components/layout/TelemetryProvider';
import { getCategoryTree } from '@/lib/data/products';

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategoryTree();

  return (
    <div className="min-h-screen flex flex-col">
      <TelemetryProvider>
        <Header categories={categories} />
        <main className="flex-1">{children}</main>
        <Footer />
        <MiniCart />
      </TelemetryProvider>
    </div>
  );
}
