import React from 'react';
import { Search, Bell, User, FileText } from 'lucide-react';

const Navbar = ({ title }) => {
  return (
    <nav className="h-16 flex items-center justify-between px-8 mb-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search security logs..." 
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64"
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-slate-800/50 p-2 rounded-xl border border-slate-700/50 text-slate-400 hover:text-white transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-accent rounded-full border border-slate-800" />
          </button>
          
          <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <FileText size={16} />
            Generate Report
          </button>

          <div className="h-8 w-px bg-slate-700 mx-2" />

          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center p-[1px]">
              <div className="w-full h-full bg-slate-800 rounded-[10px] flex items-center justify-center overflow-hidden">
                <User size={20} className="text-slate-200" />
              </div>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-white group-hover:text-primary transition-colors">Admin User</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">SecOps Manager</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
