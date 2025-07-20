import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Player, Team } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingSpinner from '../components/LoadingSpinner';
import DefaultAvatar from '../components/DefaultAvatar';
import { User, Target, Users, Search, Filter } from 'lucide-react';

const Players = () => {
  const { language } = useLanguage();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'goals' | 'assists' | 'total'>('goals');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [playersResponse, teamsResponse] = await Promise.all([
        supabase
          .from('players')
          .select(`
            *,
            team:teams(name, logo_url)
          `)
          .order('goals', { ascending: false }),
        supabase
          .from('teams')
          .select('*')
          .order('name')
      ]);

      if (playersResponse.error) throw playersResponse.error;
      if (teamsResponse.error) throw teamsResponse.error;

      setPlayers(playersResponse.data || []);
      setTeams(teamsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedPlayers = () => {
    let filtered = players;
    
    // Filter by team
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(player => player.team_id === selectedTeam);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.team?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort players
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'goals':
          aValue = a.goals;
          bValue = b.goals;
          break;
        case 'assists':
          aValue = a.assists;
          bValue = b.assists;
          break;
        case 'total':
          aValue = a.goals + a.assists;
          bValue = b.goals + b.assists;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {language === 'ar' ? 'اللاعبون' : 'Joueurs'}
        </h1>
        <p className="text-gray-600">
          {language === 'ar' ? 'جميع لاعبي الدوري' : 'Tous les joueurs de la ligue'}
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'البحث عن لاعب أو فريق...' : 'Rechercher joueur ou équipe...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          {/* Team Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
            >
              <option value="all">
                {language === 'ar' ? 'جميع الفرق' : 'Toutes les équipes'}
              </option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="goals">
                {language === 'ar' ? 'ترتيب حسب الأهداف' : 'Trier par buts'}
              </option>
              <option value="assists">
                {language === 'ar' ? 'ترتيب حسب التمريرات' : 'Trier par passes'}
              </option>
              <option value="total">
                {language === 'ar' ? 'ترتيب حسب المجموع' : 'Trier par total'}
              </option>
              <option value="name">
                {language === 'ar' ? 'ترتيب حسب الاسم' : 'Trier par nom'}
              </option>
            </select>
          </div>
          
          {/* Sort Order */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="desc">
                {language === 'ar' ? 'تنازلي' : 'Décroissant'}
              </option>
              <option value="asc">
                {language === 'ar' ? 'تصاعدي' : 'Croissant'}
              </option>
            </select>
          </div>
        </div>
        
        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          {language === 'ar' 
            ? `عرض ${filteredAndSortedPlayers().length} من ${players.length} لاعب`
            : `Affichage de ${filteredAndSortedPlayers().length} sur ${players.length} joueurs`
          }
        </div>
      </div>

      {/* Players Grid */}
      {filteredAndSortedPlayers().length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-white/20">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {language === 'ar' ? 'لا توجد نتائج' : 'Aucun résultat'}
          </h3>
          <p className="text-gray-600">
            {language === 'ar' 
              ? 'لم يتم العثور على لاعبين يطابقون معايير البحث'
              : 'Aucun joueur trouvé correspondant aux critères de recherche'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedPlayers().map((player) => (
            <div key={player.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center space-x-4 mb-4">
              <DefaultAvatar type="player" name={player.name} size="lg" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{player.name}</h3>
                <div className="flex items-center space-x-2">
                  {player.team?.logo_url ? (
                    <img 
                      src={player.team.logo_url} 
                      alt="" 
                      className="h-4 w-4 rounded-full"
                    />
                  ) : (
                    <DefaultAvatar type="team" name={player.team?.name} size="sm" />
                  )}
                  <span className="text-sm text-gray-600">{player.team?.name}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-gray-600">
                    {language === 'ar' ? 'الأهداف' : 'Buts'}
                  </span>
                </div>
                <span className="text-lg font-bold text-emerald-600">{player.goals}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">
                    {language === 'ar' ? 'التمريرات الحاسمة' : 'Passes décisives'}
                  </span>
                </div>
                <span className="text-lg font-bold text-blue-600">{player.assists}</span>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {language === 'ar' ? 'إجمالي المساهمات' : 'Total contributions'}
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {player.goals + player.assists}
                  </span>
                </div>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Players;