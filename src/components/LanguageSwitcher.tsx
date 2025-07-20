import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative">
      <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
        <Globe className="h-4 w-4 text-white" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'ar' | 'fr')}
          className="bg-transparent text-white text-sm font-medium border-none outline-none cursor-pointer"
        >
          <option value="ar" className="text-gray-900">العربية</option>
          <option value="fr" className="text-gray-900">Français</option>
        </select>
      </div>
    </div>
  );
};

export default LanguageSwitcher;