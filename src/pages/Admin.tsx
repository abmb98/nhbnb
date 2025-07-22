import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { Team, Player, Match, EliminationMatch } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import DefaultAvatar from '../components/DefaultAvatar';
import ImageUpload from '../components/ImageUpload';
import { 
  Users, 
  User, 
  Calendar, 
  Trophy, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  LogOut,
  Search,
  Filter,
  Target
} from 'lucide-react';

const Admin = () => {
  const { user, signOut } = useAuth();
  const { language } = useLanguage();
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [eliminationMatches, setEliminationMatches] = useState<EliminationMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'teams' | 'players' | 'matches' | 'eliminations'>('teams');
  
  // Form states
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [showAddElimination, setShowAddElimination] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  
  // Search and filter states
  const [teamSearch, setTeamSearch] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerTeamFilter, setPlayerTeamFilter] = useState('all');
  const [playerSortBy, setPlayerSortBy] = useState<'name' | 'goals' | 'assists' | 'total'>('goals');
  const [playerSortOrder, setPlayerSortOrder] = useState<'asc' | 'desc'>('desc');

  // Form data
  const [teamForm, setTeamForm] = useState({
    name: '',
    logo_url: '',
    group_name: 'A'
  });
  
  const [playerForm, setPlayerForm] = useState({
    name: '',
    team_id: '',
    goals: 0,
    assists: 0
  });
  
  const [matchForm, setMatchForm] = useState({
    date: '',
    time: '15:00',
    home_team: '',
    away_team: ''
  });

  const [eliminationForm, setEliminationForm] = useState({
    stage: 'quarter' as 'quarter' | 'semi' | 'final',
    match_number: 1,
    team1_id: '',
    team2_id: '',
    date: '',
    time: '15:00'
  });

  const [matchEditForm, setMatchEditForm] = useState({
    home_score: 0,
    away_score: 0,
    played: false
  });

  const [matchSearchTerm, setMatchSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [teamsRes, playersRes, matchesRes, eliminationRes] = await Promise.all([
        supabase.from('teams').select('*').order('name'),
        supabase.from('players').select(`
          *,
          team:teams(name, logo_url)
        `).order('goals', { ascending: false }),
        supabase.from('matches').select(`
          *,
          home_team_data:teams!matches_home_team_fkey(name),
          away_team_data:teams!matches_away_team_fkey(name)
        `).order('date', { ascending: false }),
        supabase.from('elimination_matches').select(`
          *,
          team1_data:teams!elimination_matches_team1_id_fkey(name),
          team2_data:teams!elimination_matches_team2_id_fkey(name)
        `).order('stage', { ascending: false })
      ]);

      if (teamsRes.error) throw teamsRes.error;
      if (playersRes.error) throw playersRes.error;
      if (matchesRes.error) throw matchesRes.error;
      if (eliminationRes.error) throw eliminationRes.error;

      setTeams(teamsRes.data || []);
      setPlayers(playersRes.data || []);
      setMatches(matchesRes.data || []);
      setEliminationMatches(eliminationRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort functions
  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(teamSearch.toLowerCase())
  );

  const filteredAndSortedPlayers = () => {
    let filtered = players;
    
    // Filter by team
    if (playerTeamFilter !== 'all') {
      filtered = filtered.filter(player => player.team_id === playerTeamFilter);
    }
    
    // Filter by search term
    if (playerSearch.trim()) {
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
        player.team?.name.toLowerCase().includes(playerSearch.toLowerCase())
      );
    }
    
    // Sort players
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (playerSortBy) {
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
      
      if (playerSortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  };

  const filteredMatches = matches.filter(match => {
    if (!matchSearchTerm.trim()) return true;
    
    const searchLower = matchSearchTerm.toLowerCase();
    const homeTeamName = match.home_team_data?.name?.toLowerCase() || '';
    const awayTeamName = match.away_team_data?.name?.toLowerCase() || '';
    const matchDate = new Date(match.date).toLocaleDateString().toLowerCase();
    
    return homeTeamName.includes(searchLower) ||
           awayTeamName.includes(searchLower) ||
           matchDate.includes(searchLower);
  });

  // CRUD operations
  const addTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('teams')
        .insert([teamForm]);
      
      if (error) throw error;
      
      setTeamForm({ name: '', logo_url: '', group_name: 'A' });
      setShowAddTeam(false);
      fetchData();
    } catch (error) {
      console.error('Error adding team:', error);
    }
  };

  const updateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;
    
    try {
      const { error } = await supabase
        .from('teams')
        .update(teamForm)
        .eq('id', editingTeam.id);
      
      if (error) throw error;
      
      setEditingTeam(null);
      setTeamForm({ name: '', logo_url: '', group_name: 'A' });
      fetchData();
    } catch (error) {
      console.error('Error updating team:', error);
    }
  };

  const deleteTeam = async (id: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الفريق؟' : 'Êtes-vous sûr de supprimer cette équipe?')) return;
    
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const addPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('players')
        .insert([playerForm]);
      
      if (error) throw error;
      
      setPlayerForm({ name: '', team_id: '', goals: 0, assists: 0 });
      setShowAddPlayer(false);
      fetchData();
    } catch (error) {
      console.error('Error adding player:', error);
    }
  };

  const updatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    
    try {
      const { error } = await supabase
        .from('players')
        .update(playerForm)
        .eq('id', editingPlayer.id);
      
      if (error) throw error;
      
      setEditingPlayer(null);
      setPlayerForm({ name: '', team_id: '', goals: 0, assists: 0 });
      fetchData();
    } catch (error) {
      console.error('Error updating player:', error);
    }
  };

  const deletePlayer = async (id: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا اللاعب؟' : 'Êtes-vous sûr de supprimer ce joueur?')) return;
    
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  };

  const addMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('matches')
        .insert([matchForm]);
      
      if (error) throw error;
      
      setMatchForm({ date: '', time: '15:00', home_team: '', away_team: '' });
      setShowAddMatch(false);
      fetchData();
    } catch (error) {
      console.error('Error adding match:', error);
    }
  };

  const updateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;
    
    try {
      const { error } = await supabase
        .from('matches')
        .update({
          home_score: matchEditForm.home_score,
          away_score: matchEditForm.away_score,
          played: matchEditForm.played,
          status: matchEditForm.played ? 'finished' : 'scheduled'
        })
        .eq('id', editingMatch.id);
      
      if (error) throw error;
      
      // If marking as played, update team statistics
      if (matchEditForm.played && !editingMatch.played) {
        await updateTeamStatsFromMatch(editingMatch.home_team, editingMatch.away_team, matchEditForm.home_score, matchEditForm.away_score);
      }
      
      setEditingMatch(null);
      setMatchEditForm({ home_score: 0, away_score: 0, played: false });
      fetchData();
    } catch (error) {
      console.error('Error updating match:', error);
    }
  };

  const updateTeamStatsFromMatch = async (homeTeamId: string, awayTeamId: string, homeScore: number, awayScore: number) => {
    try {
      // Fetch current team stats
      const { data: homeTeam } = await supabase
        .from('teams')
        .select('*')
        .eq('id', homeTeamId)
        .single();
        
      const { data: awayTeam } = await supabase
        .from('teams')
        .select('*')
        .eq('id', awayTeamId)
        .single();

      if (!homeTeam || !awayTeam) return;

      // Calculate new stats based on result
      let homeWins = homeTeam.wins;
      let homeDraws = homeTeam.draws;
      let homeLosses = homeTeam.losses;
      let awayWins = awayTeam.wins;
      let awayDraws = awayTeam.draws;
      let awayLosses = awayTeam.losses;

      if (homeScore > awayScore) {
        homeWins++;
        awayLosses++;
      } else if (awayScore > homeScore) {
        awayWins++;
        homeLosses++;
      } else {
        homeDraws++;
        awayDraws++;
      }

      // Update goals
      const homeGoalsFor = homeTeam.goals_for + homeScore;
      const homeGoalsAgainst = homeTeam.goals_against + awayScore;
      const awayGoalsFor = awayTeam.goals_for + awayScore;
      const awayGoalsAgainst = awayTeam.goals_against + homeScore;

      // Update home team
      await supabase
        .from('teams')
        .update({
          wins: homeWins,
          draws: homeDraws,
          losses: homeLosses,
          goals_for: homeGoalsFor,
          goals_against: homeGoalsAgainst
        })
        .eq('id', homeTeamId);

      // Update away team
      await supabase
        .from('teams')
        .update({
          wins: awayWins,
          draws: awayDraws,
          losses: awayLosses,
          goals_for: awayGoalsFor,
          goals_against: awayGoalsAgainst
        })
        .eq('id', awayTeamId);

    } catch (error) {
      console.error('Error updating team stats:', error);
    }
  };

  const addEliminationMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('elimination_matches')
        .insert([eliminationForm]);
      
      if (error) throw error;
      
      setEliminationForm({
        stage: 'quarter',
        match_number: 1,
        team1_id: '',
        team2_id: '',
        date: '',
        time: '15:00'
      });
      setShowAddElimination(false);
      fetchData();
    } catch (error) {
      console.error('Error adding elimination match:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {language === 'ar' ? 'تسجيل الدخول للإدارة' : 'Connexion Admin'}
            </h2>
          </div>
          <LoginForm />
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {language === 'ar' ? 'لوحة الإدارة' : 'Panneau d\'Administration'}
        </h1>
        <button
          onClick={handleSignOut}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <LogOut className="h-4 w-4" />
          <span>{language === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          {[
            { id: 'teams', label: language === 'ar' ? 'الفرق' : 'Équipes', icon: Users },
            { id: 'players', label: language === 'ar' ? 'اللاعبون' : 'Joueurs', icon: User },
            { id: 'matches', label: language === 'ar' ? 'المباريات' : 'Matchs', icon: Calendar },
            { id: 'eliminations', label: language === 'ar' ? 'الإقصاءيات' : 'Éliminations', icon: Trophy }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {language === 'ar' ? 'إدارة الفرق' : 'Gestion des Équipes'}
            </h2>
            <button
              onClick={() => setShowAddTeam(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{language === 'ar' ? 'إضافة فريق' : 'Ajouter Équipe'}</span>
            </button>
          </div>

          {/* Team Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'البحث عن فريق...' : 'Rechercher une équipe...'}
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => (
              <div key={team.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center space-x-4 mb-4">
                  {team.logo_url ? (
                    <img src={team.logo_url} alt="" className="h-12 w-12 rounded-full" />
                  ) : (
                    <DefaultAvatar type="team" name={team.name} size="lg" />
                  )}
                  <div>
                    <h3 className="font-semibold">{team.name}</h3>
                    <p className="text-sm text-gray-600">
                      {language === 'ar' ? 'المجموعة' : 'Groupe'} {team.group_name}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingTeam(team);
                      setTeamForm({
                        name: team.name,
                        logo_url: team.logo_url,
                        group_name: team.group_name
                      });
                    }}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="h-4 w-4 mx-auto" />
                  </button>
                  <button
                    onClick={() => deleteTeam(team.id)}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Players Tab */}
      {activeTab === 'players' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {language === 'ar' ? 'إدارة اللاعبين' : 'Gestion des Joueurs'}
            </h2>
            <button
              onClick={() => setShowAddPlayer(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{language === 'ar' ? 'إضافة لاعب' : 'Ajouter Joueur'}</span>
            </button>
          </div>

          {/* Player Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'البحث عن لاعب...' : 'Rechercher joueur...'}
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              {/* Team Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={playerTeamFilter}
                  onChange={(e) => setPlayerTeamFilter(e.target.value)}
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
                  value={playerSortBy}
                  onChange={(e) => setPlayerSortBy(e.target.value as any)}
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
                  value={playerSortOrder}
                  onChange={(e) => setPlayerSortOrder(e.target.value as any)}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedPlayers().map((player) => (
              <div key={player.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <DefaultAvatar type="player" name={player.name} size="lg" />
                  <div>
                    <h3 className="font-semibold">{player.name}</h3>
                    <p className="text-sm text-gray-600">{player.team?.name}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1">
                        <Target className="h-3 w-3 text-emerald-600" />
                        <span className="text-xs text-emerald-600">{player.goals}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-blue-600" />
                        <span className="text-xs text-blue-600">{player.assists}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingPlayer(player);
                      setPlayerForm({
                        name: player.name,
                        team_id: player.team_id,
                        goals: player.goals,
                        assists: player.assists
                      });
                    }}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="h-4 w-4 mx-auto" />
                  </button>
                  <button
                    onClick={() => deletePlayer(player.id)}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matches Tab */}
      {activeTab === 'matches' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {language === 'ar' ? 'إدارة المباريات' : 'Gestion des Matchs'}
            </h2>
            <button
              onClick={() => setShowAddMatch(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{language === 'ar' ? 'إضافة مباراة' : 'Ajouter Match'}</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-white/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={language === 'ar' ? 'البحث في المباريات (الفرق، التاريخ...)' : 'Rechercher dans les matchs (équipes, date...)'}
                value={matchSearchTerm}
                onChange={(e) => setMatchSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white/50 backdrop-blur-sm"
              />
            </div>
            
            {/* Results Counter */}
            <div className="mt-3 text-sm text-gray-600">
              {language === 'ar' 
                ? `عرض ${filteredMatches.length} من ${matches.length} مباراة`
                : `Affichage de ${filteredMatches.length} sur ${matches.length} matchs`
              }
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'التاريخ' : 'Date'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'المباراة' : 'Match'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'النتيجة' : 'Score'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'الحالة' : 'Statut'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMatches.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      {language === 'ar' ? 'لا توجد مباريات تطابق البحث' : 'Aucun match ne correspond à la recherche'}
                    </td>
                  </tr>
                ) : filteredMatches.map((match) => (
                  <tr key={match.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(match.date).toLocaleDateString()} - {match.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {match.home_team_data?.name} vs {match.away_team_data?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {match.played ? `${match.home_score} - ${match.away_score}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        match.status === 'live' 
                          ? 'bg-red-100 text-red-800' 
                          : match.status === 'finished'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {match.status === 'live' && (language === 'ar' ? 'مباشر' : 'En direct')}
                        {match.status === 'finished' && (language === 'ar' ? 'انتهت' : 'Terminé')}
                        {match.status === 'scheduled' && (language === 'ar' ? 'مجدولة' : 'Programmé')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingMatch(match);
                          setMatchEditForm({
                            home_score: match.home_score || 0,
                            away_score: match.away_score || 0,
                            played: match.played
                          });
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Eliminations Tab */}
      {activeTab === 'eliminations' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {language === 'ar' ? 'إدارة الإقصاءيات' : 'Gestion des Éliminations'}
            </h2>
            <button
              onClick={() => setShowAddElimination(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{language === 'ar' ? 'إضافة مباراة إقصائية' : 'Ajouter Match Éliminatoire'}</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'المرحلة' : 'Stage'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'المباراة' : 'Match'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'التاريخ' : 'Date'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'الحالة' : 'Statut'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {eliminationMatches.map((match) => (
                  <tr key={match.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {match.stage === 'quarter' && (language === 'ar' ? 'ربع النهائي' : 'Quart de finale')}
                      {match.stage === 'semi' && (language === 'ar' ? 'نصف النهائي' : 'Demi-finale')}
                      {match.stage === 'final' && (language === 'ar' ? 'النهائي' : 'Finale')}
                      {match.stage !== 'final' && ` ${match.match_number}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {match.team1_data?.name || (language === 'ar' ? 'غير محدد' : 'Non défini')} vs {match.team2_data?.name || (language === 'ar' ? 'غير محدد' : 'Non défini')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(match.date).toLocaleDateString()} - {match.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        match.status === 'live' 
                          ? 'bg-red-100 text-red-800' 
                          : match.status === 'finished'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {match.status === 'live' && (language === 'ar' ? 'مباشر' : 'En direct')}
                        {match.status === 'finished' && (language === 'ar' ? 'انتهت' : 'Terminé')}
                        {match.status === 'scheduled' && (language === 'ar' ? 'مجدولة' : 'Programmé')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Team Modal */}
      {(showAddTeam || editingTeam) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingTeam 
                ? (language === 'ar' ? 'تعديل الفريق' : 'Modifier l\'équipe')
                : (language === 'ar' ? 'إضافة فريق جديد' : 'Ajouter nouvelle équipe')
              }
            </h3>
            <form onSubmit={editingTeam ? updateTeam : addTeam}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'اسم الفريق' : 'Nom de l\'équipe'}
                </label>
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({...teamForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'المجموعة' : 'Groupe'}
                </label>
                <select
                  value={teamForm.group_name}
                  onChange={(e) => setTeamForm({...teamForm, group_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'شعار الفريق' : 'Logo de l\'équipe'}
                </label>
                <ImageUpload
                  currentImage={teamForm.logo_url}
                  onImageChange={(url) => setTeamForm({...teamForm, logo_url: url})}
                  placeholder={language === 'ar' ? 'اختر شعار الفريق' : 'Choisir logo équipe'}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTeam(false);
                    setEditingTeam(null);
                    setTeamForm({ name: '', logo_url: '', group_name: 'A' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{language === 'ar' ? 'حفظ' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Player Modal */}
      {(showAddPlayer || editingPlayer) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingPlayer 
                ? (language === 'ar' ? 'تعديل اللاعب' : 'Modifier le joueur')
                : (language === 'ar' ? 'إضافة لاعب جديد' : 'Ajouter nouveau joueur')
              }
            </h3>
            <form onSubmit={editingPlayer ? updatePlayer : addPlayer}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'اسم اللاعب' : 'Nom du joueur'}
                </label>
                <input
                  type="text"
                  value={playerForm.name}
                  onChange={(e) => setPlayerForm({...playerForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'الفريق' : 'Équipe'}
                </label>
                <select
                  value={playerForm.team_id}
                  onChange={(e) => setPlayerForm({...playerForm, team_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">
                    {language === 'ar' ? 'اختر فريق' : 'Choisir équipe'}
                  </option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'الأهداف' : 'Buts'}
                  </label>
                  <input
                    type="number"
                    value={playerForm.goals}
                    onChange={(e) => setPlayerForm({...playerForm, goals: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'التمريرات الحاسمة' : 'Passes décisives'}
                  </label>
                  <input
                    type="number"
                    value={playerForm.assists}
                    onChange={(e) => setPlayerForm({...playerForm, assists: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPlayer(false);
                    setEditingPlayer(null);
                    setPlayerForm({ name: '', team_id: '', goals: 0, assists: 0 });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{language === 'ar' ? 'حفظ' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Match Modal */}
      {showAddMatch && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {language === 'ar' ? 'إضافة مباراة جديدة' : 'Ajouter nouveau match'}
            </h3>
            <form onSubmit={addMatch}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'التاريخ' : 'Date'}
                </label>
                <input
                  type="date"
                  value={matchForm.date}
                  onChange={(e) => setMatchForm({...matchForm, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'الوقت' : 'Heure'}
                </label>
                <input
                  type="time"
                  value={matchForm.time}
                  onChange={(e) => setMatchForm({...matchForm, time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'الفريق المضيف' : 'Équipe domicile'}
                </label>
                <select
                  value={matchForm.home_team}
                  onChange={(e) => setMatchForm({...matchForm, home_team: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">
                    {language === 'ar' ? 'اختر فريق' : 'Choisir équipe'}
                  </option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'الفريق الضيف' : 'Équipe extérieur'}
                </label>
                <select
                  value={matchForm.away_team}
                  onChange={(e) => setMatchForm({...matchForm, away_team: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">
                    {language === 'ar' ? 'اختر فريق' : 'Choisir équipe'}
                  </option>
                  {teams.filter(team => team.id !== matchForm.home_team).map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMatch(false);
                    setMatchForm({ date: '', time: '15:00', home_team: '', away_team: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{language === 'ar' ? 'حفظ' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Elimination Match Modal */}
      {showAddElimination && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {language === 'ar' ? 'إضافة مباراة إقصائية' : 'Ajouter match éliminatoire'}
            </h3>
            <form onSubmit={addEliminationMatch}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'المرحلة' : 'Stage'}
                </label>
                <select
                  value={eliminationForm.stage}
                  onChange={(e) => setEliminationForm({...eliminationForm, stage: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="quarter">
                    {language === 'ar' ? 'ربع النهائي' : 'Quart de finale'}
                  </option>
                  <option value="semi">
                    {language === 'ar' ? 'نصف النهائي' : 'Demi-finale'}
                  </option>
                  <option value="final">
                    {language === 'ar' ? 'النهائي' : 'Finale'}
                  </option>
                </select>
              </div>

              {eliminationForm.stage !== 'final' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'رقم المباراة' : 'Numéro du match'}
                  </label>
                  <input
                    type="number"
                    value={eliminationForm.match_number}
                    onChange={(e) => setEliminationForm({...eliminationForm, match_number: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    min="1"
                    max={eliminationForm.stage === 'quarter' ? 4 : 2}
                    required
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'التاريخ' : 'Date'}
                </label>
                <input
                  type="date"
                  value={eliminationForm.date}
                  onChange={(e) => setEliminationForm({...eliminationForm, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'الوقت' : 'Heure'}
                </label>
                <input
                  type="time"
                  value={eliminationForm.time}
                  onChange={(e) => setEliminationForm({...eliminationForm, time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'الفريق الأول' : 'Première équipe'}
                </label>
                <select
                  value={eliminationForm.team1_id}
                  onChange={(e) => setEliminationForm({...eliminationForm, team1_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">
                    {language === 'ar' ? 'اختر فريق (اختياري)' : 'Choisir équipe (optionnel)'}
                  </option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'الفريق الثاني' : 'Deuxième équipe'}
                </label>
                <select
                  value={eliminationForm.team2_id}
                  onChange={(e) => setEliminationForm({...eliminationForm, team2_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">
                    {language === 'ar' ? 'اختر فريق (اختياري)' : 'Choisir équipe (optionnel)'}
                  </option>
                  {teams.filter(team => team.id !== eliminationForm.team1_id).map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddElimination(false);
                    setEliminationForm({
                      stage: 'quarter',
                      match_number: 1,
                      team1_id: '',
                      team2_id: '',
                      date: '',
                      time: '15:00'
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{language === 'ar' ? 'حفظ' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Match Modal */}
      {editingMatch && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {language === 'ar' ? 'تعديل نتيجة المباراة' : 'Modifier le résultat du match'}
            </h3>
            
            {/* Match Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">
                {new Date(editingMatch.date).toLocaleDateString()} - {editingMatch.time}
              </div>
              <div className="font-medium">
                {editingMatch.home_team_data?.name} vs {editingMatch.away_team_data?.name}
              </div>
            </div>

            <form onSubmit={updateMatch}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingMatch.home_team_data?.name}
                  </label>
                  <input
                    type="number"
                    value={matchEditForm.home_score}
                    onChange={(e) => setMatchEditForm({...matchEditForm, home_score: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingMatch.away_team_data?.name}
                  </label>
                  <input
                    type="number"
                    value={matchEditForm.away_score}
                    onChange={(e) => setMatchEditForm({...matchEditForm, away_score: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    min="0"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={matchEditForm.played}
                    onChange={(e) => setMatchEditForm({...matchEditForm, played: e.target.checked})}
                    className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {language === 'ar' ? 'المباراة منتهية' : 'Match terminé'}
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMatch(null);
                    setMatchEditForm({ home_score: 0, away_score: 0, played: false });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{language === 'ar' ? 'حفظ' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Login Form Component
const LoginForm = () => {
  const { signIn } = useAuth();
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(language === 'ar' ? 'خطأ في تسجيل الدخول' : 'Erreur de connexion');
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {language === 'ar' ? 'كلمة المرور' : 'Mot de passe'}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          required
        />
      </div>
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
      >
        {loading 
          ? (language === 'ar' ? 'جاري تسجيل الدخول...' : 'Connexion...')
          : (language === 'ar' ? 'تسجيل الدخول' : 'Se connecter')
        }
      </button>
    </form>
  );
};

export default Admin;