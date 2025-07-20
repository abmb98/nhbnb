import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { Menu, X, Trophy } from 'lucide-react';

const Navbar = () => {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.matches'), path: '/matches' },
    { name: t('nav.teams'), path: '/teams' },
    { name: t('nav.players'), path: '/players' },
    { name: t('nav.topScorers'), path: '/top-scorers' },
    { name: t('nav.live'), path: '/live' },
    { name: t('nav.eliminations'), path: '/eliminations' },
    { name: t('nav.admin'), path: '/admin' },
  ];

  return (
    <nav className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-xl backdrop-blur-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                <Trophy className="h-8 w-8 text-yellow-300" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                {t('nav.title')}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className={`flex items-center space-x-6 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 ${
                    location.pathname === link.path
                      ? 'bg-white/20 backdrop-blur-sm text-white shadow-lg'
                      : 'text-emerald-100 hover:bg-white/10 hover:text-white hover:backdrop-blur-sm'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <LanguageSwitcher />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <div className="flex items-center space-x-3">
              <LanguageSwitcher />
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-all duration-300"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white/10 backdrop-blur-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-white/20">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                  location.pathname === link.path
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-emerald-100 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;