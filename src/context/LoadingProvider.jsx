import { createContext, useContext, useState, useCallback } from "react";

const LoadingContext = createContext(null);

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used within LoadingProvider");
  return ctx;
}

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const startLoading = useCallback((text = "") => {
    setLoadingText(text);
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingText("");
  }, []);

  return <LoadingContext.Provider value={{ isLoading, loadingText, startLoading, stopLoading }}>{children}</LoadingContext.Provider>;
}
