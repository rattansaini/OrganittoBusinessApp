/*
  # Create Dashboard Tables for Organitto

  ## Overview
  This migration creates tables for managing finances, products, and activity tracking
  in the Organitto Ayurvedic business management system.

  ## New Tables

  ### `expenses`
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, references users) - User who created the expense
  - `amount` (numeric, not null) - Expense amount in rupees
  - `category` (text, not null) - Expense category (e.g., Raw Materials, Labor, Marketing)
  - `description` (text) - Expense description
  - `expense_date` (date, not null, default today) - Date of expense
  - `created_at` (timestamptz, default now()) - Record creation timestamp
  - `updated_at` (timestamptz, default now()) - Record update timestamp

  ### `investments`
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, references users) - User who created the investment
  - `amount` (numeric, not null) - Investment amount in rupees
  - `source` (text, not null) - Source of investment (e.g., Personal, Loan, Partner)
  - `description` (text) - Investment description
  - `investment_date` (date, not null, default today) - Date of investment
  - `created_at` (timestamptz, default now()) - Record creation timestamp
  - `updated_at` (timestamptz, default now()) - Record update timestamp

  ### `products`
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, references users) - User who created the product
  - `name` (text, not null) - Product name
  - `status` (text, not null, default 'planning') - Product status
  - `description` (text) - Product description
  - `created_at` (timestamptz, default now()) - Record creation timestamp
  - `updated_at` (timestamptz, default now()) - Record update timestamp

  ### `activity_log`
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, references users) - User who performed the action
  - `activity_type` (text, not null) - Type of activity (expense, investment, product, etc.)
  - `description` (text, not null) - Activity description
  - `created_at` (timestamptz, default now()) - Activity timestamp

  ## Security

  All tables have Row Level Security enabled with policies for:
  - Users can read their own records
  - Users can create their own records
  - Users can update their own records
  - Users can delete their own records
  - Admins can access all records

  ## Notes
  - Product status must be one of: 'planning', 'testing', 'production', 'completed'
  - Expense categories are flexible text fields for now
  - All amounts are stored as numeric for precision
  - Activity log is append-only (no updates or deletes for audit trail)
*/

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  category text NOT NULL,
  description text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  source text NOT NULL,
  description text,
  investment_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'testing', 'production', 'completed')),
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can read own investments"
  ON investments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own investments"
  ON investments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments"
  ON investments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments"
  ON investments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all investments"
  ON investments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can read own products"
  ON products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all products"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can read own activity"
  ON activity_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activity"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all activity"
  ON activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS investments_user_id_idx ON investments(user_id);
CREATE INDEX IF NOT EXISTS investments_date_idx ON investments(investment_date);
CREATE INDEX IF NOT EXISTS products_user_id_idx ON products(user_id);
CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
CREATE INDEX IF NOT EXISTS activity_log_user_id_idx ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS activity_log_created_at_idx ON activity_log(created_at DESC);