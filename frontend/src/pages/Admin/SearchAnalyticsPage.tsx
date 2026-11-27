import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { SearchIntelligencePanel } from '../../components/Admin/SearchIntelligencePanel';

export const SearchAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all"
          >
            <ChevronLeft size={16} /> Volver al Panel Admin
          </button>
        </div>

        <SearchIntelligencePanel />
      </div>
    </div>
  );
};

export default SearchAnalyticsPage;
