-- Add parent_id column to messages table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'messages'
        AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE messages ADD COLUMN parent_id UUID REFERENCES messages(id) NULL;
    END IF;
END $$;
