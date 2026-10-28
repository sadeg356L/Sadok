import { createContext, useContext } from "react";

export interface LoadingType {
  progress: number;
  isIntroDone: boolean;
  finish: () => void;
}

export const LoadingContext = createContext<LoadingType | null>(null);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
