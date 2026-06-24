import * as THREE from 'three';

export function getCartesianCoordinates(lat: number, lng: number, radius: number): THREE.Vector3 {
  // Convert Lat/Lon to Radians
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 90) * (Math.PI / 180);
  
  const vector = new THREE.Vector3();
  // Three.js helper to perfectly wrap coordinates around a sphere
  vector.setFromSphericalCoords(radius, phi, theta);
  
  return vector;
}