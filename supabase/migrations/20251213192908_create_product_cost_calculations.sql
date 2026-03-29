/*
  # Create Product Cost Calculations Table

  1. New Tables
    - `product_cost_calculations`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key, nullable) - References products (nullable for ad-hoc calculations)
      - `calculation_name` (text) - Name for this calculation version
      - `batch_size` (integer) - Number of units in batch
      - `raw_material_costs` (jsonb) - Breakdown of ingredient costs
      - `packaging_costs` (jsonb) - Packaging component costs
      - `manufacturing_costs` (jsonb) - Labour, utilities, QC costs
      - `overhead_costs` (jsonb) - Rent, salaries, compliance costs
      - `marketing_costs` (jsonb) - Marketing and distribution costs
      - `total_cost` (numeric) - Total batch cost
      - `cost_per_unit` (numeric) - Cost per unit
      - `margin_scenarios` (jsonb) - Different margin calculations
      - `saved_by` (uuid) - User who saved this calculation
      - `version` (integer) - Version number for tracking
      - `is_draft` (boolean) - Draft vs. saved calculation
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `product_cost_calculations` table
    - Add policies for authenticated users to manage calculations
*/

-- Create product_cost_calculations table
CREATE TABLE IF NOT EXISTS product_cost_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  calculation_name text NOT NULL,
  batch_size integer NOT NULL DEFAULT 100,
  raw_material_costs jsonb DEFAULT '{"ingredients": [], "subtotal": 0}'::jsonb,
  packaging_costs jsonb DEFAULT '{"components": [], "subtotal": 0}'::jsonb,
  manufacturing_costs jsonb DEFAULT '{"labour": 0, "utilities": 0, "qc": 0, "subtotal": 0}'::jsonb,
  overhead_costs jsonb DEFAULT '{"rent": 0, "salaries": 0, "compliance": 0, "other": [], "subtotal": 0}'::jsonb,
  marketing_costs jsonb DEFAULT '{"marketing": 0, "fulfillment": 0, "subtotal": 0}'::jsonb,
  total_cost numeric DEFAULT 0,
  cost_per_unit numeric DEFAULT 0,
  margin_scenarios jsonb DEFAULT '[]'::jsonb,
  saved_by uuid,
  version integer DEFAULT 1,
  is_draft boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_cost_calculations ENABLE ROW LEVEL SECURITY;

-- Policies for product_cost_calculations
CREATE POLICY "Users can view cost calculations"
  ON product_cost_calculations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create cost calculations"
  ON product_cost_calculations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update cost calculations"
  ON product_cost_calculations FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete cost calculations"
  ON product_cost_calculations FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cost_calculations_product_id ON product_cost_calculations(product_id);
CREATE INDEX IF NOT EXISTS idx_cost_calculations_saved_by ON product_cost_calculations(saved_by);
CREATE INDEX IF NOT EXISTS idx_cost_calculations_is_draft ON product_cost_calculations(is_draft);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_cost_calculations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cost_calculations_updated_at_trigger
  BEFORE UPDATE ON product_cost_calculations
  FOR EACH ROW
  EXECUTE FUNCTION update_cost_calculations_updated_at();
