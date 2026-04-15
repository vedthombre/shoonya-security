import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Lock, 
  AlertTriangle, 
  Zap,
  LayoutDashboard
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import StatCard from './components/StatCard';
import ChartCard from './components/ChartCard';
import AlertsTable from './components/AlertsTable';

const COLORS = ['#3b82f6', '#0ea5e9', '#6366f1', '#f59e0b', '#ef4444'];

const App = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ totalDetected: 0, secretsBlocked: 0, preventionRate: 0, avgRisk: 0 });
  const [events, setEvents] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.local.get({ events: [], totalScans: 0, secretsBlocked: 0 });
          const storedEvents = result.events || [];
          
          let totalDetected = storedEvents.length;
          let redacted = storedEvents.filter(e => e.action === 'REDACTED').length;
          let preventionRate = totalDetected > 0 ? (redacted / totalDetected) * 100 : 0;
          let avgRisk = totalDetected > 0 ? (storedEvents.reduce((acc, e) => acc + (e.risk_score || 0), 0) / totalDetected) : 0;

          setStats({
            totalDetected,
            secretsBlocked: redacted, // using redacted count directly
            preventionRate: Math.round(preventionRate),
            avgRisk: Math.round(avgRisk)
          });
          
          setEvents(storedEvents);

          // Calculate insights
          const last2Hours = new Date(Date.now() - 2 * 60 * 60 * 1000);
          const recentEvents = storedEvents.filter(e => new Date(e.timestamp) >= last2Hours).length;
          
          const insightsArr = [];
          if (recentEvents > 5) {
            insightsArr.push({ priority: 'high', message: `Spike in activity detected: ${recentEvents} events in the last 2 hours.` });
          }

          const platformCount = storedEvents.reduce((acc, e) => {
             acc[e.platform] = (acc[e.platform] || 0) + 1;
             return acc;
          }, {});
          
          const sortedPlatforms = Object.keys(platformCount).sort((a,b) => platformCount[b] - platformCount[a]);
          const topPlatform = sortedPlatforms[0];
          
          if (topPlatform && platformCount[topPlatform] > 10) {
            insightsArr.push({
              priority: 'medium',
              message: `Repeated leaks detected on ${topPlatform}. Consider reviewing platform-specific policies.`
            });
          }

          if (insightsArr.length === 0) {
            insightsArr.push({ priority: 'low', message: 'Security landscape is currently stable. No significant anomalies detected.' });
          }
          setInsights(insightsArr);
        }
      } catch (err) {
        console.error('Failed to fetch Shoonya data from local storage:', err);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Data processing for charts
  const timelineData = events.reduce((acc, event) => {
    const date = new Date(event.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
    const existing = acc.find(d => d.date === date);
    if (existing) existing.count += 1;
    else acc.push({ date, count: 1 });
    return acc;
  }, []).slice(-7);

  const typeData = events.reduce((acc, event) => {
    const existing = acc.find(d => d.name === event.type);
    if (existing) existing.value += 1;
    else acc.push({ name: event.type, value: 1 });
    return acc;
  }, []);

  const platformData = events.reduce((acc, event) => {
    const existing = acc.find(d => d.name === event.platform);
    if (existing) existing.value += 1;
    else acc.push({ name: event.platform, value: 1 });
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <div className="bg-primary/20 p-5 rounded-3xl">
            <Shield className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-bold text-white tracking-widest uppercase">Initializing Shoonya</h2>
            <p className="text-slate-500 text-sm font-medium">Securing your AI workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <main className="flex-1 flex flex-col p-8 transition-all duration-500">
        <Navbar title="Security Overview" />

        {/* Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up">
          <StatCard 
            label="Total Detected" 
            value={stats.totalDetected} 
            icon={<Search size={22} />} 
            trend="+12%" 
          />
          <StatCard 
            label="Secrets Blocked" 
            value={stats.secretsBlocked} 
            icon={<Lock size={22} />} 
            trend="+8%" 
            trendColor="text-cyan-400"
          />
          <StatCard 
            label="Prevention Rate" 
            value={`${stats.preventionRate}%`} 
            icon={<Zap size={22} />} 
          />
          <StatCard 
            label="System Risk" 
            value={stats.avgRisk > 70 ? 'High' : stats.avgRisk > 40 ? 'Medium' : 'Low'} 
            icon={<AlertTriangle size={22} />} 
            trendColor={stats.avgRisk > 70 ? 'text-rose-500' : 'text-emerald-400'}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="lg:col-span-2">
            <ChartCard title="Security Incident Timeline" subtitle="Detection frequency over last 7 days">
              <div className="h-[300px] w-full mt-4" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="99%" height="100%">
                  <LineChart data={timelineData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                       dataKey="date" 
                       stroke="#64748b" 
                       fontSize={10} 
                       fontWeight="bold"
                       tickLine={false} 
                       axisLine={false} 
                    />
                    <YAxis 
                       stroke="#64748b" 
                       fontSize={10} 
                       fontWeight="bold"
                       tickLine={false} 
                       axisLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                      itemStyle={{ color: '#3b82f6', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3b82f6" 
                      strokeWidth={4} 
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 8, strokeWidth: 0 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Threat Types" subtitle="Distribution by secret classification">
            <div className="h-[300px] w-full mt-4" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="99%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%" cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-2">
                 {typeData.map((t, idx) => (
                     <div key={idx} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter">
                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                         <span className="text-slate-400">{t.name}</span>
                     </div>
                 ))}
              </div>
          </ChartCard>
        </div>

        {/* Platform & Table Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
           <div className="lg:col-span-1">
              <ChartCard title="Platform Exposure" subtitle="Leaks by AI Provider">
                <div className="h-[350px] w-full mt-4" style={{ minWidth: 0 }}>
                    <ResponsiveContainer width="99%" height="100%">
                        <BarChart data={platformData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                stroke="#94a3b8" 
                                fontSize={10} 
                                fontWeight="bold"
                                axisLine={false}
                                tickLine={false}
                                width={60}
                            />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                            <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
              </ChartCard>
           </div>

           <div className="lg:col-span-3">
              <AlertsTable events={events} />
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;
