import { create } from 'zustand';
import type { TenSessionStudent, TwentyFiveSessionStudent, CompletedStudent, ContinuingStudent } from './serverActions';

interface PrefetchState {
  tenSession: TenSessionStudent[];
  twentyFiveSession: TwentyFiveSessionStudent[];
  completed: CompletedStudent[];
  continuing: ContinuingStudent[];
  lastFetched: number | null;
  loading: boolean;
  error: string | null;
  setPrefetchData: (data: Partial<Omit<PrefetchState, 'setPrefetchData' | 'clear'>>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const usePrefetchStore = create<PrefetchState>((set) => ({
  tenSession: [],
  twentyFiveSession: [],
  completed: [],
  continuing: [],
  lastFetched: null,
  loading: false,
  error: null,
  setPrefetchData: (data) => set((state) => ({ ...state, ...data })),
  setLoading: (loading) => set(() => ({ loading })),
  setError: (error) => set(() => ({ error })),
  clear: () => set(() => ({
    tenSession: [],
    twentyFiveSession: [],
    completed: [],
    continuing: [],
    lastFetched: null,
    loading: false,
    error: null,
  })),
})); 