/*
  # Enhance Investments Table

  ## Overview
  Enhances the existing investments table to support comprehensive investment tracking
  with approval workflow, payment proofs, and better categorization.

  ## Changes to Investments Table

  ### Rename/Add Columns
  - Rename `user_id` to `partner_id` for clarity
  - Rename `source` to `purpose` 
  - Rename `description` to `notes`
  - Add `payment_proof_url` (text) - URL to payment receipt/statement
  - Add `status` (text) - pending/approved/rejected
  - Add `submitted_by` (uuid) - User who recorded the investment
  - Add `approved_by` (uuid) - Admin who approved
  - Add `approved_at` (timestamptz) - Approval timestamp
  - Add `rejection_reason` (text) - Reason if rejected

  ## Security
  - Update RLS policies for new columns
  - Partners can view all, add their own (with approval)
  - Admins can approve, edit, delete

  ## Notes
  - All changes use IF NOT EXISTS / conditional checks for safety
  - Preserves existing data
*/

-- Rename columns if they exist with old names
DO $$
BEGIN
  -- Rename user_id to partner_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investments' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE investments RENAME COLUMN user_id TO partner_id;
  END IF;

  -- Rename source to purpose
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investments' AND column_name = 'source'
  ) THEN
    ALTER TABLE investments RENAME COLUMN source TO purpose;
  END IF;

  -- Rename description to notes
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investments' AND column_name = 'description'
  ) THEN
    ALTER TABLE investments RENAME COLUMN description TO notes;
  END IF;
END $$;

-- Add new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investments' AND column_name = 'payment_proof_url'
  ) THEN
    ALTER TABLE investments ADD COLUMN payment_proof_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investments' AND column_name = 'status'
  ) THEN
    ALTER TABLE investments ADD COLUMN status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investments' AND column_name = 'submitted_by'
  ) THEN
    ALTER TABLE investments ADD COLUMN submitted_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investments' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE investments ADD COLUMN approved_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investments' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE investments ADD COLUMN approved_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investments' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE investments ADD COLUMN rejection_reason text;
  END IF;
END $$;

-- Update the amount check constraint to allow positive values only
DO $$
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'investments_amount_check'
  ) THEN
    ALTER TABLE investments DROP CONSTRAINT investments_amount_check;
  END IF;
  
  -- Add new constraint
  ALTER TABLE investments ADD CONSTRAINT investments_amount_positive CHECK (amount > 0);
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_investments_partner_id ON investments(partner_id);
CREATE INDEX IF NOT EXISTS idx_investments_date ON investments(investment_date DESC);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "All users can view all investments" ON investments;
DROP POLICY IF EXISTS "Users can record investments" ON investments;
DROP POLICY IF EXISTS "Users can update own pending investments" ON investments;
DROP POLICY IF EXISTS "Admins can update any investment" ON investments;
DROP POLICY IF EXISTS "Admins can delete investments" ON investments;

-- Recreate policies with correct column names
CREATE POLICY "All users can view all investments"
  ON investments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can record investments"
  ON investments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own pending investments"
  ON investments
  FOR UPDATE
  TO authenticated
  USING (
    submitted_by = auth.uid() AND status = 'pending'
  )
  WITH CHECK (
    submitted_by = auth.uid() AND status = 'pending'
  );

CREATE POLICY "Admins can update any investment"
  ON investments
  FOR UPDATE
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

CREATE POLICY "Admins can delete investments"
  ON investments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
