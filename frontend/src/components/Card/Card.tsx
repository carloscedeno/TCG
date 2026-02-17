import React, { useState } from 'react';
import { RotateCw, Shield, ShoppingCart } from 'lucide-react';
import { fetchCardDetails, addToCart } from '../../utils/api';

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
  total_stock?: number;
  // New props for finishes if available in API, otherwise we infer or ignore for now
  finish?: string; // 'foil', 'nonfoil', 'etched'
  is_foil?: boolean;
  onClick?: () => void;
}

export const Card = React.memo<CardProps>(({ name, set, imageUrl, image_url, price, card_id, rarity, type, card_faces, viewMode = 'grid', total_stock, finish, is_foil, onClick }) => {
  const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

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

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (addingToCart) return;

    setAddingToCart(true);
    try {
      await addToCart(card_id, 1);
      // Optional: Show toast
    } catch (err) {
      console.error("Failed to add to cart", err);
    } finally {
      setAddingToCart(false);
    }
  };

  // Neon rarity colors & Border Styles
  const getRarityStyle = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'mythic': return 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.15)]';
      case 'rare': return 'border-geeko-gold/50 shadow-[0_0_10px_rgba(255,193,7,0.1)]';
      case 'uncommon': return 'border-geeko-blue/30';
      default: return 'border-white/10';
    }
  };

  const isFoil = is_foil === true || finish === 'foil' || name.toLowerCase().includes(' foil ') || (type?.toLowerCase().includes('foil')); // Simple heuristic if finish prop not fully populated yet

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Pre-fetch card details on hover
    try {
      fetchCardDetails(card_id);
    } catch (err) {
      // Ignore errors during pre-fetch
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  if (viewMode === 'list') {
    return (
      <a
        href={`card/${card_id}`}
        onClick={(e) => {
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onClick?.();
          }
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex items-center gap-4 px-4 py-3 bg-black/40 hover:bg-neutral-900 border border-white/5 hover:border-geeko-cyan/30 rounded-xl transition-all cursor-pointer group"
      >
        <div className="w-12 h-16 bg-[#1a1a1a] rounded-md overflow-hidden flex-shrink-0 relative">
          {imgSrc ? (
            <img src={imgSrc} alt={currentName} className="w-full h-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <Shield size={20} className="absolute inset-0 m-auto opacity-10" />
          )}
          {hasMultipleFaces && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <RotateCw size={12} className="text-white" />
            </div>
          )}
          {isFoil && (
            <div className="absolute inset-0 foil-shimmer opacity-30 pointer-events-none" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm group-hover:text-geeko-cyan transition-colors">{currentName}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider px-1.5 py-0.5 bg-white/5 rounded">{set}</span>
            {rarity && (
              <span className={`text-[9px] font-black uppercase tracking-widest ${rarity.toLowerCase() === 'mythic' ? 'text-orange-400' :
                rarity.toLowerCase() === 'rare' ? 'text-geeko-gold' : 'text-neutral-500'
                }`}>
                {rarity}
              </span>
            )}
            {isFoil && (
              <span className="flex items-center gap-1 text-[8px] bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider animate-pulse">
                <svg width="8" height="10" viewBox="0 0 10 12" fill="none" className="drop-shadow-sm">
                  <rect x="0.5" y="0.5" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1" />
                  <path d="M2 3 L8 3 M2 5 L6 5" stroke="currentColor" strokeWidth="1" />
                  <circle cx="7" cy="8" r="1.5" fill="currentColor" />
                </svg>
                Foil
              </span>
            )}
          </div>
        </div>

        {/* Stock Indicator List View */}
        <div className="hidden sm:flex flex-col items-center justify-center px-4">
          {total_stock !== undefined && total_stock > 0 ? (
            <span className="text-[10px] font-black uppercase tracking-widest text-geeko-cyan bg-geeko-cyan/10 px-2 py-1 rounded-md">
              DISP: {total_stock}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Agotado</span>
          )}
        </div>

        <div className="text-right flex flex-col items-end min-w-[80px]">
          <span className="text-[9px] uppercase text-neutral-500 font-bold tracking-wider">Mercado</span>
          <div className="flex items-center gap-1.5">
            <span className="text-geeko-cyan font-mono font-bold text-base leading-none">
              {typeof price === 'number' ? `$${price.toFixed(2)}` : '---'}
            </span>
            {isFoil && (
              <span className="text-[10px] bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white px-1.5 py-0.5 rounded uppercase font-black tracking-tighter" title="Versión Foil">
                FOIL
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleQuickAdd}
          className={`ml-4 w-9 h-9 rounded-full flex items-center justify-center transition-all border border-white/5 ${addingToCart ? 'bg-geeko-cyan text-black' : 'bg-white/5 text-neutral-400 hover:bg-geeko-cyan hover:text-black hover:scale-110'}`}
          title="Agregar al Carrito Rápido"
        >
          {addingToCart ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <ShoppingCart size={16} />}
        </button>
      </a>
    );
  }

  // Grid View
  return (
    <a
      href={`card/${card_id}`}
      onClick={(e) => {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          onClick?.();
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid="product-card"
      className={`flex flex-col glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 group relative ${getRarityStyle(rarity)} cursor-pointer h-full`}
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
      <div className={`relative aspect-[2.5/3.5] w-full bg-[#1a1a1a] overflow-hidden ${isFoil ? 'holo-effect' : ''}`}>
        {isFoil && (
          <div className="absolute inset-0 z-20 foil-shimmer opacity-30 mix-blend-overlay pointer-events-none" />
        )}

        {imgSrc ? (
          <img
            src={imgSrc}
            alt={currentName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            decoding="async"
            data-testid="product-image"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-neutral-600 p-4">
            <Shield size={40} className="mb-2 opacity-20" />
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-50 text-center">Imagen No Disponible</span>
          </div>
        )}

        {/* Stock display - Repositioned & Darker as requested */}
        {total_stock !== undefined && total_stock > 0 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-black/20 bg-black/80 text-white shadow-lg">
            DISP: {total_stock}
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

        {isFoil && (
          <div className="absolute top-8 right-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-pink-500/80 via-purple-600/80 to-cyan-500/80 text-white border border-white/20 z-20 shadow-lg flex items-center gap-1 animate-pulse">
            <svg width="8" height="10" viewBox="0 0 10 12" fill="none">
              <rect x="0.5" y="0.5" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1" />
              <path d="M2 3 L8 3 M2 5 L6 5" stroke="currentColor" strokeWidth="1" />
              <circle cx="7" cy="8" r="1.5" fill="currentColor" />
            </svg>
            Foil
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-4 flex flex-col gap-1 z-20 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-white/5 flex-grow">
        {/* Fix text overlap: Truncate + Title */}
        <h3 className="text-white text-sm font-bold truncate leading-snug group-hover:text-geeko-cyan transition-colors" title={currentName}>
          {currentName}
        </h3>

        <div className="flex items-center justify-between text-[10px] text-neutral-400 font-medium">
          <span className="truncate max-w-[65%] opacity-70 italic" title={set}>{set}</span>
          {currentType && <span className="truncate max-w-[30%] opacity-50 text-right">{currentType.split('—')[0].trim()}</span>}
        </div>

        {/* Price Row */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-white/5">
          <div className="flex flex-col text-right w-full pr-10 relative"> {/* Adjusted for price alignment */}
            <span className="text-[8px] uppercase text-neutral-500 font-bold tracking-wider absolute -top-2 right-10">Mercado</span>
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-geeko-cyan font-mono font-bold text-lg leading-none">
                {price && price > 0 ? `$${price.toFixed(2)}` : 'S/P'}
              </span>
              {isFoil && (
                <span className="text-[10px] bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white px-1.5 py-0.5 rounded uppercase font-black tracking-tighter" title="Versión Foil">
                  FOIL
                </span>
              )}
            </div>
          </div>

          {/* Quick Add Button showing on Hover */}
          <button
            onClick={handleQuickAdd}
            title="Agregar al Carrito Rápido"
            className={`absolute right-3 bottom-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg ${isHovered || addingToCart ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              } ${addingToCart ? 'bg-geeko-cyan text-black' : 'bg-neutral-800 text-white hover:bg-geeko-cyan hover:text-black border border-white/10'}`}
          >
            {addingToCart ? <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <ShoppingCart size={14} />}
          </button>
        </div>
      </div>
    </a>
  );
}, (prevProps, nextProps) => {
  // Only re-render if these props change
  return prevProps.card_id === nextProps.card_id &&
    prevProps.price === nextProps.price &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.total_stock === nextProps.total_stock &&
    prevProps.finish === nextProps.finish;
});
