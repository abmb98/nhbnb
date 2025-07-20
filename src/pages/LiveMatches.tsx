import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Match } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingSpinner from '../components/LoadingSpinner';
import LiveMatchCard from '../components/LiveMatchCard';
import { Radio, Calendar, Trophy } from 'lucide-react';

const LiveMatches = () => {
  const { t, language } = useLanguage();
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [todayMatches, setTodayMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
    
    // Set up real-time subscription for live updates
    const subscription = supabase
      .channel('live-matches')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'matches',
        }, 
        () => {
          fetchMatches();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'elimination_matches'
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

  const fetchMatches = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch live matches
      const { data: liveData, error: liveError } = await supabase
        .from('matches')
        .select(`
          *,
          home_team_data:teams!matches_home_team_fkey(name, logo_url),
          away_team_data:teams!matches_away_team_fkey(name, logo_url)
        `)
        .eq('status', 'live')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (liveError) throw liveError;

      // Fetch today's matches
      const { data: todayData, error: todayError } = await supabase
        .from('matches')
        .select(`
          *,
          home_team_data:teams!matches_home_team_fkey(name, logo_url),
          away_team_data:teams!matches_away_team_fkey(name, logo_url)
        `)
        .eq('date', today)
        .order('time', { ascending: true });

      if (todayError) throw todayError;

      setLiveMatches(liveData || []);
      setTodayMatches(todayData || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4 flex items-center space-x-3">
          <Radio className="h-8 w-8 text-red-600" />
          <span>{language === 'ar' ? 'المباريات المباشرة' : 'Matchs en Direct'}</span>
        </h1>
        <p className="text-gray-600 text-lg">
          {language === 'ar' 
            ? 'تابع المباريات الجارية والنتائج المباشرة' 
            : 'Suivez les matchs en cours et les résultats en direct'
          }
        </p>
      </div>

      {/* Live Matches Section */}
      <div className="mb-12">
        <div className="flex items-center mb-6">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
          <h2 className="text-2xl font-bold text-gray-900">
            {language === 'ar' ? 'المباريات الجارية الآن' : 'Matchs en Cours'}
          </h2>
          {liveMatches.length > 0 && (
            <span className="ml-3 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              {liveMatches.length} {language === 'ar' ? 'مباراة' : 'match(s)'}
            </span>
          )}
        </div>

        {liveMatches.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-white/20">
            <Radio className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {language === 'ar' ? 'لا توجد مباريات مباشرة حالياً' : 'Aucun match en direct actuellement'}
            </h3>
            <p className="text-gray-600">
              {language === 'ar' 
                ? 'ستظهر المباريات المباشرة هنا عند بدء اللعب' 
                : 'Les matchs en direct apparaîtront ici lorsqu\'ils commenceront'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {liveMatches.map((match) => (
              <LiveMatchCard
                key={match.id}
                match={match}
                onUpdate={fetchMatches}
              />
            ))}
          </div>
        )}
      </div>

      {/* Today's Matches Section */}
      <div>
        <div className="flex items-center mb-6">
          <Calendar className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">
            {language === 'ar' ? 'مباريات اليوم' : 'Matchs d\'Aujourd\'hui'}
          </h2>
        </div>

        {todayMatches.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-white/20">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {language === 'ar' ? 'لا توجد مباريات اليوم' : 'Aucun match aujourd\'hui'}
            </h3>
            <p className="text-gray-600">
              {language === 'ar' 
                ? 'لا توجد مباريات مجدولة لهذا اليوم' 
                : 'Aucun match programmé pour aujourd\'hui'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {todayMatches.map((match) => (
              <LiveMatchCard
                key={match.id}
                match={match}
                onUpdate={fetchMatches}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMatches;