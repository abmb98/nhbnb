import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Match, MatchEvent, Player } from '../types';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';
import DefaultAvatar from './DefaultAvatar';
import { Clock, Target, AlertTriangle, Plus, Save, X } from 'lucide-react';

interface MatchDetailProps {
  match: Match;
  onClose: () => void;
  onUpdate: () => void;
}

const MatchDetail: React.FC<MatchDetailProps> = ({ match, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    player_id: '',
    event_type: 'goal' as 'goal' | 'red_card' | 'yellow_card',
    minute: 0,
    assist_player_id: '',
  });

  useEffect(() => {
    fetchMatchEvents();
    fetchPlayers();
  }, [match.id]);

  const fetchMatchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('match_events')
        .select(`
          *,
          player:players!match_events_player_id_fkey(name, team_id),
          assist_player:players!match_events_assist_player_id_fkey(name, team_id)
        `)
        .eq('match_id', match.id)
        .order('minute', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching match events:', error);
    }
  };

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          team:teams(name, logo_url)
        `)
        .in('team_id', [match.home_team, match.away_team])
        .order('name');

      if (error) throw error;
      setPlayers(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching players:', error);
      setLoading(false);
    }
  };

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const eventData = {
        match_id: match.id,
        player_id: newEvent.player_id,
        event_type: newEvent.event_type,
        minute: newEvent.minute,
        assist_player_id: newEvent.event_type === 'goal' && newEvent.assist_player_id 
          ? newEvent.assist_player_id 
          : null,
      };

      const { error } = await supabase
        .from('match_events')
        .insert([eventData]);

      if (error) throw error;

      // Update player stats if it's a goal
      if (newEvent.event_type === 'goal') {
        const player = players.find(p => p.id === newEvent.player_id);
        if (player) {
          await supabase
            .from('players')
            .update({ goals: player.goals + 1 })
            .eq('id', newEvent.player_id);
        }

        // Update assist if provided
        if (newEvent.assist_player_id) {
          const assistPlayer = players.find(p => p.id === newEvent.assist_player_id);
          if (assistPlayer) {
            await supabase
              .from('players')
              .update({ assists: assistPlayer.assists + 1 })
              .eq('id', newEvent.assist_player_id);
          }
        }
      }

      // Reset form
      setNewEvent({
        player_id: '',
        event_type: 'goal',
        minute: 0,
        assist_player_id: '',
      });
      setShowAddEvent(false);
      
      // Refresh data
      fetchMatchEvents();
      onUpdate();
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user || !confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('match_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      fetchMatchEvents();
      onUpdate();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'goal':
        return <Target className="h-4 w-4 text-green-600" />;
      case 'red_card':
        return <div className="h-4 w-3 bg-red-600 rounded-sm" />;
      case 'yellow_card':
        return <div className="h-4 w-3 bg-yellow-500 rounded-sm" />;
      default:
        return null;
    }
  };

  const getPlayersByTeam = (teamId: string) => {
    return players.filter(player => player.team_id === teamId);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">تفاصيل المباراة</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Match Header */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {match.home_team_data?.logo_url ? (
                  <img 
                    src={match.home_team_data.logo_url} 
                    alt="" 
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <DefaultAvatar type="team" name={match.home_team_data?.name} size="lg" />
                )}
                <div>
                  <h3 className="text-lg font-semibold">{match.home_team_data?.name}</h3>
                  <p className="text-sm text-gray-600">المضيف</p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {match.played ? `${match.home_score} - ${match.away_score}` : 'ضد'}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(match.date).toLocaleDateString()} - {match.time}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <h3 className="text-lg font-semibold">{match.away_team_data?.name}</h3>
                  <p className="text-sm text-gray-600">الضيف</p>
                </div>
                {match.away_team_data?.logo_url ? (
                  <img 
                    src={match.away_team_data.logo_url} 
                    alt="" 
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <DefaultAvatar type="team" name={match.away_team_data?.name} size="lg" />
                )}
              </div>
            </div>
          </div>

          {/* Add Event Button (Admin Only) */}
          {user && (
            <div className="mb-6">
              <button
                onClick={() => setShowAddEvent(true)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة حدث</span>
              </button>
            </div>
          )}

          {/* Events Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>أحداث المباراة</span>
            </h3>
            
            {events.length === 0 ? (
              <p className="text-gray-500 text-center py-8">لا توجد أحداث مسجلة لهذه المباراة</p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-bold text-gray-600 w-8">
                        {event.minute}'
                      </div>
                      {getEventIcon(event.event_type)}
                      <div>
                        <div className="font-medium text-gray-900">
                          {event.player?.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {event.event_type === 'goal' && 'هدف'}
                          {event.event_type === 'red_card' && 'بطاقة حمراء'}
                          {event.event_type === 'yellow_card' && 'بطاقة صفراء'}
                          {event.assist_player && (
                            <span className="ml-2">
                              (تمريرة حاسمة: {event.assist_player.name})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {user && (
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Event Modal */}
        {showAddEvent && user && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">إضافة حدث للمباراة</h3>
              <form onSubmit={addEvent}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع الحدث
                  </label>
                  <select
                    value={newEvent.event_type}
                    onChange={(e) => setNewEvent({...newEvent, event_type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="goal">هدف</option>
                    <option value="yellow_card">بطاقة صفراء</option>
                    <option value="red_card">بطاقة حمراء</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اللاعب
                  </label>
                  <select
                    value={newEvent.player_id}
                    onChange={(e) => setNewEvent({...newEvent, player_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">اختر لاعب</option>
                    <optgroup label={match.home_team_data?.name}>
                      {getPlayersByTeam(match.home_team).map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label={match.away_team_data?.name}>
                      {getPlayersByTeam(match.away_team).map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الدقيقة
                  </label>
                  <input
                    type="number"
                    value={newEvent.minute}
                    onChange={(e) => setNewEvent({...newEvent, minute: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    min="0"
                    max="120"
                    required
                  />
                </div>

                {newEvent.event_type === 'goal' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      التمريرة الحاسمة (اختياري)
                    </label>
                    <select
                      value={newEvent.assist_player_id}
                      onChange={(e) => setNewEvent({...newEvent, assist_player_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">بدون تمريرة حاسمة</option>
                      <optgroup label={match.home_team_data?.name}>
                        {getPlayersByTeam(match.home_team)
                          .filter(p => p.id !== newEvent.player_id)
                          .map((player) => (
                            <option key={player.id} value={player.id}>
                              {player.name}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label={match.away_team_data?.name}>
                        {getPlayersByTeam(match.away_team)
                          .filter(p => p.id !== newEvent.player_id)
                          .map((player) => (
                            <option key={player.id} value={player.id}>
                              {player.name}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddEvent(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>إضافة حدث</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDetail;