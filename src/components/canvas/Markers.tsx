import { useStore } from '../../store/useStore';
import { getCartesianCoordinates } from '../../utils/math';
import * as THREE from 'three';

export function Markers() {
  const events = useStore((state) => state.events);
  const simTime = useStore((state) => state.simTime);
  const activeFilters = useStore((state) => state.activeFilters);
  const setSelectedEvent = useStore((state) => state.setSelectedEvent);

  const getColor = (category: string) => {
    if (category === 'wildfires') return '#ff6b22';
    if (category === 'volcanoes') return '#ff2222';
    if (category === 'severeStorms' || category === 'storms') return '#22aaff';
    if (category === 'earthquakes') return '#ffee22';
    return '#ffffff';
  };

  return (
    <group>
      {events.map((event) => {
        const isVisible = 
          (activeFilters.wildfires && event.category === 'wildfires') ||
          (activeFilters.volcanoes && event.category === 'volcanoes') ||
          (activeFilters.storms && (event.category === 'severeStorms' || event.category === 'storms')) ||
          (activeFilters.earthquakes && event.category === 'earthquakes');

        if (!isVisible) return null;

        const ageInMs = simTime - event.date;
        const peakDuration = 10 * 24 * 60 * 60 * 1000;
        const fadeDuration = 30 * 24 * 60 * 60 * 1000;

        if (ageInMs < 0 || ageInMs > (peakDuration + fadeDuration)) return null;

        let opacity = 1;
        let scale = 1;

        if (ageInMs > peakDuration) {
          const fadeProgress = (ageInMs - peakDuration) / fadeDuration;
          opacity = 1 - fadeProgress;
          scale = 1 - (fadeProgress * 0.5);
        }

        const pos = getCartesianCoordinates(event.coordinates[1], event.coordinates[0], 2.02);

        return (
          <mesh 
            name={event.id} 
            key={event.id} 
            position={pos} 
            scale={[scale, scale, scale]}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEvent(event);
            }}
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onPointerOut={() => (document.body.style.cursor = 'auto')}
          >
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color={getColor(event.category)} transparent={true} opacity={opacity} />
          </mesh>
        );
      })}
    </group>
  );
}