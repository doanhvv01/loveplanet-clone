import React, { useMemo, useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html, Text, useTexture } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Gift, Mail } from "lucide-react";

/**
 * LovePlanet Clone — single-file starter
 * Tech: React + @react-three/fiber + drei + Tailwind + Framer Motion + lucide-react
 *
 * Features:
 * - Vòng ảnh xoay quanh tinh cầu (ảnh tuỳ chỉnh)
 * - Hạt sao (galaxy/nebula) + hiệu ứng sao băng đơn giản
 * - Toggle hiệu ứng bay (gift icon), hiển thị thư 3D (mail icon)
 * - Double click để bật nhạc & camera kick nhẹ
 * - Panel Cài đặt đổi màu, tốc độ, ảnh & âm thanh
 *
 * Gợi ý deploy: Vercel/Netlify (build: vite or CRA). File này export default một component có thể nhúng vào app.
 */

// ====== Helpers ======
const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?w=800",
  "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=800",
  "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=800",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800",
];

const DEFAULT_AUDIO = ""; // đặt link mp3 của anh vào đây nếu muốn auto play sau double click

function useDoubleClick(callback, latency = 250) {
  const clickRef = useRef(0);
  useEffect(() => {
    const handler = () => {
      const now = Date.now();
      if (now - clickRef.current < latency) {
        callback?.();
      }
      clickRef.current = now;
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [callback, latency]);
}

// ====== 3D Parts ======
function Planet({ color = "#8ec5ff" }) {
  const ref = useRef();
  useFrame((_, d) => {
    if (!ref.current) return;
    ref.current.rotation.y += d * 0.1;
  });
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <sphereGeometry args={[1.2, 64, 64]} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
    </mesh>
  );
}

function ImageBillboard({ url, index, total, radius, speed, flying }) {
  const ref = useRef();
  const texture = useTexture(url);
  const angle0 = (index / total) * Math.PI * 2;
  useFrame((state, d) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() * speed;
    const a = angle0 + t;
    const r = radius + (flying ? Math.sin(t * 2 + index) * 0.15 : 0);
    ref.current.position.set(Math.cos(a) * r, Math.sin(a * 0.9) * 0.1, Math.sin(a) * r);
    ref.current.lookAt(0, 0, 0);
  });
  return (
    <mesh ref={ref}>
      <planeGeometry args={[0.9, 0.9]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
}

function ImageRing({ images, radius = 3.2, speed = 0.4, flying = true }) {
  return (
    <group>
      {images.map((url, i) => (
        <ImageBillboard
          key={i}
          url={url}
          index={i}
          total={images.length}
          radius={radius}
          speed={speed}
          flying={flying}
        />
      ))}
    </group>
  );
}

function ShootingStar() {
  const ref = useRef();
  const start = useMemo(() => ({
    x: (Math.random() - 0.5) * 10,
    y: Math.random() * 4 + 2,
    z: -5 - Math.random() * 5,
  }), []);
  useFrame((_, d) => {
    if (!ref.current) return;
    ref.current.position.x += d * 6;
    ref.current.position.y -= d * 2;
    if (ref.current.position.x > 6) {
      ref.current.position.set(start.x, start.y, start.z);
    }
  });
  return (
    <mesh ref={ref} position={[start.x, start.y, start.z]}>
      <coneGeometry args={[0.02, 0.4, 8]} />
      <meshBasicMaterial color={"white"} />
    </mesh>
  );
}

function Galaxy({ starColor = "#ffffff" }) {
  return (
    <group>
      <Stars radius={60} depth={40} count={6000} factor={2} saturation={0} fade />
      {/* Thi thoảng bắn sao băng */}
      <ShootingStar />
    </group>
  );
}

function ThreeDLetter({ show, text = "Yêu em 3000" }) {
  if (!show) return null;
  return (
    <Text
      position={[0, 1.8, 0]}
      fontSize={0.4}
      color="#ffffff"
      anchorX="center"
      anchorY="middle"
      outlineColor="#ff7bd3"
      outlineWidth={0.02}
    >
      {text}
    </Text>
  );
}

// ====== Main Component ======
export default function LovePlanetClone() {
  const [images, setImages] = useState(DEFAULT_IMAGES);
  const [audioUrl, setAudioUrl] = useState(DEFAULT_AUDIO);
  const [playing, setPlaying] = useState(false);
  const [fly, setFly] = useState(true);
  const [showLetter, setShowLetter] = useState(false);
  const [planetColor, setPlanetColor] = useState("#8ec5ff");
  const [starColor, setStarColor] = useState("#ffffff");
  const [speed, setSpeed] = useState(0.4);
  const audioRef = useRef(null);

  // Double click: bật nhạc + hiệu ứng kick camera (nhe)
  useDoubleClick(() => {
    if (!audioRef.current && audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.loop = true;
    }
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setPlaying(true);
      }
    }
    // nhẹ nhàng rung màn hình
    if (document && document.body) {
      document.body.classList.add("shake");
      setTimeout(() => document.body.classList.remove("shake"), 350);
    }
  });

  // URL hash nhận id (demo: chưa fetch, chỉ log)
  useEffect(() => {
    const id = window.location.hash.replace("#id=", "");
    if (id) console.log("Config ID:", id);
  }, []);

  // Thêm CSS rung
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .shake { animation: shake 0.35s; }
      @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0)}
        20%, 80% { transform: translate3d(2px, 0, 0)}
        30%, 50%, 70% { transform: translate3d(-4px, 0, 0)}
        40%, 60% { transform: translate3d(4px, 0, 0)} }
      .glass { backdrop-filter: blur(10px); background: rgba(255,255,255,0.12); }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Upload ảnh qua input
  const onPickImages = (files) => {
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    if (urls.length) setImages(urls);
  };

  return (
    <div className="w-screen h-screen bg-black text-white overflow-hidden">
      {/* UI overlay */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
        <button
          onClick={() => setFly((s) => !s)}
          className="p-3 rounded-2xl glass shadow hover:scale-105 transition"
          title="Bật/Tắt hiệu ứng bay vòng ảnh"
        >
          <Gift className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowLetter((s) => !s)}
          className="p-3 rounded-2xl glass shadow hover:scale-105 transition"
          title="Hiển thị/Ẩn thư 3D"
        >
          <Mail className="w-5 h-5" />
        </button>
        <SettingsPanel
          images={images}
          setImages={setImages}
          onPickImages={onPickImages}
          planetColor={planetColor}
          setPlanetColor={setPlanetColor}
          starColor={starColor}
          setStarColor={setStarColor}
          speed={speed}
          setSpeed={setSpeed}
          audioUrl={audioUrl}
          setAudioUrl={setAudioUrl}
        />
      </div>

      {/* Tips */}
      <div className="absolute left-3 top-3 z-20 text-xs md:text-sm opacity-80 space-y-1">
        <div className="px-3 py-2 rounded-xl glass inline-block">[PC/Mobile] Double click: bật/ tắt nhạc + camera kick</div>
        <div className="px-3 py-2 rounded-xl glass inline-block ml-2">Gift: bay vòng ảnh • Mail: thư 3D</div>
      </div>

      <Canvas shadows camera={{ position: [0, 2, 7], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 2]} intensity={1.2} castShadow />
        <Suspense fallback={<Html center style={{ color: "white" }}>Đang tải thiên hà...</Html>}>
          <Galaxy starColor={starColor} />
          <group>
            <Planet color={planetColor} />
            <ImageRing images={images} radius={3.2} speed={speed} flying={fly} />
            <ThreeDLetter show={showLetter} text="Công chúa ơi 💖" />
          </group>
        </Suspense>
        <OrbitControls enablePan={false} />
      </Canvas>

      {/* Footer */}
      <div className="absolute bottom-3 w-full flex justify-center z-20">
        <div className="px-4 py-2 rounded-2xl glass text-xs md:text-sm">
          LovePlanet Clone • built with React & three.js • by anh
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({
  images,
  setImages,
  onPickImages,
  planetColor,
  setPlanetColor,
  starColor,
  setStarColor,
  speed,
  setSpeed,
  audioUrl,
  setAudioUrl,
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-3 rounded-2xl glass shadow hover:scale-105 transition"
        title="Cài đặt"
      >
        <Settings className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-[320px] max-w-[90vw] glass rounded-2xl p-4 space-y-4 backdrop-blur-md"
          >
            <h3 className="font-semibold">Cài đặt</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="space-y-1">
                <div>Màu tinh cầu</div>
                <input
                  type="color"
                  value={planetColor}
                  onChange={(e) => setPlanetColor(e.target.value)}
                  className="w-full h-9 rounded-xl bg-transparent"
                />
              </label>
              <label className="space-y-1">
                <div>Màu sao</div>
                <input
                  type="color"
                  value={starColor}
                  onChange={(e) => setStarColor(e.target.value)}
                  className="w-full h-9 rounded-xl bg-transparent"
                />
              </label>
              <label className="space-y-1 col-span-2">
                <div>Tốc độ xoay ảnh: {speed.toFixed(2)}</div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full"
                />
              </label>
              <label className="space-y-1 col-span-2">
                <div>Nhạc (MP3 URL)</div>
                <input
                  type="url"
                  placeholder="https://...mp3"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 outline-none"
                />
              </label>
              <div className="col-span-2 space-y-2">
                <div>Ảnh vòng (upload nhiều ảnh)</div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => onPickImages(e.target.files)}
                  className="w-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
