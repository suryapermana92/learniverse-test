-- Create messages table for storing chat messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  user_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  room_name TEXT NOT NULL DEFAULT 'my-chat-room',
  parent_id UUID REFERENCES messages(id) NULL
);

-- Create index for faster queries by room
CREATE INDEX IF NOT EXISTS messages_room_name_idx ON messages(room_name);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read messages
CREATE POLICY "Anyone can read messages" ON messages
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert messages
CREATE POLICY "Authenticated users can insert messages" ON messages
  FOR INSERT TO authenticated WITH CHECK (true);

-- Set up realtime subscriptions for this table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
