import React, { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture, Stars } from "@react-three/drei";
import * as THREE from "three";

// ====== Cấu hình ======
const IMAGES = Array.from({ length: 34 }, (_, i) => `/images/img${i + 1}.jpg`);
const AUDIO_URL = "/audio/Kho Báu (with Rhymastic).mp3";

// ====== Hook double click bật/tắt nhạc ======
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

// ====== Hành tinh chấm đỏ ======
function DotPlanet({ radius = 1.5, count = 6000, rotationSpeed = 0.001 }) {
  const geo = useMemo(() => new THREE.SphereGeometry(0.008, 6, 6), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "red", emissive: "red", emissiveIntensity: 0.7 }), []);
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
    ref.current.rotation.y += rotationSpeed; // nhẹ quay
  });

  return (
    <group ref={ref}>
      {positions.map((pos, i) => (
        <mesh key={i} geometry={geo} material={mat} position={pos} />
      ))}
    </group>
  );
}

// ====== Ảnh quanh hành tinh ======
function ImageBillboard({ url, radiusBase = 3.5, radiusSpread = 1.5, heightSpread = 0.5, speed = 0.05 }) {
  const texture = useTexture(url);
  const ref = useRef();
  const angle0 = useMemo(() => Math.random() * Math.PI * 2, []);
  const radius = useMemo(() => radiusBase + Math.random() * radiusSpread, []);
  const y = useMemo(() => (Math.random() - 0.5) * heightSpread, []);

  useFrame((state) => {
    // đảo chiều quay: thêm dấu âm trước elapsedTime
    const t = -state.clock.getElapsedTime() * speed; 
    const a = angle0 + t;
    ref.current.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
    ref.current.lookAt(state.camera.position);
  });

  return (
    <mesh ref={ref}>
      <planeGeometry args={[0.15, 0.15]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

function ImageBelt({ images }) {
  const imgs = [...images, ...images, ...images, ...images]; // nhân 4 lần
  return <>{imgs.map((url, i) => <ImageBillboard key={i} url={url} />)}</>;
}


// ====== Vành đai chấm đỏ + hồng ======
function DotRing({
  radiusInner = 1.5,
  radiusOuterRed = 6,
  radiusOuterPink = 3,
  countPink = 3000,
  countRed = 800
}) {
  const pinkGeo = useMemo(() => new THREE.SphereGeometry(0.01, 6, 6), []);
  const pinkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "pink", emissive: "pink", emissiveIntensity: 0.6 }), []);
  const redGeo = useMemo(() => new THREE.SphereGeometry(0.012, 6, 6), []);
  const redMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "red", emissive: "red", emissiveIntensity: 0.7 }), []);

  const pinkDots = useMemo(() => {
    const temp = [];
    for (let i = 0; i < countPink; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = radiusInner + 1 + Math.random() * (radiusOuterPink - 1);
      const y = (Math.random() - 0.5) * 0.05;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      temp.push([x, y, z]);
    }
    return temp;
  }, [countPink, radiusInner, radiusOuterPink]);

  const redDots = useMemo(() => {
    const temp = [];
    for (let i = 0; i < countRed; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = radiusInner + Math.random() * (radiusOuterRed - radiusInner);
      const y = (Math.random() - 0.5) * 0.1;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      temp.push([x, y, z]);
    }
    return temp;
  }, [countRed, radiusInner, radiusOuterRed]);

  const ref = useRef();
  useFrame(() => {
    ref.current.rotation.y += 0.0005; // nhẹ quay
  });

  return (
    <group ref={ref}>
      {pinkDots.map((pos, i) => <mesh key={`pink-${i}`} geometry={pinkGeo} material={pinkMat} position={pos} />)}
      {redDots.map((pos, i) => <mesh key={`red-${i}`} geometry={redGeo} material={redMat} position={pos} />)}
    </group>
  );
}

// ====== Galaxy + mưa sao băng hồng ======
function ShootingStar() {
  const ref = useRef();
  const start = useMemo(() => ({
    x: (Math.random() - 0.5) * 50,
    y: Math.random() * 30 - 10,
    z: (Math.random() - 0.5) * 50
  }), []);
  const velocity = useMemo(() => ({
    x: 0.5 + Math.random() * 0.5,
    y: -0.2 - Math.random() * 0.1,
    z: 0
  }), []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.x += delta * velocity.x;
    ref.current.position.y += delta * velocity.y;
    if (ref.current.position.y < -15) ref.current.position.set(start.x, start.y, start.z);
  });

  return (
    <mesh ref={ref} position={[start.x, start.y, start.z]}>
      <coneGeometry args={[0.01, 0.2, 8]} />
      <meshBasicMaterial color="pink" />
    </mesh>
  );
}

function Galaxy() {
  return (
    <group>
      <Stars radius={200} depth={100} count={2000} factor={2} saturation={0} fade color="pink" />
      {Array.from({ length: 50 }).map((_, i) => <ShootingStar key={i} />)}
    </group>
  );
}

// ====== Main Component ======
export default function LovePlanet() {
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
      <Canvas className="w-full h-full" camera={{ position: [0, 2.5, 6], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} />
        <Suspense fallback={null}>
          <DotPlanet />
          <DotRing />
          <ImageBelt images={IMAGES} />
          <Galaxy />
        </Suspense>
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}
