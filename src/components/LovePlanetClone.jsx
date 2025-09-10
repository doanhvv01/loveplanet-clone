// LovePlanetClone.jsx
import React, { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture, Stars } from "@react-three/drei";
import * as THREE from "three";

// ====== Config ======
const IMAGES = Array.from({ length: 34 }, (_, i) => `/images/img${i + 1}.jpg`);
const AUDIO_URL = "/audio/Kho Báu (with Rhymastic).mp3";

// ====== Double click music ======
function useDoubleClick(callback, latency = 250) {
  const clickRef = useRef(0);
  useEffect(() => {
    const handler = () => {
      const now = Date.now();
      if (now - clickRef.current < latency) callback?.();
      clickRef.current = now;
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [callback, latency]);
}

// ====== Planet (dense red dots) ======
function DotPlanet({ radius = 0.7, count = 8000, rotationSpeed = 0.0005 }) {
  const geo = useMemo(() => new THREE.SphereGeometry(0.005, 6, 6), []);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "red",
        emissive: "red",
        emissiveIntensity: 0.25,
      }),
    []
  );

  const positions = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = radius;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      temp.push([x, y, z]);
    }
    return temp;
  }, [count, radius]);

  const ref = useRef();
  useFrame(() => {
    ref.current.rotation.y += rotationSpeed;
  });

  return (
    <group ref={ref}>
      {positions.map((pos, i) => (
        <mesh key={i} geometry={geo} material={mat} position={pos} />
      ))}
    </group>
  );
}

// ====== Orbiting images ======
function ImageBillboard({
  url,
  radiusBase = 2.5,
  radiusSpread = 1.5,
  heightSpread = 0.3,
  speed = 0.01,
}) {
  const texture = useTexture(url);
  const ref = useRef();
  const angle0 = useMemo(() => Math.random() * Math.PI * 2, []);
  const radius = useMemo(() => radiusBase + Math.random() * radiusSpread, []);
  const y = useMemo(() => (Math.random() - 0.5) * heightSpread, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    const a = angle0 + t;
    ref.current.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
    ref.current.lookAt(state.camera.position);
  });

  return (
    <mesh ref={ref}>
      <planeGeometry args={[0.3, 0.3]} /> {/* to hơn 3 lần */}
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

function ImageBelt({ images }) {
  const imgs = [...images, ...images]; // nhân đôi thôi cho vừa
  return <>{imgs.map((url, i) => <ImageBillboard key={i} url={url} />)}</>;
}

// ====== Rings (pink + red) ======
function DotRingFull() {
  const pinkGeo = useMemo(() => new THREE.SphereGeometry(0.005, 6, 6), []);
  const pinkMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ff69b4",
        emissive: "#ff69b4",
        emissiveIntensity: 0.4,
      }),
    []
  );

  const redGeo = useMemo(() => new THREE.SphereGeometry(0.006, 6, 6), []);
  const redMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "red",
        emissive: "red",
        emissiveIntensity: 0.2,
      }),
    []
  );

  const pinkDots = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 4000; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.2 + Math.random() * 0.8; // dense inner pink
      const y = (Math.random() - 0.5) * 0.1;
      arr.push([Math.cos(angle) * radius, y, Math.sin(angle) * radius]);
    }
    return arr;
  }, []);

  const redDots = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 6000; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 2;
      const y = (Math.random() - 0.5) * 0.2;
      arr.push([Math.cos(angle) * radius, y, Math.sin(angle) * radius]);
    }
    return arr;
  }, []);

  const ref = useRef();
  useFrame(() => {
    ref.current.rotation.y += 0.0015; // quay chậm
  });

  return (
    <group ref={ref}>
      {pinkDots.map((pos, i) => (
        <mesh key={`pink-${i}`} geometry={pinkGeo} material={pinkMat} position={pos} />
      ))}
      {redDots.map((pos, i) => (
        <mesh key={`red-${i}`} geometry={redGeo} material={redMat} position={pos} />
      ))}
    </group>
  );
}

// ====== Galaxy ======
function Galaxy() {
  return (
    <group>
      <Stars radius={80} depth={100} count={4000} factor={3} saturation={0} fade color="pink" />
    </group>
  );
}

// ====== Main ======
export default function LovePlanetClone() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useDoubleClick(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(AUDIO_URL);
      audioRef.current.loop = true;
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  });

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <Canvas className="w-full h-full" camera={{ position: [0, 2, 6], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={2} />
        <Suspense fallback={null}>
          <DotPlanet />
          <DotRingFull />
          <ImageBelt images={IMAGES} />
          <Galaxy />
        </Suspense>
        <OrbitControls enablePan={false} enableZoom={false} />
      </Canvas>
    </div>
  );
}
