/*
  # Fix User Self-Registration Policy

  ## Overview
  Adds a policy to allow users to create their own profile during registration.
  Previously, only admins could create user profiles, which blocked self-registration.

  ## Security Changes
  - Add policy: Users can insert their own profile during registration
  - This allows the signUp flow to complete successfully

  ## Important Notes
  - Users can only insert a profile for their own auth.uid()
  - This policy is essential for self-service registration
  - Role selection is validated at the application level
*/

CREATE POLICY "Users can create own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
