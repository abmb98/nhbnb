import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Match } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import DefaultAvatar from '../components/DefaultAvatar';
import MatchDetail from '../components/MatchDetail';
import { Calendar, Filter } from 'lucide-react';

const Matches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'played' | 'upcoming'>('all');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    fetchMatches();
    
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
    filterMatches();
  }, [matches, filter]);

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

  const filterMatches = () => {
    let filtered = matches;
    
    if (filter === 'played') {
      filtered = matches.filter(match => match.status === 'finished');
    } else if (filter === 'upcoming') {
      filtered = matches.filter(match => match.status === 'scheduled');
    }

    setFilteredMatches(filtered);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">المباريات</h1>
        <p className="text-gray-600">جميع مباريات الدوري والنتائج</p>
      </div>

      {/* Filter Buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            filter === 'all'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          جميع المباريات
        </button>
        <button
          onClick={() => setFilter('played')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            filter === 'played'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          النتائج
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            filter === 'upcoming'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          المباريات القادمة
        </button>
      </div>

      {/* Matches List */}
      <div className="bg-white rounded-lg shadow-lg">
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
                    {new Date(match.date).toLocaleDateString()} - {match.time}
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
                      <div className="text-lg font-medium text-gray-500">ضد</div>
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
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {match.played ? 'انتهت' : 'قادمة'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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