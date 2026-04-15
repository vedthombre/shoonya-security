import React from 'react';
import { MoreVertical } from 'lucide-react';

const ChartCard = ({ title, subtitle, children }) => {
  return (
    <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-lg flex flex-col h-full hover:border-slate-600 transition-colors duration-300">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{subtitle}</p>}
        </div>
        <button className="text-slate-500 hover:text-white transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>
      
      <div className="flex-1 w-full min-h-[250px]">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
