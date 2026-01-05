import React, { useState } from 'react';
import { RotateCw, Shield } from 'lucide-react';

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
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ name, set, imageUrl, image_url, price, rarity, type, card_faces, onClick }) => {
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
  const currentType = hasMultipleFaces ? card_faces![currentFaceIndex].type_line : type;
  const imgSrc = getImgSrc();

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFaceIndex((prev) => (prev + 1) % card_faces!.length);
  };

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
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />

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
          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md border border-white/10 ${rarity.toLowerCase() === 'mythic' ? 'bg-orange-500/20 text-orange-400' :
            rarity.toLowerCase() === 'rare' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-black/60 text-neutral-400'
            }`}>
            {rarity}
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-4 flex flex-col gap-1 z-20 bg-black/40 backdrop-blur-md border-t border-white/5 h-full min-h-[100px]">
        <h3 className="text-white text-sm font-bold truncate leading-tight group-hover:text-geeko-cyan transition-colors" title={currentName}>
          {currentName}
        </h3>

        <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium">
          <span className="truncate max-w-[60%] opacity-80">{set}</span>
          {currentType && <span className="truncate max-w-[35%] opacity-60 text-right">{currentType.split('—')[0].trim()}</span>}
        </div>

        {/* Price Row */}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-neutral-500 font-bold tracking-wider">Market Price</span>
            <span className="text-geeko-cyan font-mono font-bold text-lg leading-none">
              ${typeof price === 'number' ? price.toFixed(2) : '0.00'}
            </span>
          </div>
          <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-geeko-cyan/20 hover:text-geeko-cyan flex items-center justify-center transition-all text-neutral-400 border border-white/10 group/btn">
            <span className="text-lg mb-1 group-hover/btn:translate-x-0.5 transition-transform">›</span>
          </button>
        </div>
      </div>
    </div>
  );
};