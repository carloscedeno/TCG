import React from 'react';
import { render, screen } from '@testing-library/react';
import { CardGrid } from '../components/Card/CardGrid';
import type { CardProps } from '../components/Card/Card';

describe('CardGrid', () => {
  const mockCards: CardProps[] = [
    {
      name: 'Black Lotus',
      set: 'Alpha',
      imageUrl: 'https://cards.scryfall.io/normal/front/4/0/40b3e7b2-6c1e-4e2e-8e2d-2e7e7e7e7e7e.jpg',
      price: 250000,
    },
    {
      name: 'Force of Will',
      set: 'Alliances',
      imageUrl: 'https://cards.scryfall.io/normal/front/1/2/12b3e7b2-6c1e-4e2e-8e2d-2e7e7e7e7e7e.jpg',
      price: 120.5,
    },
  ];

  it('renderiza todas las cartas correctamente', () => {
    render(<CardGrid cards={mockCards} />);
    expect(screen.getByText('Black Lotus')).toBeInTheDocument();
    expect(screen.getByText('Force of Will')).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });
}); 