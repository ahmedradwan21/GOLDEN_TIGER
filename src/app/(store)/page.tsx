import { getActiveBrands, getDisplayCoupons } from '@/lib/data/catalog-settings';
import { HeroSlider } from '@/components/HeroSlider';
import { MarketingBanner } from '@/components/MarketingBanner';
import { CouponSection } from '@/components/CouponSection';
import { BrandsHub } from '@/components/BrandsHub';
import { CategoryFeatureGrid } from '@/components/CategoryFeatureGrid';
import { BrowsingHistory } from '@/components/BrowsingHistory';
import { CategoryTiles } from '@/components/home/CategoryTiles';
import { CategorySlider } from '@/components/home/CategorySlider';
import { DealsOfTheDay } from '@/components/home/DealsOfTheDay';
import { Newsletter } from '@/components/home/Newsletter';
import {
  getHeroSlides,
  getCategoryTree,
  getProductsByCategory,
  getDealsOfTheDay,
  getHomepageRelatedProducts,
} from '@/lib/data/products';

// Re-read banners at least every minute so scheduled starts/ends take effect;
// admin banner saves also refresh the homepage immediately.
export const revalidate = 60;

export default async function HomePage() {
  const [slides, categories, deals, relatedProducts, brands, coupons] = await Promise.all([
    getHeroSlides(),
    getCategoryTree(),
    getDealsOfTheDay(),
    getHomepageRelatedProducts(),
    getActiveBrands(),
    getDisplayCoupons(),
  ]);

  const productsByCategory = await Promise.all(
    categories.map(async (cat) => ({
      category: cat,
      products: await getProductsByCategory(cat.slug),
    }))
  );

  const allProducts = productsByCategory.flatMap(({ products }) => products);

  return (
    <div>
      <HeroSlider slides={slides} />
      <CategoryTiles categories={categories} />

      <MarketingBanner />

      <CategoryFeatureGrid categories={categories} products={allProducts} />

      <BrandsHub brands={brands} />

      <CouponSection coupons={coupons} />

      {productsByCategory.map(({ category, products }) =>
        products.length > 0 ? (
          <CategorySlider
            key={category.id}
            title={category.name}
            category={category}
            products={products}
            seeAllHref={`/category/${category.slug}`}
          />
        ) : null
      )}
      <DealsOfTheDay products={deals} />

      <BrowsingHistory relatedProducts={relatedProducts} />

      <Newsletter />
    </div>
  );
}
