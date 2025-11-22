'use client';

import { useLocale } from "@/i18n/useLocale";
import SettingsCard from "@/components/settings/SettingsCard";
import LanguageSelector from "@/components/settings/LanguageSelector";
import ThemeSelector from "@/components/settings/ThemeSelector";
import { useEffect, useState } from "react";
import Loading from "@/components/ui/Loading";

export default function SettingsPage() {
  const { t } = useLocale();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="container mx-auto p-6 max-w-4xl flex justify-center items-center min-h-[50vh]">
        <Loading variant="spinner" size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <img
          src="/menu-icon/setting.png"
          alt="Settings Icon"
          className="w-10 h-10 object-contain"
        />
        {t.settings.title}
      </h1>

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
