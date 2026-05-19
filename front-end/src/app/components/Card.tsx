import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const baseStyles = 'bg-white rounded-lg p-6 border border-bs-neutral-200 transition-all duration-200';
  const hoverStyles = hover ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer' : 'shadow-md';

  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface RestaurantCardProps {
  name: string;
  rating: number;
  distance: string;
  dietary: string;
  image?: string;
  onDirections?: () => void;
}

export function RestaurantCard({ name, rating, distance, dietary, image, onDirections }: RestaurantCardProps) {
  return (
    <Card hover className="overflow-hidden p-0">
      {image && (
        <div className="h-48 bg-bs-neutral-200 overflow-hidden">
          <img src={image} alt={name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-6">
        <h3 className="mb-3">{name}</h3>
        <div className="flex items-center gap-4 mb-4 text-sm text-bs-neutral-600">
          <div className="flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1L10 5.5L15 6.5L11.5 10L12.5 15L8 12.5L3.5 15L4.5 10L1 6.5L6 5.5L8 1Z" fill="#FFD700" stroke="#FFD700" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <span>{rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 14C8 14 2 10 2 5.5C2 3.5 3.5 2 5.5 2C6.5 2 7.5 2.5 8 3.5C8.5 2.5 9.5 2 10.5 2C12.5 2 14 3.5 14 5.5C14 10 8 14 8 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <span>{distance}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2C8 2 6 2 6 4C6 6 8 6 8 8C8 6 10 6 10 4C10 2 8 2 8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M5 10C5 10 3 10 3 12C3 14 5 14 5 14C5 14 7 14 7 12C7 10 5 10 5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M11 10C11 10 9 10 9 12C9 14 11 14 11 14C11 14 13 14 13 12C13 10 11 10 11 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <span>{dietary}</span>
          </div>
        </div>
        {onDirections && (
          <button
            onClick={onDirections}
            className="w-full bg-bs-gold text-bs-neutral-900 py-2 rounded-lg hover:bg-[#FFE44D] transition-colors"
          >
            Get Directions
          </button>
        )}
      </div>
    </Card>
  );
}

interface SuggestionCardProps {
  summary: string;
  rating: number;
  distance: string;
  dietary: string;
  onViewMap?: () => void;
}

export function SuggestionCard({ summary, rating, distance, dietary, onViewMap }: SuggestionCardProps) {
  return (
    <Card hover>
      <p className="mb-4 text-bs-neutral-700">{summary}</p>
      <div className="flex items-center gap-4 mb-4 text-sm text-bs-neutral-600">
        <div className="flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1L10 5.5L15 6.5L11.5 10L12.5 15L8 12.5L3.5 15L4.5 10L1 6.5L6 5.5L8 1Z" fill="#FFD700" stroke="#FFD700" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <span>{rating}</span>
        </div>
        <div className="flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 14C8 14 2 10 2 5.5C2 3.5 3.5 2 5.5 2C6.5 2 7.5 2.5 8 3.5C8.5 2.5 9.5 2 10.5 2C12.5 2 14 3.5 14 5.5C14 10 8 14 8 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <span>{distance}</span>
        </div>
        <div className="flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2C8 2 6 2 6 4C6 6 8 6 8 8C8 6 10 6 10 4C10 2 8 2 8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M5 10C5 10 3 10 3 12C3 14 5 14 5 14C5 14 7 14 7 12C7 10 5 10 5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M11 10C11 10 9 10 9 12C9 14 11 14 11 14C11 14 13 14 13 12C13 10 11 10 11 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <span>{dietary}</span>
        </div>
      </div>
      {onViewMap && (
        <button
          onClick={onViewMap}
          className="w-full bg-bs-gold text-bs-neutral-900 py-2 rounded-lg hover:bg-[#FFE44D] transition-colors"
        >
          View on Map
        </button>
      )}
    </Card>
  );
}
