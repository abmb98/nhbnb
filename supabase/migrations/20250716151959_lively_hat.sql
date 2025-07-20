/*
  # Update schema for group system

  1. Schema Changes
    - Add group_name column to teams table
    - Update sample data for 4 groups (A, B, C, D) with 4 teams each
    
  2. Data Organization
    - Group A: 4 teams
    - Group B: 4 teams  
    - Group C: 4 teams
    - Group D: 4 teams
*/

-- Add group_name column to teams table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'group_name'
  ) THEN
    ALTER TABLE teams ADD COLUMN group_name text NOT NULL DEFAULT 'A';
  END IF;
END $$;

-- Clear existing data
DELETE FROM matches;
DELETE FROM players;
DELETE FROM teams;

-- Insert teams for 4 groups
INSERT INTO teams (name, logo_url, group_name, wins, draws, losses, goals_for, goals_against) VALUES
-- Group A
('Manchester United', 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'A', 2, 1, 0, 6, 2),
('Liverpool', 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'A', 2, 0, 1, 5, 3),
('Chelsea', 'https://images.pexels.com/photos/114296/pexels-photo-114296.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'A', 1, 1, 1, 4, 4),
('Arsenal', 'https://images.pexels.com/photos/163452/basketball-dunk-blue-game-163452.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'A', 0, 0, 3, 1, 7),

-- Group B
('Barcelona', 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'B', 3, 0, 0, 8, 2),
('Real Madrid', 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'B', 2, 0, 1, 6, 4),
('Atletico Madrid', 'https://images.pexels.com/photos/114296/pexels-photo-114296.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'B', 1, 0, 2, 3, 5),
('Valencia', 'https://images.pexels.com/photos/163452/basketball-dunk-blue-game-163452.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'B', 0, 0, 3, 2, 8),

-- Group C
('Bayern Munich', 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'C', 2, 1, 0, 7, 3),
('Borussia Dortmund', 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'C', 2, 0, 1, 5, 4),
('RB Leipzig', 'https://images.pexels.com/photos/114296/pexels-photo-114296.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'C', 1, 1, 1, 4, 4),
('Schalke', 'https://images.pexels.com/photos/163452/basketball-dunk-blue-game-163452.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'C', 0, 0, 3, 2, 7),

-- Group D
('Juventus', 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'D', 2, 1, 0, 6, 2),
('AC Milan', 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'D', 2, 0, 1, 5, 3),
('Inter Milan', 'https://images.pexels.com/photos/114296/pexels-photo-114296.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'D', 1, 0, 2, 3, 5),
('Napoli', 'https://images.pexels.com/photos/163452/basketball-dunk-blue-game-163452.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'D', 0, 1, 2, 2, 6);

-- Insert sample players for each team
INSERT INTO players (name, team_id, goals, assists) 
SELECT 
  player_name,
  team_id,
  goals,
  assists
FROM (
  SELECT t.id as team_id, unnest(ARRAY['Player 1', 'Player 2', 'Player 3']) as player_name,
         unnest(ARRAY[5, 3, 2]) as goals,
         unnest(ARRAY[2, 4, 1]) as assists
  FROM teams t
) player_data;

-- Insert sample matches within groups
INSERT INTO matches (date, home_team, away_team, home_score, away_score, played)
SELECT 
  CURRENT_DATE - INTERVAL '7 days' + (row_number() OVER ()) * INTERVAL '3 days',
  t1.id,
  t2.id,
  CASE WHEN random() > 0.5 THEN floor(random() * 4)::int ELSE NULL END,
  CASE WHEN random() > 0.5 THEN floor(random() * 4)::int ELSE NULL END,
  random() > 0.3
FROM teams t1
CROSS JOIN teams t2
WHERE t1.group_name = t2.group_name 
  AND t1.id < t2.id
LIMIT 24; -- 6 matches per group (4 teams = 6 possible matches)