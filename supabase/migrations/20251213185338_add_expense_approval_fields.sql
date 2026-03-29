/*
  # Add Expense Approval Workflow Fields

  ## Overview
  Enhances the expenses table with fields needed for the approval workflow system.

  ## Changes to Expenses Table

  ### New Columns Added
  - `approval_comments` (text) - Optional comments from approver
  - `rejection_reason` (text) - Required reason if expense is rejected
  - `edit_history` (jsonb) - Track all changes made to the expense
  - `viewed_bill` (boolean, default false) - Track if bill has been viewed

  ## Notes
  - All fields are optional and added safely with IF NOT EXISTS checks
  - edit_history stores JSON array of change events
  - approval_comments stores feedback from admin during approval
  - rejection_reason stores reason selected during rejection
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'approval_comments'
  ) THEN
    ALTER TABLE expenses ADD COLUMN approval_comments text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE expenses ADD COLUMN rejection_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'edit_history'
  ) THEN
    ALTER TABLE expenses ADD COLUMN edit_history jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'viewed_bill'
  ) THEN
    ALTER TABLE expenses ADD COLUMN viewed_bill boolean DEFAULT false;
  END IF;
END $$;