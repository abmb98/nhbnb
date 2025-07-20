/*
  # Add live match status support

  1. New Columns
    - `status` - Match status (scheduled, live, finished)
    - `live_home_score` - Current home team score during live match
    - `live_away_score` - Current away team score during live match
    - `current_minute` - Current match minute for live matches

  2. Updates
    - Add status column with default 'scheduled'
    - Add live score tracking columns
    - Add current minute tracking
*/

DO $$
BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'status'
  ) THEN
    ALTER TABLE matches ADD COLUMN status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished'));
  END IF;

  -- Add live_home_score column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'live_home_score'
  ) THEN
    ALTER TABLE matches ADD COLUMN live_home_score integer DEFAULT 0;
  END IF;

  -- Add live_away_score column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'live_away_score'
  ) THEN
    ALTER TABLE matches ADD COLUMN live_away_score integer DEFAULT 0;
  END IF;

  -- Add current_minute column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'current_minute'
  ) THEN
    ALTER TABLE matches ADD COLUMN current_minute integer DEFAULT 0;
  END IF;
END $$;

-- Create index for live matches
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- Update existing matches status based on played field
UPDATE matches SET status = 'finished' WHERE played = true;
UPDATE matches SET status = 'scheduled' WHERE played = false;