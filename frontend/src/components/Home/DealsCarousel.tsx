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
    <div className="bg-neutral-900/40 rounded-3xl p-6 border border-white/5 relative group mb-8">
      <h2 className="text-xl font-black uppercase tracking-tighter text-white mb-6 drop-shadow-md">
        {title}
      </h2>
      
      {/* Carrusel container */}
      <div className="relative">
        {/* Navigation Buttons */}
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-10 h-10 rounded-full bg-black/80 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white hover:text-black transition-all shadow-xl"
        >
          <ChevronLeft size={20} />
        </button>
        
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-10 h-10 rounded-full bg-black/80 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white hover:text-black transition-all shadow-xl"
        >
          <ChevronRight size={20} />
        </button>

        {/* Scrollable Area */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-4 pb-4 no-scrollbar scroll-smooth snap-x"
        >
          {cards.map((card) => (
            <div key={card.card_id} className="min-w-[180px] w-[180px] md:min-w-[200px] md:w-[200px] flex-shrink-0 snap-start">
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
