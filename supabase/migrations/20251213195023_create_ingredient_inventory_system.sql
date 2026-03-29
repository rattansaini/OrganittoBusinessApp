/*
  # Create Ingredient Inventory System with Expiry Tracking

  1. New Tables
    - `ingredients`
      - `id` (uuid, primary key)
      - `common_name` (text) - Ingredient name
      - `botanical_name` (text) - Scientific/botanical name
      - `type` (text) - Herb, Oil, Powder, Extract, Base, Preservative, Fragrance, Active
      - `category` (text) - Raw Material, Packaging, Active Ingredient, Base, Preservative
      - `default_unit` (text) - kg, L, g, ml, pieces
      - `typical_shelf_life_months` (integer) - Expected shelf life
      - `ayurvedic_properties` (jsonb) - Array of properties/doshas
      - `reorder_level` (numeric) - Minimum stock threshold
      - `preferred_vendor_id` (uuid) - Preferred vendor
      - `storage_conditions` (text) - Storage requirements
      - `image_url` (text) - Ingredient photo
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `ingredient_stock`
      - `id` (uuid, primary key)
      - `ingredient_id` (uuid, foreign key)
      - `purchase_date` (date) - When purchased
      - `expiry_date` (date) - When expires
      - `quantity` (numeric) - Amount in stock
      - `original_quantity` (numeric) - Original purchase amount
      - `unit` (text) - Measurement unit
      - `lot_number` (text) - Supplier lot/batch number
      - `vendor_id` (uuid) - Vendor who supplied
      - `cost_per_unit` (numeric) - Price per unit
      - `invoice_number` (text) - Purchase invoice
      - `storage_location` (text) - Where stored
      - `quality_cert_url` (text) - Certificate of Analysis URL
      - `status` (text) - active, used, expired
      - `notes` (text)
      - `purchased_by` (uuid)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `ingredient_usage`
      - `id` (uuid, primary key)
      - `ingredient_id` (uuid, foreign key)
      - `stock_id` (uuid, foreign key) - Specific lot used
      - `quantity` (numeric) - Amount used
      - `used_for` (text) - product_batch, testing, samples, waste, other
      - `batch_id` (uuid, nullable) - If used in product batch
      - `product_id` (uuid, nullable) - If used in product
      - `usage_date` (date)
      - `used_by` (uuid)
      - `notes` (text)
      - `created_at` (timestamptz)

    - `ingredient_documents`
      - `id` (uuid, primary key)
      - `ingredient_id` (uuid, foreign key)
      - `stock_id` (uuid, nullable) - Associated lot if applicable
      - `file_name` (text)
      - `file_url` (text)
      - `category` (text) - coa, organic_cert, test_report, msds, specification, photo
      - `expiry_date` (date, nullable) - For certificates
      - `uploaded_by` (uuid)
      - `uploaded_at` (timestamptz)

  2. Security
    - Enable RLS on all ingredient tables
    - Add policies for authenticated users
*/

-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  common_name text NOT NULL,
  botanical_name text,
  type text NOT NULL,
  category text NOT NULL,
  default_unit text DEFAULT 'kg',
  typical_shelf_life_months integer DEFAULT 24,
  ayurvedic_properties jsonb DEFAULT '[]'::jsonb,
  reorder_level numeric DEFAULT 0,
  preferred_vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  storage_conditions text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ingredient_stock table
CREATE TABLE IF NOT EXISTS ingredient_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid REFERENCES ingredients(id) ON DELETE CASCADE NOT NULL,
  purchase_date date NOT NULL,
  expiry_date date NOT NULL,
  quantity numeric NOT NULL,
  original_quantity numeric NOT NULL,
  unit text NOT NULL,
  lot_number text,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  cost_per_unit numeric,
  invoice_number text,
  storage_location text,
  quality_cert_url text,
  status text DEFAULT 'active',
  notes text,
  purchased_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ingredient_usage table
CREATE TABLE IF NOT EXISTS ingredient_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid REFERENCES ingredients(id) ON DELETE CASCADE NOT NULL,
  stock_id uuid REFERENCES ingredient_stock(id) ON DELETE SET NULL,
  quantity numeric NOT NULL,
  used_for text NOT NULL,
  batch_id uuid REFERENCES batches(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  usage_date date NOT NULL,
  used_by uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create ingredient_documents table
CREATE TABLE IF NOT EXISTS ingredient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid REFERENCES ingredients(id) ON DELETE CASCADE NOT NULL,
  stock_id uuid REFERENCES ingredient_stock(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  category text NOT NULL,
  expiry_date date,
  uploaded_by uuid,
  uploaded_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_documents ENABLE ROW LEVEL SECURITY;

-- Policies for ingredients
CREATE POLICY "Users can view ingredients"
  ON ingredients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create ingredients"
  ON ingredients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update ingredients"
  ON ingredients FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete ingredients"
  ON ingredients FOR DELETE
  TO authenticated
  USING (true);

-- Policies for ingredient_stock
CREATE POLICY "Users can view ingredient stock"
  ON ingredient_stock FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create ingredient stock"
  ON ingredient_stock FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update ingredient stock"
  ON ingredient_stock FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete ingredient stock"
  ON ingredient_stock FOR DELETE
  TO authenticated
  USING (true);

-- Policies for ingredient_usage
CREATE POLICY "Users can view ingredient usage"
  ON ingredient_usage FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create ingredient usage"
  ON ingredient_usage FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for ingredient_documents
CREATE POLICY "Users can view ingredient documents"
  ON ingredient_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create ingredient documents"
  ON ingredient_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete ingredient documents"
  ON ingredient_documents FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ingredients_common_name ON ingredients(common_name);
CREATE INDEX IF NOT EXISTS idx_ingredients_type ON ingredients(type);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
CREATE INDEX IF NOT EXISTS idx_ingredient_stock_ingredient_id ON ingredient_stock(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_stock_expiry_date ON ingredient_stock(expiry_date);
CREATE INDEX IF NOT EXISTS idx_ingredient_stock_status ON ingredient_stock(status);
CREATE INDEX IF NOT EXISTS idx_ingredient_usage_ingredient_id ON ingredient_usage(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_usage_batch_id ON ingredient_usage(batch_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_documents_ingredient_id ON ingredient_documents(ingredient_id);

-- Create trigger for updated_at on ingredients
CREATE OR REPLACE FUNCTION update_ingredients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ingredients_updated_at_trigger
  BEFORE UPDATE ON ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_ingredients_updated_at();

-- Create trigger for updated_at on ingredient_stock
CREATE TRIGGER update_ingredient_stock_updated_at_trigger
  BEFORE UPDATE ON ingredient_stock
  FOR EACH ROW
  EXECUTE FUNCTION update_ingredients_updated_at();

-- Function to automatically update stock status based on expiry
CREATE OR REPLACE FUNCTION update_stock_status_on_expiry()
RETURNS void AS $$
BEGIN
  UPDATE ingredient_stock
  SET status = 'expired'
  WHERE expiry_date < CURRENT_DATE
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to update ingredient stock quantity when used
CREATE OR REPLACE FUNCTION update_ingredient_stock_on_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ingredient_stock
  SET 
    quantity = quantity - NEW.quantity,
    status = CASE 
      WHEN quantity - NEW.quantity <= 0 THEN 'used'
      ELSE status
    END
  WHERE id = NEW.stock_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ingredient_stock_on_usage_trigger
  AFTER INSERT ON ingredient_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_ingredient_stock_on_usage();

-- Create view for current ingredient inventory (aggregated by ingredient)
CREATE OR REPLACE VIEW ingredient_inventory_summary AS
SELECT 
  i.id as ingredient_id,
  i.common_name,
  i.botanical_name,
  i.type,
  i.category,
  i.default_unit,
  i.reorder_level,
  i.preferred_vendor_id,
  i.image_url,
  COALESCE(SUM(CASE WHEN s.status = 'active' THEN s.quantity ELSE 0 END), 0) as total_stock,
  MIN(CASE WHEN s.status = 'active' THEN s.expiry_date END) as earliest_expiry,
  MAX(CASE WHEN s.status = 'active' THEN s.expiry_date END) as latest_expiry,
  COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_lots,
  AVG(CASE WHEN s.status = 'active' THEN s.cost_per_unit END) as avg_cost_per_unit,
  MAX(s.purchase_date) as last_purchase_date,
  CASE 
    WHEN MIN(CASE WHEN s.status = 'active' THEN s.expiry_date END) < CURRENT_DATE THEN 'expired'
    WHEN MIN(CASE WHEN s.status = 'active' THEN s.expiry_date END) <= CURRENT_DATE + INTERVAL '15 days' THEN 'expiring_soon'
    WHEN MIN(CASE WHEN s.status = 'active' THEN s.expiry_date END) <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_30d'
    WHEN COALESCE(SUM(CASE WHEN s.status = 'active' THEN s.quantity ELSE 0 END), 0) = 0 THEN 'out_of_stock'
    WHEN COALESCE(SUM(CASE WHEN s.status = 'active' THEN s.quantity ELSE 0 END), 0) < i.reorder_level THEN 'low_stock'
    ELSE 'good_stock'
  END as inventory_status
FROM ingredients i
LEFT JOIN ingredient_stock s ON i.id = s.ingredient_id
GROUP BY i.id, i.common_name, i.botanical_name, i.type, i.category, i.default_unit, i.reorder_level, i.preferred_vendor_id, i.image_url;
