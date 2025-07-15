import { create } from 'zustand';
import type { TenSessionStudent, TwentyFiveSessionStudent, CompletedStudent, ContinuingStudent } from './serverActions';

interface PrefetchState {
  tenSession: TenSessionStudent[];
  twentyFiveSession: TwentyFiveSessionStudent[];
  completed: CompletedStudent[];
  continuing: ContinuingStudent[];
  lastFetched: number | null;
  mentorId: string | null;
  loading: boolean;
  error: string | null;
  setPrefetchData: (data: Partial<Omit<PrefetchState, 'setPrefetchData' | 'clear' | 'setMentorId'>>) => void;
  setMentorId: (mentorId: string | null) => void;
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
  mentorId: null,
  loading: false,
  error: null,
  setPrefetchData: (data) => set((state) => ({ ...state, ...data })),
  setMentorId: (mentorId) => set(() => ({ mentorId })),
  setLoading: (loading) => set(() => ({ loading })),
  setError: (error) => set(() => ({ error })),
  clear: () => set(() => ({
    tenSession: [],
    twentyFiveSession: [],
    completed: [],
    continuing: [],
    lastFetched: null,
    mentorId: null,
    loading: false,
    error: null,
  })),
})); 