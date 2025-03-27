import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, PinIcon, Award } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import type { MeetingAvailability, AnalyticsData, DayTimeCombo } from './types';

const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const HOURS = Array.from({ length: 24 }, (_, i) => 
  `${i.toString().padStart(2, '0')}:00`
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC0CB'];

function App() {
  const [formData, setFormData] = useState<MeetingAvailability>({
    name: '',
    weekdayOrWeekend: 'weekday',
    days: [],
    time: ''
  });

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    dayStats: [],
    timeStats: [],
    weekdayStats: [],
    mostCommonTime: '',
    mostCommonWeekday: '',
    dayTimeCombos: [],
    suggestedMeetingTime: null,
    top3MeetingTimes: []
  });

  const fetchAnalytics = async () => {
    const { data, error } = await supabase
      .from('meeting_times')
      .select('*');

    if (error) {
      toast.error('Failed to fetch analytics');
      return;
    }

    // Process day statistics
    const dayCount: Record<string, number> = {};
    const timeCount: Record<string, number> = {};
    const weekdayCount: Record<string, number> = {};
    const dayTimeCount: Record<string, { count: number, people: string[] }> = {};
    
    data.forEach((entry) => {
      entry.days.forEach((day: string) => {
        dayCount[day] = (dayCount[day] || 0) + 1;

        // Gün-zaman kombinasyonu oluşturma
        const comboId = `${day}@${entry.time}`;
        if (!dayTimeCount[comboId]) {
          dayTimeCount[comboId] = { count: 0, people: [] };
        }
        dayTimeCount[comboId].count += 1;
        dayTimeCount[comboId].people.push(entry.name);
      });
      
      timeCount[entry.time] = (timeCount[entry.time] || 0) + 1;
      
      // Hafta içi/sonu tercihlerini topla
      const preference = entry.weekdayorweekend === 'weekday' ? 'Hafta İçi' : 'Hafta Sonu';
      weekdayCount[preference] = (weekdayCount[preference] || 0) + 1;
    });

    const dayStats = Object.entries(dayCount).map(([name, value]) => ({ name, value }));
    const timeStats = Object.entries(timeCount).map(([name, value]) => ({ name, value }));
    const weekdayStats = Object.entries(weekdayCount).map(([name, value]) => ({ name, value }));

    // Find most common time
    const timeEntries = Object.entries(timeCount);
    const mostCommonTime = timeEntries.length === 0 
      ? 'Henüz veri yok'
      : `En popüler zaman: ${timeEntries.reduce((a, b) => timeCount[a[0]] > timeCount[b[0]] ? a : b)[0]}`;

    // En popüler hafta içi/sonu tercihini bul
    const weekdayEntries = Object.entries(weekdayCount);
    const mostCommonWeekday = weekdayEntries.length === 0
      ? 'Henüz veri yok'
      : `En popüler periyot: ${weekdayEntries.reduce((a, b) => weekdayCount[a[0]] > weekdayCount[b[0]] ? a : b)[0]}`;

    // Gün-zaman kombinasyonlarını işle
    const dayTimeCombos: DayTimeCombo[] = Object.entries(dayTimeCount).map(([id, { count, people }]) => {
      const [day, time] = id.split('@');
      return {
        id,
        name: `${day} at ${time}`,
        day,
        time,
        count,
        people
      };
    }).sort((a, b) => b.count - a.count); // En yüksek sayıdan başlayarak sırala

    // En çok tercih edilen 3 zaman
    const top3MeetingTimes = dayTimeCombos.slice(0, 3);
    const suggestedMeetingTime = dayTimeCombos.length > 0 ? dayTimeCombos[0] : null;

    setAnalytics({
      dayStats,
      timeStats,
      weekdayStats,
      mostCommonTime,
      mostCommonWeekday,
      dayTimeCombos,
      suggestedMeetingTime,
      top3MeetingTimes
    });
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.weekdayOrWeekend || formData.days.length === 0 || !formData.time) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      const { error } = await supabase
        .from('meeting_times')
        .insert([{
          name: formData.name,
          weekdayorweekend: formData.weekdayOrWeekend,
          days: formData.days,
          time: formData.time
        }]);

      if (error) {
        console.error('Supabase hatası:', error);
        toast.error(`Kayıt hatası: ${error.message}`);
        return;
      }

      toast.success('Toplantı zamanınız kaydedildi!');
      fetchAnalytics();
      
      // Formu sıfırla
      setFormData({
        name: '',
        weekdayOrWeekend: 'weekday',
        days: [],
        time: ''
      });
    } catch (error) {
      console.error('Gönderim hatası:', error);
      toast.error('Beklenmeyen bir hata oluştu');
    }
  };

  // Popover içeriğini göstermek için
  const renderPeopleTooltip = (people: string[]) => {
    return (
      <div className="bg-white shadow-lg rounded p-2 text-sm">
        <h4 className="font-medium mb-1">Participants:</h4>
        <ul>
          {people.map((person, index) => (
            <li key={index}>{person}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <Users className="h-8 w-8 text-indigo-600" />
            Meeting Availability
          </h1>
          <p className="mt-2 text-lg text-gray-600">Help us find the perfect time for everyone</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Preference</label>
              <select
                value={formData.weekdayOrWeekend}
                onChange={(e) => setFormData({ ...formData, weekdayOrWeekend: e.target.value as 'weekday' | 'weekend' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="weekday">Weekdays</option>
                <option value="weekend">Weekends</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Days</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {DAYS.map((day) => (
                  <label key={day} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.days.includes(day)}
                      onChange={(e) => {
                        const newDays = e.target.checked
                          ? [...formData.days, day]
                          : formData.days.filter(d => d !== day);
                        setFormData({ ...formData, days: newDays });
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Preferred Time</label>
              <select
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">Select a time</option>
                {HOURS.map((hour) => (
                  <option key={hour} value={hour}>{hour}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Submit Availability
            </button>
          </form>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            Analytics
          </h2>

          {/* Suggested Meeting Time Section */}
          {analytics.suggestedMeetingTime && (
            <div className="mb-8 bg-indigo-50 rounded-lg p-6 border border-indigo-200">
              <h3 className="text-xl font-bold text-indigo-800 mb-4 flex items-center gap-2">
                <PinIcon className="h-5 w-5 text-indigo-600" />
                Suggested Meeting Time
              </h3>
              
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <div className="text-center sm:text-left mb-4 sm:mb-0">
                  <p className="text-3xl font-bold text-indigo-700">
                    {analytics.suggestedMeetingTime.name}
                  </p>
                  <p className="text-indigo-600 mt-1">
                    {analytics.suggestedMeetingTime.count} people available
                  </p>
                </div>

                <div className="flex flex-col">
                  <button 
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                    onClick={() => {
                      const people = analytics.suggestedMeetingTime?.people || [];
                      const names = people.join(', ');
                      toast(renderPeopleTooltip(people), { duration: 5000 });
                    }}
                  >
                    View Participants
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Top Alternatives */}
          {analytics.top3MeetingTimes.length > 1 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Alternatives</h3>
              <div className="space-y-4">
                {analytics.top3MeetingTimes.slice(1).map((combo, index) => (
                  <div 
                    key={combo.id} 
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">{combo.name}</span>
                      <span className="text-sm text-gray-500">({combo.count} votes)</span>
                    </div>
                    <button 
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                      onClick={() => {
                        toast(renderPeopleTooltip(combo.people), { duration: 5000 });
                      }}
                    >
                      View participants
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Original Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Days Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.dayStats}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {analytics.dayStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Time Preferences</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.timeStats}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Period Preferences</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.weekdayStats}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {analytics.weekdayStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Day-Time Combination Chart */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Day-Time Combinations</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={analytics.dayTimeCombos.slice(0, 10)} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={150} />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              <p className="text-lg font-medium text-gray-900">{analytics.mostCommonTime}</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <p className="text-lg font-medium text-gray-900">{analytics.mostCommonWeekday}</p>
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;