/*
  # Add Match Events System

  1. New Tables
    - `match_events`
      - `id` (uuid, primary key)
      - `match_id` (uuid, foreign key to matches)
      - `player_id` (uuid, foreign key to players)
      - `event_type` (text: 'goal', 'red_card', 'yellow_card')
      - `minute` (integer)
      - `assist_player_id` (uuid, optional foreign key to players)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `match_events` table
    - Add policies for authenticated users to manage events
    - Add policy for public to read events

  3. Indexes
    - Index on match_id for fast event retrieval
    - Index on player_id for player statistics
*/

CREATE TABLE IF NOT EXISTS match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('goal', 'red_card', 'yellow_card')),
  minute integer NOT NULL CHECK (minute >= 0 AND minute <= 120),
  assist_player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage match events"
  ON match_events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read match events"
  ON match_events
  FOR SELECT
  TO public
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_player_id ON match_events(player_id);
CREATE INDEX IF NOT EXISTS idx_match_events_type ON match_events(event_type);