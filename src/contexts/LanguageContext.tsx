import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.matches': 'المباريات',
    'nav.teams': 'الفرق',
    'nav.players': 'اللاعبون',
    'nav.topScorers': 'هدافي الدوري',
    'nav.live': 'المباشر',
     'nav.eliminations': 'الإقصاءيات',
    
    'nav.admin': 'الإدارة',
    'nav.title': 'دوري تمدوين',
    
    // Home page
    'home.title': 'ترتيب المجموعات',
    'home.subtitle': 'ترتيب المجموعات الحالي والنتائج الأخيرة',
    'home.group': 'المجموعة',
    'home.recentResults': 'النتائج الأخيرة',
    'home.upcomingMatches': 'المباريات القادمة',
    'home.vs': 'ضد',
    
    // Table headers
    'table.position': 'المركز',
    'table.team': 'الفريق',
    'table.played': 'لعب',
    'table.wins': 'فوز',
    'table.draws': 'تعادل',
    'table.losses': 'خسارة',
    'table.goalsFor': 'له',
    'table.goalsAgainst': 'عليه',
    'table.goalDifference': 'الفارق',
    'table.points': 'النقاط',
    'table.time': 'الوقت',
    
    // Admin
    'admin.title': 'لوحة الإدارة',
    'admin.signOut': 'تسجيل الخروج',
    'admin.teams': 'الفرق',
    'admin.players': 'اللاعبون',
    'admin.matches': 'المباريات',
    'admin.addTeam': 'إضافة فريق',
    'admin.addPlayer': 'إضافة لاعب',
    'admin.addMatch': 'إضافة مباراة',
    'admin.deleteAll': 'حذف الكل',
    'admin.actions': 'الإجراءات',
    
    // Forms
    'form.teamName': 'اسم الفريق',
    'form.playerName': 'اسم اللاعب',
    'form.group': 'المجموعة',
    'form.logo': 'الشعار',
    'form.optional': 'اختياري',
    'form.save': 'حفظ',
    'form.cancel': 'إلغاء',
    'form.goals': 'الأهداف',
    'form.assists': 'التمريرات الحاسمة',
    'form.date': 'التاريخ',
    'form.time': 'الوقت',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.noData': 'لا توجد بيانات',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
    'common.confirm': 'تأكيد',
  },
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.matches': 'Matchs',
    'nav.teams': 'Équipes',
    'nav.players': 'Joueurs',
    'nav.topScorers': 'Meilleurs Buteurs',
    'nav.live': 'En Direct',
    'nav.eliminations': 'Éliminations',
    'nav.admin': 'Administration',
    'nav.title': 'Ligue Tamdouin',
    
    // Home page
    'home.title': 'Classement des Groupes',
    'home.subtitle': 'Classement actuel des groupes et résultats récents',
    'home.group': 'Groupe',
    'home.recentResults': 'Résultats Récents',
    'home.upcomingMatches': 'Prochains Matchs',
    'home.vs': 'vs',
    
    // Table headers
    'table.position': 'Position',
    'table.team': 'Équipe',
    'table.played': 'J',
    'table.wins': 'V',
    'table.draws': 'N',
    'table.losses': 'D',
    'table.goalsFor': 'BP',
    'table.goalsAgainst': 'BC',
    'table.goalDifference': 'Diff',
    'table.points': 'Pts',
    'table.time': 'Heure',
    
    // Admin
    'admin.title': 'Panneau d\'Administration',
    'admin.signOut': 'Déconnexion',
    'admin.teams': 'Équipes',
    'admin.players': 'Joueurs',
    'admin.matches': 'Matchs',
    'admin.addTeam': 'Ajouter Équipe',
    'admin.addPlayer': 'Ajouter Joueur',
    'admin.addMatch': 'Ajouter Match',
    'admin.deleteAll': 'Supprimer Tout',
    'admin.actions': 'Actions',
    
    // Forms
    'form.teamName': 'Nom de l\'équipe',
    'form.playerName': 'Nom du joueur',
    'form.group': 'Groupe',
    'form.logo': 'Logo',
    'form.optional': 'optionnel',
    'form.save': 'Enregistrer',
    'form.cancel': 'Annuler',
    'form.goals': 'Buts',
    'form.assists': 'Passes décisives',
    'form.date': 'Date',
    'form.time': 'Heure',
    
    // Common
    'common.loading': 'Chargement...',
    'common.noData': 'Aucune donnée',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.confirm': 'Confirmer',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ar');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'ar' || savedLanguage === 'fr')) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};