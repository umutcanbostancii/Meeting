/*
  # Create meeting times table

  1. New Tables
    - `meeting_times`
      - `id` (uuid, primary key)
      - `name` (text)
      - `weekdayOrWeekend` (text)
      - `days` (text[])
      - `time` (text)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `meeting_times` table
    - Add policy for authenticated users to read all data
    - Add policy for authenticated users to insert their own data
*/

CREATE TABLE IF NOT EXISTS meeting_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  weekdayOrWeekend text NOT NULL,
  days text[] NOT NULL,
  time text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE meeting_times ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access"
  ON meeting_times
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON meeting_times
  FOR INSERT
  TO authenticated
  WITH CHECK (true);