import { create } from "zustand";
import type { UserStats } from "./github";

interface StatsStore {
  stats: UserStats | null;
  username: string | null;
  isAuthenticated: boolean;
  setStats: (
    stats: UserStats,
    username: string,
    isAuthenticated: boolean
  ) => void;
  clearStats: () => void;
}

export const useStatsStore = create<StatsStore>((set) => ({
  stats: null,
  username: null,
  isAuthenticated: false,

  setStats: (stats, username, isAuthenticated) => {
    set({ stats, username, isAuthenticated });
  },

  clearStats: () => {
    set({ stats: null, username: null, isAuthenticated: false });
  },
}));
