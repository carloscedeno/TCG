import React, { useState } from 'react';
import { RotateCw, Shield } from 'lucide-react';
import { fetchCardDetails } from '../../utils/api';

export interface CardFace {
  image_url?: string;
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
    png?: string;
  };
  name: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
}

export interface CardProps {
  name: string;
  set: string;
  imageUrl?: string;
  image_url?: string;
  price: number;
  card_id: string;
  rarity?: string;
  type?: string;
  card_faces?: CardFace[];
  viewMode?: 'grid' | 'list';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ name, set, imageUrl, image_url, price, card_id, rarity, type, card_faces, viewMode = 'grid', onClick }) => {
  const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
  const hasMultipleFaces = card_faces && card_faces.length > 1;

  const getImgSrc = () => {
    if (hasMultipleFaces) {
      const face = card_faces![currentFaceIndex];
      return face.image_uris?.normal || face.image_url || imageUrl || image_url;
    }
    return imageUrl || image_url;
  };

  const currentName = hasMultipleFaces ? card_faces![currentFaceIndex].name : name;
  const currentType = hasMultipleFaces ? card_faces![currentFaceIndex].type_line || type : type;
  const imgSrc = getImgSrc();

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFaceIndex((prev) => (prev + 1) % card_faces!.length);
  };

  // Neon rarity colors
  const getRarityStyle = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'mythic': return 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)]';
      case 'rare': return 'border-geeko-gold/50 shadow-[0_0_10px_rgba(255,193,7,0.15)]';
      case 'uncommon': return 'border-geeko-blue/30';
      default: return 'border-white/10';
    }
  };

  const handleMouseEnter = () => {
    // Pre-fetch card details on hover
    try {
      fetchCardDetails(card_id);
    } catch (err) {
      // Ignore errors during pre-fetch
    }
  };

  if (viewMode === 'list') {
    return (
      <a
        href={`/TCG/card/${card_id}`}
        onClick={(e) => {
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onClick?.();
          }
        }}
        onMouseEnter={handleMouseEnter}
        className="flex items-center gap-4 px-4 py-3 bg-black/40 hover:bg-neutral-900 border border-white/5 hover:border-geeko-cyan/30 rounded-xl transition-all cursor-pointer group"
      >
        <div className="w-12 h-16 bg-[#1a1a1a] rounded-md overflow-hidden flex-shrink-0 relative">
          {imgSrc ? (
            <img src={imgSrc} alt={currentName} className="w-full h-full object-cover" />
          ) : (
            <Shield size={20} className="absolute inset-0 m-auto opacity-10" />
          )}
          {hasMultipleFaces && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <RotateCw size={12} className="text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm truncate group-hover:text-geeko-cyan transition-colors">{currentName}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider px-1.5 py-0.5 bg-white/5 rounded">{set}</span>
            {rarity && (
              <span className={`text-[9px] font-black uppercase tracking-widest ${rarity.toLowerCase() === 'mythic' ? 'text-orange-400' :
                rarity.toLowerCase() === 'rare' ? 'text-geeko-gold' : 'text-neutral-500'
                }`}>
                {rarity}
              </span>
            )}
          </div>
        </div>

        <div className="hidden sm:block flex-1 min-w-0">
          <p className="text-[11px] text-neutral-400 truncate opacity-60">{currentType}</p>
        </div>

        <div className="text-right flex flex-col items-end">
          <span className="text-[9px] uppercase text-neutral-500 font-bold tracking-wider">Market</span>
          <span className="text-geeko-cyan font-mono font-bold text-base leading-none">
            {typeof price === 'number' && price > 0 ? `$${price.toFixed(2)}` : '---'}
          </span>
        </div>

        <div className="ml-2">
          <button className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-geeko-cyan/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
            <span className="text-lg text-geeko-cyan">›</span>
          </button>
        </div>
      </a>
    );
  }

  return (
    <a
      href={`/TCG/card/${card_id}`}
      onClick={(e) => {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          onClick?.();
        }
      }}
      onMouseEnter={handleMouseEnter}
      className={`flex flex-col glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 group relative ${getRarityStyle(rarity)} cursor-pointer h-full`}
    >
      {/* Flip Button overlay */}
      {hasMultipleFaces && (
        <button
          onClick={handleFlip}
          className="absolute top-2 left-2 z-30 p-1.5 bg-black/60 hover:bg-geeko-cyan text-white rounded-full border border-white/10 transition-colors"
        >
          <RotateCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
        </button>
      )}

      {/* Dynamic Background Glow for Hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />

      {/* Card Image */}
      <div className="relative aspect-[2.5/3.5] w-full bg-[#1a1a1a]">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={currentName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-neutral-600 p-4">
            <Shield size={40} className="mb-2 opacity-20" />
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-50 text-center">No Image Available</span>
          </div>
        )}

        {/* Rarity Badge (Overlay) */}
        {rarity && (
          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md border border-white/10 z-20 ${rarity.toLowerCase() === 'mythic' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
            rarity.toLowerCase() === 'rare' ? 'bg-geeko-gold/20 text-geeko-gold border-geeko-gold/30' :
              'bg-black/60 text-neutral-400'
            }`}>
            {rarity}
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-4 flex flex-col gap-1 z-20 bg-[#0a0a0a]/80 backdrop-blur-md border-t border-white/5 flex-grow">
        <h3 className="text-white text-sm font-bold truncate leading-tight group-hover:text-geeko-cyan transition-colors" title={currentName}>
          {currentName}
        </h3>

        <div className="flex items-center justify-between text-[10px] text-neutral-400 font-medium">
          <span className="truncate max-w-[65%] opacity-70 italic">{set}</span>
          {currentType && <span className="truncate max-w-[30%] opacity-50 text-right">{currentType.split('—')[0].trim()}</span>}
        </div>

        {/* Price Row */}
        <div className="mt-4 pt-3 flex items-center justify-between border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-neutral-500 font-bold tracking-wider">Market</span>
            <span className="text-geeko-cyan font-mono font-bold text-lg leading-none">
              {typeof price === 'number' && price > 0 ? `$${price.toFixed(2)}` : '---'}
            </span>
          </div>
          <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-geeko-cyan/20 hover:text-geeko-cyan flex items-center justify-center transition-all text-neutral-400 border border-white/10 group/btn">
            <span className="text-lg mb-0.5 group-hover/btn:translate-x-0.5 transition-transform italic">›</span>
          </button>
        </div>
      </div>
    </a>
  );
};
