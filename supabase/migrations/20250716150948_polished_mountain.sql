/*
  # Football League Database Schema

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `logo_url` (text)
      - `wins` (integer, default 0)
      - `draws` (integer, default 0)
      - `losses` (integer, default 0)
      - `goals_for` (integer, default 0)
      - `goals_against` (integer, default 0)
      - `created_at` (timestamp)
    
    - `players`
      - `id` (uuid, primary key)
      - `name` (text)
      - `team_id` (uuid, foreign key to teams.id)
      - `goals` (integer, default 0)
      - `assists` (integer, default 0)
      - `created_at` (timestamp)
    
    - `matches`
      - `id` (uuid, primary key)
      - `date` (date)
      - `home_team` (uuid, foreign key to teams.id)
      - `away_team` (uuid, foreign key to teams.id)
      - `home_score` (integer, nullable)
      - `away_score` (integer, nullable)
      - `played` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated admin write access
*/

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  logo_url text NOT NULL,
  wins integer DEFAULT 0,
  draws integer DEFAULT 0,
  losses integer DEFAULT 0,
  goals_for integer DEFAULT 0,
  goals_against integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  goals integer DEFAULT 0,
  assists integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  home_team uuid REFERENCES teams(id) ON DELETE CASCADE,
  away_team uuid REFERENCES teams(id) ON DELETE CASCADE,
  home_score integer,
  away_score integer,
  played boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT different_teams CHECK (home_team != away_team)
);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Public can read teams"
  ON teams
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can read players"
  ON players
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can read matches"
  ON matches
  FOR SELECT
  TO public
  USING (true);

-- Authenticated users can perform all operations (for admin functionality)
CREATE POLICY "Authenticated users can manage teams"
  ON teams
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage players"
  ON players
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage matches"
  ON matches
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_goals ON players(goals DESC);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
CREATE INDEX IF NOT EXISTS idx_matches_teams ON matches(home_team, away_team);
CREATE INDEX IF NOT EXISTS idx_teams_points ON teams((wins * 3 + draws) DESC);