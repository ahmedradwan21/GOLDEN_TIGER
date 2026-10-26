/*
# Seed categories
Inserts 25 categories (8 top-level + 17 subcategories) for The Golden Tiger store.
*/

INSERT INTO categories (id, slug, name, parent_id, image_url, sort_order) VALUES
  ('cat-electronics','electronics','Electronics',NULL,'https://images.pexels.com/photos/16387546/pexels-photo-16387546.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',0),
  ('cat-audio','audio','Audio','cat-electronics','https://images.pexels.com/photos/10885667/pexels-photo-10885667.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',1),
  ('cat-wearables','wearables','Wearables','cat-electronics','https://images.pexels.com/photos/5208869/pexels-photo-5208869.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',2),
  ('cat-computing','computing','Computing','cat-electronics','https://images.pexels.com/photos/25772336/pexels-photo-25772336.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',3),
  ('cat-fashion','fashion','Fashion',NULL,'https://images.pexels.com/photos/1488470/pexels-photo-1488470.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',4),
  ('cat-mens-fashion','mens-fashion','Men''s Fashion','cat-fashion','https://images.pexels.com/photos/9594692/pexels-photo-9594692.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',5),
  ('cat-womens-fashion','womens-fashion','Women''s Fashion','cat-fashion','https://images.pexels.com/photos/9558711/pexels-photo-9558711.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',6),
  ('cat-home-kitchen','home-kitchen','Home & Kitchen',NULL,'https://images.pexels.com/photos/7166645/pexels-photo-7166645.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',7),
  ('cat-kitchen-appliances','kitchen-appliances','Kitchen Appliances','cat-home-kitchen','https://images.pexels.com/photos/4713243/pexels-photo-4713243.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',8),
  ('cat-home-decor','home-decor','Home Decor','cat-home-kitchen','https://images.pexels.com/photos/12128381/pexels-photo-12128381.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',9),
  ('cat-beauty','beauty','Beauty',NULL,'https://images.pexels.com/photos/16233812/pexels-photo-16233812.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',10),
  ('cat-skincare','skincare','Skincare','cat-beauty','https://images.pexels.com/photos/36339062/pexels-photo-36339062.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',11),
  ('cat-makeup','makeup','Makeup','cat-beauty','https://images.pexels.com/photos/7256102/pexels-photo-7256102.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',12),
  ('cat-sports-outdoors','sports-outdoors','Sports & Outdoors',NULL,'https://images.pexels.com/photos/20500863/pexels-photo-20500863.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',13),
  ('cat-fitness-equipment','fitness-equipment','Fitness Equipment','cat-sports-outdoors','https://images.pexels.com/photos/6740821/pexels-photo-6740821.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',14),
  ('cat-outdoor-gear','outdoor-gear','Outdoor Gear','cat-sports-outdoors','https://images.pexels.com/photos/4793221/pexels-photo-4793221.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',15),
  ('cat-toys-games','toys-games','Toys & Games',NULL,'https://images.pexels.com/photos/27403981/pexels-photo-27403981.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',16),
  ('cat-board-games','board-games','Board Games','cat-toys-games','https://images.pexels.com/photos/9090534/pexels-photo-9090534.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',17),
  ('cat-puzzles','puzzles','Puzzles','cat-toys-games','https://images.pexels.com/photos/207924/pexels-photo-207924.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',18),
  ('cat-books','books','Books',NULL,'https://images.pexels.com/photos/8762862/pexels-photo-8762862.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',19),
  ('cat-fiction','fiction','Fiction','cat-books','https://images.pexels.com/photos/1132577/pexels-photo-1132577.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',20),
  ('cat-non-fiction','non-fiction','Non-Fiction','cat-books','https://images.pexels.com/photos/1693959/pexels-photo-1693959.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',21),
  ('cat-automotive','automotive','Automotive',NULL,'https://images.pexels.com/photos/4480451/pexels-photo-4480451.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',22),
  ('cat-car-tools','car-tools','Car Tools','cat-automotive','https://images.pexels.com/photos/10126655/pexels-photo-10126655.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',23),
  ('cat-car-accessories','car-accessories','Car Accessories','cat-automotive','https://images.pexels.com/photos/4116191/pexels-photo-4116191.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',24)
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, parent_id=EXCLUDED.parent_id, image_url=EXCLUDED.image_url, sort_order=EXCLUDED.sort_order;