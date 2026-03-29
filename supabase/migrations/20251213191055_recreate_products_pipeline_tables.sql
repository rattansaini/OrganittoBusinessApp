/*
  # Recreate Product Pipeline Tables

  1. Changes
    - Drop existing products table
    - Create new products table with pipeline fields
    - Create product_stage_history table

  2. New Products Table Structure
    - `id` (uuid, primary key)
    - `name` (text, required) - Product name
    - `category` (text, required) - Product category
    - `product_type` (text) - Type of product
    - `description` (text) - Product description
    - `image_url` (text) - Product image URL
    - `current_stage` (text, required) - Current pipeline stage
    - `priority` (text, required) - Priority level
    - `target_launch_date` (date) - Target launch date
    - `stage_entered_at` (timestamptz) - When entered current stage
    - `assigned_partners` (jsonb) - Array of user IDs
    - `progress` (integer) - Progress percentage
    - `created_by` (uuid) - User who created the product
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Drop existing products table
DROP TABLE IF EXISTS products CASCADE;

-- Create new products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  product_type text,
  description text,
  image_url text,
  current_stage text NOT NULL DEFAULT 'idea',
  priority text NOT NULL DEFAULT 'medium',
  target_launch_date date,
  stage_entered_at timestamptz DEFAULT now(),
  assigned_partners jsonb DEFAULT '[]'::jsonb,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create product_stage_history table
CREATE TABLE IF NOT EXISTS product_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  stage text NOT NULL,
  entered_at timestamptz DEFAULT now(),
  exited_at timestamptz,
  moved_by uuid,
  notes text
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_stage_history ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Users can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- Product stage history policies
CREATE POLICY "Users can view product stage history"
  ON product_stage_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create product stage history"
  ON product_stage_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX idx_products_current_stage ON products(current_stage);
CREATE INDEX idx_products_priority ON products(priority);
CREATE INDEX idx_products_created_by ON products(created_by);
CREATE INDEX idx_product_stage_history_product_id ON product_stage_history(product_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_products_updated_at_trigger
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();
