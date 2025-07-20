import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { EliminationMatch, Team } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingSpinner from '../components/LoadingSpinner';
import DefaultAvatar from '../components/DefaultAvatar';
import EliminationMatchCard from '../components/EliminationMatchCard';
import { Trophy, Medal, Award, Crown } from 'lucide-react';

const Eliminations = () => {
  const { t, language } = useLanguage();
  const [eliminationMatches, setEliminationMatches] = useState<EliminationMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEliminationMatches();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('elimination-matches')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'elimination_matches'
        }, 
        () => {
          fetchEliminationMatches();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchEliminationMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('elimination_matches')
        .select(`
          *,
          team1_data:teams!elimination_matches_team1_id_fkey(id, name, logo_url),
          team2_data:teams!elimination_matches_team2_id_fkey(id, name, logo_url),
          winner_data:teams!elimination_matches_winner_id_fkey(id, name, logo_url)
        `)
        .order('stage', { ascending: false })
        .order('match_number', { ascending: true });

      if (error) throw error;
      setEliminationMatches(data || []);
    } catch (error) {
      console.error('Error fetching elimination matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'final':
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 'semi':
        return <Trophy className="h-6 w-6 text-gray-400" />;
      case 'quarter':
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <Award className="h-6 w-6 text-blue-500" />;
    }
  };

  const getStageTitle = (stage: string) => {
    switch (stage) {
      case 'final':
        return language === 'ar' ? 'المباراة النهائية' : 'Finale';
      case 'semi':
        return language === 'ar' ? 'نصف النهائي' : 'Demi-finales';
      case 'quarter':
        return language === 'ar' ? 'ربع النهائي' : 'Quarts de finale';
      default:
        return stage;
    }
  };

  const getMatchesByStage = (stage: string) => {
    return eliminationMatches.filter(match => match.stage === stage);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-4 flex items-center justify-center space-x-3">
          <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-600" />
          <span>{language === 'ar' ? 'مرحلة الإقصاء' : 'Phase Éliminatoire'}</span>
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          {language === 'ar' 
            ? 'ربع النهائي، نصف النهائي والمباراة النهائية' 
            : 'Quarts de finale, demi-finales et finale'
          }
        </p>
      </div>

      {/* Tournament Bracket */}
      <div className="space-y-12">
        {/* Final */}
        {getMatchesByStage('final').length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-3xl p-6 sm:p-8 border-2 border-yellow-200">
            <div className="flex items-center justify-center mb-6">
              {getStageIcon('final')}
              <h2 className="text-2xl sm:text-3xl font-bold text-yellow-700 ml-3">
                {getStageTitle('final')}
              </h2>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                {getMatchesByStage('final').map((match) => (
                  <EliminationMatchCard
                    key={match.id}
                    match={match}
                    onUpdate={fetchEliminationMatches}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Semi-Finals */}
        {getMatchesByStage('semi').length > 0 && (
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-3xl p-6 sm:p-8 border-2 border-gray-200">
            <div className="flex items-center justify-center mb-6">
              {getStageIcon('semi')}
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-700 ml-3">
                {getStageTitle('semi')}
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {getMatchesByStage('semi').map((match) => (
                <EliminationMatchCard
                  key={match.id}
                  match={match}
                  onUpdate={fetchEliminationMatches}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quarter-Finals */}
        {getMatchesByStage('quarter').length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-3xl p-6 sm:p-8 border-2 border-amber-200">
            <div className="flex items-center justify-center mb-6">
              {getStageIcon('quarter')}
              <h2 className="text-2xl sm:text-3xl font-bold text-amber-700 ml-3">
                {getStageTitle('quarter')}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {getMatchesByStage('quarter').map((match) => (
                <EliminationMatchCard
                  key={match.id}
                  match={match}
                  onUpdate={fetchEliminationMatches}
                />
              ))}
            </div>
          </div>
        )}

        {/* No Matches Message */}
        {eliminationMatches.length === 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-white/20">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {language === 'ar' ? 'لم تبدأ مرحلة الإقصاء بعد' : 'Phase éliminatoire pas encore commencée'}
            </h3>
            <p className="text-gray-600">
              {language === 'ar' 
                ? 'ستظهر مباريات الإقصاء هنا عند إنشائها من لوحة الإدارة' 
                : 'Les matchs éliminatoires apparaîtront ici une fois créés depuis le panneau d\'administration'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Eliminations;