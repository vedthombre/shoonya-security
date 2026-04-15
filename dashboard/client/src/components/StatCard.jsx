import React from 'react';
import { ArrowUpRight, TrendingUp } from 'lucide-react';

const StatCard = ({ label, value, icon, trend, trendColor }) => {
  return (
    <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 group hover:border-primary/50 transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className="bg-slate-700/50 p-3 rounded-xl shadow-inner group-hover:scale-110 transition-transform duration-300">
          <div className="text-primary">{icon}</div>
        </div>
        {trend && (
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-slate-700/50 ${trendColor || 'text-emerald-400'}`}>
                <TrendingUp size={12} />
                {trend}
            </div>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
        <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
            <div className="mb-1 text-slate-600">
                <ArrowUpRight size={18} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
