/*
  # Create Team Chat Communication System

  1. New Tables
    - `chat_rooms`
      - `id` (uuid, primary key)
      - `name` (text) - Room name
      - `description` (text) - Room description
      - `type` (text) - general, product, project, dm
      - `product_id` (uuid, nullable) - Link to product if product-specific
      - `icon` (text) - Emoji or icon identifier
      - `color` (text) - Room color theme
      - `created_by` (uuid)
      - `created_at` (timestamptz)
      - `archived` (boolean) - Archived rooms
      - `archived_at` (timestamptz, nullable)
      - `settings` (jsonb) - Room settings (permissions, etc.)

    - `chat_room_members`
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key)
      - `user_id` (uuid)
      - `joined_at` (timestamptz)
      - `role` (text) - member, admin
      - `last_read_message_id` (uuid, nullable) - For unread tracking
      - `last_read_at` (timestamptz, nullable)
      - `notification_settings` (jsonb) - Per-room notification preferences
      - `is_muted` (boolean)
      - `is_favorite` (boolean)

    - `chat_messages`
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key)
      - `sender_id` (uuid)
      - `message_text` (text) - Supports markdown
      - `message_type` (text) - text, image, file, system
      - `attachments` (jsonb) - Array of file/image URLs
      - `mentions` (jsonb) - Array of mentioned user IDs
      - `reactions` (jsonb) - Object mapping emoji to user IDs
      - `reply_to_message_id` (uuid, nullable) - For threaded replies
      - `is_pinned` (boolean)
      - `pinned_by` (uuid, nullable)
      - `pinned_at` (timestamptz, nullable)
      - `is_edited` (boolean)
      - `edited_at` (timestamptz, nullable)
      - `is_deleted` (boolean)
      - `deleted_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

    - `chat_files`
      - `id` (uuid, primary key)
      - `message_id` (uuid, foreign key)
      - `room_id` (uuid, foreign key)
      - `file_name` (text)
      - `file_url` (text)
      - `file_size` (bigint) - Size in bytes
      - `file_type` (text) - MIME type
      - `uploaded_by` (uuid)
      - `created_at` (timestamptz)

    - `chat_typing_status`
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key)
      - `user_id` (uuid)
      - `is_typing` (boolean)
      - `last_typing_time` (timestamptz)

    - `user_chat_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, unique)
      - `notifications_enabled` (boolean)
      - `sound_enabled` (boolean)
      - `email_notifications` (boolean)
      - `desktop_notifications` (boolean)
      - `quiet_hours_start` (time, nullable)
      - `quiet_hours_end` (time, nullable)
      - `notification_preview` (boolean) - Show message content in notifications
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all chat tables
    - Add policies for authenticated users
    - Ensure users can only access rooms they're members of
*/

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'general',
  product_id uuid,
  icon text DEFAULT '💬',
  color text DEFAULT '#8B7355',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  archived boolean DEFAULT false,
  archived_at timestamptz,
  settings jsonb DEFAULT '{}'::jsonb
);

-- Create chat_room_members table
CREATE TABLE IF NOT EXISTS chat_room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamptz DEFAULT now(),
  role text DEFAULT 'member',
  last_read_message_id uuid,
  last_read_at timestamptz,
  notification_settings jsonb DEFAULT '{}'::jsonb,
  is_muted boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  UNIQUE(room_id, user_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid NOT NULL,
  message_text text NOT NULL,
  message_type text DEFAULT 'text',
  attachments jsonb DEFAULT '[]'::jsonb,
  mentions jsonb DEFAULT '[]'::jsonb,
  reactions jsonb DEFAULT '{}'::jsonb,
  reply_to_message_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL,
  is_pinned boolean DEFAULT false,
  pinned_by uuid,
  pinned_at timestamptz,
  is_edited boolean DEFAULT false,
  edited_at timestamptz,
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create chat_files table
CREATE TABLE IF NOT EXISTS chat_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES chat_messages(id) ON DELETE CASCADE NOT NULL,
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  uploaded_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create chat_typing_status table
CREATE TABLE IF NOT EXISTS chat_typing_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  is_typing boolean DEFAULT false,
  last_typing_time timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create user_chat_settings table
CREATE TABLE IF NOT EXISTS user_chat_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  notifications_enabled boolean DEFAULT true,
  sound_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT false,
  desktop_notifications boolean DEFAULT true,
  quiet_hours_start time,
  quiet_hours_end time,
  notification_preview boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_typing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_chat_settings ENABLE ROW LEVEL SECURITY;

-- Policies for chat_rooms
CREATE POLICY "Users can view rooms they are members of"
  ON chat_rooms FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create rooms"
  ON chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Room creators and admins can update rooms"
  ON chat_rooms FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    id IN (
      SELECT room_id FROM chat_room_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for chat_room_members
CREATE POLICY "Users can view room members for their rooms"
  ON chat_room_members FOR SELECT
  TO authenticated
  USING (
    room_id IN (
      SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join rooms"
  ON chat_room_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own membership"
  ON chat_room_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can remove members"
  ON chat_room_members FOR DELETE
  TO authenticated
  USING (
    room_id IN (
      SELECT room_id FROM chat_room_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for chat_messages
CREATE POLICY "Users can view messages in their rooms"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    room_id IN (
      SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()
    ) AND
    (is_deleted = false OR sender_id = auth.uid())
  );

CREATE POLICY "Users can send messages to their rooms"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    room_id IN (
      SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- Policies for chat_files
CREATE POLICY "Users can view files in their rooms"
  ON chat_files FOR SELECT
  TO authenticated
  USING (
    room_id IN (
      SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload files to their rooms"
  ON chat_files FOR INSERT
  TO authenticated
  WITH CHECK (
    room_id IN (
      SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()
    )
  );

-- Policies for chat_typing_status
CREATE POLICY "Users can view typing status in their rooms"
  ON chat_typing_status FOR SELECT
  TO authenticated
  USING (
    room_id IN (
      SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can set their typing status"
  ON chat_typing_status FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can change their typing status"
  ON chat_typing_status FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for user_chat_settings
CREATE POLICY "Users can view their own settings"
  ON user_chat_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own settings"
  ON user_chat_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own settings"
  ON user_chat_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON chat_rooms(type);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_product_id ON chat_rooms(product_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room_id ON chat_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user_id ON chat_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_files_room_id ON chat_files(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_files_message_id ON chat_files(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_typing_status_room_id ON chat_typing_status(room_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_chat_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_chat_settings_updated_at_trigger'
  ) THEN
    CREATE TRIGGER update_user_chat_settings_updated_at_trigger
      BEFORE UPDATE ON user_chat_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_user_chat_settings_updated_at();
  END IF;
END $$;

-- Create view for room list with unread counts
CREATE OR REPLACE VIEW chat_room_list AS
SELECT 
  cr.id,
  cr.name,
  cr.description,
  cr.type,
  cr.product_id,
  cr.icon,
  cr.color,
  cr.created_by,
  cr.created_at,
  cr.archived,
  crm.user_id,
  crm.is_muted,
  crm.is_favorite,
  crm.last_read_message_id,
  crm.last_read_at,
  (SELECT COUNT(*) FROM chat_room_members WHERE room_id = cr.id) as member_count,
  (SELECT message_text FROM chat_messages 
   WHERE room_id = cr.id AND is_deleted = false 
   ORDER BY created_at DESC LIMIT 1) as last_message,
  (SELECT created_at FROM chat_messages 
   WHERE room_id = cr.id AND is_deleted = false 
   ORDER BY created_at DESC LIMIT 1) as last_message_time,
  (SELECT COUNT(*) FROM chat_messages cm
   WHERE cm.room_id = cr.id 
   AND cm.is_deleted = false
   AND (crm.last_read_message_id IS NULL OR cm.created_at > crm.last_read_at)
   AND cm.sender_id != crm.user_id) as unread_count
FROM chat_rooms cr
LEFT JOIN chat_room_members crm ON cr.id = crm.room_id;

-- Function to create default chat rooms
CREATE OR REPLACE FUNCTION create_default_chat_rooms()
RETURNS void AS $$
BEGIN
  -- Create General room if it doesn't exist
  INSERT INTO chat_rooms (name, description, type, icon, color)
  SELECT '💬 General', 'General team discussions', 'general', '💬', '#8B7355'
  WHERE NOT EXISTS (SELECT 1 FROM chat_rooms WHERE name = '💬 General');

  -- Create Finance room
  INSERT INTO chat_rooms (name, description, type, icon, color)
  SELECT '💰 Finance', 'Discussions about expenses and investments', 'general', '💰', '#D4AF37'
  WHERE NOT EXISTS (SELECT 1 FROM chat_rooms WHERE name = '💰 Finance');

  -- Create R&D room
  INSERT INTO chat_rooms (name, description, type, icon, color)
  SELECT '🧪 R&D', 'Product development and research', 'general', '🧪', '#6B8E23'
  WHERE NOT EXISTS (SELECT 1 FROM chat_rooms WHERE name = '🧪 R&D');

  -- Create Production room
  INSERT INTO chat_rooms (name, description, type, icon, color)
  SELECT '📦 Production', 'Manufacturing and operations', 'general', '📦', '#CD853F'
  WHERE NOT EXISTS (SELECT 1 FROM chat_rooms WHERE name = '📦 Production');

  -- Create Sales & Marketing room
  INSERT INTO chat_rooms (name, description, type, icon, color)
  SELECT '🛒 Sales & Marketing', 'Sales and marketing discussions', 'general', '🛒', '#4682B4'
  WHERE NOT EXISTS (SELECT 1 FROM chat_rooms WHERE name = '🛒 Sales & Marketing');
END;
$$ LANGUAGE plpgsql;

-- Execute function to create default rooms
SELECT create_default_chat_rooms();
