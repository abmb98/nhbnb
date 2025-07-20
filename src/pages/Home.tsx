import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Team, Match } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import DefaultAvatar from '../components/DefaultAvatar';
import { Calendar, Trophy, Target, Users } from 'lucide-react';

const Home = () => {
  const { t, language } = useLanguage();
  const [groupedTeams, setGroupedTeams] = useState<Record<string, Team[]>>({});
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<string>('A');

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscription for updates
    const subscription = supabase
      .channel('home-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'matches'
        }, 
        () => {
          fetchData();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'teams'
        }, 
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch teams with calculated stats
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*');

      if (teamsError) throw teamsError;

      // Calculate additional stats and group teams
      const teamsWithStats = teamsData.map((team) => ({
        ...team,
        matches_played: team.wins + team.draws + team.losses,
        points: team.wins * 3 + team.draws,
        goal_difference: team.goals_for - team.goals_against,
      }));

      // Group teams by group_name and sort within each group
      const grouped = teamsWithStats.reduce((acc, team) => {
        if (!acc[team.group_name]) {
          acc[team.group_name] = [];
        }
        acc[team.group_name].push(team);
        return acc;
      }, {} as Record<string, Team[]>);

      // Sort teams within each group by points, then goal difference
      Object.keys(grouped).forEach(groupName => {
        grouped[groupName].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return b.goal_difference - a.goal_difference;
        });
      });

      setGroupedTeams(grouped);

      // Fetch recent matches
      const { data: recentData, error: recentError } = await supabase
        .from('matches')
        .select(`
          *,
          home_team_data:teams!matches_home_team_fkey(name, logo_url),
          away_team_data:teams!matches_away_team_fkey(name, logo_url)
        `)
        .eq('played', true)
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .limit(3);

      if (recentError) throw recentError;
      setRecentMatches(recentData || []);

      // Fetch upcoming matches
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('matches')
        .select(`
          *,
          home_team_data:teams!matches_home_team_fkey(name, logo_url),
          away_team_data:teams!matches_away_team_fkey(name, logo_url)
        `)
        .in('status', ['scheduled', 'live'])
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(3);

      if (upcomingError) throw upcomingError;
      setUpcomingMatches(upcomingData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
          {t('home.title')}
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">{t('home.subtitle')}</p>
      </div>

      {/* Group Tabs */}
      <div className="mb-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-lg">
          <nav className="flex flex-wrap justify-center gap-2">
            {['A', 'B', 'C', 'D'].map((group) => (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className={`py-3 px-6 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-105 ${
                  activeGroup === group
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>{t('home.group')} {group}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Group Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden mb-8 border border-white/20">
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
          <h3 className="text-xl font-bold text-gray-800">{t('home.group')} {activeGroup}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.position')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.team')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.played')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.wins')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.draws')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.losses')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.goalsFor')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.goalsAgainst')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.goalDifference')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.points')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-100">
              {(groupedTeams[activeGroup] || []).map((team, index) => (
                <tr key={team.id} className="hover:bg-white/70 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                      index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                      index === 2 ? 'bg-gradient-to-r from-amber-600 to-yellow-600' :
                      'bg-gradient-to-r from-slate-400 to-slate-500'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {team.logo_url ? (
                        <img className="h-8 w-8 rounded-full" src={team.logo_url} alt={team.name} />
                      ) : (
                        <DefaultAvatar type="team" name={team.name} size="md" />
                      )}
                      <div className={language === 'ar' ? 'mr-4' : 'ml-4'}>
                        <div className="text-sm font-medium text-gray-900">{team.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {team.matches_played}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {team.wins}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {team.draws}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {team.losses}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {team.goals_for}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {team.goals_against}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    <span className={team.goal_difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                    <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full">
                      {team.points}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent and Upcoming Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Recent Matches */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex items-center mb-4">
            <Trophy className="h-6 w-6 text-emerald-600 mr-3" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {t('home.recentResults')}
            </h2>
          </div>
          <div className="space-y-4">
            {recentMatches.map((match) => (
              <div key={match.id} className="bg-gradient-to-r from-white/50 to-gray-50/50 backdrop-blur-sm border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {match.home_team_data?.logo_url ? (
                      <img src={match.home_team_data.logo_url} alt="" className="h-8 w-8 rounded-full" />
                    ) : (
                      <DefaultAvatar type="team" name={match.home_team_data?.name} size="md" />
                    )}
                    <span className="font-medium">{match.home_team_data?.name}</span>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg">
                    {match.home_score} - {match.away_score}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{match.away_team_data?.name}</span>
                    {match.away_team_data?.logo_url ? (
                      <img src={match.away_team_data.logo_url} alt="" className="h-8 w-8 rounded-full" />
                    ) : (
                      <DefaultAvatar type="team" name={match.away_team_data?.name} size="md" />
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-3 text-center font-medium">
                  {new Date(match.date).toLocaleDateString()} - {match.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Matches */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex items-center mb-4">
            <Calendar className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('home.upcomingMatches')}
            </h2>
          </div>
          <div className="space-y-4">
            {upcomingMatches.map((match) => (
              <div key={match.id} className="bg-gradient-to-r from-white/50 to-blue-50/50 backdrop-blur-sm border border-blue-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {match.home_team_data?.logo_url ? (
                      <img src={match.home_team_data.logo_url} alt="" className="h-8 w-8 rounded-full" />
                    ) : (
                      <DefaultAvatar type="team" name={match.home_team_data?.name} size="md" />
                    )}
                    <span className="font-medium">{match.home_team_data?.name}</span>
                  </div>
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg">
                    {match.status === 'live' ? (
                      <div className="text-center">
                        <div>{match.live_home_score} - {match.live_away_score}</div>
                        <div className="text-xs">{match.current_minute}' LIVE</div>
                      </div>
                    ) : (
                      t('home.vs')
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{match.away_team_data?.name}</span>
                    {match.away_team_data?.logo_url ? (
                      <img src={match.away_team_data.logo_url} alt="" className="h-8 w-8 rounded-full" />
                    ) : (
                      <DefaultAvatar type="team" name={match.away_team_data?.name} size="md" />
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-3 text-center font-medium">
                  {new Date(match.date).toLocaleDateString()} - {match.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;