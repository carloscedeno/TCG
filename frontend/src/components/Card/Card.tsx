import React from 'react';

export interface CardProps {
  name: string;
  set: string;
  imageUrl: string;
  price: number;
}

export const Card: React.FC<CardProps> = ({ name, set, imageUrl, price }) => (
  <div className="bg-white dark:bg-neutral-black rounded-xl shadow-md overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:shadow-lg transition-shadow flex flex-col">
    <img
      src={imageUrl}
      alt={name}
      className="w-full h-48 object-cover bg-neutral-100 dark:bg-neutral-900"
      loading="lazy"
    />
    <div className="p-4 flex-1 flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-bold text-primary-pink dark:text-primary-pink mb-1 truncate" title={name}>{name}</h2>
        <p className="text-sm text-secondary-purple dark:text-secondary-purple mb-2">{set}</p>
      </div>
      <div className="mt-auto">
        <span className="inline-block bg-accent-yellow text-neutral-900 text-xs font-semibold px-2 py-1 rounded">
          ${price.toFixed(2)}
        </span>
        <span className="ml-2 text-xs text-neutral-500">Precio promedio</span>
      </div>
    </div>
  </div>
); 