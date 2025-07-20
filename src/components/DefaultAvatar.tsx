import React from 'react';
import { User, Users } from 'lucide-react';

interface DefaultAvatarProps {
  type: 'team' | 'player';
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ 
  type, 
  name, 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6'
  };

  const getInitials = (name?: string) => {
    if (!name) return type === 'team' ? 'ف' : 'ل';
    
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return words[0][0] + words[1][0];
    }
    return words[0][0] || (type === 'team' ? 'ف' : 'ل');
  };

  const bgColors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-gray-500'
  ];

  const getColorFromName = (name?: string) => {
    if (!name) return bgColors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return bgColors[Math.abs(hash) % bgColors.length];
  };

  return (
    <div 
      className={`${sizeClasses[size]} ${getColorFromName(name)} rounded-full flex items-center justify-center text-white font-medium ${className}`}
    >
      {name ? (
        <span className="text-xs font-bold">
          {getInitials(name)}
        </span>
      ) : (
        type === 'team' ? (
          <Users className={iconSizes[size]} />
        ) : (
          <User className={iconSizes[size]} />
        )
      )}
    </div>
  );
};

export default DefaultAvatar;