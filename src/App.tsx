import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Earth } from './components/canvas/Earth';
import { Markers } from './components/canvas/Markers';
import { useStore } from './store/useStore';

const SimulationController = () => {
  const setSimTime = useStore((state) => state.setSimTime);
  
  useFrame((_, delta) => {
    const state = useStore.getState();
    if (state.isLoading || !state.isPlaying) return;

    const oneDayInMs = 24 * 60 * 60 * 1000;
    const timeToAdd = delta * oneDayInMs * state.timeMultiplier;
    
    setSimTime((prev) => {
      const nextTime = prev + timeToAdd;
      if (nextTime >= Date.now()) {
        return Date.now() - (180 * 24 * 60 * 60 * 1000);
      }
      return nextTime;
    });
  });
  return null;
};

const GodModeCamera = () => {
  const { selectedEvent, setSelectedEvent, simTime } = useStore();
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const isLocked = useRef(false);

  useFrame((state) => {
    if (!controlsRef.current) return;

    if (selectedEvent) {
      const ageInMs = simTime - selectedEvent.date;
      const peakDuration = 10 * 24 * 60 * 60 * 1000;
      const fadeDuration = 30 * 24 * 60 * 60 * 1000;
      
      if (ageInMs > (peakDuration + fadeDuration)) {
        setSelectedEvent(null);
      }
    }

    if (selectedEvent) {
      isLocked.current = true;
      controlsRef.current.enabled = false;
      
      const marker = state.scene.getObjectByName(selectedEvent.id);
      if (marker) {
        const worldPos = new THREE.Vector3();
        marker.getWorldPosition(worldPos);
        
        const targetDist = controlsRef.current.target.distanceTo(worldPos);
        const trackSpeed = targetDist > 1.0 ? 0.05 : 0.8;
        
        controlsRef.current.target.lerp(worldPos, trackSpeed);
        
        const zoomPos = worldPos.clone().normalize().multiplyScalar(3.0);
        camera.position.lerp(zoomPos, trackSpeed);
      }
    } else if (isLocked.current) {
      controlsRef.current.enabled = true;
      controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), 0.1);
      
      if (controlsRef.current.target.distanceTo(new THREE.Vector3(0, 0, 0)) < 0.1) {
        isLocked.current = false;
      }
    }
    controlsRef.current.update();
  });

  return (
    <OrbitControls 
      ref={controlsRef} 
      enablePan={true} 
      minDistance={2.2} 
      maxDistance={32} 
    />
  );
};

const UIOverlay = () => {
  const { 
    simTime, setSimTime, isPlaying, setIsPlaying, 
    timeMultiplier, setTimeMultiplier, activeFilters, 
    toggleFilter, events, isLoading, selectedEvent, setSelectedEvent 
  } = useStore();
  
  const currentDate = new Date(simTime);

  return (
    <div className="ui-layer" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', width: '100%' }}>
        <div className="ui-element" style={{ width: '250px', background: 'rgba(10, 10, 15, 0.85)', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
          <h3 style={{ marginBottom: '10px' }}>Global Metrics</h3>
          <p style={{ color: isLoading ? '#ffee22' : '#4ade80' }}>
            {isLoading ? 'Downloading EONET Data...' : `Total Events Loaded: ${events.length}`}
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="ui-element" style={{ width: '300px', background: 'rgba(10, 10, 15, 0.85)', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
            <h3 style={{ marginBottom: '10px' }}>Disaster Filters</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#ccc' }}>
              <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={activeFilters.wildfires} onChange={() => toggleFilter('wildfires')} /> 🔥 Wildfires</label>
              <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={activeFilters.volcanoes} onChange={() => toggleFilter('volcanoes')} /> 🌋 Volcanoes</label>
              <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={activeFilters.storms} onChange={() => toggleFilter('storms')} /> 🌀 Severe Storms</label>
              <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={activeFilters.earthquakes} onChange={() => toggleFilter('earthquakes')} /> 💥 Earthquakes</label>
            </div>
          </div>

          {selectedEvent && (
            <div className="ui-element" style={{ width: '300px', background: 'rgba(10, 10, 15, 0.95)', padding: '20px', borderRadius: '12px', border: '1px solid #4ade80', boxShadow: '0 0 15px rgba(74, 222, 128, 0.2)' }}>
              <h3 style={{ color: '#4ade80', marginBottom: '5px', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '1px' }}>God Mode Active</h3>
              <h2 style={{ fontSize: '1.2em', marginBottom: '10px' }}>{selectedEvent.title}</h2>
              <p style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '15px' }}>
                Recorded: {new Date(selectedEvent.date).toLocaleDateString()}
              </p>
              <button 
                onClick={() => setSelectedEvent(null)} 
                style={{ width: '100%', background: '#333', color: 'white', border: '1px solid #555', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Release Camera
              </button>
            </div>
          )}
        </div>
      </div>

      <div 
        className="ui-element" 
        style={{ 
          background: 'rgba(10, 10, 15, 0.9)', 
          padding: '15px', // Reduced padding for mobile
          borderTop: '1px solid #333', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px',
          flexWrap: 'wrap' // CRITICAL: Allows items to wrap to the next line on mobile
        }}
      >
        <button 
          onClick={() => setIsPlaying(!isPlaying)} 
          style={{ 
            background: isPlaying ? '#ff4444' : '#4ade80', 
            color: 'black', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '4px', 
            fontWeight: 'bold', 
            cursor: 'pointer' 
          }}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        
        <div 
          style={{ 
            flex: '1 1 200px',
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            color: 'white',
            flexWrap: 'wrap'
          }}
        >
          <span style={{ fontFamily: 'monospace', minWidth: '100px' }}>
            {currentDate.toISOString().split('T')[0]}
          </span>
          <input 
            type="range" 
            min={Date.now() - (180 * 24 * 60 * 60 * 1000)} 
            max={Date.now()} 
            value={simTime} 
            onChange={(e) => {
              setIsPlaying(false);
              setSimTime(Number(e.target.value));
            }} 
            style={{ flex: 1, cursor: 'pointer', minWidth: '150px' }} 
          />
        </div>
        
        <select 
          value={timeMultiplier} 
          onChange={(e) => setTimeMultiplier(Number(e.target.value))} 
          style={{ 
            background: '#222', 
            color: 'white', 
            border: '1px solid #444', 
            padding: '8px', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          <option value={0.1}>Speed: 0.1x</option>
          <option value={0.5}>Speed: 0.5x</option>
          <option value={1}>Speed: 1x</option>
          <option value={5}>Speed: 5x</option>
          <option value={10}>Speed: 10x</option>
        </select>
      </div>
    </div>
  );
};

function App() {
  const fetchEvents = useStore((state) => state.fetchEvents);
  
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <GodModeCamera />
        <SimulationController />
        <Earth>
          <Markers />
        </Earth>
      </Canvas>
      <UIOverlay />
    </>
  );
}

export default App;