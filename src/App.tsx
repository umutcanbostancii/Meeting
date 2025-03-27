import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, PinIcon, Award, CheckCircle, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import type { FinalVote, VoteCount, DayVoteStats, VoteResults } from './types';

const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

function App() {
  const [formData, setFormData] = useState<FinalVote>({
    name: '',
    available_day: '',
    unavailable_day: ''
  });

  const [voteStats, setVoteStats] = useState<DayVoteStats>({});
  const [results, setResults] = useState<VoteResults[]>([]);
  const [suggestedDay, setSuggestedDay] = useState<string>('');

  const fetchVotes = async () => {
    const { data, error } = await supabase
      .from('final_votes')
      .select('*');

    if (error) {
      toast.error('Oyları getirirken hata oluştu');
      return;
    }

    // Oyları işle
    const stats: DayVoteStats = {};
    DAYS.forEach(day => {
      stats[day] = { available: 0, unavailable: 0 };
    });

    data.forEach((vote: FinalVote) => {
      stats[vote.available_day].available++;
      stats[vote.unavailable_day].unavailable++;
    });

    setVoteStats(stats);
    setResults(data.map(vote => ({
      name: vote.name,
      availableDay: vote.available_day,
      unavailableDay: vote.unavailable_day
    })));

    // En uygun günü hesapla
    const availableDays = DAYS.filter(day => stats[day].unavailable === 0);
    if (availableDays.length > 0) {
      const bestDay = availableDays.reduce((a, b) => 
        stats[a].available > stats[b].available ? a : b
      );
      setSuggestedDay(bestDay);
    }
  };

  useEffect(() => {
    fetchVotes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.available_day || !formData.unavailable_day) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    if (formData.available_day === formData.unavailable_day) {
      toast.error('Aynı günü hem uygun hem de uygun değil olarak seçemezsiniz');
      return;
    }

    try {
      const { error } = await supabase
        .from('final_votes')
        .insert([formData]);

      if (error) {
        toast.error(`Kayıt hatası: ${error.message}`);
        return;
      }

      toast.success('Oylarınız kaydedildi!');
      fetchVotes();
      
      setFormData({
        name: '',
        available_day: '',
        unavailable_day: ''
      });
    } catch (error) {
      toast.error('Beklenmeyen bir hata oluştu');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <Users className="h-8 w-8 text-indigo-600" />
            Toplantı Zamanı Seçimi
          </h1>
          <p className="mt-2 text-lg text-gray-600">En uygun toplantı zamanını belirleyelim</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">İsim</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Uygun Olduğunuz Gün</label>
                <div className="space-y-2">
                  {DAYS.map((day) => (
                    <label key={day} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="available_day"
                        value={day}
                        checked={formData.available_day === day}
                        onChange={(e) => setFormData({ ...formData, available_day: e.target.value })}
                        className="text-green-500 focus:ring-green-500"
                        required
                      />
                      <span className="text-sm text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Uygun Olmadığınız Gün</label>
                <div className="space-y-2">
                  {DAYS.map((day) => (
                    <label key={day} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="unavailable_day"
                        value={day}
                        checked={formData.unavailable_day === day}
                        onChange={(e) => setFormData({ ...formData, unavailable_day: e.target.value })}
                        className="text-red-500 focus:ring-red-500"
                        required
                      />
                      <span className="text-sm text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Oyla
            </button>
          </form>
        </div>

        {suggestedDay && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <PinIcon className="h-8 w-8 text-green-500" />
              <p className="text-2xl font-bold text-green-800">
                Önerilen Toplantı Zamanı
              </p>
              <p className="text-4xl font-bold text-green-900">
                {suggestedDay} @ 21:00
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* En Çok Uygun Olan Günler */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              En Çok Uygun Olan Günler
            </h2>
            <div className="space-y-4">
              {DAYS
                .map(day => ({
                  day,
                  count: voteStats[day]?.available || 0
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3)
                .map(({ day, count }, index) => (
                  <div 
                    key={day}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index === 0 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${
                        index === 0 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {index + 1}.
                      </span>
                      <span className={`font-medium ${
                        index === 0 ? 'text-green-800' : 'text-gray-800'
                      }`}>
                        {day}
                      </span>
                    </div>
                    <span className={`font-bold ${
                      index === 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {count} oy
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* En Çok Uygun Olmayan Günler */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-500" />
              En Çok Uygun Olmayan Günler
            </h2>
            <div className="space-y-4">
              {DAYS
                .map(day => ({
                  day,
                  count: voteStats[day]?.unavailable || 0
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3)
                .map(({ day, count }, index) => (
                  <div 
                    key={day}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index === 0 
                        ? 'bg-red-50 border border-red-200' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${
                        index === 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {index + 1}.
                      </span>
                      <span className={`font-medium ${
                        index === 0 ? 'text-red-800' : 'text-gray-800'
                      }`}>
                        {day}
                      </span>
                    </div>
                    <span className={`font-bold ${
                      index === 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {count} oy
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Günlük Oylama Durumu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DAYS.map((day) => (
              <div key={day} className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">{day}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-green-600">
                    <span>✅ Uygunum</span>
                    <span className="font-medium">{voteStats[day]?.available || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-red-600">
                    <span>❌ Uygun değilim</span>
                    <span className="font-medium">{voteStats[day]?.unavailable || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {results.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mt-8">
            <h2 className="text-xl font-semibold mb-4">Katılımcı Tercihleri</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İsim</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uygun Gün</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uygun Olmayan Gün</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{result.availableDay}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{result.unavailableDay}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Toaster position="top-right" />
      </div>
    </div>
  );
}

export default App;