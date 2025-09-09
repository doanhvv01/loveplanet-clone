import React, { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, useTexture } from "@react-three/drei";
import * as THREE from "three";

// ====== Cấu hình ======
const IMAGES = Array.from({ length: 34 }, (_, i) => `/images/img${i + 1}.jpg`);
const AUDIO_URL = "/audio/Kho Báu (with Rhymastic).mp3";
const PLANET_COLOR = "#ff69b4"; // Hồng

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

// ====== 3D Components ======
function Planet({ color }) {
  const ref = useRef();
  useFrame((_, d) => {
  if (!ref.current) return;
  ref.current.position.x += d * (8 + Math.random() * 4);
  ref.current.position.y -= d * (4 + Math.random() * 2);
  ref.current.position.z += d * (1 - 0.5); // thêm chút chiều sâu
  // nếu đi quá màn hình → reset
  if (
    Math.abs(ref.current.position.x) > 25 ||
    ref.current.position.y < -15 ||
    Math.abs(ref.current.position.z) > 25
  ) {
    ref.current.position.set(start.x, start.y, start.z);
  }
});
;
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
    </mesh>
  );
}

// ====== Ảnh xung quanh planet kiểu vành đai ======
function ImageBillboard({ url, radiusBase = 3.5, radiusSpread = 1.5, heightSpread = 1.2, speed = 0.2 }) {
  const texture = useTexture(url);
  const ref = useRef();

  // Tạo góc và bán kính ngẫu nhiên cho vành đai
  const angle0 = useMemo(() => Math.random() * Math.PI * 2, []);
  const radius = useMemo(() => radiusBase + Math.random() * radiusSpread, []);
  const y = useMemo(() => (Math.random() - 0.5) * heightSpread, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime() * speed;
    const a = angle0 + t;
    ref.current.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
    ref.current.lookAt(0, 0, 0); // luôn hướng về planet
  });

  return (
    <mesh ref={ref}>
      <planeGeometry args={[0.5, 0.5]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

function ImageBelt({ images }) {
  // nhân đôi mảng
  const imgs = [...images, ...images]; 
  return <>{imgs.map((url, i) => <ImageBillboard key={i} url={url} />)}</>;
}


// ====== Shooting Stars + Galaxy ======
function ShootingStar() {
  const ref = useRef();
  const start = useMemo(() => ({
  x: (Math.random() - 0.5) * 50,  // rộng ra 50 đơn vị ngang
  y: Math.random() * 30 - 10,     // cao thấp toàn màn hình
  z: (Math.random() - 0.5) * 50 - 20 // sâu trước sau
}), []);


  useFrame((_, d) => {
    if (!ref.current) return;
    ref.current.position.x += d * 12;
    ref.current.position.y -= d * 4;
    if (ref.current.position.x > 10) ref.current.position.set(start.x, start.y, start.z);
  });

  return (
    <mesh ref={ref} position={[start.x, start.y, start.z]}>
      <coneGeometry args={[0.02, 0.5, 8]} />
      <meshBasicMaterial color="white" />
    </mesh>
  );
}

function Galaxy() {
  return (
    <group>
      <Stars radius={200} depth={50} count={8000} factor={2} saturation={0} fade />
      {/* Mưa sao băng nhiều hơn */}
      {Array.from({ length: 80 }).map((_, i) => (
        <ShootingStar key={i} />
      ))}
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
      <Canvas className="w-full h-full" camera={{ position: [0, 3, 10], fov: 60 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
        <Suspense fallback={null}>
          <Galaxy />
          <Planet color={PLANET_COLOR} />
          <ImageBelt images={IMAGES} />
        </Suspense>
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}
