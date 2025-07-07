import React from 'react';
import { Card } from './Card';
import type { CardProps } from './Card';

export interface CardGridProps {
  cards: CardProps[];
}

export const CardGrid: React.FC<CardGridProps> = ({ cards }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
    {cards.map((card) => (
      <Card key={card.name + card.set} {...card} />
    ))}
  </div>
); 