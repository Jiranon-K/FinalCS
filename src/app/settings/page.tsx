'use client';

import { useLocale } from "@/i18n/useLocale";
import SettingsCard from "@/components/settings/SettingsCard";
import LanguageSelector from "@/components/settings/LanguageSelector";
import ThemeSelector from "@/components/settings/ThemeSelector";

export default function SettingsPage() {
  const { t } = useLocale();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{t.settings.title}</h1>

      <div className="space-y-6">
        {/* Language Settings */}
        <SettingsCard
          title={t.settings.languageSettings}
          description={t.settings.languageDescription}
        >
          <LanguageSelector />
        </SettingsCard>

        {/* Appearance Settings */}
        <SettingsCard
          title={t.settings.appearanceSettings}
          description={t.settings.appearanceDescription}
        >
          <ThemeSelector />
        </SettingsCard>

        {/* Notification Settings */}
        <SettingsCard
          title={t.settings.notificationSettings}
          description={t.settings.notificationDescription}
        >
          <div className="text-sm text-base-content/70">
            {t.settings.comingSoon}
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
