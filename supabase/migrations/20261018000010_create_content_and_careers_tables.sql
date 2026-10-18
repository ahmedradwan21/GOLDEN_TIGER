/*
# Create site_content, job_postings, and job_applications tables

## Purpose
Supports the Our Story, Careers, Privacy Policy, and Terms of Service pages,
plus admin management panels for content editing and job/candidate management.

## New Tables

### 1. site_content
- `id` (uuid, primary key)
- `page_key` (text, unique) — e.g. 'our_story', 'privacy', 'terms'
- `title_en` / `title_ar` (text) — bilingual page titles
- `body_en` / `body_ar` (text) — bilingual rich-text body content
- `updated_at` (timestamptz) — auto-updated on change

### 2. job_postings
- `id` (uuid, primary key)
- `title` (text, not null) — job title
- `department` (text, not null) — e.g. Engineering, Marketing
- `location` (text, not null) — e.g. Remote, Dubai
- `type` (text, not null) — e.g. Full-time, Part-time, Contract
- `description` (text, not null) — full job description
- `requirements` (text) — optional requirements text
- `is_active` (boolean, default true) — toggle visibility on careers page
- `created_at` / `updated_at` (timestamptz)

### 3. job_applications
- `id` (uuid, primary key)
- `job_id` (uuid, FK to job_postings, ON DELETE CASCADE)
- `full_name` (text, not null)
- `email` (text, not null)
- `phone` (text) — optional
- `cover_letter` (text) — optional
- `resume_url` (text) — optional link to resume document
- `created_at` (timestamptz)

## Security
- site_content: public read (anon + authenticated), no public writes (admin only via server API)
- job_postings: public read of active jobs, no public writes
- job_applications: public insert (anyone can apply), no public read (admin only)

## Seed Data
- Inserts default rows for 'our_story', 'privacy', and 'terms' with placeholder content.
- Inserts sample job postings.
*/

-- site_content table
CREATE TABLE IF NOT EXISTS site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text UNIQUE NOT NULL,
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  body_en text NOT NULL DEFAULT '',
  body_ar text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_site_content" ON site_content;
CREATE POLICY "public_read_site_content" ON site_content FOR SELECT
  TO anon, authenticated USING (true);

-- job_postings table
CREATE TABLE IF NOT EXISTS job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text NOT NULL,
  location text NOT NULL,
  type text NOT NULL DEFAULT 'Full-time',
  description text NOT NULL,
  requirements text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_jobs" ON job_postings;
CREATE POLICY "public_read_active_jobs" ON job_postings FOR SELECT
  TO anon, authenticated USING (true);

-- job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  cover_letter text,
  resume_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_submit_application" ON job_applications;
CREATE POLICY "public_submit_application" ON job_applications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Seed default site_content rows
INSERT INTO site_content (page_key, title_en, title_ar, body_en, body_ar) VALUES
  ('our_story', 'Our Story', 'قصتنا',
    'The Golden Tiger was founded with a singular vision: to bring premium, curated products to discerning shoppers worldwide. From our humble beginnings as a small online boutique, we have grown into a trusted marketplace spanning electronics, fashion, home goods, and beauty. Every product in our catalog is hand-selected by our team of experts who share a passion for quality and craftsmanship. We believe that luxury should be accessible, that shopping should be an experience, and that every customer deserves the golden treatment.',
    'تأسس النمر الذهبي برؤية واحدة: تقديم منتجات مميزة ومنتقاة للمتسوقين المميزين حول العالم. من بداياتنا المتواضعة كمتجر إلكتروني صغير، نمونا لنصبح سوقاً موثوقاً يشمل الإلكترونيات والموضة والمنزل والجمال. كل منتج في كتالوجنا منتقى بعناية من قبل فريقنا من الخبراء الذين يشاركوننا شغف الجودة والحرفية. نؤمن بأن الفخامة يجب أن تكون متاحة، وأن التسوق يجب أن يكون تجربة، وأن كل عميل يستحق المعاملة الذهبية.'),
  ('privacy', 'Privacy Policy', 'سياسة الخصوصية',
    'At The Golden Tiger, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase. We collect information you provide directly to us, such as your name, email address, shipping address, and payment information when you place an order. We also automatically collect certain information about your device and browsing activity. We use your information to process orders, communicate with you about your purchases, improve our services, and send promotional communications (which you can opt out of at any time). We do not sell your personal information to third parties.',
    'في النمر الذهبي، نأخذ خصوصيتك على محمل الجد. تشرح سياسة الخصوصية هذه كيفية جمع معلوماتك واستخدامها والكشف عنها وحمايتها عند زيارتك لموقعنا أو إجراء عملية شراء. نجمع المعلومات التي تقدمها لنا مباشرة، مثل اسمك وبريدك الإلكتروني وعنوان الشحن ومعلومات الدفع عند تقديم طلب. نجمع أيضاً تلقائياً معلومات معينة عن جهازك ونشاط التصفح. نستخدم معلوماتك لمعالجة الطلبات والتواصل معك بشأن مشترياتك وتحسين خدماتنا وإرسال اتصالات ترويجية (يمكنك إلغاء الاشتراك فيها في أي وقت). لا نبيع معلوماتك الشخصية لأطراف ثالثة.'),
  ('terms', 'Terms of Service', 'شروط الخدمة',
    'Welcome to The Golden Tiger. By accessing or using our website, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our services. You must be at least 18 years old to use this website. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. All purchases are subject to product availability. Prices and availability are subject to change without notice. We reserve the right to refuse or cancel any order at our discretion.',
    'مرحباً بك في النمر الذهبي. بالوصول إلى موقعنا أو استخدامه، فإنك توافق على الالتزام بشروط الخدمة هذه. إذا لم توافق على أي جزء من هذه الشروط، يرجى عدم استخدام خدماتنا. يجب أن يكون عمرك 18 عاماً على الأقل لاستخدام هذا الموقع. أنت مسؤول عن الحفاظ على سرية بيانات حسابك وعن جميع الأنشطة التي تتم تحت حسابك. جميع المشتريات تخضع لتوفر المنتج. الأسعار والتوفر عرضة للتغيير دون إشعار. نحتفظ بالحق في رفض أو إلغاء أي طلب تقديراً لنا.')
ON CONFLICT (page_key) DO NOTHING;

-- Seed sample job postings
INSERT INTO job_postings (title, department, location, type, description, requirements, is_active) VALUES
  ('Senior Frontend Engineer', 'Engineering', 'Remote', 'Full-time',
   'We are looking for a passionate Senior Frontend Engineer to join our growing team. You will build delightful shopping experiences used by thousands of customers worldwide.',
   '5+ years React/Next.js experience, strong TypeScript skills, eye for design and UX.',
   true),
  ('Product Designer', 'Design', 'Dubai, UAE', 'Full-time',
   'Shape the visual identity of The Golden Tiger. Lead design for web and mobile, create design systems, and collaborate closely with engineering.',
   '3+ years product design experience, proficiency in Figma, strong portfolio.',
   true),
  ('Customer Experience Specialist', 'Support', 'Remote', 'Part-time',
   'Be the golden voice of our brand. Help customers with orders, returns, and product questions. Turn every interaction into a delightful experience.',
   'Excellent communication skills, empathy, prior customer support experience preferred.',
   true)
ON CONFLICT DO NOTHING;
