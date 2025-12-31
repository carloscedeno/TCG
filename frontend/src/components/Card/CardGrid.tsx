import React from 'react';
import { Card } from './Card';
import type { CardProps } from './Card';

export interface CardGridProps {
  cards: (CardProps & { card_id: string })[];
}

export const CardGrid: React.FC<CardGridProps> = ({ cards }) => {
  return (
    <section className="w-full">
      {cards.length === 0 ? (
        <div className="text-center text-neutral-500 dark:text-neutral-400 py-12 text-lg">
          No se encontraron cartas.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {cards.map((card) => (
            <Card key={card.card_id} {...card} />
          ))}
        </div>
      )}
    </section>
  );
}