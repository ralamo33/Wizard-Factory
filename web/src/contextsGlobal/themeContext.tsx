import { createContext, type JSX, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark" | "system";

type ThemeValue = Readonly<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>;

const storageKey = "theme";

const ThemeContext = createContext<ThemeValue | undefined>(undefined);

const isTheme = (value: string | null): value is Theme => value === "light" || value === "dark" || value === "system";

const readStoredTheme = (): Theme => {
  const stored = localStorage.getItem(storageKey);

  return isTheme(stored) ? stored : "system";
};

const applyTheme = (theme: Theme): void => {
  if (theme === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.dataset["theme"] = theme;
  }
};

type ThemeProviderProps = Readonly<{ children: Readonly<JSX.Element> }>;

export const ThemeProvider = ({ children }: ThemeProviderProps): JSX.Element => {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    localStorage.setItem(storageKey, theme);
    applyTheme(theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
};

export const useTheme = (): ThemeValue => {
  const value = useContext(ThemeContext);

  if (value === undefined) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return value;
};
