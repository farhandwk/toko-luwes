-- (BACA SEBELUM PAKAI!!!)
-- SCRIPT INI MASIH HARUS DIKONFIRMASI DENGAN BENTUK ASLI DATA DI LAPANGAN (BELUM BISA DIPAKAI)
-- AKAN DIPAKAI UNTUK AUTO MAPPING SATUAN SETIAP PRODUK DALAM DATABASE SUPABASE

-- 1. Berikan satuan 'KG' untuk produk yang mengandung kata 'KG' atau 'LPG'
UPDATE products SET unitid = (SELECT id FROM units WHERE name = 'KG' LIMIT 1)
WHERE name ILIKE '%KG%' OR name ILIKE '%LPG%' OR name '%Gula%' OR name '%Tepung%';

-- 2. Berikan satuan 'LITER' untuk produk cairan
UPDATE products SET unitid = (SELECT id FROM units WHERE name = 'LITER' LIMIT 1)
WHERE name ILIKE '%Minyak%' OR name ;

-- 3. Berikan satuan 'UNIT' untuk produk saset
UPDATE products SET unitid = (SELECT id FROM units WHERE name = 'UNIT' LIMIT 1)
WHERE name ILIKE '%saset%' OR name ILIKE '%renceng%';


