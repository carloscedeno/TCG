import React, { useState } from 'react';
import { RotateCw, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchCardDetails, addToCart } from '../../utils/api';
import { CardImage } from './CardImage';

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
  original_price?: number;
  discount_percentage?: number;
  finish?: string;
  is_foil?: boolean;
  isArchive?: boolean;
  showCartButton?: boolean;
  is_accessory?: boolean;
  accessory_id?: string;
  restocked_at?: string;
  additional_images?: string[];
  onClick?: () => void;
}

export const Card = React.memo<CardProps>(({ name, set, imageUrl, image_url, price, original_price, discount_percentage, card_id, type, card_faces, viewMode = 'grid', total_stock, finish, is_foil, isArchive, showCartButton = false, is_accessory, accessory_id, additional_images, restocked_at, onClick }) => {
  const isNew = restocked_at ? (Date.now() - new Date(restocked_at).getTime()) < 14 * 24 * 60 * 60 * 1000 : false;
  const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  const isDFC = name?.includes(' // ');
  const hasMultipleFaces = (card_faces && card_faces.length > 1) || isDFC;

  const allImages = React.useMemo(() => {
    let mainImg = imageUrl || image_url;
    if (card_faces && card_faces.length > 1) {
      mainImg = card_faces[currentFaceIndex].image_uris?.normal || card_faces[currentFaceIndex].image_url || mainImg;
    } else if (isDFC && currentFaceIndex === 1 && mainImg) {
      if (mainImg.includes('/front/')) mainImg = mainImg.replace('/front/', '/back/');
      else if (mainImg.includes('.jpg')) mainImg = mainImg.replace('.jpg', '_back.jpg');
      else if (mainImg.includes('.png')) mainImg = mainImg.replace('.png', '_back.png');
    }

    const list = mainImg ? [mainImg] : [];
    if (additional_images && additional_images.length > 0) {
      additional_images.forEach(img => {
        if (img && img !== mainImg) list.push(img);
      });
    }
    return list;
  }, [hasMultipleFaces, isDFC, card_faces, currentFaceIndex, imageUrl, image_url, additional_images]);

  const currentName = (card_faces && card_faces.length > 1) ? card_faces[currentFaceIndex].name : (isDFC && name ? name.split(' // ')[currentFaceIndex] : name);
  const isPresale = currentName?.toLowerCase().includes('(preventa)');
  const cleanName = isPresale ? currentName.replace(/\(preventa\)/gi, '').trim() : currentName;

  const imgSrc = allImages[currentImageIndex] || allImages[0] || '';

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentFaceIndex((prev) => (prev + 1) % (card_faces && card_faces.length > 1 ? card_faces.length : 2));
    setCurrentImageIndex(0);
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (addingToCart) return;

    setAddingToCart(true);
    try {
      if (is_accessory || accessory_id) {
          // If it's an accessory, we use a specialized helper if available or pass flag
          const result = await addToCart(accessory_id || card_id, 1, finish, true);
          if (result && !result.success) throw new Error(result.message || result.error || 'Error interno al agregar.');
      } else {
          const result = await addToCart(card_id, 1, finish);
          if (result && !result.success) throw new Error(result.message || result.error || 'Error interno al agregar.');
      }
    } catch (err: any) {
      console.error("Cart addition failed:", err);
    } finally {
      setAddingToCart(false);
    }
  };


  const isFoil = is_foil === true || finish === 'foil' || name.toLowerCase().includes(' foil ') || (type?.toLowerCase().includes('foil')); // Simple heuristic if finish prop not fully populated yet

  const handlePreFetch = () => {
    // Pre-fetch card details on hover
    try {
      fetchCardDetails(card_id);
    } catch {
      // Ignore errors during pre-fetch
    }
  };

  if (viewMode === 'list') {
    return (
      <a
        href={`/card/${card_id}`}
        onClick={(e) => {
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onClick?.();
          }
        }}
        onMouseEnter={handlePreFetch}
        data-testid="product-card"
        className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-black/40 hover:bg-neutral-50 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-white/5 hover:border-geeko-cyan/50 dark:hover:border-geeko-cyan/30 rounded-xl transition-all cursor-pointer group shadow-sm dark:shadow-none"
      >
        <div className="w-12 h-16 bg-neutral-200 dark:bg-[#1a1a1a] rounded-md overflow-hidden flex-shrink-0 relative">
          <CardImage src={imgSrc} alt={currentName} size="small" fallbackIconSize={20} className="rounded-md" />
          {!!hasMultipleFaces && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <RotateCw size={12} className="text-white" />
            </div>
          )}
          {isFoil && (
            <div className="absolute inset-0 foil-shimmer opacity-30 pointer-events-none" />
          )}
        </div>

        <div className="mt-4 flex-1 flex flex-col min-w-0">
        <h3 className="text-black dark:text-white font-bold text-sm sm:text-base leading-tight group-hover:text-geeko-cyan transition-colors break-words whitespace-normal relative z-10 flex flex-wrap items-center gap-2">
            {cleanName}
            {isPresale && (
              <span className="px-1.5 py-0.5 bg-geeko-cyan text-black text-[7px] font-black uppercase rounded shadow-lg shadow-geeko-cyan/20">Preventa</span>
            )}
            {isNew && (
              <span className="px-1.5 py-0.5 bg-purple-600 text-[7px] font-black uppercase rounded shadow-lg shadow-purple-500/20 animate-pulse">Nuevo</span>
            )}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-neutral-600 dark:text-text-low font-bold uppercase tracking-wider px-1.5 py-0.5 bg-black/5 dark:bg-white/5 rounded">{set}</span>
            {!is_accessory && (
              isFoil ? (
                <span className="text-[8px] bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white px-1.5 py-0.5 rounded uppercase font-black tracking-wider">
                  Foil
                </span>
              ) : (
                <span className="text-[8px] bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">
                  Normal
                </span>
              )
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
            <span className="text-[10px] font-bold text-text-low uppercase tracking-widest">Por Encargo</span>
          )}
        </div>

        <div className="text-right flex flex-col items-end min-w-[80px] ml-auto pl-2 relative">
          {discount_percentage && discount_percentage > 0 ? (
              <div className="flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-text-low font-bold line-through">{original_price?.toFixed(2)}$</span>
                      <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black uppercase">{discount_percentage}% OFF</span>
                  </div>
                  <span className="text-geeko-cyan font-mono font-black text-base leading-none">
                    {typeof price === 'number' ? `${price.toFixed(2)} $` : '---'}
                  </span>
              </div>
          ) : (
              <span className="text-geeko-cyan font-mono font-black text-base leading-none">
                {typeof price === 'number' ? `${price.toFixed(2)} $` : '---'}
              </span>
          )}
        </div>

        {showCartButton && !isArchive && (
          <button
            onClick={handleQuickAdd}
            className={`ml-4 w-9 h-9 rounded-full flex items-center justify-center transition-all border border-white/5 ${addingToCart ? 'bg-geeko-cyan text-black' : 'bg-geeko-cyan text-black hover:scale-110'}`}
            title={(total_stock || 0) > 0 ? "Agregar al Carrito Rápido" : "Por encargo"}
          >
            {addingToCart ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Plus size={20} strokeWidth={3} />}
          </button>
        )}
      </a>
    );
  }

  // Grid View
  return (
    <a
      href={`/card/${card_id}`}
      onClick={(e) => {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          onClick?.();
        }
      }}
      onMouseEnter={handlePreFetch}
      data-testid="product-card"
      className="relative group p-2.5 sm:p-3.5 bg-white dark:bg-[#23193b]/95 border border-neutral-200 dark:border-white/10 rounded-2xl hover:bg-neutral-50 dark:hover:bg-[#2c204a] transition-all cursor-pointer flex flex-col h-full hover:border-geeko-cyan/50 dark:hover:border-geeko-cyan/40 shadow-sm dark:shadow-xl"
    >
      {/* Clean Card Image (No badges covering the artwork) */}
      <div className="relative aspect-[63/88] w-full rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 shadow-lg flex-shrink-0">
        {!!hasMultipleFaces && (
          <button
            onClick={handleFlip}
            aria-label="Voltear carta"
            className="absolute top-2 left-2 z-20 p-1.5 bg-black/65 hover:bg-geeko-cyan text-white hover:text-black rounded-full border border-white/10 transition-colors"
          >
            <RotateCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
          </button>
        )}

        {isPresale && (
          <div className="absolute top-2 left-2 z-20 px-2 py-0.5 bg-geeko-cyan text-black text-[8px] font-black uppercase rounded shadow-lg">
            Preventa
          </div>
        )}

        <div className={`relative w-full h-full bg-neutral-100 dark:bg-[#1a1a1a] overflow-hidden ${isFoil ? 'holo-effect' : ''}`}>
          {isFoil && (
            <div className="absolute inset-0 z-10 foil-shimmer opacity-30 mix-blend-overlay pointer-events-none" />
          )}

          <CardImage src={imgSrc} alt={currentName} size="small" fallbackIconSize={40} className="group-hover:scale-105 transition-transform duration-500" />

          {!hasMultipleFaces && allImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setCurrentImageIndex((prev) => prev === 0 ? allImages.length - 1 : prev - 1);
                }}
                className="absolute top-1/2 left-2 -translate-y-1/2 z-20 p-1.5 bg-black/60 hover:bg-geeko-cyan text-white rounded-full opacity-0 group-hover:opacity-100 transition-all border border-white/10"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
                }}
                className="absolute top-1/2 right-2 -translate-y-1/2 z-20 p-1.5 bg-black/60 hover:bg-geeko-cyan text-white rounded-full opacity-0 group-hover:opacity-100 transition-all border border-white/10"
              >
                <ChevronRight size={16} />
              </button>

              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {allImages.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-geeko-cyan shadow-[0_0_5px_rgba(0,209,255,0.8)]' : 'bg-white/50'}`} 
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card Info Body */}
      <div className="pt-3 flex flex-col gap-2 flex-grow">
        {/* Row 1: Set + Availability + Normal/Foil (under image, never over card art) */}
        <div className="flex items-center justify-between gap-1 min-h-[22px]">
          <span className="px-1.5 py-0.5 bg-neutral-200 dark:bg-black/80 border border-neutral-300 dark:border-white/10 rounded text-[10px] font-black uppercase tracking-wider text-neutral-800 dark:text-white truncate max-w-[32%]">
            {set}
          </span>

          {total_stock !== undefined && total_stock > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-neutral-900 dark:bg-black text-white border border-white/10 whitespace-nowrap">
              DISP: {total_stock}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/25 whitespace-nowrap">
              P/E
            </span>
          )}

          {!is_accessory && (
            isFoil ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white whitespace-nowrap shadow-sm">
                FOIL
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                NORMAL
              </span>
            )
          )}
        </div>

        {/* Row 2: Product Title (minimum 2 lines for clean uniform alignment) */}
        <h3
          className="text-black dark:text-white text-sm sm:text-[15px] font-extrabold italic leading-snug line-clamp-2 min-h-[2.6em] group-hover:text-geeko-cyan transition-colors break-words"
          title={cleanName}
        >
          {cleanName}
        </h3>

        {/* Row 3: Discount (when active) + Price & Add-to-Cart Button */}
        <div className="mt-auto pt-1 flex flex-col gap-1.5">
          {!!(discount_percentage && discount_percentage > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-200 font-bold line-through leading-none">
                {original_price?.toFixed(2)}$
              </span>
              <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase tracking-wide leading-none shadow-sm">
                {discount_percentage}% OFF
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-geeko-cyan font-mono font-black text-xl sm:text-2xl tracking-tight leading-none">
              {price && price > 0 ? `${price.toFixed(2)} $` : 'S/P'}
            </span>

            {showCartButton && !isArchive && (
              <button
                onClick={handleQuickAdd}
                disabled={addingToCart}
                aria-label="Añadir al carrito"
                title={(total_stock || 0) > 0 ? "Añadir al carrito" : "Por encargo"}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-geeko-cyan text-black hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,229,255,0.4)] disabled:opacity-60"
              >
                {addingToCart ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <Plus size={20} strokeWidth={3} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </a>
  );
});
