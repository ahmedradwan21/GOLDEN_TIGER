import { HeroCarousel } from '@/components/home/HeroCarousel';
import { CategoryTiles } from '@/components/home/CategoryTiles';
import { CategorySlider } from '@/components/home/CategorySlider';
import { DealsOfTheDay } from '@/components/home/DealsOfTheDay';
import { Newsletter } from '@/components/home/Newsletter';
import {
  getHeroSlides,
  getCategoryTree,
  getProductsByCategory,
  getDealsOfTheDay,
} from '@/lib/data/products';

export default async function HomePage() {
  const [slides, categories, deals] = await Promise.all([
    getHeroSlides(),
    getCategoryTree(),
    getDealsOfTheDay(),
  ]);

  const productsByCategory = await Promise.all(
    categories.map(async (cat) => ({
      category: cat,
      products: await getProductsByCategory(cat.slug),
    }))
  );

  return (
    <div>
      <HeroCarousel slides={slides} />
      <CategoryTiles categories={categories} />
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
      <Newsletter />
    </div>
  );
}
