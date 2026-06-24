import { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

function DynamicSun() {
  const sunRef = useRef<THREE.Group>(null);
  const { isPlaying, isLoading, simTime } = useStore();
  const activeTime = useRef(simTime);

  useFrame(() => {
    if (isLoading || !sunRef.current) return;
    if (isPlaying) activeTime.current = simTime;

    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    const t = (activeTime.current / oneYearInMs) * (Math.PI * 2);
    const orbitDistance = 8;
    
    sunRef.current.position.x = Math.sin(t) * orbitDistance;
    sunRef.current.position.z = Math.cos(t) * orbitDistance;
  });

  return (
    <group ref={sunRef}>
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#ffffee" />
      </mesh>
      <directionalLight intensity={2.5} />
    </group>
  );
}

function TexturedGlobe({ children }: { children?: React.ReactNode }) {
  const globeGroupRef = useRef<THREE.Group>(null);
  const { isLoading, simTime } = useStore();
  const colorMap = useTexture('textures/worldtopobathy2004013x21600x10800.jpg');

  useFrame(() => {
    if (isLoading || !globeGroupRef.current) return;
    
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const timeSpin = (simTime / oneDayInMs) * (Math.PI * 2);
    
    globeGroupRef.current.rotation.y = timeSpin;
  });

  return (
    <group ref={globeGroupRef}>
      <Sphere args={[2, 128, 128]}>
        <meshStandardMaterial 
          map={isLoading ? null : colorMap} 
          color={isLoading ? "#1a4b7c" : "white"} 
          roughness={0.6} 
        />
      </Sphere>
      {children}
    </group>
  );
}

export function Earth({ children }: { children?: React.ReactNode }) {
  const { isLoading } = useStore();

  return (
    <>
      <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <DynamicSun />
      <ambientLight intensity={0.1} />
      
      <Suspense fallback={
        <Sphere args={[2, 32, 32]}>
          <meshBasicMaterial color="#1a4b7c" wireframe />
        </Sphere>
      }>
        <TexturedGlobe key={isLoading.toString()}>
          {children}
        </TexturedGlobe>
      </Suspense>
    </>
  );
}