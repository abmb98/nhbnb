import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Match } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import DefaultAvatar from './DefaultAvatar';
import { Play, Pause, Square, Clock, Target, Edit } from 'lucide-react';

interface LiveMatchCardProps {
  match: Match;
  onUpdate: () => void;
}

const LiveMatchCard: React.FC<LiveMatchCardProps> = ({ match, onUpdate }) => {
  const { t, language } = useLanguage();
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
              .from('matches')
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
        .from('matches')
        .update({
          status: 'live',
          current_minute: 1,
          live_home_score: 0,
          live_away_score: 0
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
      const finalHomeScore = match.live_home_score || 0;
      const finalAwayScore = match.live_away_score || 0;
      
      // Update final scores and mark as finished
      const { error } = await supabase
        .from('matches')
        .update({
          status: 'finished',
          played: true,
          home_score: finalHomeScore,
          away_score: finalAwayScore
        })
        .eq('id', match.id);

      if (error) throw error;
      
      // Update team statistics
      await updateTeamStats(finalHomeScore, finalAwayScore);
      onUpdate();
    } catch (error) {
      console.error('Error finishing match:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateTeamStats = async (homeScore: number, awayScore: number) => {
    try {
      // Fetch current team stats
      const { data: homeTeam } = await supabase
        .from('teams')
        .select('*')
        .eq('id', match.home_team)
        .single();
        
      const { data: awayTeam } = await supabase
        .from('teams')
        .select('*')
        .eq('id', match.away_team)
        .single();

      if (!homeTeam || !awayTeam) return;

      // Calculate new stats based on final result
      let homeWins = homeTeam.wins;
      let homeDraws = homeTeam.draws;
      let homeLosses = homeTeam.losses;
      let awayWins = awayTeam.wins;
      let awayDraws = awayTeam.draws;
      let awayLosses = awayTeam.losses;

      // Award points based on final result (3 for win, 1 for draw, 0 for loss)
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

      // Update goals for and against
      const homeGoalsFor = homeTeam.goals_for + homeScore;
      const homeGoalsAgainst = homeTeam.goals_against + awayScore;
      const awayGoalsFor = awayTeam.goals_for + awayScore;
      const awayGoalsAgainst = awayTeam.goals_against + homeScore;

      // Update home team stats
      await supabase
        .from('teams')
        .update({
          wins: homeWins,
          draws: homeDraws,
          losses: homeLosses,
          goals_for: homeGoalsFor,
          goals_against: homeGoalsAgainst
        })
        .eq('id', match.home_team);

      // Update away team stats
      await supabase
        .from('teams')
        .update({
          wins: awayWins,
          draws: awayDraws,
          losses: awayLosses,
          goals_for: awayGoalsFor,
          goals_against: awayGoalsAgainst
        })
        .eq('id', match.away_team);

    } catch (error) {
      console.error('Error updating team stats:', error);
    }
  };

  const updateScore = async (team: 'home' | 'away', increment: boolean) => {
    if (!user) return;
    setIsUpdating(true);
    
    try {
      const currentHomeScore = match.live_home_score || 0;
      const currentAwayScore = match.live_away_score || 0;
      
      let newHomeScore = currentHomeScore;
      let newAwayScore = currentAwayScore;
      
      if (team === 'home') {
        newHomeScore = increment ? currentHomeScore + 1 : Math.max(0, currentHomeScore - 1);
      } else {
        newAwayScore = increment ? currentAwayScore + 1 : Math.max(0, currentAwayScore - 1);
      }

      const { error } = await supabase
        .from('matches')
        .update({
          live_home_score: newHomeScore,
          live_away_score: newAwayScore
        })
        .eq('id', match.id);

      if (error) throw error;
      
      // Only update UI, no team stats during live play
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
        .from('matches')
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
          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
            {language === 'ar' ? 'انتهت' : 'TERMINÉ'}
          </span>
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
      return `${match.live_home_score || 0} - ${match.live_away_score || 0}`;
    } else if (match.status === 'finished') {
      return `${match.home_score || 0} - ${match.away_score || 0}`;
    }
    return language === 'ar' ? 'ضد' : 'vs';
  };

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 transition-all duration-300 ${
      match.status === 'live' 
        ? 'border-red-400 shadow-red-100' 
        : match.status === 'finished'
        ? 'border-gray-300'
        : 'border-blue-300'
    }`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Match Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          {new Date(match.date).toLocaleDateString()} - {match.time}
        </div>
        {getStatusBadge()}
      </div>

      {/* Teams and Score */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
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
            <h3 className="font-semibold text-gray-900">{match.home_team_data?.name}</h3>
            <p className="text-sm text-gray-600">{language === 'ar' ? 'المضيف' : 'Domicile'}</p>
          </div>
        </div>
        
        <div className="text-center">
          <div className={`text-3xl font-bold ${
            match.status === 'live' ? 'text-red-600' : 'text-gray-900'
          }`}>
            {getDisplayScore()}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <h3 className="font-semibold text-gray-900">{match.away_team_data?.name}</h3>
            <p className="text-sm text-gray-600">{language === 'ar' ? 'الضيف' : 'Extérieur'}</p>
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

      {/* Admin Controls */}
      {user && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">
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
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" />
                    <span>{language === 'ar' ? 'بدء المباراة' : 'Commencer'}</span>
                  </button>
                )}
                
                {match.status === 'live' && (
                  <button
                    onClick={finishMatch}
                    disabled={isUpdating}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Square className="h-4 w-4" />
                    <span>{language === 'ar' ? 'إنهاء المباراة' : 'Terminer'}</span>
                  </button>
                )}
              </div>

              {/* Live Controls */}
              {match.status === 'live' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Home Team Score */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      {match.home_team_data?.name}
                    </h5>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateScore('home', false)}
                        disabled={isUpdating}
                        className="bg-red-500 text-white w-8 h-8 rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="text-xl font-bold w-8 text-center">
                        {match.live_home_score || 0}
                      </span>
                      <button
                        onClick={() => updateScore('home', true)}
                        disabled={isUpdating}
                        className="bg-green-500 text-white w-8 h-8 rounded-full hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Current Minute */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{language === 'ar' ? 'الدقيقة' : 'Minute'}</span>
                    </h5>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateMinute((match.current_minute || 0) - 1)}
                        disabled={isUpdating}
                        className="bg-gray-500 text-white w-8 h-8 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="text-xl font-bold w-12 text-center">
                        {match.current_minute || 0}'
                      </span>
                      <button
                        onClick={() => updateMinute((match.current_minute || 0) + 1)}
                        disabled={isUpdating}
                        className="bg-gray-500 text-white w-8 h-8 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Away Team Score */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      {match.away_team_data?.name}
                    </h5>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateScore('away', false)}
                        disabled={isUpdating}
                        className="bg-red-500 text-white w-8 h-8 rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="text-xl font-bold w-8 text-center">
                        {match.live_away_score || 0}
                      </span>
                      <button
                        onClick={() => updateScore('away', true)}
                        disabled={isUpdating}
                        className="bg-green-500 text-white w-8 h-8 rounded-full hover:bg-green-600 transition-colors disabled:opacity-50"
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

export default LiveMatchCard;