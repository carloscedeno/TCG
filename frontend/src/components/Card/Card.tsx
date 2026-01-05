import React from 'react';

export interface CardProps {
  name: string;
  set: string;
  imageUrl?: string;
  image_url?: string;
  price: number;
  card_id: string;
  rarity?: string;
  type?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ name, set, imageUrl, image_url, price, rarity, type, onClick }) => {
  const imgSrc = imageUrl || image_url;

  // Neon rarity colors
  const getRarityStyle = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'mythic': return 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)]';
      case 'rare': return 'border-yellow-400/50 shadow-[0_0_10px_rgba(250,204,21,0.2)]';
      case 'uncommon': return 'border-blue-400/30';
      default: return 'border-white/10';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`flex flex-col glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 group relative ${getRarityStyle(rarity)} cursor-pointer`}
    >

      {/* Dynamic Background Glow for Hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />

      {/* Card Image */}
      <div className="relative aspect-[2.5/3.5] w-full bg-[#1a1a1a]">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-neutral-600 p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">No Image</span>
          </div>
        )}

        {/* Rarity Badge (Overlay) */}
        {rarity && (
          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md border border-white/10 ${rarity.toLowerCase() === 'mythic' ? 'bg-orange-500/20 text-orange-400' :
            rarity.toLowerCase() === 'rare' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-black/60 text-neutral-400'
            }`}>
            {rarity}
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-4 flex flex-col gap-1 z-20 bg-black/40 backdrop-blur-md border-t border-white/5 h-full">
        <h3 className="text-white text-sm font-bold truncate leading-tight group-hover:text-blue-400 transition-colors" title={name}>
          {name}
        </h3>

        <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium">
          <span className="truncate max-w-[60%] opacity-80">{set}</span>
          {type && <span className="truncate max-w-[35%] opacity-60 text-right">{type.split('—')[0].trim()}</span>}
        </div>

        {/* Price Row */}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-neutral-500 font-bold tracking-wider">Market Price</span>
            <span className="text-geeko-cyan font-mono font-bold text-lg leading-none">
              ${typeof price === 'number' ? price.toFixed(2) : '0.00'}
            </span>
          </div>
          <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all text-neutral-400 border border-white/10 group/btn">
            <span className="text-lg mb-1 group-hover/btn:translate-x-0.5 transition-transform">›</span>
          </button>
        </div>
      </div>
    </div>
  );
};