'use client';

import { useTheme } from "@/hooks/useTheme";
import { useLocale } from "@/i18n/useLocale";
import { lightThemes, darkThemes, type Theme } from "@/contexts/ThemeContext";
import { faCheck, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function ThemeSelector() {
  const { theme, setTheme, isMounted } = useTheme();
  const { t } = useLocale();

  const ThemeButton = ({ themeName }: { themeName: Theme }) => {
    const isSelected = theme === themeName;

    return (
      <button
        onClick={() => setTheme(themeName)}
        className={`relative overflow-hidden rounded-lg border-2 transition-all ${
          isSelected
            ? 'border-primary scale-105 shadow-lg'
            : 'border-base-300 hover:border-primary/50 hover:scale-102'
        }`}
        data-theme={themeName}
      >
        <div className="p-4 bg-base-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-base-content capitalize">
              {themeName}
            </span>
            {isSelected && (
              <FontAwesomeIcon
                icon={faCheck}
                className="text-primary text-sm"
              />
            )}
          </div>

          {/* Theme color preview */}
          <div className="flex gap-1 mt-2">
            <div className="w-4 h-4 rounded bg-primary"></div>
            <div className="w-4 h-4 rounded bg-secondary"></div>
            <div className="w-4 h-4 rounded bg-accent"></div>
            <div className="w-4 h-4 rounded bg-neutral"></div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Current Theme Display */}
      <div className="alert bg-base-200">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <div className="w-3 h-3 rounded-full bg-secondary"></div>
            <div className="w-3 h-3 rounded-full bg-accent"></div>
          </div>
          <div>
            <div className="text-xs text-base-content/70">{t.settings.currentTheme}</div>
            <div className="text-sm font-semibold capitalize">
              {isMounted ? theme : 'light'}
            </div>
          </div>
        </div>
      </div>

      {/* Light Themes */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FontAwesomeIcon icon={faSun} className="text-warning" />
          {t.settings.lightThemes}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {lightThemes.map((themeName) => (
            <ThemeButton key={themeName} themeName={themeName} />
          ))}
        </div>
      </div>

      {/* Dark Themes */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FontAwesomeIcon icon={faMoon} className="text-info" />
          {t.settings.darkThemes}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {darkThemes.map((themeName) => (
            <ThemeButton key={themeName} themeName={themeName} />
          ))}
        </div>
      </div>
    </div>
  );
}
