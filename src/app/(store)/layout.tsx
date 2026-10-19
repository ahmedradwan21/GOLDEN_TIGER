import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MiniCart } from '@/components/layout/MiniCart';
import { TelemetryProvider } from '@/components/layout/TelemetryProvider';
import { CampaignBanner } from '@/components/home/CampaignBanner';
import { AnnouncementBar } from '@/components/AnnouncementBar';
import { BrowsingHistory } from '@/components/BrowsingHistory';
import { getCategoryTree } from '@/lib/data/products';
import { logDatabaseDiagnostics } from '@/lib/db';

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  void logDatabaseDiagnostics();
  const categories = await getCategoryTree();

  return (
    <div className="min-h-screen flex flex-col">
      <TelemetryProvider>
        <AnnouncementBar />
        <CampaignBanner />
        <Header categories={categories} />
        <main className="flex-1">{children}</main>
        <BrowsingHistory />
        <Footer />
        <MiniCart />
      </TelemetryProvider>
    </div>
  );
}
