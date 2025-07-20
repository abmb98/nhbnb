/*
  # Add time field to matches

  1. Changes
    - Add `time` column to `matches` table to store match time
    - Update existing matches to have default time if needed

  2. Security
    - No changes to RLS policies needed
*/

-- Add time column to matches table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'time'
  ) THEN
    ALTER TABLE matches ADD COLUMN time time DEFAULT '15:00';
  END IF;
END $$;