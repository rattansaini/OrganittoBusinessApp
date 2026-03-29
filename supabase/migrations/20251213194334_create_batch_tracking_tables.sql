/*
  # Create Batch Tracking System Tables

  1. New Tables
    - `batches`
      - `id` (uuid, primary key)
      - `batch_number` (text, unique) - Format: BT-[PRODUCT-CODE]-[YYYYMMDD]-[SEQ]
      - `product_id` (uuid, foreign key) - References products table
      - `manufacturing_date` (date) - When batch was manufactured
      - `expiry_date` (date) - When batch expires
      - `batch_size` (integer) - Total units produced
      - `units_in_stock` (integer) - Current units available
      - `units_sold` (integer) - Units sold/dispatched
      - `units_damaged` (integer) - Units damaged/rejected
      - `storage_location` (text) - Where batch is stored
      - `manufacturing_team` (jsonb) - Array of user IDs
      - `qc_approved` (boolean) - QC approval status
      - `qc_approved_by` (uuid) - User who approved QC
      - `qc_approved_date` (date) - When QC was approved
      - `qc_notes` (text) - QC notes
      - `qc_checklist` (jsonb) - QC checklist items
      - `status` (text) - active, sold_out, recalled, expired
      - `recall_reason` (text) - Reason for recall if recalled
      - `recall_date` (date) - When recalled
      - `created_by` (uuid)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `batch_ingredients`
      - `id` (uuid, primary key)
      - `batch_id` (uuid, foreign key)
      - `ingredient_name` (text)
      - `lot_number` (text) - Ingredient lot number
      - `supplier_batch_number` (text) - Supplier's batch number
      - `vendor_id` (uuid, foreign key, nullable)
      - `ingredient_expiry_date` (date)
      - `quantity_used` (numeric)
      - `unit` (text)

    - `batch_tests`
      - `id` (uuid, primary key)
      - `batch_id` (uuid, foreign key)
      - `test_type` (text) - pH, Stability, Microbial, etc.
      - `result` (text) - Pass/Fail or actual value
      - `test_date` (date)
      - `report_url` (text) - Link to test report
      - `tested_by` (uuid)
      - `notes` (text)
      - `created_at` (timestamptz)

    - `batch_dispatches`
      - `id` (uuid, primary key)
      - `batch_id` (uuid, foreign key)
      - `dispatch_date` (date)
      - `dispatch_to` (text) - Customer/Retailer name
      - `quantity` (integer)
      - `invoice_number` (text)
      - `dispatch_method` (text) - Courier/Self/Pickup
      - `tracking_number` (text)
      - `status` (text) - dispatched, delivered
      - `delivered_date` (date)
      - `notes` (text)
      - `created_by` (uuid)
      - `created_at` (timestamptz)

    - `batch_stock_adjustments`
      - `id` (uuid, primary key)
      - `batch_id` (uuid, foreign key)
      - `adjustment_date` (date)
      - `adjustment_type` (text) - damage, rejection, return, other
      - `quantity` (integer)
      - `reason` (text)
      - `adjusted_by` (uuid)
      - `notes` (text)
      - `created_at` (timestamptz)

    - `batch_photos`
      - `id` (uuid, primary key)
      - `batch_id` (uuid, foreign key)
      - `photo_url` (text)
      - `category` (text) - product, packaging, label, qc, process
      - `uploaded_by` (uuid)
      - `uploaded_at` (timestamptz)

    - `batch_activity_log`
      - `id` (uuid, primary key)
      - `batch_id` (uuid, foreign key)
      - `activity_type` (text)
      - `activity_description` (text)
      - `details` (jsonb)
      - `performed_by` (uuid)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all batch tables
    - Add policies for authenticated users
*/

-- Create batches table
CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number text UNIQUE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  manufacturing_date date NOT NULL,
  expiry_date date NOT NULL,
  batch_size integer NOT NULL,
  units_in_stock integer DEFAULT 0,
  units_sold integer DEFAULT 0,
  units_damaged integer DEFAULT 0,
  storage_location text,
  manufacturing_team jsonb DEFAULT '[]'::jsonb,
  qc_approved boolean DEFAULT false,
  qc_approved_by uuid,
  qc_approved_date date,
  qc_notes text,
  qc_checklist jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active',
  recall_reason text,
  recall_date date,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create batch_ingredients table
CREATE TABLE IF NOT EXISTS batch_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE NOT NULL,
  ingredient_name text NOT NULL,
  lot_number text,
  supplier_batch_number text,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  ingredient_expiry_date date,
  quantity_used numeric,
  unit text
);

-- Create batch_tests table
CREATE TABLE IF NOT EXISTS batch_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE NOT NULL,
  test_type text NOT NULL,
  result text NOT NULL,
  test_date date NOT NULL,
  report_url text,
  tested_by uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create batch_dispatches table
CREATE TABLE IF NOT EXISTS batch_dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE NOT NULL,
  dispatch_date date NOT NULL,
  dispatch_to text NOT NULL,
  quantity integer NOT NULL,
  invoice_number text,
  dispatch_method text,
  tracking_number text,
  status text DEFAULT 'dispatched',
  delivered_date date,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Create batch_stock_adjustments table
CREATE TABLE IF NOT EXISTS batch_stock_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE NOT NULL,
  adjustment_date date NOT NULL,
  adjustment_type text NOT NULL,
  quantity integer NOT NULL,
  reason text NOT NULL,
  adjusted_by uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create batch_photos table
CREATE TABLE IF NOT EXISTS batch_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  category text NOT NULL,
  uploaded_by uuid,
  uploaded_at timestamptz DEFAULT now()
);

-- Create batch_activity_log table
CREATE TABLE IF NOT EXISTS batch_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  activity_description text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  performed_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_activity_log ENABLE ROW LEVEL SECURITY;

-- Policies for batches
CREATE POLICY "Users can view batches"
  ON batches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create batches"
  ON batches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update batches"
  ON batches FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete batches"
  ON batches FOR DELETE
  TO authenticated
  USING (true);

-- Policies for batch_ingredients
CREATE POLICY "Users can view batch ingredients"
  ON batch_ingredients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create batch ingredients"
  ON batch_ingredients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update batch ingredients"
  ON batch_ingredients FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete batch ingredients"
  ON batch_ingredients FOR DELETE
  TO authenticated
  USING (true);

-- Policies for batch_tests
CREATE POLICY "Users can view batch tests"
  ON batch_tests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create batch tests"
  ON batch_tests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update batch tests"
  ON batch_tests FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete batch tests"
  ON batch_tests FOR DELETE
  TO authenticated
  USING (true);

-- Policies for batch_dispatches
CREATE POLICY "Users can view batch dispatches"
  ON batch_dispatches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create batch dispatches"
  ON batch_dispatches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update batch dispatches"
  ON batch_dispatches FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete batch dispatches"
  ON batch_dispatches FOR DELETE
  TO authenticated
  USING (true);

-- Policies for batch_stock_adjustments
CREATE POLICY "Users can view batch stock adjustments"
  ON batch_stock_adjustments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create batch stock adjustments"
  ON batch_stock_adjustments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for batch_photos
CREATE POLICY "Users can view batch photos"
  ON batch_photos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create batch photos"
  ON batch_photos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete batch photos"
  ON batch_photos FOR DELETE
  TO authenticated
  USING (true);

-- Policies for batch_activity_log
CREATE POLICY "Users can view batch activity log"
  ON batch_activity_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create batch activity log"
  ON batch_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_batches_product_id ON batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_batch_number ON batches(batch_number);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_expiry_date ON batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_batch_ingredients_batch_id ON batch_ingredients(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_tests_batch_id ON batch_tests(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_dispatches_batch_id ON batch_dispatches(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_stock_adjustments_batch_id ON batch_stock_adjustments(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_photos_batch_id ON batch_photos(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_activity_log_batch_id ON batch_activity_log(batch_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_batches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_batches_updated_at_trigger
  BEFORE UPDATE ON batches
  FOR EACH ROW
  EXECUTE FUNCTION update_batches_updated_at();

-- Function to log batch activities
CREATE OR REPLACE FUNCTION log_batch_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO batch_activity_log (batch_id, activity_type, activity_description, details, performed_by)
    VALUES (NEW.id, 'batch_created', 'Batch created', jsonb_build_object('batch_number', NEW.batch_number), NEW.created_by);
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status != OLD.status THEN
      INSERT INTO batch_activity_log (batch_id, activity_type, activity_description, details, performed_by)
      VALUES (NEW.id, 'status_changed', 'Batch status changed', jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status), NEW.created_by);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_batch_activity_trigger
  AFTER INSERT OR UPDATE ON batches
  FOR EACH ROW
  EXECUTE FUNCTION log_batch_activity();

-- Function to update batch stock on dispatch
CREATE OR REPLACE FUNCTION update_batch_stock_on_dispatch()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE batches
  SET 
    units_sold = units_sold + NEW.quantity,
    units_in_stock = units_in_stock - NEW.quantity
  WHERE id = NEW.batch_id;
  
  INSERT INTO batch_activity_log (batch_id, activity_type, activity_description, details, performed_by)
  VALUES (NEW.batch_id, 'dispatch', 'Units dispatched', jsonb_build_object('quantity', NEW.quantity, 'dispatch_to', NEW.dispatch_to), NEW.created_by);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_batch_stock_on_dispatch_trigger
  AFTER INSERT ON batch_dispatches
  FOR EACH ROW
  EXECUTE FUNCTION update_batch_stock_on_dispatch();

-- Function to update batch stock on adjustment
CREATE OR REPLACE FUNCTION update_batch_stock_on_adjustment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE batches
  SET 
    units_damaged = units_damaged + NEW.quantity,
    units_in_stock = units_in_stock - NEW.quantity
  WHERE id = NEW.batch_id;
  
  INSERT INTO batch_activity_log (batch_id, activity_type, activity_description, details, performed_by)
  VALUES (NEW.batch_id, 'stock_adjustment', 'Stock adjusted', jsonb_build_object('type', NEW.adjustment_type, 'quantity', NEW.quantity, 'reason', NEW.reason), NEW.adjusted_by);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_batch_stock_on_adjustment_trigger
  AFTER INSERT ON batch_stock_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION update_batch_stock_on_adjustment();
