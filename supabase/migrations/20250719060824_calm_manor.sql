/*
  # Add elimination stage support

  1. New Tables
    - `elimination_matches`
      - `id` (uuid, primary key)
      - `stage` (text) - quarter, semi, final
      - `match_number` (integer) - 1,2,3,4 for quarters, 1,2 for semis, 1 for final
      - `team1_id` (uuid, nullable) - first team
      - `team2_id` (uuid, nullable) - second team
      - `winner_id` (uuid, nullable) - winning team
      - `team1_score` (integer, nullable)
      - `team2_score` (integer, nullable)
      - `date` (date)
      - `time` (time)
      - `status` (text) - scheduled, live, finished
      - `live_team1_score` (integer, default 0)
      - `live_team2_score` (integer, default 0)
      - `current_minute` (integer, default 0)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `elimination_matches` table
    - Add policies for public read and authenticated write
*/

CREATE TABLE IF NOT EXISTS elimination_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage text NOT NULL CHECK (stage IN ('quarter', 'semi', 'final')),
  match_number integer NOT NULL,
  team1_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  team2_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  winner_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  team1_score integer,
  team2_score integer,
  date date NOT NULL,
  time time DEFAULT '15:00:00',
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
  live_team1_score integer DEFAULT 0,
  live_team2_score integer DEFAULT 0,
  current_minute integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE elimination_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read elimination matches"
  ON elimination_matches
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage elimination matches"
  ON elimination_matches
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_elimination_matches_stage ON elimination_matches(stage);
CREATE INDEX IF NOT EXISTS idx_elimination_matches_status ON elimination_matches(status);
CREATE INDEX IF NOT EXISTS idx_elimination_matches_date ON elimination_matches(date);