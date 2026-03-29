/*
  # Create Vendor Related Tables

  1. New Tables
    - `vendor_transactions` - Transaction history with vendors
    - `vendor_invoices` - Invoice management
    - `vendor_prices` - Price list from vendors
    - `vendor_documents` - Document storage
    - `vendor_notes` - Internal notes
    - `vendor_reviews` - Rating and review system

  2. Updates to vendors table
    - Add missing columns if they don't exist

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Update vendors table with new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'products') THEN
    ALTER TABLE vendors ADD COLUMN products text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'contact_person') THEN
    ALTER TABLE vendors ADD COLUMN contact_person text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'phone') THEN
    ALTER TABLE vendors ADD COLUMN phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'alternate_phone') THEN
    ALTER TABLE vendors ADD COLUMN alternate_phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'address') THEN
    ALTER TABLE vendors ADD COLUMN address text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'gst_number') THEN
    ALTER TABLE vendors ADD COLUMN gst_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'website') THEN
    ALTER TABLE vendors ADD COLUMN website text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'payment_terms') THEN
    ALTER TABLE vendors ADD COLUMN payment_terms text DEFAULT '30 days';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'bank_details') THEN
    ALTER TABLE vendors ADD COLUMN bank_details jsonb DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'certifications') THEN
    ALTER TABLE vendors ADD COLUMN certifications jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'initial_rating') THEN
    ALTER TABLE vendors ADD COLUMN initial_rating numeric DEFAULT 3;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'current_rating') THEN
    ALTER TABLE vendors ADD COLUMN current_rating numeric DEFAULT 3;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'notes') THEN
    ALTER TABLE vendors ADD COLUMN notes text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'is_favorite') THEN
    ALTER TABLE vendors ADD COLUMN is_favorite boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'created_by') THEN
    ALTER TABLE vendors ADD COLUMN created_by uuid;
  END IF;
END $$;

-- Create vendor_transactions table
CREATE TABLE IF NOT EXISTS vendor_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  expense_id uuid,
  transaction_type text NOT NULL,
  amount numeric NOT NULL,
  date date NOT NULL,
  status text DEFAULT 'pending',
  invoice_number text,
  receipt_url text,
  description text,
  payment_mode text,
  created_at timestamptz DEFAULT now()
);

-- Create vendor_invoices table
CREATE TABLE IF NOT EXISTS vendor_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  invoice_number text NOT NULL,
  date date NOT NULL,
  due_date date NOT NULL,
  amount numeric NOT NULL,
  items jsonb DEFAULT '[]'::jsonb,
  invoice_url text,
  status text DEFAULT 'pending',
  paid_date date,
  paid_amount numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vendor_prices table
CREATE TABLE IF NOT EXISTS vendor_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  product_name text NOT NULL,
  category text,
  unit text NOT NULL,
  price numeric NOT NULL,
  moq numeric,
  lead_time integer,
  effective_from date DEFAULT CURRENT_DATE,
  effective_to date,
  price_history jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vendor_documents table
CREATE TABLE IF NOT EXISTS vendor_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  category text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  uploaded_by uuid,
  uploaded_at timestamptz DEFAULT now()
);

-- Create vendor_notes table
CREATE TABLE IF NOT EXISTS vendor_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  note_text text NOT NULL,
  written_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vendor_reviews table
CREATE TABLE IF NOT EXISTS vendor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  reviewed_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE vendor_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for vendor_transactions
CREATE POLICY "Users can view vendor transactions"
  ON vendor_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create vendor transactions"
  ON vendor_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update vendor transactions"
  ON vendor_transactions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete vendor transactions"
  ON vendor_transactions FOR DELETE
  TO authenticated
  USING (true);

-- Policies for vendor_invoices
CREATE POLICY "Users can view vendor invoices"
  ON vendor_invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create vendor invoices"
  ON vendor_invoices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update vendor invoices"
  ON vendor_invoices FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete vendor invoices"
  ON vendor_invoices FOR DELETE
  TO authenticated
  USING (true);

-- Policies for vendor_prices
CREATE POLICY "Users can view vendor prices"
  ON vendor_prices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create vendor prices"
  ON vendor_prices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update vendor prices"
  ON vendor_prices FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete vendor prices"
  ON vendor_prices FOR DELETE
  TO authenticated
  USING (true);

-- Policies for vendor_documents
CREATE POLICY "Users can view vendor documents"
  ON vendor_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create vendor documents"
  ON vendor_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete vendor documents"
  ON vendor_documents FOR DELETE
  TO authenticated
  USING (true);

-- Policies for vendor_notes
CREATE POLICY "Users can view vendor notes"
  ON vendor_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create vendor notes"
  ON vendor_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update vendor notes"
  ON vendor_notes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete vendor notes"
  ON vendor_notes FOR DELETE
  TO authenticated
  USING (true);

-- Policies for vendor_reviews
CREATE POLICY "Users can view vendor reviews"
  ON vendor_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create vendor reviews"
  ON vendor_reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_transactions_vendor_id ON vendor_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_transactions_date ON vendor_transactions(date);
CREATE INDEX IF NOT EXISTS idx_vendor_invoices_vendor_id ON vendor_invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_invoices_status ON vendor_invoices(status);
CREATE INDEX IF NOT EXISTS idx_vendor_prices_vendor_id ON vendor_prices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_documents_vendor_id ON vendor_documents(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_notes_vendor_id ON vendor_notes(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_vendor_id ON vendor_reviews(vendor_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_vendor_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_invoices_updated_at_trigger
  BEFORE UPDATE ON vendor_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_tables_updated_at();

CREATE TRIGGER update_vendor_prices_updated_at_trigger
  BEFORE UPDATE ON vendor_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_tables_updated_at();

CREATE TRIGGER update_vendor_notes_updated_at_trigger
  BEFORE UPDATE ON vendor_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_tables_updated_at();

-- Function to update vendor rating
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendors
  SET current_rating = (
    SELECT AVG(rating)::numeric(3,2)
    FROM vendor_reviews
    WHERE vendor_id = NEW.vendor_id
  )
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_rating_trigger
  AFTER INSERT ON vendor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_rating();
