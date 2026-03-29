/*
  # Create Product Detail Tables

  1. New Tables
    - `product_ingredients`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key) - References products
      - `ingredient_name` (text) - Name of ingredient
      - `botanical_name` (text) - Scientific/botanical name
      - `type` (text) - Herb/Oil/Powder/Extract/Base/Preservative/Fragrance/Active
      - `quantity` (numeric) - Quantity per batch
      - `unit` (text) - g/ml/kg/L/%
      - `vendor` (text) - Source/vendor name
      - `cost_per_unit` (numeric) - Cost per unit in rupees
      - `ayurvedic_properties` (jsonb) - Array of properties
      - `notes` (text) - Additional notes
      - `created_at` (timestamptz)

    - `formula_versions`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `version_number` (text) - Version identifier
      - `version_name` (text) - Display name
      - `ingredients_list` (jsonb) - Snapshot of ingredients
      - `instructions` (text) - Preparation method
      - `research_notes` (text) - Research and inspiration
      - `changes_from_previous` (text) - What changed
      - `created_by` (uuid) - User who created version
      - `created_at` (timestamptz)
      - `is_current` (boolean) - Current active version

    - `product_tests`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `test_type` (text) - Type of test
      - `test_category` (text) - Stability/Safety/Performance
      - `target_value` (text) - Expected value
      - `actual_value` (text) - Measured value
      - `result` (text) - pass/fail/pending
      - `test_date` (date) - Date tested
      - `tested_by` (uuid) - User who performed test
      - `notes` (text) - Test notes
      - `report_url` (text) - Link to test report
      - `created_at` (timestamptz)

    - `sample_batches`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `batch_number` (text) - Batch identifier
      - `quantity` (numeric) - Amount produced
      - `unit` (text) - Units
      - `purpose` (text) - testing/sampling/gifting
      - `batch_date` (date) - Date made
      - `given_to` (text) - Recipients
      - `feedback` (text) - Feedback received
      - `rating` (integer) - Star rating 1-5
      - `photos` (jsonb) - Array of photo URLs
      - `created_by` (uuid)
      - `created_at` (timestamptz)

    - `packaging_designs`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `version_name` (text) - Design version name
      - `image_url` (text) - Design image URL
      - `status` (text) - under_review/approved/rejected
      - `votes` (jsonb) - User votes
      - `approved_by` (uuid) - Admin who approved
      - `approved_at` (timestamptz)
      - `specifications` (jsonb) - Packaging specs
      - `uploaded_by` (uuid)
      - `created_at` (timestamptz)

    - `product_tasks`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `title` (text) - Task title
      - `description` (text) - Task description
      - `category` (text) - Research/Formula/Packaging/Production
      - `assigned_to` (uuid) - User assigned
      - `due_date` (date) - Due date
      - `priority` (text) - high/medium/low
      - `status` (text) - todo/in_progress/completed/blocked
      - `sub_tasks` (jsonb) - Array of sub-tasks
      - `created_by` (uuid)
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz)

    - `product_comments`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `user_id` (uuid) - Comment author
      - `text` (text) - Comment text
      - `attachments` (jsonb) - Array of file attachments
      - `reactions` (jsonb) - Emoji reactions
      - `parent_comment_id` (uuid) - For threaded replies
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `product_files`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `file_name` (text) - File name
      - `file_url` (text) - File URL
      - `file_type` (text) - File MIME type
      - `file_size` (integer) - File size in bytes
      - `category` (text) - Folder/category
      - `uploaded_by` (uuid)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create product_ingredients table
CREATE TABLE IF NOT EXISTS product_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  ingredient_name text NOT NULL,
  botanical_name text,
  type text,
  quantity numeric,
  unit text,
  vendor text,
  cost_per_unit numeric DEFAULT 0,
  ayurvedic_properties jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create formula_versions table
CREATE TABLE IF NOT EXISTS formula_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  version_number text NOT NULL,
  version_name text,
  ingredients_list jsonb DEFAULT '[]'::jsonb,
  instructions text,
  research_notes text,
  changes_from_previous text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  is_current boolean DEFAULT false
);

-- Create product_tests table
CREATE TABLE IF NOT EXISTS product_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  test_type text NOT NULL,
  test_category text,
  target_value text,
  actual_value text,
  result text DEFAULT 'pending',
  test_date date DEFAULT CURRENT_DATE,
  tested_by uuid,
  notes text,
  report_url text,
  created_at timestamptz DEFAULT now()
);

-- Create sample_batches table
CREATE TABLE IF NOT EXISTS sample_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  batch_number text NOT NULL,
  quantity numeric,
  unit text,
  purpose text,
  batch_date date DEFAULT CURRENT_DATE,
  given_to text,
  feedback text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  photos jsonb DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Create packaging_designs table
CREATE TABLE IF NOT EXISTS packaging_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  version_name text NOT NULL,
  image_url text,
  status text DEFAULT 'under_review',
  votes jsonb DEFAULT '[]'::jsonb,
  approved_by uuid,
  approved_at timestamptz,
  specifications jsonb DEFAULT '{}'::jsonb,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Create product_tasks table
CREATE TABLE IF NOT EXISTS product_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  assigned_to uuid,
  due_date date,
  priority text DEFAULT 'medium',
  status text DEFAULT 'todo',
  sub_tasks jsonb DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create product_comments table
CREATE TABLE IF NOT EXISTS product_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid,
  text text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  reactions jsonb DEFAULT '[]'::jsonb,
  parent_comment_id uuid REFERENCES product_comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create product_files table
CREATE TABLE IF NOT EXISTS product_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size integer,
  category text,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE formula_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_files ENABLE ROW LEVEL SECURITY;

-- Product ingredients policies
CREATE POLICY "Users can view product ingredients"
  ON product_ingredients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create product ingredients"
  ON product_ingredients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update product ingredients"
  ON product_ingredients FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete product ingredients"
  ON product_ingredients FOR DELETE
  TO authenticated
  USING (true);

-- Formula versions policies
CREATE POLICY "Users can view formula versions"
  ON formula_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create formula versions"
  ON formula_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update formula versions"
  ON formula_versions FOR UPDATE
  TO authenticated
  USING (true);

-- Product tests policies
CREATE POLICY "Users can view product tests"
  ON product_tests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create product tests"
  ON product_tests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update product tests"
  ON product_tests FOR UPDATE
  TO authenticated
  USING (true);

-- Sample batches policies
CREATE POLICY "Users can view sample batches"
  ON sample_batches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create sample batches"
  ON sample_batches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update sample batches"
  ON sample_batches FOR UPDATE
  TO authenticated
  USING (true);

-- Packaging designs policies
CREATE POLICY "Users can view packaging designs"
  ON packaging_designs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create packaging designs"
  ON packaging_designs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update packaging designs"
  ON packaging_designs FOR UPDATE
  TO authenticated
  USING (true);

-- Product tasks policies
CREATE POLICY "Users can view product tasks"
  ON product_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create product tasks"
  ON product_tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update product tasks"
  ON product_tasks FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete product tasks"
  ON product_tasks FOR DELETE
  TO authenticated
  USING (true);

-- Product comments policies
CREATE POLICY "Users can view product comments"
  ON product_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create product comments"
  ON product_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own product comments"
  ON product_comments FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own product comments"
  ON product_comments FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Product files policies
CREATE POLICY "Users can view product files"
  ON product_files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create product files"
  ON product_files FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete product files"
  ON product_files FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_ingredients_product_id ON product_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_formula_versions_product_id ON formula_versions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tests_product_id ON product_tests(product_id);
CREATE INDEX IF NOT EXISTS idx_sample_batches_product_id ON sample_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_packaging_designs_product_id ON packaging_designs(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tasks_product_id ON product_tasks(product_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_product_id ON product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_files_product_id ON product_files(product_id);

-- Create trigger for product_comments updated_at
CREATE OR REPLACE FUNCTION update_product_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_comments_updated_at_trigger
  BEFORE UPDATE ON product_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_product_comments_updated_at();
