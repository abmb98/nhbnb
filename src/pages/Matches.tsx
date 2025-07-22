import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Match, Team } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingSpinner from '../components/LoadingSpinner';
import DefaultAvatar from '../components/DefaultAvatar';
import MatchDetail from '../components/MatchDetail';
import { Calendar, Filter, Search, Users } from 'lucide-react';

const Matches = () => {
  const { t, language } = useLanguage();
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'played' | 'upcoming'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    fetchMatches();
    fetchTeams();
    
    // Set up real-time subscription for match updates
    const subscription = supabase
      .channel('matches-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'matches'
        }, 
        () => {
          fetchMatches();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'teams'
        }, 
        () => {
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    filterAndSearchMatches();
  }, [matches, filter, searchTerm, selectedGroup, teams]);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team_data:teams!matches_home_team_fkey(name, logo_url),
          away_team_data:teams!matches_away_team_fkey(name, logo_url)
        `)
        .order('date', { ascending: false })
        .order('time', { ascending: true });

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('group_name')
        .order('name');

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSearchMatches = () => {
    let filtered = matches;
    
    // Filter by match status
    if (filter === 'played') {
      filtered = matches.filter(match => match.status === 'finished');
    } else if (filter === 'upcoming') {
      filtered = matches.filter(match => match.status === 'scheduled');
    }

    // Filter by group
    if (selectedGroup !== 'all') {
      filtered = filtered.filter(match => {
        const homeTeam = teams.find(team => team.id === match.home_team);
        const awayTeam = teams.find(team => team.id === match.away_team);
        return homeTeam?.group_name === selectedGroup || awayTeam?.group_name === selectedGroup;
      });
    }

    // Search by team names or date
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(match => {
        const homeTeamName = match.home_team_data?.name?.toLowerCase() || '';
        const awayTeamName = match.away_team_data?.name?.toLowerCase() || '';
        const matchDate = match.date.toLowerCase();
        
        return homeTeamName.includes(searchLower) || 
               awayTeamName.includes(searchLower) || 
               matchDate.includes(searchLower);
      });
    }

    setFilteredMatches(filtered);
  };

  const getUniqueGroups = () => {
    const groups = [...new Set(teams.map(team => team.group_name))].sort();
    return groups;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {language === 'ar' ? 'المباريات' : 'Matchs'}
        </h1>
        <p className="text-gray-600">
          {language === 'ar' ? 'جميع مباريات الدوري والنتائج' : 'Tous les matchs de la ligue et résultats'}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'البحث عن فريق أو تاريخ...' : 'Rechercher équipe ou date...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          {/* Group Filter */}
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
            >
              <option value="all">
                {language === 'ar' ? 'جميع المجموعات' : 'Tous les groupes'}
              </option>
              {getUniqueGroups().map((group) => (
                <option key={group} value={group}>
                  {language === 'ar' ? `المجموعة ${group}` : `Groupe ${group}`}
                </option>
              ))}
            </select>
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'played' | 'upcoming')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
            >
              <option value="all">
                {language === 'ar' ? 'جميع المباريات' : 'Tous les matchs'}
              </option>
              <option value="played">
                {language === 'ar' ? 'النتائج' : 'Résultats'}
              </option>
              <option value="upcoming">
                {language === 'ar' ? 'المباريات القادمة' : 'Matchs à venir'}
              </option>
            </select>
          </div>
          
          {/* Results Counter */}
          <div className="flex items-center justify-center bg-emerald-50 rounded-lg px-4 py-2">
            <span className="text-sm text-emerald-700 font-medium">
              {language === 'ar' 
                ? `عرض ${filteredMatches.length} من ${matches.length} مباراة`
                : `${filteredMatches.length} sur ${matches.length} matchs`
              }
            </span>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="mb-6 flex flex-wrap gap-2 md:hidden">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            filter === 'all'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {language === 'ar' ? 'جميع المباريات' : 'Tous les matchs'}
        </button>
        <button
          onClick={() => setFilter('played')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            filter === 'played'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {language === 'ar' ? 'النتائج' : 'Résultats'}
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            filter === 'upcoming'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {language === 'ar' ? 'المباريات القادمة' : 'Matchs à venir'}
        </button>
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-white/20">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {language === 'ar' ? 'لا توجد نتائج' : 'Aucun résultat'}
          </h3>
          <p className="text-gray-600">
            {language === 'ar' 
              ? 'لم يتم العثور على مباريات تطابق معايير البحث'
              : 'Aucun match trouvé correspondant aux critères de recherche'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
        <div className="divide-y divide-gray-200">
          {filteredMatches.map((match) => (
            <div 
              key={match.id} 
              className="p-6 hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedMatch(match)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    {new Date(match.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'fr-FR')} - {match.time}
                  </div>
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center space-x-8">
                  <div className="flex items-center space-x-3">
                    {match.home_team_data?.logo_url ? (
                      <img 
                        src={match.home_team_data.logo_url} 
                        alt="" 
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <DefaultAvatar type="team" name={match.home_team_data?.name} size="md" />
                    )}
                    <span className="font-medium text-gray-900">
                      {match.home_team_data?.name}
                    </span>
                  </div>
                  
                  <div className="text-center">
                    {match.played ? (
                      <div className="text-xl font-bold text-gray-900">
                        {match.home_score} - {match.away_score}
                      </div>
                    ) : (
                      <div className="text-lg font-medium text-gray-500">
                        {language === 'ar' ? 'ضد' : 'vs'}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">
                      {match.away_team_data?.name}
                    </span>
                    {match.away_team_data?.logo_url ? (
                      <img 
                        src={match.away_team_data.logo_url} 
                        alt="" 
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <DefaultAvatar type="team" name={match.away_team_data?.name} size="md" />
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    match.played 
                      ? 'bg-green-100 text-green-800'
                      : match.status === 'live'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {match.played 
                      ? (language === 'ar' ? 'انتهت' : 'Terminé')
                      : match.status === 'live'
                      ? (language === 'ar' ? 'مباشر' : 'En Direct')
                      : (language === 'ar' ? 'قادمة' : 'À venir')
                    }
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      )}

      {/* Match Detail Modal */}
      {selectedMatch && (
        <MatchDetail
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onUpdate={fetchMatches}
        />
      )}
    </div>
  );
};

export default Matches;