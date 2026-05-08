import React, { useRef } from 'react';
import { Card } from '../Card/Card';
import type { CardProps } from '../Card/Card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DealsCarouselProps {
  title: string;
  cards: (CardProps & { card_id: string })[];
  onCardClick?: (id: string) => void;
  isArchive?: boolean;
}

export const DealsCarousel: React.FC<DealsCarouselProps> = ({ title, cards, onCardClick, isArchive }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (cards.length === 0) return null;

  return (
    <div className="relative group mb-8 px-4">
      <div className="flex flex-col items-center mb-4">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white mb-2 animate-pulse">
          {isArchive ? 'Coleccionables' : 'Stock Geekorium'}
        </span>
        <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          {title}
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-white to-transparent mt-4"></div>
      </div>
      
      {/* Carrusel container */}
      <div className="relative">
        {/* Navigation Buttons - Adjusted for floating look */}
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-8 z-30 w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white hover:text-black transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]"
        >
          <ChevronLeft size={24} />
        </button>
        
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-8 z-30 w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white hover:text-black transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]"
        >
          <ChevronRight size={24} />
        </button>

        {/* Scrollable Area */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-6 pb-8 no-scrollbar scroll-smooth snap-x"
        >
          {cards.map((card) => (
            <div key={card.card_id} className="min-w-[200px] w-[200px] md:min-w-[240px] md:w-[240px] flex-shrink-0 snap-start">
              <Card
                {...card}
                viewMode="grid"
                isArchive={isArchive}
                showCartButton={true}
                onClick={() => onCardClick && onCardClick(card.card_id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
