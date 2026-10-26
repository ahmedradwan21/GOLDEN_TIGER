import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-admin';
import { getAdminSession } from '@/lib/auth/session';

/**
 * One-time admin-only seed route.
 * POST /api/admin/seed-products          -> seeds if none of these products exist yet
 * POST /api/admin/seed-products?force=true -> re-upserts even if they already exist
 *
 * Data converted 1:1 from the two `INSERT INTO products` statements in golden_tiger_FINAL.sql.
 */

export const dynamic = 'force-dynamic';

type SeedProduct = {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  description: string;
  features: string[];
  specifications: Record<string, string> | null;
  price_cents: number;
  compare_at_cents: number | null;
  stock: number;
  images: string[];
  video_urls: string[];
  rating: number;
  review_count: number;
  tags: string[];
  is_published: boolean;
  category_id: string;
};

const SEED_PRODUCTS: SeedProduct[] = [
  {
    "id": "p-001",
    "slug": "aurum-wireless-earbuds-pro",
    "title": "Aurum Wireless Earbuds Pro with Active Noise Cancellation",
    "brand": "Aurum Audio",
    "description": "Experience studio-grade audio in the palm of your hand with the Aurum Wireless Earbuds Pro. Featuring industry-leading active noise cancellation, these earbuds block out the world so you can focus on what matters—your music, your calls, your moment. With up to 32 hours of total playback, IPX5 water resistance, and Bluetooth 5.3 multipoint pairing, the Aurum Pro earbuds are built for your daily grind. The ergonomic design ensures all-day comfort, while the Qi-compatible charging case keeps you powered on the go.",
    "features": [
      "Active Noise Cancellation with transparency mode",
      "Up to 32 hours total battery with charging case",
      "IPX5 sweat and water resistance",
      "Custom 12mm titanium drivers for rich bass",
      "Multipoint Bluetooth 5.3 connectivity",
      "Wireless Qi charging case"
    ],
    "specifications": {
      "Driver Size": "12mm Titanium",
      "Battery Life": "8h earbuds, 32h with case",
      "Bluetooth": "5.3",
      "Water Resistance": "IPX5",
      "Charging": "USB-C + Qi Wireless",
      "Weight": "5.2g per earbud"
    },
    "price_cents": 14999,
    "compare_at_cents": 19999,
    "stock": 42,
    "images": [
      "https://images.pexels.com/photos/10885667/pexels-photo-10885667.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/9784242/pexels-photo-9784242.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/25772336/pexels-photo-25772336.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/16387546/pexels-photo-16387546.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    ],
    "rating": 4.7,
    "review_count": 2847,
    "tags": [
      "bestseller",
      "new-arrival",
      "noise-cancelling"
    ],
    "is_published": true,
    "category_id": "cat-audio"
  },
  {
    "id": "p-002",
    "slug": "aurum-studio-headphones",
    "title": "Aurum Studio Over-Ear Headphones - Hi-Res Audio",
    "brand": "Aurum Audio",
    "description": "The Aurum Studio Over-Ear Headphones deliver reference-quality sound with stunning clarity across the full frequency range. The 40mm beryllium drivers reproduce every nuance of your favorite tracks with breathtaking precision.\nDesigned for marathon listening sessions, the plush memory foam ear cushions and adjustable headband provide exceptional comfort. With 40 hours of battery life and hybrid noise cancellation, you will never want to take them off.",
    "features": [
      "Hi-Res Audio certified with 40mm beryllium drivers",
      "Hybrid active noise cancellation",
      "40-hour battery life on a single charge",
      "Plush memory foam ear cushions",
      "Foldable design with premium carry case"
    ],
    "specifications": {
      "Driver Size": "40mm Beryllium",
      "Battery Life": "40 hours",
      "Noise Cancellation": "Hybrid ANC",
      "Connectivity": "Bluetooth 5.2 + 3.5mm",
      "Weight": "258g"
    },
    "price_cents": 24999,
    "compare_at_cents": 29999,
    "stock": 18,
    "images": [
      "https://images.pexels.com/photos/16387546/pexels-photo-16387546.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/4249193/pexels-photo-4249193.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/9784240/pexels-photo-9784240.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.8,
    "review_count": 1532,
    "tags": [
      "bestseller",
      "hi-res-audio"
    ],
    "is_published": true,
    "category_id": "cat-audio"
  },
  {
    "id": "p-003",
    "slug": "aurum-bluetooth-speaker-xl",
    "title": "Aurum XL Portable Bluetooth Speaker - 360 Sound",
    "brand": "Aurum Audio",
    "description": "Take the party anywhere with the Aurum XL Portable Bluetooth Speaker. Its 360-degree driver array fills any space with rich, room-shaking sound while the rugged IP67 exterior shrugs off water, dust, and drops. With 24 hours of playback and a built-in power bank to charge your devices, the Aurum XL is the ultimate adventure companion. Pair two speakers for true stereo sound.",
    "features": [
      "360-degree omnidirectional sound",
      "IP67 waterproof and dustproof",
      "24-hour battery life",
      "Party pairing for stereo sound",
      "Built-in USB power bank function"
    ],
    "specifications": {
      "Output": "40W",
      "Battery Life": "24 hours",
      "Water Resistance": "IP67",
      "Connectivity": "Bluetooth 5.1",
      "Weight": "680g"
    },
    "price_cents": 8999,
    "compare_at_cents": null,
    "stock": 3,
    "images": [
      "https://images.pexels.com/photos/9784242/pexels-photo-9784242.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/18386862/pexels-photo-18386862.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/16888144/pexels-photo-16888144.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    ],
    "rating": 4.5,
    "review_count": 967,
    "tags": [
      "low-stock"
    ],
    "is_published": true,
    "category_id": "cat-audio"
  },
  {
    "id": "p-004",
    "slug": "tiger-smartwatch-gold-edition",
    "title": "Tiger Smartwatch Gold Edition - Health & Fitness Tracker",
    "brand": "Tiger Wear",
    "description": "The Tiger Smartwatch Gold Edition combines luxury design with serious health tracking. The stunning 1.4-inch AMOLED display stays visible even in bright sunlight, while the gold stainless steel case makes a statement on any wrist. Track over 80 sport modes, monitor your heart rate, blood oxygen, and even take an ECG. With 7-day battery life and 5 ATM water resistance, this is the only wearable you need.",
    "features": [
      "1.4-inch AMOLED display with always-on mode",
      "Heart rate, SpO2, and ECG monitoring",
      "Built-in GPS with 80+ sport modes",
      "7-day battery life",
      "5 ATM water resistance",
      "Gold stainless steel case"
    ],
    "specifications": {
      "Display": "1.4\" AMOLED",
      "Battery Life": "7 days",
      "Water Resistance": "5 ATM",
      "Sensors": "Heart Rate, SpO2, ECG, Accelerometer",
      "Material": "316L Stainless Steel",
      "Weight": "52g"
    },
    "price_cents": 19999,
    "compare_at_cents": 25999,
    "stock": 55,
    "images": [
      "https://images.pexels.com/photos/5208869/pexels-photo-5208869.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/11450271/pexels-photo-11450271.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/16888144/pexels-photo-16888144.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/14541068/pexels-photo-14541068.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    ],
    "rating": 4.6,
    "review_count": 3214,
    "tags": [
      "bestseller",
      "new-arrival"
    ],
    "is_published": true,
    "category_id": "cat-wearables"
  },
  {
    "id": "p-005",
    "slug": "tiger-fitness-band-lite",
    "title": "Tiger Fitness Band Lite - Activity & Sleep Tracker",
    "brand": "Tiger Wear",
    "description": "The Tiger Fitness Band Lite is your entry into smart health tracking. Monitor your steps, sleep quality, and daily activity with a comfortable, lightweight band that you will forget you are wearing.\nWith 14 days of battery life on a single charge, you can focus on your goals instead of your charger. Available in multiple colors to match your style.",
    "features": [
      "0.96-inch OLED display",
      "Sleep and stress tracking",
      "20 sport modes",
      "14-day battery life",
      "Lightweight silicone band"
    ],
    "specifications": {
      "Display": "0.96\" OLED",
      "Battery Life": "14 days",
      "Water Resistance": "3 ATM",
      "Sport Modes": "20",
      "Weight": "22g"
    },
    "price_cents": 4999,
    "compare_at_cents": 7999,
    "stock": 0,
    "images": [
      "https://images.pexels.com/photos/5208781/pexels-photo-5208781.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/14541068/pexels-photo-14541068.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/5208869/pexels-photo-5208869.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.3,
    "review_count": 5421,
    "tags": [
      "out-of-stock"
    ],
    "is_published": true,
    "category_id": "cat-wearables"
  },
  {
    "id": "p-006",
    "slug": "aurum-ultrabook-14-pro",
    "title": "Aurum Ultrabook 14 Pro - Intel Core i7, 16GB RAM",
    "brand": "Aurum Computing",
    "description": "The Aurum Ultrabook 14 Pro is a powerhouse in a feather-light frame. The stunning 2.8K OLED display delivers vibrant colors and deep blacks, perfect for creative work and entertainment alike. Powered by an Intel Core i7 processor with 16GB of RAM and a 1TB NVMe SSD, this ultrabook handles everything from 4K video editing to intense multitasking with ease. The all-aluminum chassis weighs just 1.2kg.",
    "features": [
      "Intel Core i7-13700H processor",
      "14-inch 2.8K OLED display, 90Hz",
      "16GB LPDDR5 RAM, 1TB NVMe SSD",
      "Intel Iris Xe graphics",
      "All-aluminum chassis, 1.2kg",
      "Thunderbolt 4, Wi-Fi 6E"
    ],
    "specifications": {
      "CPU": "Intel Core i7-13700H",
      "GPU": "Intel Iris Xe",
      "RAM": "16GB LPDDR5",
      "Storage": "1TB NVMe SSD",
      "Display": "14\" 2.8K OLED 90Hz",
      "Weight": "1.2kg",
      "Ports": "2x Thunderbolt 4, USB-A, HDMI"
    },
    "price_cents": 129999,
    "compare_at_cents": 149999,
    "stock": 12,
    "images": [
      "https://images.pexels.com/photos/25772336/pexels-photo-25772336.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/11450271/pexels-photo-11450271.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/4249193/pexels-photo-4249193.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/16888144/pexels-photo-16888144.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    ],
    "rating": 4.9,
    "review_count": 843,
    "tags": [
      "bestseller",
      "premium"
    ],
    "is_published": true,
    "category_id": "cat-computing"
  },
  {
    "id": "p-007",
    "slug": "aurum-mechanical-keyboard-rgb",
    "title": "Aurum Mechanical Keyboard RGB - Hot-Swappable Switches",
    "brand": "Aurum Computing",
    "description": "Type with precision and style on the Aurum Mechanical Keyboard. Featuring hot-swappable switches, you can customize your typing feel without soldering. The gasket-mounted aluminum frame provides a premium, cushioned typing experience. With per-key RGB, PBT keycaps, and dual connectivity, this keyboard is as functional as it is beautiful.",
    "features": [
      "Hot-swappable mechanical switches",
      "Per-key RGB backlighting",
      "Aluminum frame with gasket mount",
      "USB-C and Bluetooth connectivity",
      "PBT keycaps with double-shot legends"
    ],
    "specifications": {
      "Layout": "75% (84 keys)",
      "Switches": "Hot-swappable, pre-installed linear",
      "Connectivity": "USB-C, Bluetooth 5.1",
      "Material": "Aluminum + PBT keycaps",
      "Weight": "1.1kg"
    },
    "price_cents": 11999,
    "compare_at_cents": null,
    "stock": 27,
    "images": [
      "https://images.pexels.com/photos/25772336/pexels-photo-25772336.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/9784240/pexels-photo-9784240.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.7,
    "review_count": 1245,
    "tags": [
      "new-arrival"
    ],
    "is_published": true,
    "category_id": "cat-computing"
  },
  {
    "id": "p-008",
    "slug": "mens-premium-cotton-tshirt",
    "title": "Men's Premium Cotton Crew Neck T-Shirt - 3 Pack",
    "brand": "Tiger Apparel",
    "description": "Elevate your everyday wardrobe with the Tiger Apparel Premium Cotton T-Shirt 3-Pack. Made from 200 GSM combed cotton, these tees are substantial, soft, and built to last through countless washes.\nThe pre-shrunk fabric and tagless design ensure all-day comfort, while the classic crew neck pairs effortlessly with any outfit. Stock up on essentials that never go out of style.",
    "features": [
      "100% premium combed cotton, 200 GSM",
      "Pre-shrunk for perfect fit",
      "Ribbed crew neckline",
      "Tagless comfort design",
      "Available in 6 colors"
    ],
    "specifications": {
      "Material": "100% Combed Cotton",
      "Weight": "200 GSM",
      "Fit": "Regular",
      "Care": "Machine wash cold",
      "Pack Size": "3 shirts"
    },
    "price_cents": 3999,
    "compare_at_cents": 5999,
    "stock": 120,
    "images": [
      "https://images.pexels.com/photos/9594692/pexels-photo-9594692.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/8387807/pexels-photo-8387807.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/14534753/pexels-photo-14534753.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.4,
    "review_count": 4210,
    "tags": [
      "bestseller",
      "deal"
    ],
    "is_published": true,
    "category_id": "cat-mens-fashion"
  },
  {
    "id": "p-009",
    "slug": "mens-slim-fit-jeans-dark-wash",
    "title": "Men's Slim Fit Stretch Jeans - Dark Wash",
    "brand": "Tiger Apparel",
    "description": "Find your perfect fit with the Tiger Apparel Slim Fit Stretch Jeans. The 2% elastane blend provides all-day comfort and mobility, while the slim silhouette keeps you looking sharp. The dark indigo wash transitions seamlessly from casual to smart-casual occasions. Reinforced stitching at stress points ensures these jeans will be in rotation for years.",
    "features": [
      "98% cotton, 2% elastane for stretch comfort",
      "Slim fit through thigh and leg",
      "5-pocket styling",
      "Reinforced stress points",
      "Dark indigo wash with subtle fading"
    ],
    "specifications": {
      "Material": "98% Cotton, 2% Elastane",
      "Fit": "Slim",
      "Rise": "Mid-rise",
      "Wash": "Dark Indigo",
      "Care": "Machine wash inside out"
    },
    "price_cents": 6999,
    "compare_at_cents": 8999,
    "stock": 34,
    "images": [
      "https://images.pexels.com/photos/1488470/pexels-photo-1488470.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/14833749/pexels-photo-14833749.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/2601442/pexels-photo-2601442.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.5,
    "review_count": 2187,
    "tags": [
      "bestseller"
    ],
    "is_published": true,
    "category_id": "cat-mens-fashion"
  },
  {
    "id": "p-010",
    "slug": "womens-silk-blouse-ivory",
    "title": "Women's Silk Blend Blouse - Ivory",
    "brand": "Tiger Couture",
    "description": "Effortless elegance starts with the Tiger Couture Silk Blend Blouse. The silk-cotton fabric drapes beautifully while remaining easy to care for. The relaxed fit and covered button placket create a clean, sophisticated silhouette. Pair it with tailored trousers for the office or jeans for a weekend brunch. The versatile ivory tone complements any wardrobe.",
    "features": [
      "Silk-cotton blend for luxurious drape",
      "Relaxed fit with covered button placket",
      "French seam construction",
      "Hand-washable silk blend",
      "Versatile ivory color"
    ],
    "specifications": {
      "Material": "70% Silk, 30% Cotton",
      "Fit": "Relaxed",
      "Care": "Hand wash cold",
      "Closure": "Covered buttons"
    },
    "price_cents": 7999,
    "compare_at_cents": 10999,
    "stock": 5,
    "images": [
      "https://images.pexels.com/photos/9558711/pexels-photo-9558711.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/8619007/pexels-photo-8619007.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/8386651/pexels-photo-8386651.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    ],
    "rating": 4.6,
    "review_count": 893,
    "tags": [
      "low-stock",
      "deal"
    ],
    "is_published": true,
    "category_id": "cat-womens-fashion"
  },
  {
    "id": "p-011",
    "slug": "womens-leather-crossbody-bag",
    "title": "Women's Genuine Leather Crossbody Bag - Tan",
    "brand": "Tiger Couture",
    "description": "Crafted from full-grain leather that only gets better with age, the Tiger Couture Crossbody Bag is an investment in timeless style. The compact design holds your essentials without the bulk.\nThe RFID-blocking pocket protects your cards, while the solid brass hardware adds a touch of luxury. Each bag develops a unique patina over time, making it truly yours.",
    "features": [
      "Full-grain genuine leather",
      "Adjustable crossbody strap",
      "RFID-blocking interior pocket",
      "Solid brass hardware",
      "Lifetime craftsmanship guarantee"
    ],
    "specifications": {
      "Material": "Full-grain Leather",
      "Size": "10\" x 7\" x 3\"",
      "Strap Drop": "Adjustable 18-26\"",
      "Hardware": "Solid Brass",
      "Lining": "Cotton twill"
    },
    "price_cents": 11999,
    "compare_at_cents": null,
    "stock": 22,
    "images": [
      "https://images.pexels.com/photos/8386663/pexels-photo-8386663.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/32549955/pexels-photo-32549955.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/16891088/pexels-photo-16891088.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.8,
    "review_count": 567,
    "tags": [
      "premium",
      "new-arrival"
    ],
    "is_published": true,
    "category_id": "cat-womens-fashion"
  },
  {
    "id": "p-012",
    "slug": "tiger-pro-blender-1500w",
    "title": "Tiger Pro Blender 1500W - Professional Grade",
    "brand": "Tiger Home",
    "description": "The Tiger Pro Blender crushes ice, pulverizes vegetables, and blends smoothies to silky perfection with its powerful 1500W motor and 6-prong stainless steel blade. The variable speed dial gives you complete control over texture. The 2-liter Tritan pitcher is shatterproof and BPA-free. Cleanup is easy—just pop the parts in the dishwasher. Backed by a 5-year motor warranty.",
    "features": [
      "1500W motor with variable speed dial",
      "6-prong stainless steel blade",
      "2-liter BPA-free Tritan pitcher",
      "Pulse function for precise control",
      "Dishwasher-safe parts",
      "5-year motor warranty"
    ],
    "specifications": {
      "Power": "1500W",
      "Pitcher Capacity": "2 liters",
      "Blade": "6-prong stainless steel",
      "Speeds": "Variable + pulse",
      "Material": "BPA-free Tritan"
    },
    "price_cents": 9999,
    "compare_at_cents": 13999,
    "stock": 45,
    "images": [
      "https://images.pexels.com/photos/4713243/pexels-photo-4713243.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/12689256/pexels-photo-12689256.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/19599329/pexels-photo-19599329.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/7166645/pexels-photo-7166645.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    ],
    "rating": 4.7,
    "review_count": 1876,
    "tags": [
      "bestseller",
      "deal"
    ],
    "is_published": true,
    "category_id": "cat-kitchen-appliances"
  },
  {
    "id": "p-013",
    "slug": "tiger-espresso-machine-pro",
    "title": "Tiger Espresso Machine Pro - 15 Bar",
    "brand": "Tiger Home",
    "description": "Bring the cafe home with the Tiger Espresso Machine Pro. The 15-bar Italian pump extracts rich, crema-topped shots, while the built-in conical burr grinder grinds fresh for every cup. The stainless steel steam wand froths milk to silky microfoam for cappuccinos and lattes. With programmable shot volumes and a removable water reservoir, barista-quality espresso has never been easier.",
    "features": [
      "15-bar Italian pump pressure",
      "Built-in conical burr grinder",
      "Stainless steel steam wand",
      "Programmable single and double shots",
      "Removable 2L water reservoir"
    ],
    "specifications": {
      "Pressure": "15 bar",
      "Grinder": "Conical burr, 30 settings",
      "Water Tank": "2 liters",
      "Material": "Stainless steel",
      "Power": "1450W"
    },
    "price_cents": 34999,
    "compare_at_cents": 44999,
    "stock": 8,
    "images": [
      "https://images.pexels.com/photos/19563199/pexels-photo-19563199.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/25852330/pexels-photo-25852330.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/4740585/pexels-photo-4740585.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.8,
    "review_count": 645,
    "tags": [
      "low-stock",
      "premium"
    ],
    "is_published": true,
    "category_id": "cat-kitchen-appliances"
  },
  {
    "id": "p-014",
    "slug": "tiger-air-fryer-digital-6qt",
    "title": "Tiger Digital Air Fryer 6QT - Touch Screen",
    "brand": "Tiger Home",
    "description": "Cook healthier meals with the Tiger Digital Air Fryer. Using rapid air circulation technology, it delivers crispy, golden results with little to no oil. The 6-quart basket is perfect for family-sized portions.\nEight preset functions take the guesswork out of cooking fries, chicken, steak, and more. The digital touch screen makes it easy to adjust time and temperature on the fly.",
    "features": [
      "6-quart capacity, feeds 4-6 people",
      "8 preset cooking functions",
      "Digital touch screen with temperature control",
      "Rapid air technology, little to no oil",
      "Dishwasher-safe non-stick basket"
    ],
    "specifications": {
      "Capacity": "6 quarts",
      "Temperature Range": "180-400F",
      "Presets": "8",
      "Display": "Digital touch screen",
      "Power": "1700W"
    },
    "price_cents": 8999,
    "compare_at_cents": null,
    "stock": 60,
    "images": [
      "https://images.pexels.com/photos/19599329/pexels-photo-19599329.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/12689256/pexels-photo-12689256.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/15409513/pexels-photo-15409513.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.6,
    "review_count": 3204,
    "tags": [
      "bestseller"
    ],
    "is_published": true,
    "category_id": "cat-kitchen-appliances"
  },
  {
    "id": "p-015",
    "slug": "tiger-ceramic-vase-set-gold",
    "title": "Tiger Ceramic Vase Set of 3 - Gold Accents",
    "brand": "Tiger Decor",
    "description": "Add a touch of luxury to your space with the Tiger Ceramic Vase Set. Each piece is handcrafted with gold foil accents over a matte black finish, creating a striking contrast that catches the eye. The set of three graduated sizes allows for versatile styling—group them together or scatter throughout your home. The waterproof interior means they are ready for fresh flowers.",
    "features": [
      "Set of 3 graduated sizes",
      "Handcrafted ceramic with gold foil accents",
      "Matte black finish",
      "Waterproof interior for fresh flowers",
      "Decorative use indoor or outdoor"
    ],
    "specifications": {
      "Material": "Ceramic",
      "Sizes": "8\", 10\", 12\" tall",
      "Finish": "Matte black + gold foil",
      "Indoor": "Yes",
      "Outdoor": "Covered outdoor only"
    },
    "price_cents": 5999,
    "compare_at_cents": 8999,
    "stock": 28,
    "images": [
      "https://images.pexels.com/photos/12128381/pexels-photo-12128381.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/38796245/pexels-photo-38796245.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/17134085/pexels-photo-17134085.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.5,
    "review_count": 432,
    "tags": [
      "deal",
      "new-arrival"
    ],
    "is_published": true,
    "category_id": "cat-home-decor"
  },
  {
    "id": "p-016",
    "slug": "tiger-hyaluronic-serum-gold",
    "title": "Tiger Hyaluronic Acid Serum with Gold Infusion",
    "brand": "Tiger Beauty",
    "description": "Plump, hydrate, and illuminate your skin with the Tiger Hyaluronic Acid Serum. The multi-weight hyaluronic acid complex penetrates multiple layers of the skin for deep, lasting hydration, while 24K gold leaf adds a subtle radiance. This lightweight serum absorbs in seconds and layers perfectly under moisturizer and makeup. Suitable for all skin types, including sensitive skin.",
    "features": [
      "2% hyaluronic acid complex",
      "24K gold leaf infusion",
      "Lightweight, fast-absorbing formula",
      "Suitable for all skin types",
      "Vegan and cruelty-free",
      "30ml glass dropper bottle"
    ],
    "specifications": {
      "Key Ingredient": "2% Hyaluronic Acid + 24K Gold",
      "Size": "30ml",
      "Skin Type": "All types",
      "Vegan": "Yes",
      "Cruelty-Free": "Yes"
    },
    "price_cents": 3499,
    "compare_at_cents": 4999,
    "stock": 80,
    "images": [
      "https://images.pexels.com/photos/36339062/pexels-photo-36339062.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/36698525/pexels-photo-36698525.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/20171275/pexels-photo-20171275.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/24602070/pexels-photo-24602070.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    ],
    "rating": 4.7,
    "review_count": 5621,
    "tags": [
      "bestseller",
      "new-arrival"
    ],
    "is_published": true,
    "category_id": "cat-skincare"
  },
  {
    "id": "p-017",
    "slug": "tiger-vitamin-c-brightening-cream",
    "title": "Tiger Vitamin C Brightening Night Cream",
    "brand": "Tiger Beauty",
    "description": "Wake up to brighter, more radiant skin with the Tiger Vitamin C Brightening Night Cream. The stable ethyl ascorbic acid form of Vitamin C works overnight to fade dark spots and even out skin tone.\nCombined with niacinamide and hyaluronic acid, this non-greasy cream nourishes and plumps while you sleep. Suitable for all skin types.",
    "features": [
      "10% Vitamin C (ethyl ascorbic acid)",
      "Niacinamide and hyaluronic acid blend",
      "Brightens and evens skin tone",
      "Non-greasy night formula",
      "50ml jar"
    ],
    "specifications": {
      "Key Ingredient": "10% Vitamin C",
      "Size": "50ml",
      "Use": "Night",
      "Skin Type": "All types"
    },
    "price_cents": 2999,
    "compare_at_cents": null,
    "stock": 15,
    "images": [
      "https://images.pexels.com/photos/24602070/pexels-photo-24602070.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/36698525/pexels-photo-36698525.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/8128670/pexels-photo-8128670.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.5,
    "review_count": 2340,
    "tags": [
      "deal"
    ],
    "is_published": true,
    "category_id": "cat-skincare"
  },
  {
    "id": "p-018",
    "slug": "tiger-luxury-lipstick-set-gold",
    "title": "Tiger Luxury Matte Lipstick Set - 5 Shades",
    "brand": "Tiger Beauty",
    "description": "Complete your lip wardrobe with the Tiger Luxury Matte Lipstick Set. Five curated shades take you from everyday nude to evening bold, all in a comfortable, long-wearing matte formula. Enriched with shea butter and Vitamin E, these lipsticks glide on creamy and set to a non-drying matte finish that lasts up to 12 hours. The gold-tone casings are as beautiful as the shades inside.",
    "features": [
      "5 curated nude-to-bold shades",
      "Long-wearing matte finish, 12-hour",
      "Enriched with shea butter and Vitamin E",
      "Gold-tone bullet casings",
      "Cruelty-free formula"
    ],
    "specifications": {
      "Finish": "Matte",
      "Wear Time": "12 hours",
      "Shades": "5 (nude, rose, red, berry, plum)",
      "Cruelty-Free": "Yes",
      "Net Weight": "3.5g each"
    },
    "price_cents": 4999,
    "compare_at_cents": 7499,
    "stock": 40,
    "images": [
      "https://images.pexels.com/photos/7256102/pexels-photo-7256102.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/26927323/pexels-photo-26927323.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/1470165/pexels-photo-1470165.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/12969358/pexels-photo-12969358.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.6,
    "review_count": 1456,
    "tags": [
      "bestseller",
      "deal"
    ],
    "is_published": true,
    "category_id": "cat-makeup"
  },
  {
    "id": "p-019",
    "slug": "tiger-primer-grip-foundation-base",
    "title": "Tiger Power Grip Primer - Smoothing Base",
    "brand": "Tiger Beauty",
    "description": "Create the perfect canvas for your makeup with the Tiger Power Grip Primer. This lightweight formula grips makeup for all-day wear while hyaluronic acid keeps skin hydrated and plump.\nThe smoothing effect blurs pores and fine lines instantly, creating a flawless base for foundation. A little goes a long way.",
    "features": [
      "Smoothing grip primer",
      "Hyaluronic acid infused",
      "Extends makeup wear up to 12 hours",
      "Blurs pores and fine lines",
      "Suitable for all skin types"
    ],
    "specifications": {
      "Size": "30ml",
      "Skin Type": "All types",
      "Key Ingredient": "Hyaluronic Acid",
      "Vegan": "Yes"
    },
    "price_cents": 1999,
    "compare_at_cents": null,
    "stock": 0,
    "images": [
      "https://images.pexels.com/photos/30836145/pexels-photo-30836145.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/23940099/pexels-photo-23940099.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/13534508/pexels-photo-13534508.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.4,
    "review_count": 3210,
    "tags": [
      "out-of-stock"
    ],
    "is_published": true,
    "category_id": "cat-makeup"
  },
  {
    "id": "p-020",
    "slug": "tiger-adjustable-dumbbells-50lb",
    "title": "Tiger Adjustable Dumbbells 50lb Pair - Space Saving",
    "brand": "Tiger Fitness",
    "description": "Transform your home gym with the Tiger Adjustable Dumbbells. Each dumbbell adjusts from 5 to 50 pounds in 2.5-pound increments with a simple turn of the dial, replacing 15 sets of traditional dumbbells. The space-saving design stores neatly in the included tray, making it perfect for apartments and home gyms. The anti-roll safety design keeps your floors protected.",
    "features": [
      "Replaces 15 sets of dumbbells",
      "5 to 50 lbs per dumbbell, adjustable in 2.5 lb increments",
      "Quick-select dial system",
      "Compact storage tray included",
      "Anti-roll safety design"
    ],
    "specifications": {
      "Weight Range": "5-50 lbs each",
      "Increments": "2.5 lbs",
      "Material": "Steel + contoured grip",
      "Includes": "2 dumbbells + storage tray"
    },
    "price_cents": 29999,
    "compare_at_cents": 39999,
    "stock": 14,
    "images": [
      "https://images.pexels.com/photos/6740821/pexels-photo-6740821.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/4793221/pexels-photo-4793221.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/6293106/pexels-photo-6293106.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/20500863/pexels-photo-20500863.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    ],
    "rating": 4.8,
    "review_count": 876,
    "tags": [
      "bestseller",
      "premium"
    ],
    "is_published": true,
    "category_id": "cat-fitness-equipment"
  },
  {
    "id": "p-021",
    "slug": "tiger-yoga-mat-premium-6mm",
    "title": "Tiger Premium Yoga Mat 6mm - Non-Slip Extra Thick",
    "brand": "Tiger Fitness",
    "description": "Practice in comfort with the Tiger Premium Yoga Mat. The 6mm thickness provides superior joint protection, while the double-sided non-slip surface keeps you stable in any pose. Made from eco-friendly TPE material, this mat is free from latex, PVC, and toxic chemicals. The included carrying strap makes it easy to take to the studio.",
    "features": [
      "6mm extra-thick cushioning",
      "Double-sided non-slip surface",
      "Eco-friendly TPE material",
      "Includes carrying strap",
      "Latex and PVC free"
    ],
    "specifications": {
      "Thickness": "6mm",
      "Material": "Eco-friendly TPE",
      "Size": "72\" x 26\"",
      "Weight": "900g",
      "Carrying Strap": "Included"
    },
    "price_cents": 4999,
    "compare_at_cents": 6999,
    "stock": 75,
    "images": [
      "https://images.pexels.com/photos/20500863/pexels-photo-20500863.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/8038694/pexels-photo-8038694.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/3931297/pexels-photo-3931297.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.6,
    "review_count": 4523,
    "tags": [
      "bestseller",
      "deal"
    ],
    "is_published": true,
    "category_id": "cat-fitness-equipment"
  },
  {
    "id": "p-022",
    "slug": "tiger-hiking-backpack-40l",
    "title": "Tiger Hiking Backpack 40L - Waterproof",
    "brand": "Tiger Outdoors",
    "description": "Tackle any trail with the Tiger Hiking Backpack. The 40-liter capacity holds everything you need for a day hike or overnight trip, while the airflow back system keeps you cool and comfortable.\nThe waterproof ripstop nylon and included rain cover protect your gear in any weather. Multiple compartments and a hydration bladder sleeve keep you organized on the trail.",
    "features": [
      "40-liter capacity",
      "Waterproof ripstop nylon",
      "Adjustable airflow back system",
      "Hydration bladder compatible",
      "Rain cover included"
    ],
    "specifications": {
      "Capacity": "40 liters",
      "Material": "Ripstop nylon",
      "Weight": "1.2kg",
      "Hydration Compatible": "Yes (bladder not included)",
      "Rain Cover": "Included"
    },
    "price_cents": 8999,
    "compare_at_cents": null,
    "stock": 20,
    "images": [
      "https://images.pexels.com/photos/4793221/pexels-photo-4793221.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/20500863/pexels-photo-20500863.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.7,
    "review_count": 678,
    "tags": [
      "new-arrival"
    ],
    "is_published": true,
    "category_id": "cat-outdoor-gear"
  },
  {
    "id": "p-023",
    "slug": "tiger-insulated-water-bottle-32oz",
    "title": "Tiger Insulated Water Bottle 32oz - Stainless Steel",
    "brand": "Tiger Outdoors",
    "description": "Stay hydrated in style with the Tiger Insulated Water Bottle. The double-wall vacuum insulation keeps your drinks ice-cold for 24 hours or piping hot for 12 hours, making it perfect for any season. Made from 18/8 food-grade stainless steel with a powder-coated finish, this bottle is as durable as it is beautiful. The leak-proof flip-top lid lets you drink one-handed.",
    "features": [
      "Double-wall vacuum insulation",
      "Keeps cold 24 hours, hot 12 hours",
      "18/8 food-grade stainless steel",
      "Leak-proof flip-top lid",
      "Fits standard cup holders"
    ],
    "specifications": {
      "Capacity": "32oz",
      "Material": "18/8 Stainless Steel",
      "Cold Retention": "24 hours",
      "Hot Retention": "12 hours",
      "Lid": "Leak-proof flip-top"
    },
    "price_cents": 2999,
    "compare_at_cents": 3999,
    "stock": 200,
    "images": [
      "https://images.pexels.com/photos/6740821/pexels-photo-6740821.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/4793221/pexels-photo-4793221.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.8,
    "review_count": 8901,
    "tags": [
      "bestseller",
      "deal"
    ],
    "is_published": true,
    "category_id": "cat-outdoor-gear"
  },
  {
    "id": "p-024",
    "slug": "tiger-strategy-board-game-deluxe",
    "title": "Tiger Strategy Board Game Deluxe Edition - Family Game Night",
    "brand": "Tiger Games",
    "description": "Gather the family for game night with the Tiger Strategy Board Game Deluxe Edition. This award-winning strategy game combines resource management, negotiation, and tactical planning for endless replayability. The deluxe edition features premium metal game pieces, a foil-stamped board, and an exclusive expansion pack. Perfect for game nights with friends and family.",
    "features": [
      "For 2-6 players, ages 10+",
      "60-90 minute play time",
      "Premium metal game pieces",
      "Foil-stamped game board",
      "Includes expansion pack"
    ],
    "specifications": {
      "Players": "2-6",
      "Age Range": "10+",
      "Play Time": "60-90 minutes",
      "Includes": "Board, pieces, cards, expansion"
    },
    "price_cents": 4999,
    "compare_at_cents": 6999,
    "stock": 30,
    "images": [
      "https://images.pexels.com/photos/9090534/pexels-photo-9090534.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/27403981/pexels-photo-27403981.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/278918/pexels-photo-278918.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/207924/pexels-photo-207924.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    ],
    "rating": 4.9,
    "review_count": 1234,
    "tags": [
      "bestseller",
      "deal"
    ],
    "is_published": true,
    "category_id": "cat-board-games"
  },
  {
    "id": "p-025",
    "slug": "tiger-family-card-game-collection",
    "title": "Tiger Family Card Game Collection - 5 Games in 1",
    "brand": "Tiger Games",
    "description": "Five classic card games in one beautifully designed package. The Tiger Family Card Game Collection includes everything you need for hours of entertainment, from quick warm-up games to deep strategy sessions.\nThe premium linen-finish cards shuffle smoothly and hold up to countless game nights. The compact box is perfect for travel.",
    "features": [
      "5 classic card games in one box",
      "For 2-8 players, ages 8+",
      "Premium linen-finish cards",
      "Illustrated rulebook included",
      "Compact travel size"
    ],
    "specifications": {
      "Players": "2-8",
      "Age Range": "8+",
      "Games Included": "5",
      "Card Quality": "300gsm linen finish"
    },
    "price_cents": 2499,
    "compare_at_cents": null,
    "stock": 4,
    "images": [
      "https://images.pexels.com/photos/31674909/pexels-photo-31674909.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/792051/pexels-photo-792051.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/1329644/pexels-photo-1329644.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.5,
    "review_count": 2100,
    "tags": [
      "low-stock"
    ],
    "is_published": true,
    "category_id": "cat-board-games"
  },
  {
    "id": "p-026",
    "slug": "tiger-1000-piece-puzzle-golden-tiger",
    "title": "Tiger 1000-Piece Puzzle - Golden Tiger Edition",
    "brand": "Tiger Games",
    "description": "Piece together a masterpiece with the Tiger 1000-Piece Puzzle. The stunning golden tiger artwork comes to life as you assemble the premium blue-board pieces, each uniquely cut for a satisfying fit. The included reference poster helps you along, and the finished puzzle is frame-worthy. A relaxing challenge for solo or group puzzling.",
    "features": [
      "1000 pieces, premium blue board",
      "Stunning golden tiger artwork",
      "No two pieces alike - unique cut",
      "Poster reference included",
      "Finished size: 27\" x 19\""
    ],
    "specifications": {
      "Pieces": "1000",
      "Finished Size": "27\" x 19\"",
      "Material": "Premium blue board",
      "Includes": "Puzzle + reference poster"
    },
    "price_cents": 1999,
    "compare_at_cents": 2999,
    "stock": 50,
    "images": [
      "https://images.pexels.com/photos/207924/pexels-photo-207924.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/792051/pexels-photo-792051.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/209728/pexels-photo-209728.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.7,
    "review_count": 567,
    "tags": [
      "new-arrival",
      "deal"
    ],
    "is_published": true,
    "category_id": "cat-puzzles"
  },
  {
    "id": "p-027",
    "slug": "tiger-fiction-bestseller-mystery-novel",
    "title": "The Midnight Trail - Award-Winning Mystery Novel",
    "brand": "Tiger Press",
    "description": "A gripping mystery that keeps you turning pages late into the night. The Midnight Trail follows detective Sarah Chen as she unravels a decades-old disappearance in a small mountain town. With its richly drawn characters and twist-filled plot, this award-winning novel has captivated millions of readers. The perfect gift for mystery lovers.",
    "features": [
      "Hardcover, 384 pages",
      "New York Times Bestseller",
      "Award-winning author",
      "Book club discussion guide included"
    ],
    "specifications": {
      "Format": "Hardcover",
      "Pages": "384",
      "Publisher": "Tiger Press",
      "Language": "English",
      "ISBN": "978-0-XXXXXXX-1"
    },
    "price_cents": 1899,
    "compare_at_cents": 2499,
    "stock": 100,
    "images": [
      "https://images.pexels.com/photos/8762862/pexels-photo-8762862.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/1132577/pexels-photo-1132577.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/8200898/pexels-photo-8200898.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.8,
    "review_count": 5432,
    "tags": [
      "bestseller",
      "deal"
    ],
    "is_published": true,
    "category_id": "cat-fiction"
  },
  {
    "id": "p-028",
    "slug": "tiger-scifi-epic-hardcover",
    "title": "Stars Beyond the Veil - Epic Sci-Fi Hardcover",
    "brand": "Tiger Press",
    "description": "Journey across the galaxy in this epic science fiction saga. Stars Beyond the Veil introduces a cast of unforgettable characters navigating interstellar politics, ancient mysteries, and the thin line between survival and annihilation.\nThe first book in the acclaimed Veil Saga trilogy, this Hugo-nominated novel combines hard science fiction with deeply human storytelling.",
    "features": [
      "Hardcover, 624 pages",
      "Book 1 of the Veil Saga trilogy",
      "Hugo Award nominee",
      "Includes illustrated character guide"
    ],
    "specifications": {
      "Format": "Hardcover",
      "Pages": "624",
      "Publisher": "Tiger Press",
      "Language": "English",
      "ISBN": "978-0-XXXXXXX-2"
    },
    "price_cents": 2799,
    "compare_at_cents": null,
    "stock": 35,
    "images": [
      "https://images.pexels.com/photos/1132577/pexels-photo-1132577.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/8762862/pexels-photo-8762862.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/1693959/pexels-photo-1693959.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.7,
    "review_count": 2100,
    "tags": [
      "new-arrival"
    ],
    "is_published": true,
    "category_id": "cat-fiction"
  },
  {
    "id": "p-029",
    "slug": "tiger-productivity-guide-hardcover",
    "title": "The Golden Hour - Master Your Productivity",
    "brand": "Tiger Press",
    "description": "Transform how you work with The Golden Hour. This practical guide distills decades of productivity research into actionable frameworks you can apply today. Stop chasing hacks and start mastering your time. Each chapter includes exercises and templates that help you build sustainable habits. The included downloadable workbook keeps you on track long after you finish reading.",
    "features": [
      "Hardcover, 288 pages",
      "Practical frameworks and exercises",
      "Wallstreet Journal Bestseller",
      "Includes downloadable workbook"
    ],
    "specifications": {
      "Format": "Hardcover",
      "Pages": "288",
      "Publisher": "Tiger Press",
      "Language": "English",
      "ISBN": "978-0-XXXXXXX-3"
    },
    "price_cents": 2299,
    "compare_at_cents": 2999,
    "stock": 60,
    "images": [
      "https://images.pexels.com/photos/1693959/pexels-photo-1693959.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/8460337/pexels-photo-8460337.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/17548877/pexels-photo-17548877.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.6,
    "review_count": 3200,
    "tags": [
      "bestseller",
      "deal"
    ],
    "is_published": true,
    "category_id": "cat-non-fiction"
  },
  {
    "id": "p-030",
    "slug": "tiger-cookbook-golden-kitchen",
    "title": "The Golden Kitchen - 100 Recipes from Around the World",
    "brand": "Tiger Press",
    "description": "Elevate your home cooking with The Golden Kitchen. Award-winning chef Marcus Lin shares 100 of his favorite recipes from around the world, each adapted for the home cook with accessible ingredients and clear instructions. Every recipe is accompanied by a stunning full-color photograph, helpful tips, and a pantry guide that makes stocking your kitchen effortless. A must-have for food lovers.",
    "features": [
      "Hardcover, 320 pages",
      "100 curated recipes with full-color photos",
      "Includes pantry guide and substitutions",
      "Award-winning chef author"
    ],
    "specifications": {
      "Format": "Hardcover",
      "Pages": "320",
      "Publisher": "Tiger Press",
      "Language": "English",
      "ISBN": "978-0-XXXXXXX-4"
    },
    "price_cents": 3499,
    "compare_at_cents": null,
    "stock": 25,
    "images": [
      "https://images.pexels.com/photos/1693959/pexels-photo-1693959.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/14924122/pexels-photo-14924122.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/1098656/pexels-photo-1098656.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    ],
    "rating": 4.9,
    "review_count": 1876,
    "tags": [
      "bestseller",
      "new-arrival"
    ],
    "is_published": true,
    "category_id": "cat-non-fiction"
  },
  {
    "id": "p-031",
    "slug": "tiger-pro-tool-set-200-piece",
    "title": "Tiger Pro Mechanic Tool Set - 200 Piece",
    "brand": "Tiger Auto",
    "description": "Tackle any automotive repair with the Tiger Pro Mechanic Tool Set. This 200-piece collection includes everything from ratchets and sockets to wrenches and screwdrivers, all forged from durable chrome vanadium steel.\nThe organized blow-molded case keeps every tool in its place with clearly labeled compartments. Backed by a lifetime replacement guarantee.",
    "features": [
      "200-piece comprehensive set",
      "Chrome vanadium steel construction",
      "Includes ratchets, sockets, wrenches, and more",
      "Blow-molded case with labeled compartments",
      "Lifetime replacement guarantee"
    ],
    "specifications": {
      "Piece Count": "200",
      "Material": "Chrome vanadium steel",
      "Drive Sizes": "1/4\", 3/8\", 1/2\"",
      "Case": "Blow-molded",
      "Warranty": "Lifetime"
    },
    "price_cents": 19999,
    "compare_at_cents": 25999,
    "stock": 16,
    "images": [
      "https://images.pexels.com/photos/10126655/pexels-photo-10126655.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/36597205/pexels-photo-36597205.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/4480451/pexels-photo-4480451.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/29181493/pexels-photo-29181493.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    ],
    "rating": 4.8,
    "review_count": 743,
    "tags": [
      "bestseller",
      "premium",
      "deal"
    ],
    "is_published": true,
    "category_id": "cat-car-tools"
  },
  {
    "id": "p-032",
    "slug": "tiger-odb2-scanner-professional",
    "title": "Tiger OBD2 Scanner Professional - Bluetooth Diagnostic Tool",
    "brand": "Tiger Auto",
    "description": "Diagnose car problems like a pro with the Tiger OBD2 Scanner. This compact Bluetooth device plugs into your vehicle OBD2 port and connects to your phone, giving you access to the same diagnostic information as a professional mechanic. Read and clear check engine codes, stream live data, and graph sensor readings in real time. The free app includes a database of over 10,000 code definitions.",
    "features": [
      "Bluetooth connectivity to iOS and Android",
      "Reads and clears all OBD2 codes",
      "Live data streaming and graphing",
      "Compatible with all vehicles 1996+",
      "Free app with lifetime updates"
    ],
    "specifications": {
      "Connectivity": "Bluetooth 4.0",
      "Compatibility": "All OBD2 vehicles (1996+)",
      "App": "iOS + Android, free",
      "Code Database": "10,000+ definitions",
      "Dimensions": "48 x 35 x 20mm"
    },
    "price_cents": 8999,
    "compare_at_cents": null,
    "stock": 42,
    "images": [
      "https://images.pexels.com/photos/4116191/pexels-photo-4116191.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/10126655/pexels-photo-10126655.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/8556051/pexels-photo-8556051.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.6,
    "review_count": 1567,
    "tags": [
      "new-arrival"
    ],
    "is_published": true,
    "category_id": "cat-car-tools"
  },
  {
    "id": "p-033",
    "slug": "tiger-car-vacuum-cordless",
    "title": "Tiger Cordless Car Vacuum - High Power handheld",
    "brand": "Tiger Auto",
    "description": "Keep your car spotless with the Tiger Cordless Car Vacuum. The powerful 120W motor tackles dirt, pet hair, and crumbs with ease, while the HEPA filter ensures clean exhaust air. The cordless, USB-C rechargeable design means you are never tethered to an outlet. Three nozzle attachments help you reach every crevice. 30 minutes of runtime handles even the messiest vehicles.",
    "features": [
      "Cordless, USB-C rechargeable",
      "120W high-suction motor",
      "HEPA filter captures 99.9% of particles",
      "Includes 3 nozzle attachments",
      "30-minute runtime per charge"
    ],
    "specifications": {
      "Power": "120W",
      "Runtime": "30 minutes",
      "Charging": "USB-C",
      "Filter": "HEPA (washable)",
      "Weight": "650g"
    },
    "price_cents": 5999,
    "compare_at_cents": 7999,
    "stock": 55,
    "images": [
      "https://images.pexels.com/photos/4488639/pexels-photo-4488639.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/4489749/pexels-photo-4489749.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/4480451/pexels-photo-4480451.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.5,
    "review_count": 2890,
    "tags": [
      "bestseller",
      "deal"
    ],
    "is_published": true,
    "category_id": "cat-car-accessories"
  },
  {
    "id": "p-034",
    "slug": "tiger-car-phone-mount-magnetic",
    "title": "Tiger Magnetic Car Phone Mount - 360 Rotation",
    "brand": "Tiger Auto",
    "description": "Keep your phone secure and visible on every drive with the Tiger Magnetic Car Phone Mount. Six powerful neodymium magnets hold your phone firmly in place, even on bumpy roads.\nThe 360-degree rotation ball joint lets you find the perfect viewing angle. Includes both a vent clip and dashboard adhesive mount for ultimate flexibility.",
    "features": [
      "Strong neodymium magnets",
      "360-degree rotation ball joint",
      "Vent clip and dashboard adhesive options",
      "Compatible with all phone sizes",
      "One-hand mount and release"
    ],
    "specifications": {
      "Mount Type": "Vent clip + dashboard adhesive",
      "Magnets": "6 neodymium",
      "Rotation": "360 degrees",
      "Compatibility": "All phone sizes"
    },
    "price_cents": 1999,
    "compare_at_cents": null,
    "stock": 0,
    "images": [
      "https://images.pexels.com/photos/4489721/pexels-photo-4489721.jpeg?auto=compress&cs=tinysrgb&h=600&w=600",
      "https://images.pexels.com/photos/4116232/pexels-photo-4116232.jpeg?auto=compress&cs=tinysrgb&h=600&w=600"
    ],
    "video_urls": [
      ""
    ],
    "rating": 4.4,
    "review_count": 4567,
    "tags": [
      "out-of-stock",
      "deal"
    ],
    "is_published": true,
    "category_id": "cat-car-accessories"
  }
];

async function runSeed(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const force = new URL(req.url).searchParams.get('force') === 'true';
  const ids = SEED_PRODUCTS.map((p) => p.id);

  try {
    const { count, error: countError } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .in('id', ids);

    if (countError) {
      console.error('[seed-products] existence check failed:', countError);
      return NextResponse.json(
        { error: `Failed to check existing products: ${countError.message}` },
        { status: 500 },
      );
    }

    if ((count ?? 0) > 0 && !force) {
      return NextResponse.json(
        {
          error: `${count} of ${ids.length} seed products already exist. Re-run with ?force=true to overwrite them.`,
          existing: count,
        },
        { status: 409 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .upsert(SEED_PRODUCTS, { onConflict: 'id' })
      .select('id');

    if (error) {
      console.error('[seed-products] upsert failed:', error);
      return NextResponse.json(
        { error: `Upsert failed: ${error.message}`, details: error.details ?? null, hint: error.hint ?? null },
        { status: 500 },
      );
    }

    const written = data?.length ?? 0;
    if (written !== SEED_PRODUCTS.length) {
      return NextResponse.json(
        { error: `Expected ${SEED_PRODUCTS.length} rows written but got ${written}. Check RLS / service role key.` },
        { status: 500 },
      );
    }

    return NextResponse.json({ inserted: written });
  } catch (err) {
    console.error('[seed-products] unexpected error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Seed failed: ${message}` }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return runSeed(req);
}

export async function POST(req: NextRequest) {
  return runSeed(req);
}
