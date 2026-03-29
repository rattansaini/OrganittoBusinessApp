/*
  # Create Users Table for Organitto

  ## Overview
  This migration creates the users table for the Organitto Ayurvedic business management system
  with role-based access control for Admin and Partner roles.

  ## New Tables
  
  ### `users`
  - `id` (uuid, primary key) - Unique identifier, references auth.users
  - `email` (text, unique, not null) - User's email address
  - `name` (text, not null) - User's full name
  - `phone` (text) - User's phone number
  - `role` (text, not null, default 'partner') - User role (admin or partner)
  - `created_at` (timestamptz, default now()) - Record creation timestamp
  - `updated_at` (timestamptz, default now()) - Record update timestamp

  ## Security
  
  1. Enable Row Level Security on users table
  2. Policy: Users can read their own profile data
  3. Policy: Users can update their own profile (except role)
  4. Policy: Admin users can read all user profiles
  5. Policy: Admin users can create new users
  6. Policy: Admin users can update any user profile

  ## Notes
  - The role field is restricted to 'admin' or 'partner' values
  - Users cannot change their own role (only admins can)
  - Email must be unique across all users
  - Created_at and updated_at timestamps are automatically managed
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'partner' CHECK (role IN ('admin', 'partner')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can read all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can create users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update any profile"
  ON users
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

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);