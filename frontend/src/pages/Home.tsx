import React from 'react';
import { CardGrid } from '../components/Card/CardGrid';
import type { CardProps } from '../components/Card/Card';

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
  {
    name: 'Lightning Bolt',
    set: 'Modern Horizons 3',
    imageUrl: 'https://cards.scryfall.io/normal/front/2/3/23b3e7b2-6c1e-4e2e-8e2d-2e7e7e7e7e7e.jpg',
    price: 2.5,
  },
  {
    name: 'Wrenn and Six',
    set: 'Modern Horizons',
    imageUrl: 'https://cards.scryfall.io/normal/front/3/4/34b3e7b2-6c1e-4e2e-8e2d-2e7e7e7e7e7e.jpg',
    price: 60.0,
  },
  {
    name: 'Urza, Lord High Artificer',
    set: 'Modern Horizons',
    imageUrl: 'https://cards.scryfall.io/normal/front/5/6/56b3e7b2-6c1e-4e2e-8e2d-2e7e7e7e7e7e.jpg',
    price: 45.0,
  },
];

const Home: React.FC = () => (
  <main className="min-h-screen bg-neutral-white dark:bg-neutral-black">
    <header className="py-6 px-4 text-center">
      <h1 className="text-3xl font-extrabold text-primary-blue dark:text-primary-blue mb-2">Cartas de Magic: The Gathering</h1>
      <p className="text-secondary-purple dark:text-secondary-purple">Explora y busca cartas con precios actualizados</p>
    </header>
    <CardGrid cards={mockCards} />
  </main>
);

export default Home; 