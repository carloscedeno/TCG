import React, { useEffect, useState } from 'react';
import { fetchPresales } from '../../utils/api';
import { ArrowRight } from 'lucide-react';

interface PresaleBanner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
}

export const PresaleSection: React.FC = () => {
  const [presales, setPresales] = useState<PresaleBanner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchPresales();
        setPresales(data || []);
      } catch (err) {
        console.error("Error loading presales:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-[3.5/1] rounded-2xl bg-neutral-900/50 animate-pulse border border-white/5" />
        ))}
      </div>
    );
  }

  if (presales.length === 0) return null;

  return (
    <div className="mt-8 mb-4">
      {/* Grid of small banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {presales.map((item) => (
          <a
            key={item.id}
            href={item.link_url || '#'}
            className="group relative aspect-[3.5/1] rounded-2xl overflow-hidden border border-white/10 bg-[#050505] transition-all hover:border-white/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]"
          >
            {/* Background Image */}
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4">
              <h3 className="text-sm font-black text-white italic uppercase tracking-tighter leading-tight group-hover:text-white transition-colors">
                {item.title}
              </h3>
              {item.subtitle && (
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">
                  {item.subtitle}
                </p>
              )}
            </div>

            {/* Hover Indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-lg">
              <ArrowRight size={16} strokeWidth={3} />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
