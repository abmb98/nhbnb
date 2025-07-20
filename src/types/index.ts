export interface Team {
  id: string;
  name: string;
  logo_url: string;
  group_name: string;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  matches_played: number;
  points: number;
  goal_difference: number;
}

export interface Player {
  id: string;
  name: string;
  team_id: string;
  goals: number;
  assists: number;
  team?: Team;
}

export interface Match {
  id: string;
  date: string;
  time: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  played: boolean;
  status: 'scheduled' | 'live' | 'finished';
  live_home_score: number;
  live_away_score: number;
  current_minute: number;
  home_team_data?: Team;
  away_team_data?: Team;
  events?: MatchEvent[];
}

export interface EliminationMatch {
  id: string;
  stage: 'quarter' | 'semi' | 'final';
  match_number: number;
  team1_id: string | null;
  team2_id: string | null;
  winner_id: string | null;
  team1_score: number | null;
  team2_score: number | null;
  date: string;
  time: string;
  status: 'scheduled' | 'live' | 'finished';
  live_team1_score: number;
  live_team2_score: number;
  current_minute: number;
  created_at: string;
  team1_data?: Team;
  team2_data?: Team;
  winner_data?: Team;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  player_id: string;
  event_type: 'goal' | 'red_card' | 'yellow_card';
  minute: number;
  assist_player_id?: string;
  created_at: string;
  player?: Player;
  assist_player?: Player;
}