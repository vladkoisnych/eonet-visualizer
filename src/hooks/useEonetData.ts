import { useEffect, useState } from 'react';

export interface EonetEvent {
  id: string;
  title: string;
  category: string;
  date: number; // Stored as timestamp for easy comparison
  coordinates: [number, number]; // [longitude, latitude]
}

export function useEonetData() {
  const [events, setEvents] = useState<EonetEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetching events from the last 2000 days to get a good historical spread
        const response = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?days=2000&status=all');
        const data = await response.json();

        const formattedEvents: EonetEvent[] = data.events
          .filter((event: any) => event.geometries && event.geometries.length > 0)
          .map((event: any) => ({
            id: event.id,
            title: event.title,
            category: event.categories[0]?.id || 'unknown',
            date: new Date(event.geometries[0].date).getTime(),
            // EONET returns [longitude, latitude]
            coordinates: event.geometries[0].coordinates,
          }));

        setEvents(formattedEvents);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch EONET data:", error);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { events, loading };
}