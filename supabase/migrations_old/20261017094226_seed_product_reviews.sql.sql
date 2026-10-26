-- Seed product_reviews with realistic customer reviews across 20 products
-- All reviews are pre-approved (is_approved = true) so they display immediately

INSERT INTO product_reviews (product_id, author_name, rating, comment, is_approved, created_at)
VALUES
  -- p-001: Aurum Wireless Earbuds Pro
  ('p-001', 'Ahmed K.', 5, 'Best earbuds I have ever owned. The noise cancellation is incredible and the bass is deep without being overwhelming. Battery lasts a full work day.', true, '2026-10-01 10:30:00+00'),
  ('p-001', 'Sarah Mitchell', 4, 'Great sound quality and comfortable fit. Only complaint is the case is a bit bulky compared to my old ones.', true, '2026-10-03 14:20:00+00'),
  ('p-001', 'Omar Farouk', 5, 'Worth every penny. The ANC rivals brands costing twice as much.', true, '2026-10-05 09:15:00+00'),

  -- p-002: Aurum Studio Over-Ear Headphones
  ('p-002', 'James Chen', 5, 'The Hi-Res audio certification is no joke. Hearing details in songs I have listened to hundreds of times that I never noticed before.', true, '2026-10-02 11:00:00+00'),
  ('p-002', 'Fatima Al-Sayed', 4, 'Excellent sound but they get a bit warm after extended listening sessions. Still highly recommend.', true, '2026-10-06 16:45:00+00'),

  -- p-003: Aurum XL Portable Bluetooth Speaker
  ('p-003', 'David Park', 4, 'Impressive 360-degree sound for the size. Pool parties will never be the same.', true, '2026-10-04 13:10:00+00'),

  -- p-004: Tiger Smartwatch Gold Edition
  ('p-004', 'Layla Hassan', 5, 'The gold finish looks premium and the health tracking features are spot on. Step counting matches my phone perfectly.', true, '2026-10-02 08:30:00+00'),
  ('p-004', 'Robert Taylor', 4, 'Great watch but the battery could last longer. I get about 4 days per charge with moderate use.', true, '2026-10-07 19:20:00+00'),
  ('p-004', 'Noura Ibrahim', 5, 'Replaced my old Fitbit with this and never looked back. The screen is gorgeous and the app is intuitive.', true, '2026-10-10 12:00:00+00'),

  -- p-006: Aurum Ultrabook 14 Pro
  ('p-006', 'Michael Stevens', 5, 'Fast, light, and the battery genuinely lasts 10 hours for office work. The keyboard is excellent for long typing sessions.', true, '2026-10-03 10:00:00+00'),
  ('p-006', 'Priya Sharma', 4, 'Powerful machine for the price. Wish it had more USB-C ports though.', true, '2026-10-08 15:30:00+00'),

  -- p-007: Aurum Mechanical Keyboard RGB
  ('p-007', 'Yusuf Rahman', 5, 'Hot-swappable switches are a game changer. Swapped to silent reds in 10 minutes and it feels like a custom board.', true, '2026-10-05 18:00:00+00'),
  ('p-007', 'Emma Wilson', 4, 'Beautiful RGB lighting and solid build. The software could be better but the hardware is top notch.', true, '2026-10-09 11:45:00+00'),

  -- p-008: Men's Premium Cotton T-Shirt
  ('p-008', 'Khalid Mohammed', 5, 'The cotton is thick and soft. Holds up great after multiple washes with no shrinking or fading.', true, '2026-10-01 09:00:00+00'),
  ('p-008', 'Tom Bradley', 4, 'Good quality shirts but the sizing runs slightly large. Order a size down if you prefer a fitted look.', true, '2026-10-06 14:00:00+00'),

  -- p-010: Women's Silk Blend Blouse
  ('p-010', 'Aisha Mansour', 5, 'The silk blend feels luxurious and the ivory color is even prettier in person. Got compliments all day at work.', true, '2026-10-04 10:15:00+00'),

  -- p-012: Tiger Pro Blender 1500W
  ('p-012', 'Daniel Garcia', 5, 'Crushes ice like nothing. Made smoothies every morning for a month and the motor has not struggled once.', true, '2026-10-03 07:30:00+00'),
  ('p-012', 'Hala Khoury', 4, 'Powerful blender but it is loud. Works perfectly though and cleans easily.', true, '2026-10-07 08:00:00+00'),

  -- p-013: Tiger Espresso Machine Pro
  ('p-013', 'Marco Rossi', 5, '15 bars of pressure makes genuine cafe-quality espresso. The milk frother works brilliantly for cappuccinos.', true, '2026-10-05 07:45:00+00'),

  -- p-016: Tiger Hyaluronic Acid Serum
  ('p-016', 'Sara Johnson', 5, 'My skin has never looked better. The gold infusion gives a subtle glow and it absorbs quickly without stickiness.', true, '2026-10-02 20:00:00+00'),
  ('p-016', 'Mariam Ali', 4, 'Good serum but the price is on the higher side. Results are noticeable after about two weeks of use.', true, '2026-10-08 21:30:00+00'),

  -- p-017: Tiger Vitamin C Brightening Night Cream
  ('p-017', 'Jennifer Lee', 5, 'Dark spots have visibly faded after 3 weeks. Goes on smooth and does not clog pores.', true, '2026-10-04 22:00:00+00'),

  -- p-020: Tiger Adjustable Dumbbells 50lb
  ('p-020', 'Chris Anderson', 5, 'Saved so much space replacing my rack of fixed dumbbells. The adjustment mechanism is quick and feels secure.', true, '2026-10-01 16:00:00+00'),
  ('p-020', 'Abdul Aziz', 4, 'Great for home workouts. The dial can stick occasionally but overall a solid product.', true, '2026-10-09 17:15:00+00'),

  -- p-021: Tiger Premium Yoga Mat 6mm
  ('p-021', 'Sophie Martin', 5, 'The extra thickness makes a huge difference for my knees. Non-slip surface holds even during hot yoga.', true, '2026-10-06 06:30:00+00'),

  -- p-022: Tiger Hiking Backpack 40L
  ('p-022', 'Hassan Tariq', 5, 'Carried it on a 5-day trek through the mountains. Waterproofing held up in heavy rain and the weight distribution is excellent.', true, '2026-10-05 08:00:00+00'),

  -- p-024: Tiger Strategy Board Game Deluxe
  ('p-024', 'Lisa Thompson', 5, 'Family game night has a new champion. The deluxe components are beautiful and the strategy depth is perfect.', true, '2026-10-03 19:00:00+00'),

  -- p-027: The Midnight Trail - Mystery Novel
  ('p-027', 'Rania Mahmoud', 5, 'Could not put it down. The plot twists kept me guessing until the very last page.', true, '2026-10-04 21:00:00+00'),
  ('p-027', 'Victor Hughes', 4, 'Solid mystery with well-developed characters. The pacing slows a bit in the middle but the ending is worth it.', true, '2026-10-09 22:15:00+00'),

  -- p-029: The Golden Hour - Productivity Guide
  ('p-029', 'Kevin Brooks', 5, 'Actually changed how I structure my mornings. Practical advice without the fluff most productivity books have.', true, '2026-10-06 07:00:00+00'),

  -- p-031: Tiger Pro Mechanic Tool Set 200 Piece
  ('p-031', 'Saeed Al-Hashimi', 5, 'Comprehensive set that covers everything I need for car maintenance. The case keeps everything organized.', true, '2026-10-02 15:00:00+00'),

  -- p-032: Tiger OBD2 Scanner Professional
  ('p-032', 'Adam Peterson', 4, 'Bluetooth connection works flawlessly with my phone. Identified a code my mechanic missed. Saved me 200 dollars.', true, '2026-10-07 11:00:00+00'),

  -- p-034: Tiger Magnetic Car Phone Mount
  ('p-034', 'Reem Saeed', 5, 'Holds my phone securely even on bumpy roads. The 360 rotation is handy for navigation. Simple and effective.', true, '2026-10-05 09:00:00+00')
ON CONFLICT DO NOTHING;
