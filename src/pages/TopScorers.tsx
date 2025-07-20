import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Player } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import DefaultAvatar from '../components/DefaultAvatar';
import { Trophy, Target, Medal } from 'lucide-react';

const TopScorers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopScorers();
  }, []);

  const fetchTopScorers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          team:teams(name, logo_url)
        `)
        .order('goals', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching top scorers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600">{position}</span>;
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">هدافي الدوري</h1>
        <p className="text-gray-600">أفضل هدافي الدوري</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {players.map((player, index) => (
            <div key={player.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10">
                    {getRankIcon(index + 1)}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {player.team?.logo_url ? (
                      <img 
                        src={player.team.logo_url} 
                        alt="" 
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <DefaultAvatar type="team" name={player.team?.name} size="md" className="h-10 w-10" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {player.name}
                      </h3>
                      <p className="text-sm text-gray-600">{player.team?.name}</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">
                        {player.goals}
                      </div>
                      <div className="text-xs text-gray-600">هدف</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium text-blue-600">
                        {player.assists}
                      </div>
                      <div className="text-xs text-gray-600">تمريرة حاسمة</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopScorers;