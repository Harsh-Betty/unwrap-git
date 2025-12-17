import { create } from "zustand";

export type LogStatus = "pending" | "done" | "error";

export interface LogEntry {
  id: string;
  message: string;
  status: LogStatus;
  timestamp: number;
}

interface LogStore {
  logs: LogEntry[];
  isLoading: boolean;
  addLog: (message: string) => string;
  updateLog: (id: string, status: LogStatus) => void;
  clearLogs: () => void;
  setLoading: (loading: boolean) => void;
}

let logIdCounter = 0;

export const useLogStore = create<LogStore>((set) => ({
  logs: [],
  isLoading: false,

  addLog: (message: string) => {
    const id = `log-${++logIdCounter}-${Date.now()}`;
    set((state) => ({
      logs: [
        ...state.logs,
        {
          id,
          message,
          status: "pending" as LogStatus,
          timestamp: Date.now(),
        },
      ],
    }));
    return id;
  },

  updateLog: (id: string, status: LogStatus) => {
    set((state) => ({
      logs: state.logs.map((log) => (log.id === id ? { ...log, status } : log)),
    }));
  },

  clearLogs: () => {
    set({ logs: [] });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));
