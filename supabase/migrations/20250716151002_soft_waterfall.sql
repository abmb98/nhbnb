/*
  # Add Sample Data for Football League

  1. Sample Teams
    - Creates 8 teams with logos from various sources
    - Includes realistic team names and logos
  
  2. Sample Players
    - Creates players for each team
    - Includes goal and assist statistics
  
  3. Sample Matches
    - Creates fixture list with some played matches
    - Includes realistic scores and dates
*/

-- Insert sample teams
INSERT INTO teams (name, logo_url, wins, draws, losses, goals_for, goals_against) VALUES
  ('Manchester United', 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=100', 5, 2, 1, 18, 8),
  ('Liverpool FC', 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=100', 4, 3, 1, 15, 9),
  ('Chelsea FC', 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=100', 4, 2, 2, 14, 10),
  ('Arsenal FC', 'https://images.pexels.com/photos/3657154/pexels-photo-3657154.jpeg?auto=compress&cs=tinysrgb&w=100', 3, 3, 2, 12, 11),
  ('Tottenham Hotspur', 'https://images.pexels.com/photos/114296/pexels-photo-114296.jpeg?auto=compress&cs=tinysrgb&w=100', 3, 2, 3, 13, 12),
  ('Newcastle United', 'https://images.pexels.com/photos/1171084/pexels-photo-1171084.jpeg?auto=compress&cs=tinysrgb&w=100', 2, 4, 2, 10, 11),
  ('Brighton & Hove Albion', 'https://images.pexels.com/photos/1309594/pexels-photo-1309594.jpeg?auto=compress&cs=tinysrgb&w=100', 2, 2, 4, 9, 15),
  ('Aston Villa', 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=100', 1, 3, 4, 8, 16)
ON CONFLICT (name) DO NOTHING;

-- Insert sample players (get team IDs first)
DO $$
DECLARE
  man_utd_id uuid;
  liverpool_id uuid;
  chelsea_id uuid;
  arsenal_id uuid;
  tottenham_id uuid;
  newcastle_id uuid;
  brighton_id uuid;
  aston_villa_id uuid;
BEGIN
  -- Get team IDs
  SELECT id INTO man_utd_id FROM teams WHERE name = 'Manchester United';
  SELECT id INTO liverpool_id FROM teams WHERE name = 'Liverpool FC';
  SELECT id INTO chelsea_id FROM teams WHERE name = 'Chelsea FC';
  SELECT id INTO arsenal_id FROM teams WHERE name = 'Arsenal FC';
  SELECT id INTO tottenham_id FROM teams WHERE name = 'Tottenham Hotspur';
  SELECT id INTO newcastle_id FROM teams WHERE name = 'Newcastle United';
  SELECT id INTO brighton_id FROM teams WHERE name = 'Brighton & Hove Albion';
  SELECT id INTO aston_villa_id FROM teams WHERE name = 'Aston Villa';

  -- Insert players for Manchester United
  INSERT INTO players (name, team_id, goals, assists) VALUES
    ('Marcus Rashford', man_utd_id, 8, 3),
    ('Bruno Fernandes', man_utd_id, 4, 6),
    ('Mason Mount', man_utd_id, 2, 4),
    ('Rasmus Højlund', man_utd_id, 4, 1);

  -- Insert players for Liverpool FC
  INSERT INTO players (name, team_id, goals, assists) VALUES
    ('Mohamed Salah', liverpool_id, 7, 4),
    ('Darwin Núñez', liverpool_id, 5, 2),
    ('Diogo Jota', liverpool_id, 3, 3),
    ('Luis Díaz', liverpool_id, 0, 5);

  -- Insert players for Chelsea FC
  INSERT INTO players (name, team_id, goals, assists) VALUES
    ('Cole Palmer', chelsea_id, 6, 2),
    ('Nicolas Jackson', chelsea_id, 4, 1),
    ('Christopher Nkunku', chelsea_id, 2, 3),
    ('Raheem Sterling', chelsea_id, 2, 4);

  -- Insert players for Arsenal FC
  INSERT INTO players (name, team_id, goals, assists) VALUES
    ('Bukayo Saka', arsenal_id, 5, 4),
    ('Gabriel Jesus', arsenal_id, 3, 2),
    ('Martin Ødegaard', arsenal_id, 2, 5),
    ('Kai Havertz', arsenal_id, 2, 1);

  -- Insert players for Tottenham Hotspur
  INSERT INTO players (name, team_id, goals, assists) VALUES
    ('Son Heung-min', tottenham_id, 6, 2),
    ('Richarlison', tottenham_id, 4, 1),
    ('James Maddison', tottenham_id, 1, 4),
    ('Dejan Kulusevski', tottenham_id, 2, 3);

  -- Insert players for Newcastle United
  INSERT INTO players (name, team_id, goals, assists) VALUES
    ('Alexander Isak', newcastle_id, 4, 1),
    ('Callum Wilson', newcastle_id, 3, 2),
    ('Miguel Almirón', newcastle_id, 2, 2),
    ('Anthony Gordon', newcastle_id, 1, 3);

  -- Insert players for Brighton & Hove Albion
  INSERT INTO players (name, team_id, goals, assists) VALUES
    ('Evan Ferguson', brighton_id, 3, 1),
    ('Kaoru Mitoma', brighton_id, 2, 2),
    ('Solly March', brighton_id, 2, 1),
    ('Pascal Groß', brighton_id, 2, 3);

  -- Insert players for Aston Villa
  INSERT INTO players (name, team_id, goals, assists) VALUES
    ('Ollie Watkins', aston_villa_id, 4, 1),
    ('Moussa Diaby', aston_villa_id, 2, 2),
    ('Leon Bailey', aston_villa_id, 1, 2),
    ('John McGinn', aston_villa_id, 1, 1);
END $$;

-- Insert sample matches
DO $$
DECLARE
  man_utd_id uuid;
  liverpool_id uuid;
  chelsea_id uuid;
  arsenal_id uuid;
  tottenham_id uuid;
  newcastle_id uuid;
  brighton_id uuid;
  aston_villa_id uuid;
BEGIN
  -- Get team IDs
  SELECT id INTO man_utd_id FROM teams WHERE name = 'Manchester United';
  SELECT id INTO liverpool_id FROM teams WHERE name = 'Liverpool FC';
  SELECT id INTO chelsea_id FROM teams WHERE name = 'Chelsea FC';
  SELECT id INTO arsenal_id FROM teams WHERE name = 'Arsenal FC';
  SELECT id INTO tottenham_id FROM teams WHERE name = 'Tottenham Hotspur';
  SELECT id INTO newcastle_id FROM teams WHERE name = 'Newcastle United';
  SELECT id INTO brighton_id FROM teams WHERE name = 'Brighton & Hove Albion';
  SELECT id INTO aston_villa_id FROM teams WHERE name = 'Aston Villa';

  -- Insert played matches
  INSERT INTO matches (date, home_team, away_team, home_score, away_score, played) VALUES
    ('2024-01-15', man_utd_id, liverpool_id, 2, 1, true),
    ('2024-01-16', chelsea_id, arsenal_id, 1, 2, true),
    ('2024-01-17', tottenham_id, newcastle_id, 3, 0, true),
    ('2024-01-18', brighton_id, aston_villa_id, 2, 2, true),
    ('2024-01-20', liverpool_id, chelsea_id, 1, 0, true),
    ('2024-01-21', arsenal_id, tottenham_id, 2, 1, true),
    ('2024-01-22', newcastle_id, brighton_id, 1, 1, true),
    ('2024-01-23', aston_villa_id, man_utd_id, 0, 3, true);

  -- Insert upcoming matches
  INSERT INTO matches (date, home_team, away_team, played) VALUES
    ('2024-02-01', man_utd_id, chelsea_id, false),
    ('2024-02-02', liverpool_id, arsenal_id, false),
    ('2024-02-03', tottenham_id, brighton_id, false),
    ('2024-02-04', newcastle_id, aston_villa_id, false),
    ('2024-02-08', chelsea_id, tottenham_id, false),
    ('2024-02-09', arsenal_id, newcastle_id, false),
    ('2024-02-10', brighton_id, liverpool_id, false),
    ('2024-02-11', aston_villa_id, man_utd_id, false);
END $$;