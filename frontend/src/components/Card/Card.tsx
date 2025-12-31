import React from 'react';

export interface CardProps {
  name: string;
  set: string;
  imageUrl?: string;
  image_url?: string;
  price: number;
  card_id: string;
  rarity?: string;
  type?: string;
}

export const Card: React.FC<CardProps> = ({ name, set, imageUrl, image_url, price, rarity, type }) => {
  const imgSrc = imageUrl || image_url;

  // Moxfield-style card colors based on rarity
  const getRarityColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'mythic': return 'border-orange-500';
      case 'rare': return 'border-yellow-500';
      case 'uncommon': return 'border-gray-400';
      default: return 'border-neutral-700';
    }
  };

  return (
    <div className={`flex flex-col bg-neutral-900 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-200 hover:scale-[1.02] border-2 ${getRarityColor(rarity)}`}>
      {/* Card Image */}
      <div className="relative aspect-[2.5/3.5] bg-neutral-800">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-neutral-500 p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-center font-medium">{name}</span>
          </div>
        )}
      </div>

      {/* Card Info - Moxfield style */}
      <div className="p-2 bg-neutral-900 flex flex-col gap-1">
        <h3 className="text-white text-sm font-semibold truncate" title={name}>
          {name}
        </h3>
        {type && (
          <p className="text-neutral-400 text-xs truncate">{type}</p>
        )}
        {set && (
          <p className="text-neutral-500 text-xs truncate">{set}</p>
        )}

        {/* Price and Options Row */}
        <div className="flex items-center justify-between mt-1 pt-1 border-t border-neutral-700">
          <span className="text-green-400 font-bold text-sm">
            🛒 ${typeof price === 'number' ? price.toFixed(2) : '0.00'}
          </span>
          <button className="text-purple-400 text-xs hover:text-purple-300 transition-colors">
            ⚙️ Options ▾
          </button>
        </div>
      </div>
    </div>
  );
};