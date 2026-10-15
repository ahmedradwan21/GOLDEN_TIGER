'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Locale = 'en' | 'ar';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = 'gt-locale';

const dict: Record<Locale, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.categories': 'All Categories',
    'nav.login': 'Login',
    'nav.account': 'My Account',
    'nav.logout': 'Log out',
    'nav.cart': 'Cart',
    'nav.search': 'Search products...',
    'topbar.freeship': 'Free shipping on orders over $50',
    'topbar.returns': '30-day returns',
    'topbar.secure': 'Secure payments',
    'product.addCart': 'Add to Cart',
    'product.buyNow': 'Buy Now',
    'product.inStock': 'In Stock',
    'product.lowStock': 'Only {n} left in stock',
    'product.outOfStock': 'Out of Stock',
    'product.quantity': 'Quantity:',
    'product.points': 'Points',
    'product.pointsEarn': 'Earn',
    'product.pointsDesc': 'loyalty points with this purchase',
    'product.freeDelivery': 'FREE delivery by',
    'product.secureTransaction': 'Secure transaction. 30-day returns.',
    'checkout.title': 'Checkout',
    'checkout.shipping': 'Shipping Details',
    'checkout.payment': 'Payment',
    'checkout.review': 'Review & Place Order',
    'checkout.subtotal': 'Subtotal',
    'checkout.tax': 'Tax',
    'checkout.shippingFee': 'Shipping',
    'checkout.total': 'Total',
    'checkout.placeOrder': 'Place Order',
    'checkout.email': 'Email',
    'checkout.phone': 'Phone',
    'checkout.fullName': 'Full Name',
    'checkout.address': 'Address',
    'checkout.city': 'City',
    'checkout.postalCode': 'Postal Code',
    'checkout.country': 'Country',
    'loyalty.title': 'Loyalty Rewards',
    'loyalty.yourPoints': 'Your Points',
    'loyalty.exchange': 'Exchange Points',
    'loyalty.notEnough': 'Not enough points yet',
    'loyalty.keepShopping': 'Keep shopping to earn more points!',
    'campaign.blackFriday': 'Black Friday Sale',
    'campaign.midMonth': 'Mid-Month Flash Sale',
    'campaign.monthlyStart': 'Monthly Start Sale',
    'campaign.startsIn': 'Starts in',
    'campaign.endsIn': 'Ends in',
    'campaign.shopNow': 'Shop Now',
    'footer.newsletter': 'Subscribe to our newsletter',
    'footer.subscribe': 'Subscribe',
    'footer.emailPlaceholder': 'Enter your email',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',

    'admin.title': 'Golden Tiger',
    'admin.subtitle': 'Admin',
    'admin.nav.overview': 'Overview',
    'admin.nav.analytics': 'Analytics',
    'admin.nav.inventory': 'Inventory',
    'admin.nav.orders': 'Orders',
    'admin.nav.loyalty': 'Loyalty & LTV',
    'admin.nav.campaigns': 'Campaigns',
    'admin.action.store': 'Store',
    'admin.action.logout': 'Logout',
    'admin.analytics.title': 'Analytics & CTR',
    'admin.analytics.subtitle': 'Click-through rates, conversion funnel, and device breakdown',
    'admin.analytics.impressions': 'Impressions',
    'admin.analytics.clicks': 'Clicks',
    'admin.analytics.ctr': 'CTR',
    'admin.analytics.addToCart': 'Add to Cart',
    'admin.analytics.dailyChart': 'Daily Impressions vs Clicks',
    'admin.analytics.funnel': 'Conversion Funnel',
    'admin.analytics.device': 'Device Breakdown',
    'admin.analytics.topProducts': 'Top Products by Clicks',
    'admin.analytics.product': 'Product',
    'admin.analytics.overallConversion': 'Overall Conversion',
    'admin.analytics.searchGaps': 'Fuzzy Search Gaps',
    'admin.analytics.searchGapsDesc': 'Top searched queries that returned 0 results — opportunities to add products or improve keywords',
    'admin.analytics.noSearchGaps': 'No zero-result searches recorded yet',
    'admin.analytics.lowStock': 'Low Stock Warning',
    'admin.analytics.lowStockDesc': 'Items nearing depletion — restock soon to avoid lost sales',
    'admin.analytics.allStocked': 'All products well stocked',
    'admin.analytics.outOfStock': 'OUT OF STOCK',
    'admin.analytics.left': 'left',
    'admin.analytics.results': 'results',
    'admin.loyalty.title': 'Loyalty & Customer LTV',
    'admin.loyalty.subtitle': 'Top buyers by total spending — generate custom coupons with one click',
    'admin.loyalty.totalSpent': 'Total Spent',
    'admin.loyalty.orders': 'Orders',
    'admin.loyalty.points': 'Points',
    'admin.loyalty.sendCoupon': 'Send Coupon',
    'admin.loyalty.guest': 'GUEST',
    'admin.loyalty.registered': 'REGISTERED',
    'admin.loyalty.noData': 'No completed orders yet. Customer data will appear here once orders start coming in.',
    'admin.campaigns.title': 'Campaign Manager',
    'admin.campaigns.subtitle': 'Activate seasonal campaigns to trigger storefront banners, ribbons, and countdown timers',
    'admin.campaigns.active': 'ACTIVE',
    'admin.campaigns.inactive': 'INACTIVE',
    'admin.campaigns.discount': 'Discount Percentage',
    'admin.campaigns.activate': 'Activate Campaign',
    'admin.campaigns.deactivate': 'Deactivate',
    'admin.campaigns.howTitle': 'How Campaigns Work',
    'admin.campaigns.how1': 'Activating a campaign displays a promotional banner with countdown timer at the top of every storefront page.',
    'admin.campaigns.how2': 'Product cards show campaign ribbons indicating the discount percentage.',
    'admin.campaigns.how3': 'Only one campaign banner shows at a time — the first active campaign takes priority.',
  },
  ar: {
    'nav.home': 'الرئيسية',
    'nav.categories': 'كل الفئات',
    'nav.login': 'تسجيل الدخول',
    'nav.account': 'حسابي',
    'nav.logout': 'تسجيل الخروج',
    'nav.cart': 'السلة',
    'nav.search': 'ابحث عن المنتجات...',
    'topbar.freeship': 'شحن مجاني للطلبات فوق 50 دولار',
    'topbar.returns': 'إرجاع خلال 30 يوم',
    'topbar.secure': 'مدفوعات آمنة',
    'product.addCart': 'أضف إلى السلة',
    'product.buyNow': 'اشتر الآن',
    'product.inStock': 'متوفر',
    'product.lowStock': 'بقي {n} فقط في المخزون',
    'product.outOfStock': 'غير متوفر',
    'product.quantity': 'الكمية:',
    'product.points': 'النقاط',
    'product.pointsEarn': 'اكسب',
    'product.pointsDesc': 'نقاط ولاء مع هذا الشراء',
    'product.freeDelivery': 'توصيل مجاني بحلول',
    'product.secureTransaction': 'معاملة آمنة. إرجاع خلال 30 يوم.',
    'checkout.title': 'الدفع',
    'checkout.shipping': 'تفاصيل الشحن',
    'checkout.payment': 'الدفع',
    'checkout.review': 'مراجعة وتقديم الطلب',
    'checkout.subtotal': 'المجموع الفرعي',
    'checkout.tax': 'الضريبة',
    'checkout.shippingFee': 'الشحن',
    'checkout.total': 'الإجمالي',
    'checkout.placeOrder': 'تقديم الطلب',
    'checkout.email': 'البريد الإلكتروني',
    'checkout.phone': 'الهاتف',
    'checkout.fullName': 'الاسم الكامل',
    'checkout.address': 'العنوان',
    'checkout.city': 'المدينة',
    'checkout.postalCode': 'الرمز البريدي',
    'checkout.country': 'الدولة',
    'loyalty.title': 'مكافآت الولاء',
    'loyalty.yourPoints': 'نقاطك',
    'loyalty.exchange': 'استبدل النقاط',
    'loyalty.notEnough': 'لا توجد نقاط كافية بعد',
    'loyalty.keepShopping': 'استمر في التسوق لكسب المزيد من النقاط!',
    'campaign.blackFriday': 'تخفيضات الجمعة البيضاء',
    'campaign.midMonth': 'تخفيضات منتصف الشهر',
    'campaign.monthlyStart': 'تخفيضات بداية الشهر',
    'campaign.startsIn': 'يبدأ خلال',
    'campaign.endsIn': 'ينتهي خلال',
    'campaign.shopNow': 'تسوق الآن',
    'footer.newsletter': 'اشترك في النشرة الإخبارية',
    'footer.subscribe': 'اشترك',
    'footer.emailPlaceholder': 'أدخل بريدك الإلكتروني',
    'theme.light': 'فاتح',
    'theme.dark': 'داكن',
    'theme.system': 'النظام',

    'admin.title': 'النمر الذهبي',
    'admin.subtitle': 'لوحة التحكم',
    'admin.nav.overview': 'نظرة عامة',
    'admin.nav.analytics': 'التحليلات',
    'admin.nav.inventory': 'المخزون',
    'admin.nav.orders': 'الطلبات',
    'admin.nav.loyalty': 'الولاء والقيمة',
    'admin.nav.campaigns': 'الحملات',
    'admin.action.store': 'المتجر',
    'admin.action.logout': 'تسجيل الخروج',
    'admin.analytics.title': 'التحليلات ونسبة النقر',
    'admin.analytics.subtitle': 'نسب النقر، قمع التحويل، وتوزيع الأجهزة',
    'admin.analytics.impressions': 'الظهور',
    'admin.analytics.clicks': 'النقرات',
    'admin.analytics.ctr': 'نسبة النقر',
    'admin.analytics.addToCart': 'أضف إلى السلة',
    'admin.analytics.dailyChart': 'الظهور مقابل النقرات اليومية',
    'admin.analytics.funnel': 'قمع التحويل',
    'admin.analytics.device': 'توزيع الأجهزة',
    'admin.analytics.topProducts': 'أفضل المنتجات حسب النقرات',
    'admin.analytics.product': 'المنتج',
    'admin.analytics.overallConversion': 'إجمالي التحويل',
    'admin.analytics.searchGaps': 'فجوات البحث',
    'admin.analytics.searchGapsDesc': 'أكثر استعلامات البحث التي لم تُرجع نتائج — فرص لإضافة منتجات أو تحسين الكلمات المفتاحية',
    'admin.analytics.noSearchGaps': 'لا توجد استعلامات بلا نتائج مسجلة بعد',
    'admin.analytics.lowStock': 'تحذير نقص المخزون',
    'admin.analytics.lowStockDesc': 'منتجات على وشك النفاد — أعد التخزين قريباً لتجنب خسارة المبيعات',
    'admin.analytics.allStocked': 'جميع المنتجات متوفرة بكميات جيدة',
    'admin.analytics.outOfStock': 'نفد المخزون',
    'admin.analytics.left': 'متبقي',
    'admin.analytics.results': 'نتائج',
    'admin.loyalty.title': 'الولاء وقيمة العميل',
    'admin.loyalty.subtitle': 'أفضل المشترين حسب إجمالي الإنفاق — أنشئ كوبونات مخصصة بنقرة واحدة',
    'admin.loyalty.totalSpent': 'إجمالي الإنفاق',
    'admin.loyalty.orders': 'الطلبات',
    'admin.loyalty.points': 'النقاط',
    'admin.loyalty.sendCoupon': 'إرسال كوبون',
    'admin.loyalty.guest': 'ضيف',
    'admin.loyalty.registered': 'مسجل',
    'admin.loyalty.noData': 'لا توجد طلبات مكتملة بعد. ستظهر بيانات العملاء هنا عند بدء استلام الطلبات.',
    'admin.campaigns.title': 'مدير الحملات',
    'admin.campaigns.subtitle': 'فعّل الحملات الموسمية لإظهار لافتات ترويجية ومؤقتات تنازلية على واجهة المتجر',
    'admin.campaigns.active': 'نشط',
    'admin.campaigns.inactive': 'غير نشط',
    'admin.campaigns.discount': 'نسبة الخصم',
    'admin.campaigns.activate': 'تفعيل الحملة',
    'admin.campaigns.deactivate': 'إلغاء التفعيل',
    'admin.campaigns.howTitle': 'كيف تعمل الحملات',
    'admin.campaigns.how1': 'تفعيل الحملة يُظهر لافتة ترويجية مع مؤقت تنازلي في أعلى كل صفحة في المتجر.',
    'admin.campaigns.how2': 'بطاقات المنتجات تُظهر شعارات الحملة تشير إلى نسبة الخصم.',
    'admin.campaigns.how3': 'يظهر لافتة حملة واحدة فقط في كل مرة — أول حملة نشطة لها الأولوية.',
  },
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === 'en' || stored === 'ar') {
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next = prev === 'en' ? 'ar' : 'en';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key: string) => {
      return dict[locale][key] ?? dict.en[key] ?? key;
    },
    [locale]
  );

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <I18nContext.Provider value={{ locale, setLocale, toggleLocale, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
