// src/hooks/useProfileLanguage.ts
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProfile } from './useProfile';

export const useProfileLanguage = () => {
  const { i18n } = useTranslation();
  const { profile } = useProfile();

  useEffect(() => {
    if (profile?.spokenLanguages?.length > 0) {
      const preferredLanguage = profile.spokenLanguages.find(
        lang => ['en', 'de'].includes(lang.toLowerCase())
      );
      if (preferredLanguage && i18n.language !== preferredLanguage) {
        i18n.changeLanguage(preferredLanguage.toLowerCase());
      }
    }
  }, [profile, i18n]);

  return { currentLanguage: i18n.language };
};
