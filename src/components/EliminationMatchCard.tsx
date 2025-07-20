import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { EliminationMatch } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import DefaultAvatar from './DefaultAvatar';
import { Play, Square, Clock, Edit, Trophy } from 'lucide-react';

interface EliminationMatchCardProps {
  match: EliminationMatch;
  onUpdate: () => void;
}

const EliminationMatchCard: React.FC<EliminationMatchCardProps> = ({ match, onUpdate }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Auto-increment minutes for live matches
  useEffect(() => {
    if (match.status === 'live') {
      const interval = setInterval(async () => {
        const currentMinute = match.current_minute || 0;
        if (currentMinute < 90) { // Stop auto-increment at 90 minutes
          try {
            await supabase
              .from('elimination_matches')
              .update({
                current_minute: currentMinute + 1
              })
              .eq('id', match.id);
            onUpdate();
          } catch (error) {
            console.error('Error auto-updating minute:', error);
          }
        }
      }, 60000); // Update every minute (60 seconds)

      return () => clearInterval(interval);
    }
  }, [match.status, match.current_minute, match.id, onUpdate]);

  const startMatch = async () => {
    if (!user) return;
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('elimination_matches')
        .update({
          status: 'live',
          current_minute: 1,
          live_team1_score: 0,
          live_team2_score: 0
        })
        .eq('id', match.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error starting match:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const finishMatch = async () => {
    if (!user) return;
    setIsUpdating(true);
    
    try {
      const finalTeam1Score = match.live_team1_score || 0;
      const finalTeam2Score = match.live_team2_score || 0;
      
      // Determine winner
      let winnerId = null;
      if (finalTeam1Score > finalTeam2Score) {
        winnerId = match.team1_id;
      } else if (finalTeam2Score > finalTeam1Score) {
        winnerId = match.team2_id;
      }

      const { error } = await supabase
        .from('elimination_matches')
        .update({
          status: 'finished',
          team1_score: finalTeam1Score,
          team2_score: finalTeam2Score,
          winner_id: winnerId
        })
        .eq('id', match.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error finishing match:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateScore = async (team: 'team1' | 'team2', increment: boolean) => {
    if (!user) return;
    setIsUpdating(true);
    
    try {
      const currentTeam1Score = match.live_team1_score || 0;
      const currentTeam2Score = match.live_team2_score || 0;
      
      let newTeam1Score = currentTeam1Score;
      let newTeam2Score = currentTeam2Score;
      
      if (team === 'team1') {
        newTeam1Score = increment ? currentTeam1Score + 1 : Math.max(0, currentTeam1Score - 1);
      } else {
        newTeam2Score = increment ? currentTeam2Score + 1 : Math.max(0, currentTeam2Score - 1);
      }

      const { error } = await supabase
        .from('elimination_matches')
        .update({
          live_team1_score: newTeam1Score,
          live_team2_score: newTeam2Score
        })
        .eq('id', match.id);

      if (error) throw error;
      
      // Only update UI, no team stats during live play for elimination matches
      onUpdate();
    } catch (error) {
      console.error('Error updating score:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateMinute = async (newMinute: number) => {
    if (!user) return;
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('elimination_matches')
        .update({
          current_minute: Math.max(0, Math.min(120, newMinute))
        })
        .eq('id', match.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error updating minute:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = () => {
    switch (match.status) {
      case 'live':
        return (
          <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>{language === 'ar' ? 'مباشر' : 'EN DIRECT'}</span>
            <span>{match.current_minute}'</span>
          </div>
        );
      case 'finished':
        return (
          <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            <Trophy className="h-3 w-3" />
            <span>{language === 'ar' ? 'انتهت' : 'TERMINÉ'}</span>
          </div>
        );
      default:
        return (
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {language === 'ar' ? 'مجدولة' : 'PROGRAMMÉ'}
          </span>
        );
    }
  };

  const getDisplayScore = () => {
    if (match.status === 'live') {
      return `${match.live_team1_score || 0} - ${match.live_team2_score || 0}`;
    } else if (match.status === 'finished') {
      return `${match.team1_score || 0} - ${match.team2_score || 0}`;
    }
    return language === 'ar' ? 'ضد' : 'vs';
  };

  const getMatchTitle = () => {
    const stageNames = {
      quarter: language === 'ar' ? 'ربع النهائي' : 'Quart de finale',
      semi: language === 'ar' ? 'نصف النهائي' : 'Demi-finale',
      final: language === 'ar' ? 'النهائي' : 'Finale'
    };
    
    if (match.stage === 'final') {
      return stageNames[match.stage];
    }
    
    return `${stageNames[match.stage]} ${match.match_number}`;
  };

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 border-2 transition-all duration-300 ${
      match.status === 'live' 
        ? 'border-red-400 shadow-red-100' 
        : match.status === 'finished'
        ? 'border-green-300 shadow-green-100'
        : 'border-blue-300'
    }`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Match Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
        <div className="text-sm font-medium text-gray-700">
          {getMatchTitle()}
        </div>
        {getStatusBadge()}
      </div>

      <div className="text-xs text-gray-600 mb-4 text-center">
        {new Date(match.date).toLocaleDateString()} - {match.time}
      </div>

      {/* Teams and Score */}
      <div className="space-y-4">
        {/* Team 1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {match.team1_data?.logo_url ? (
              <img 
                src={match.team1_data.logo_url} 
                alt="" 
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full"
              />
            ) : (
              <DefaultAvatar type="team" name={match.team1_data?.name} size="md" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {match.team1_data?.name || (language === 'ar' ? 'فريق غير محدد' : 'Équipe non définie')}
              </h3>
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 ml-4">
            {match.status === 'live' ? (match.live_team1_score || 0) : 
             match.status === 'finished' ? (match.team1_score || 0) : '-'}
          </div>
        </div>

        {/* VS Divider */}
        <div className="text-center text-gray-400 text-sm font-medium">
          {language === 'ar' ? 'ضد' : 'vs'}
        </div>

        {/* Team 2 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {match.team2_data?.logo_url ? (
              <img 
                src={match.team2_data.logo_url} 
                alt="" 
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full"
              />
            ) : (
              <DefaultAvatar type="team" name={match.team2_data?.name} size="md" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {match.team2_data?.name || (language === 'ar' ? 'فريق غير محدد' : 'Équipe non définie')}
              </h3>
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 ml-4">
            {match.status === 'live' ? (match.live_team2_score || 0) : 
             match.status === 'finished' ? (match.team2_score || 0) : '-'}
          </div>
        </div>
      </div>

      {/* Winner Display */}
      {match.status === 'finished' && match.winner_data && (
        <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <span className="font-semibold text-yellow-800">
              {language === 'ar' ? 'الفائز:' : 'Vainqueur:'} {match.winner_data.name}
            </span>
          </div>
        </div>
      )}

      {/* Admin Controls */}
      {user && (
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 text-sm">
              {language === 'ar' ? 'التحكم المباشر' : 'Contrôles Live'}
            </h4>
            <button
              onClick={() => setShowControls(!showControls)}
              className="text-blue-600 hover:text-blue-800"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>

          {showControls && (
            <div className="space-y-4">
              {/* Match Control Buttons */}
              <div className="flex flex-wrap gap-2">
                {match.status === 'scheduled' && (
                  <button
                    onClick={startMatch}
                    disabled={isUpdating}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 text-sm"
                  >
                    <Play className="h-4 w-4" />
                    <span>{language === 'ar' ? 'بدء' : 'Commencer'}</span>
                  </button>
                )}
                
                {match.status === 'live' && (
                  <button
                    onClick={finishMatch}
                    disabled={isUpdating}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50 text-sm"
                  >
                    <Square className="h-4 w-4" />
                    <span>{language === 'ar' ? 'إنهاء' : 'Terminer'}</span>
                  </button>
                )}
              </div>

              {/* Live Controls */}
              {match.status === 'live' && (
                <div className="grid grid-cols-1 gap-4">
                  {/* Team 1 Score */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="text-xs font-medium text-gray-700 mb-2">
                      {match.team1_data?.name}
                    </h5>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateScore('team1', false)}
                        disabled={isUpdating}
                        className="bg-red-500 text-white w-6 h-6 rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
                      >
                        -
                      </button>
                      <span className="text-lg font-bold w-6 text-center">
                        {match.live_team1_score || 0}
                      </span>
                      <button
                        onClick={() => updateScore('team1', true)}
                        disabled={isUpdating}
                        className="bg-green-500 text-white w-6 h-6 rounded-full hover:bg-green-600 transition-colors disabled:opacity-50 text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Current Minute */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{language === 'ar' ? 'الدقيقة' : 'Minute'}</span>
                    </h5>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateMinute((match.current_minute || 0) - 1)}
                        disabled={isUpdating}
                        className="bg-gray-500 text-white w-6 h-6 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50 text-sm"
                      >
                        -
                      </button>
                      <span className="text-lg font-bold w-8 text-center">
                        {match.current_minute || 0}'
                      </span>
                      <button
                        onClick={() => updateMinute((match.current_minute || 0) + 1)}
                        disabled={isUpdating}
                        className="bg-gray-500 text-white w-6 h-6 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50 text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Team 2 Score */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="text-xs font-medium text-gray-700 mb-2">
                      {match.team2_data?.name}
                    </h5>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateScore('team2', false)}
                        disabled={isUpdating}
                        className="bg-red-500 text-white w-6 h-6 rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
                      >
                        -
                      </button>
                      <span className="text-lg font-bold w-6 text-center">
                        {match.live_team2_score || 0}
                      </span>
                      <button
                        onClick={() => updateScore('team2', true)}
                        disabled={isUpdating}
                        className="bg-green-500 text-white w-6 h-6 rounded-full hover:bg-green-600 transition-colors disabled:opacity-50 text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EliminationMatchCard;