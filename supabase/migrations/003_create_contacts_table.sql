-- 003_create_contacts_table.sql
-- Create a contacts table to store user-specific quick contacts

CREATE TABLE IF NOT EXISTS contacts (
  id BIGSERIAL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_user_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  address text NOT NULL,
  email text NULL,
  label text NULL,
  public_key jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- optional index to quickly look up contacts by owner
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
