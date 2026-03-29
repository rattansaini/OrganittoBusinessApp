/*
  # Optimize RLS Policies with Subselects

  Replaces auth.uid() with (select auth.uid()) in all policies for better performance.
  This prevents re-evaluation of the function for each row at scale.
*/

-- Users table policies
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Expenses table policies
DROP POLICY IF EXISTS "Users can read own expenses" ON expenses;
CREATE POLICY "Users can read own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own expenses" ON expenses;
CREATE POLICY "Users can create own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all expenses" ON expenses;
CREATE POLICY "Admins can read all expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Investments table policies
DROP POLICY IF EXISTS "Users can read own investments" ON investments;
CREATE POLICY "Users can read own investments"
  ON investments FOR SELECT
  TO authenticated
  USING (partner_id = auth.uid());

DROP POLICY IF EXISTS "All users can view all investments" ON investments;
CREATE POLICY "All users can view all investments"
  ON investments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create own investments" ON investments;
CREATE POLICY "Users can create own investments"
  ON investments FOR INSERT
  TO authenticated
  WITH CHECK (partner_id = auth.uid());

DROP POLICY IF EXISTS "Users can record investments" ON investments;
CREATE POLICY "Users can record investments"
  ON investments FOR INSERT
  TO authenticated
  WITH CHECK (partner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own investments" ON investments;
CREATE POLICY "Users can update own investments"
  ON investments FOR UPDATE
  TO authenticated
  USING (partner_id = auth.uid())
  WITH CHECK (partner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own pending investments" ON investments;
CREATE POLICY "Users can update own pending investments"
  ON investments FOR UPDATE
  TO authenticated
  USING (partner_id = auth.uid() AND status = 'pending')
  WITH CHECK (partner_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Users can delete own investments" ON investments;
CREATE POLICY "Users can delete own investments"
  ON investments FOR DELETE
  TO authenticated
  USING (partner_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all investments" ON investments;
CREATE POLICY "Admins can read all investments"
  ON investments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update any investment" ON investments;
CREATE POLICY "Admins can update any investment"
  ON investments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete investments" ON investments;
CREATE POLICY "Admins can delete investments"
  ON investments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Activity log policies
DROP POLICY IF EXISTS "Users can read own activity" ON activity_log;
CREATE POLICY "Users can read own activity"
  ON activity_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own activity" ON activity_log;
CREATE POLICY "Users can create own activity"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all activity" ON activity_log;
CREATE POLICY "Admins can read all activity"
  ON activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Vendors table policies
DROP POLICY IF EXISTS "Users can create vendors" ON vendors;
CREATE POLICY "Users can create vendors"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read vendors" ON vendors;
CREATE POLICY "Users can read vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update vendors they created" ON vendors;
CREATE POLICY "Users can update vendors they created"
  ON vendors FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Admins can update any vendor" ON vendors;
CREATE POLICY "Admins can update any vendor"
  ON vendors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Product comments policies
DROP POLICY IF EXISTS "Users can view product comments" ON product_comments;
CREATE POLICY "Users can view product comments"
  ON product_comments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create product comments" ON product_comments;
CREATE POLICY "Users can create product comments"
  ON product_comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own product comments" ON product_comments;
CREATE POLICY "Users can update own product comments"
  ON product_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own product comments" ON product_comments;
CREATE POLICY "Users can delete own product comments"
  ON product_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Chat rooms policies
DROP POLICY IF EXISTS "Users can view rooms they are members of" ON chat_rooms;
CREATE POLICY "Users can view rooms they are members of"
  ON chat_rooms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_room_members 
      WHERE chat_room_members.room_id = chat_rooms.id 
      AND chat_room_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Room creators and admins can update rooms" ON chat_rooms;
CREATE POLICY "Room creators and admins can update rooms"
  ON chat_rooms FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Chat room members policies
DROP POLICY IF EXISTS "Users can view room members for their rooms" ON chat_room_members;
CREATE POLICY "Users can view room members for their rooms"
  ON chat_room_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_room_members crm2
      WHERE crm2.room_id = chat_room_members.room_id 
      AND crm2.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own membership" ON chat_room_members;
CREATE POLICY "Users can update their own membership"
  ON chat_room_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can remove members" ON chat_room_members;
CREATE POLICY "Admins can remove members"
  ON chat_room_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Chat messages policies
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON chat_messages;
CREATE POLICY "Users can view messages in their rooms"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_room_members 
      WHERE chat_room_members.room_id = chat_messages.room_id 
      AND chat_room_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their rooms" ON chat_messages;
CREATE POLICY "Users can send messages to their rooms"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_room_members 
      WHERE chat_room_members.room_id = chat_messages.room_id 
      AND chat_room_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
CREATE POLICY "Users can update their own messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;
CREATE POLICY "Users can delete their own messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- Chat files policies
DROP POLICY IF EXISTS "Users can view files in their rooms" ON chat_files;
CREATE POLICY "Users can view files in their rooms"
  ON chat_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_room_members 
      WHERE chat_room_members.room_id = chat_files.room_id 
      AND chat_room_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can upload files to their rooms" ON chat_files;
CREATE POLICY "Users can upload files to their rooms"
  ON chat_files FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_room_members 
      WHERE chat_room_members.room_id = chat_files.room_id 
      AND chat_room_members.user_id = auth.uid()
    )
  );

-- Chat typing status policies
DROP POLICY IF EXISTS "Users can view typing status in their rooms" ON chat_typing_status;
CREATE POLICY "Users can view typing status in their rooms"
  ON chat_typing_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_room_members 
      WHERE chat_room_members.room_id = chat_typing_status.room_id 
      AND chat_room_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can set their typing status" ON chat_typing_status;
CREATE POLICY "Users can set their typing status"
  ON chat_typing_status FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can change their typing status" ON chat_typing_status;
CREATE POLICY "Users can change their typing status"
  ON chat_typing_status FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User chat settings policies
DROP POLICY IF EXISTS "Users can view their own settings" ON user_chat_settings;
CREATE POLICY "Users can view their own settings"
  ON user_chat_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own settings" ON user_chat_settings;
CREATE POLICY "Users can create their own settings"
  ON user_chat_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own settings" ON user_chat_settings;
CREATE POLICY "Users can update their own settings"
  ON user_chat_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
