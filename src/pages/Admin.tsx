import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { Team, Player, Match, EliminationMatch } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ImageUpload from '../components/ImageUpload';
import DefaultAvatar from '../components/DefaultAvatar';
import { 
  Users, 
  User, 
  Calendar, 
  Radio, 
  Trophy, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  LogOut,
  Shield
} from 'lucide-react';

const Admin: React.FC = () => {
  const { user, signIn, signOut } = useAuth();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'teams' | 'players' | 'matches' | 'live' | 'eliminations'>('teams');
  const [loading, setLoading] = useState(false);
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Data states
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [eliminationMatches, setEliminationMatches] = useState<EliminationMatch[]>([]);

  // Form states
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [showEliminationForm, setShowEliminationForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

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

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTeams(),
        fetchPlayers(),
        fetchMatches(),
        fetchEliminationMatches()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    const { data, error } = await supabase.from('teams').select('*').order('name');
    if (error) throw error;
    setTeams(data || []);
  };

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*, team:teams(name)')
      .order('name');
    if (error) throw error;
    setPlayers(data || []);
  };

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team_data:teams!matches_home_team_fkey(name),
        away_team_data:teams!matches_away_team_fkey(name)
      `)
      .order('date', { ascending: false });
    if (error) throw error;
    setMatches(data || []);
  };

  const fetchEliminationMatches = async () => {
    const { data, error } = await supabase
      .from('elimination_matches')
      .select(`
        *,
        team1_data:teams!elimination_matches_team1_id_fkey(name),
        team2_data:teams!elimination_matches_team2_id_fkey(name)
      `)
      .order('stage', { ascending: false })
      .order('match_number');
    if (error) throw error;
    setEliminationMatches(data || []);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const { error } = await signIn(email, password);
    if (error) {
      setAuthError(error.message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Team operations
  const saveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('teams')
          .update(teamForm)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('teams')
          .insert([teamForm]);
        if (error) throw error;
      }
      resetTeamForm();
      fetchTeams();
    } catch (error) {
      console.error('Error saving team:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async (id: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الفريق؟' : 'Êtes-vous sûr de supprimer cette équipe?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;
      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetTeamForm = () => {
    setTeamForm({ name: '', logo_url: '', group_name: 'A' });
    setShowTeamForm(false);
    setEditingItem(null);
  };

  // Player operations
  const savePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('players')
          .update(playerForm)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('players')
          .insert([playerForm]);
        if (error) throw error;
      }
      resetPlayerForm();
      fetchPlayers();
    } catch (error) {
      console.error('Error saving player:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePlayer = async (id: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا اللاعب؟' : 'Êtes-vous sûr de supprimer ce joueur?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('players').delete().eq('id', id);
      if (error) throw error;
      fetchPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPlayerForm = () => {
    setPlayerForm({ name: '', team_id: '', goals: 0, assists: 0 });
    setShowPlayerForm(false);
    setEditingItem(null);
  };

  // Match operations
  const saveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('matches')
          .update(matchForm)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('matches')
          .insert([matchForm]);
        if (error) throw error;
      }
      resetMatchForm();
      fetchMatches();
    } catch (error) {
      console.error('Error saving match:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMatch = async (id: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه المباراة؟' : 'Êtes-vous sûr de supprimer ce match?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('matches').delete().eq('id', id);
      if (error) throw error;
      fetchMatches();
    } catch (error) {
      console.error('Error deleting match:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetMatchForm = () => {
    setMatchForm({ date: '', time: '15:00', home_team: '', away_team: '' });
    setShowMatchForm(false);
    setEditingItem(null);
  };

  // Elimination match operations
  const saveEliminationMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('elimination_matches')
          .update(eliminationForm)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('elimination_matches')
          .insert([eliminationForm]);
        if (error) throw error;
      }
      resetEliminationForm();
      fetchEliminationMatches();
    } catch (error) {
      console.error('Error saving elimination match:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEliminationMatch = async (id: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف مباراة الإقصاء؟' : 'Êtes-vous sûr de supprimer ce match éliminatoire?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('elimination_matches').delete().eq('id', id);
      if (error) throw error;
      fetchEliminationMatches();
    } catch (error) {
      console.error('Error deleting elimination match:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetEliminationForm = () => {
    setEliminationForm({ 
      stage: 'quarter', 
      match_number: 1, 
      team1_id: '', 
      team2_id: '', 
      date: '', 
      time: '15:00' 
    });
    setShowEliminationForm(false);
    setEditingItem(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <Shield className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'لوحة الإدارة' : 'Panneau d\'Administration'}
            </h1>
            <p className="text-gray-600 mt-2">
              {language === 'ar' ? 'تسجيل الدخول للوصول' : 'Connectez-vous pour accéder'}
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'كلمة المرور' : 'Mot de passe'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            {authError && (
              <div className="text-red-600 text-sm">{authError}</div>
            )}
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition-colors"
            >
              {language === 'ar' ? 'تسجيل الدخول' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {language === 'ar' ? 'لوحة الإدارة' : 'Panneau d\'Administration'}
          </h1>
          <p className="text-gray-600 mt-2">
            {language === 'ar' ? 'إدارة البطولة والفرق واللاعبين' : 'Gérer le tournoi, les équipes et les joueurs'}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <LogOut className="h-4 w-4" />
          <span>{language === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-lg">
          <nav className="flex flex-wrap gap-2">
            {[
              { id: 'teams', icon: Users, label: language === 'ar' ? 'الفرق' : 'Équipes' },
              { id: 'players', icon: User, label: language === 'ar' ? 'اللاعبون' : 'Joueurs' },
              { id: 'matches', icon: Calendar, label: language === 'ar' ? 'المباريات' : 'Matchs' },
              { id: 'live', icon: Radio, label: language === 'ar' ? 'النتائج المباشرة' : 'Résultats Live' },
              { id: 'eliminations', icon: Trophy, label: language === 'ar' ? 'مباريات الإقصاء' : 'Éliminations' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50 hover:text-gray-800'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {loading && <LoadingSpinner />}

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'إدارة الفرق' : 'Gestion des Équipes'}
            </h2>
            <button
              onClick={() => setShowTeamForm(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{language === 'ar' ? 'إضافة فريق' : 'Ajouter Équipe'}</span>
            </button>
          </div>

          {/* Teams List */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'الفريق' : 'Équipe'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'المجموعة' : 'Groupe'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teams.map((team) => (
                    <tr key={team.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {team.logo_url ? (
                            <img className="h-8 w-8 rounded-full" src={team.logo_url} alt="" />
                          ) : (
                            <DefaultAvatar type="team" name={team.name} size="md" />
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{team.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {team.group_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingItem(team);
                              setTeamForm({
                                name: team.name,
                                logo_url: team.logo_url,
                                group_name: team.group_name
                              });
                              setShowTeamForm(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteTeam(team.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Team Form Modal */}
          {showTeamForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {editingItem 
                      ? (language === 'ar' ? 'تعديل الفريق' : 'Modifier Équipe')
                      : (language === 'ar' ? 'إضافة فريق جديد' : 'Nouvelle Équipe')
                    }
                  </h3>
                  <button onClick={resetTeamForm}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={saveTeam} className="space-y-4">
                  <div>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ar' ? 'المجموعة' : 'Groupe'}
                    </label>
                    <select
                      value={teamForm.group_name}
                      onChange={(e) => setTeamForm({...teamForm, group_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ar' ? 'شعار الفريق' : 'Logo de l\'équipe'}
                    </label>
                    <ImageUpload
                      currentImage={teamForm.logo_url}
                      onImageChange={(url) => setTeamForm({...teamForm, logo_url: url})}
                      placeholder={language === 'ar' ? 'اختر شعار الفريق' : 'Choisir le logo'}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={resetTeamForm}
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
      )}

      {/* Players Tab */}
      {activeTab === 'players' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'إدارة اللاعبين' : 'Gestion des Joueurs'}
            </h2>
            <button
              onClick={() => setShowPlayerForm(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{language === 'ar' ? 'إضافة لاعب' : 'Ajouter Joueur'}</span>
            </button>
          </div>

          {/* Players List */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'اللاعب' : 'Joueur'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'الفريق' : 'Équipe'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'الأهداف' : 'Buts'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'التمريرات' : 'Passes'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {players.map((player) => (
                    <tr key={player.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DefaultAvatar type="player" name={player.name} size="md" />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{player.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {player.team?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {player.goals}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {player.assists}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingItem(player);
                              setPlayerForm({
                                name: player.name,
                                team_id: player.team_id,
                                goals: player.goals,
                                assists: player.assists
                              });
                              setShowPlayerForm(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deletePlayer(player.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Player Form Modal */}
          {showPlayerForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {editingItem 
                      ? (language === 'ar' ? 'تعديل اللاعب' : 'Modifier Joueur')
                      : (language === 'ar' ? 'إضافة لاعب جديد' : 'Nouveau Joueur')
                    }
                  </h3>
                  <button onClick={resetPlayerForm}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={savePlayer} className="space-y-4">
                  <div>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ar' ? 'الفريق' : 'Équipe'}
                    </label>
                    <select
                      value={playerForm.team_id}
                      onChange={(e) => setPlayerForm({...playerForm, team_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">{language === 'ar' ? 'اختر فريق' : 'Choisir équipe'}</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                        {language === 'ar' ? 'التمريرات' : 'Passes'}
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
                      onClick={resetPlayerForm}
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
      )}

      {/* Matches Tab */}
      {activeTab === 'matches' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'إدارة المباريات' : 'Gestion des Matchs'}
            </h2>
            <button
              onClick={() => setShowMatchForm(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{language === 'ar' ? 'إضافة مباراة' : 'Ajouter Match'}</span>
            </button>
          </div>

          {/* Matches List */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
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
                  {matches.map((match) => (
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
                          match.status === 'live' ? 'bg-red-100 text-red-800' :
                          match.status === 'finished' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {match.status === 'live' ? (language === 'ar' ? 'مباشر' : 'Live') :
                           match.status === 'finished' ? (language === 'ar' ? 'انتهت' : 'Terminé') :
                           (language === 'ar' ? 'مجدولة' : 'Programmé')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingItem(match);
                              setMatchForm({
                                date: match.date,
                                time: match.time,
                                home_team: match.home_team,
                                away_team: match.away_team
                              });
                              setShowMatchForm(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteMatch(match.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Match Form Modal */}
          {showMatchForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {editingItem 
                      ? (language === 'ar' ? 'تعديل المباراة' : 'Modifier Match')
                      : (language === 'ar' ? 'إضافة مباراة جديدة' : 'Nouveau Match')
                    }
                  </h3>
                  <button onClick={resetMatchForm}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={saveMatch} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
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
                    <div>
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ar' ? 'الفريق المضيف' : 'Équipe domicile'}
                    </label>
                    <select
                      value={matchForm.home_team}
                      onChange={(e) => setMatchForm({...matchForm, home_team: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">{language === 'ar' ? 'اختر فريق' : 'Choisir équipe'}</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ar' ? 'الفريق الضيف' : 'Équipe extérieur'}
                    </label>
                    <select
                      value={matchForm.away_team}
                      onChange={(e) => setMatchForm({...matchForm, away_team: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">{language === 'ar' ? 'اختر فريق' : 'Choisir équipe'}</option>
                      {teams.filter(team => team.id !== matchForm.home_team).map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={resetMatchForm}
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
      )}

      {/* Live Results Tab */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {language === 'ar' ? 'النتائج المباشرة' : 'Résultats en Direct'}
          </h2>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
            <p className="text-gray-600 text-center">
              {language === 'ar' 
                ? 'يمكنك إدارة النتائج المباشرة من صفحة "المباشر" الرئيسية'
                : 'Vous pouvez gérer les résultats en direct depuis la page "En Direct" principale'
              }
            </p>
            <div className="mt-4 text-center">
              <a 
                href="/live" 
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center space-x-2"
              >
                <Radio className="h-5 w-5" />
                <span>{language === 'ar' ? 'انتقل إلى المباشر' : 'Aller au Live'}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Elimination Matches Tab */}
      {activeTab === 'eliminations' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'إدارة مباريات الإقصاء' : 'Gestion des Matchs Éliminatoires'}
            </h2>
            <button
              onClick={() => setShowEliminationForm(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{language === 'ar' ? 'إضافة مباراة إقصاء' : 'Ajouter Match Éliminatoire'}</span>
            </button>
          </div>

          {/* Elimination Matches List */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'المرحلة' : 'Phase'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'المباراة' : 'Match'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'التاريخ' : 'Date'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'النتيجة' : 'Score'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {eliminationMatches.map((match) => (
                    <tr key={match.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {match.stage === 'final' ? (language === 'ar' ? 'النهائي' : 'Finale') :
                         match.stage === 'semi' ? (language === 'ar' ? 'نصف النهائي' : 'Demi-finale') :
                         (language === 'ar' ? 'ربع النهائي' : 'Quart de finale')} {match.match_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {match.team1_data?.name || (language === 'ar' ? 'غير محدد' : 'Non défini')} vs {match.team2_data?.name || (language === 'ar' ? 'غير محدد' : 'Non défini')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(match.date).toLocaleDateString()} - {match.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {match.status === 'finished' ? `${match.team1_score} - ${match.team2_score}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingItem(match);
                              setEliminationForm({
                                stage: match.stage,
                                match_number: match.match_number,
                                team1_id: match.team1_id || '',
                                team2_id: match.team2_id || '',
                                date: match.date,
                                time: match.time
                              });
                              setShowEliminationForm(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteEliminationMatch(match.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Elimination Match Form Modal */}
          {showEliminationForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {editingItem 
                      ? (language === 'ar' ? 'تعديل مباراة الإقصاء' : 'Modifier Match Éliminatoire')
                      : (language === 'ar' ? 'إضافة مباراة إقصاء جديدة' : 'Nouveau Match Éliminatoire')
                    }
                  </h3>
                  <button onClick={resetEliminationForm}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={saveEliminationMatch} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ar' ? 'المرحلة' : 'Phase'}
                      </label>
                      <select
                        value={eliminationForm.stage}
                        onChange={(e) => setEliminationForm({...eliminationForm, stage: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      >
                        <option value="quarter">{language === 'ar' ? 'ربع النهائي' : 'Quart de finale'}</option>
                        <option value="semi">{language === 'ar' ? 'نصف النهائي' : 'Demi-finale'}</option>
                        <option value="final">{language === 'ar' ? 'النهائي' : 'Finale'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ar' ? 'رقم المباراة' : 'Numéro'}
                      </label>
                      <input
                        type="number"
                        value={eliminationForm.match_number}
                        onChange={(e) => setEliminationForm({...eliminationForm, match_number: parseInt(e.target.value) || 1})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ar' ? 'الفريق الأول' : 'Équipe 1'}
                    </label>
                    <select
                      value={eliminationForm.team1_id}
                      onChange={(e) => setEliminationForm({...eliminationForm, team1_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">{language === 'ar' ? 'اختر فريق' : 'Choisir équipe'}</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ar' ? 'الفريق الثاني' : 'Équipe 2'}
                    </label>
                    <select
                      value={eliminationForm.team2_id}
                      onChange={(e) => setEliminationForm({...eliminationForm, team2_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">{language === 'ar' ? 'اختر فريق' : 'Choisir équipe'}</option>
                      {teams.filter(team => team.id !== eliminationForm.team1_id).map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
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
                    <div>
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
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={resetEliminationForm}
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
      )}
    </div>
  );
};

export default Admin;