/*
  # Update Expenses Table and Create Vendors Table

  ## Overview
  This migration enhances the expenses table with comprehensive tracking fields
  and creates a vendors table for managing supplier relationships.

  ## Changes to Existing Tables

  ### `expenses` - New Columns Added
  - `subcategory` (text) - Optional subcategory for more specific tracking
  - `payment_mode` (text, not null, default 'cash') - How payment was made
  - `paid_by` (uuid, references users) - Which partner paid the expense
  - `vendor_id` (uuid, references vendors) - Associated vendor
  - `bill_url` (text) - Cloud storage path for receipt/bill
  - `purpose` (text) - Additional purpose/notes
  - `status` (text, not null, default 'pending') - Approval status
  - `submitted_by` (uuid, references users) - Who submitted the expense
  - `submitted_at` (timestamptz, default now()) - When submitted
  - `approved_by` (uuid, references users) - Who approved it
  - `approved_at` (timestamptz) - When approved

  ## New Tables

  ### `vendors`
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text, not null) - Vendor/supplier name
  - `contact_person` (text) - Contact person name
  - `phone` (text) - Phone number
  - `email` (text) - Email address
  - `address` (text) - Physical address
  - `gstin` (text) - GST identification number
  - `category` (text) - Type of vendor (e.g., Raw Material Supplier)
  - `created_by` (uuid, references users) - Who added the vendor
  - `created_at` (timestamptz, default now()) - Record creation
  - `updated_at` (timestamptz, default now()) - Record update

  ## Security

  Row Level Security policies updated for:
  - Vendors table with user-based access control
  - Expenses table policies remain active

  ## Notes
  - Payment modes: cash, upi, bank_transfer, card
  - Expense status: pending, approved, rejected
  - All new fields are added safely with IF NOT EXISTS checks
  - Existing expense records will have default values for new fields
*/

CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  gstin text,
  category text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE expenses ADD COLUMN subcategory text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'payment_mode'
  ) THEN
    ALTER TABLE expenses ADD COLUMN payment_mode text NOT NULL DEFAULT 'cash' CHECK (payment_mode IN ('cash', 'upi', 'bank_transfer', 'card'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'paid_by'
  ) THEN
    ALTER TABLE expenses ADD COLUMN paid_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'vendor_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'bill_url'
  ) THEN
    ALTER TABLE expenses ADD COLUMN bill_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'purpose'
  ) THEN
    ALTER TABLE expenses ADD COLUMN purpose text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'status'
  ) THEN
    ALTER TABLE expenses ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'submitted_by'
  ) THEN
    ALTER TABLE expenses ADD COLUMN submitted_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE expenses ADD COLUMN submitted_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE expenses ADD COLUMN approved_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE expenses ADD COLUMN approved_at timestamptz;
  END IF;
END $$;

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create vendors"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update vendors they created"
  ON vendors FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update any vendor"
  ON vendors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS vendors_name_idx ON vendors(name);
CREATE INDEX IF NOT EXISTS vendors_category_idx ON vendors(category);
CREATE INDEX IF NOT EXISTS expenses_status_idx ON expenses(status);
CREATE INDEX IF NOT EXISTS expenses_paid_by_idx ON expenses(paid_by);
CREATE INDEX IF NOT EXISTS expenses_vendor_id_idx ON expenses(vendor_id);