import { create } from 'zustand';

export interface EonetEvent {
  id: string;
  title: string;
  category: string;
  date: number;
  coordinates: [number, number];
}

interface AppState {
  simTime: number;
  timeMultiplier: number;
  isPlaying: boolean;
  activeFilters: Record<string, boolean>;
  events: EonetEvent[];
  isLoading: boolean;
  selectedEvent: EonetEvent | null;
  setSimTime: (time: number | ((prev: number) => number)) => void;
  setTimeMultiplier: (mult: number) => void;
  setIsPlaying: (playing: boolean) => void;
  toggleFilter: (filter: string) => void;
  fetchEvents: () => Promise<void>;
  setSelectedEvent: (event: EonetEvent | null) => void;
}

const decodeHTMLEntities = (text: string) => {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
};

export const useStore = create<AppState>((set) => ({
  simTime: Date.now() - (180 * 24 * 60 * 60 * 1000),
  timeMultiplier: 0.5,
  isPlaying: true,
  activeFilters: { wildfires: true, volcanoes: true, storms: true, earthquakes: true },
  events: [],
  isLoading: true,
  selectedEvent: null,

  setSimTime: (update) => set((state) => {
    const nextTime = typeof update === 'function' ? update(state.simTime) : update;
    const now = Date.now();
    
    if (nextTime >= now) {
      return { simTime: now, isPlaying: false };
    }
    return { simTime: nextTime };
  }),

  setTimeMultiplier: (mult) => set({ timeMultiplier: mult }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  
  toggleFilter: (filter) => set((state) => ({
    activeFilters: { ...state.activeFilters, [filter]: !state.activeFilters[filter] },
  })),

  fetchEvents: async () => {
    try {
      let data;
      try {
        // Limited to 180 days to avoid NASA API timeouts
        const response = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?days=180&status=all', {
          headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        data = await response.json();
      } catch (apiError) {
        console.warn("NASA API unavailable. Loading local fallback data...", apiError);
        const localResponse = await fetch('/disasters.json');
        data = await localResponse.json();
      }

      if (!data || !Array.isArray(data.events)) {
        throw new Error("Invalid data format received.");
      }

      const formattedEvents: EonetEvent[] = data.events
        .filter((event: any) => event.geometry && event.geometry.length > 0)
        .map((event: any) => {
          let coords = event.geometry[0].coordinates;
          while (Array.isArray(coords[0])) {
            coords = coords[0];
          }
          
          return {
            id: event.id,
            title: decodeHTMLEntities(event.title),
            category: event.categories && event.categories[0] ? event.categories[0].id : 'unknown',
            date: new Date(event.geometry[0].date).getTime(),
            coordinates: coords as [number, number],
          };
        });

      set({ events: formattedEvents, isLoading: false });
    } catch (error) {
      console.error("Critical failure loading events:", error);
      set({ isLoading: false });
    }
  }
}));