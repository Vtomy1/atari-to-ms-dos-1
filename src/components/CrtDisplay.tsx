import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Maximize, Monitor, Sparkles, Volume2, VolumeX, Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { AtariDosEmulator, EmulatorInputs } from '../utils/atariDosEmulator';
import { PaletteStandard, VgaColor } from '../types/atari-dos';
import { generateVgaPalette } from '../utils/atariPalettes';

interface CrtDisplayProps {
  emulator: AtariDosEmulator | null;
  romName: string;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  paletteStandard: PaletteStandard;
  onChangePaletteStandard: (std: PaletteStandard) => void;
}

export const CrtDisplay: React.FC<CrtDisplayProps> = ({
  emulator,
  romName,
  isAudioMuted,
  onToggleAudio,
  paletteStandard,
  onChangePaletteStandard,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showScanlines, setShowScanlines] = useState<boolean>(true);
  const [showCurvature, setShowCurvature] = useState<boolean>(true);
  const [showOsd, setShowOsd] = useState<boolean>(true);
  const [currentFps, setCurrentFps] = useState<number>(70.1);
  const [scanlineCounter, setScanlineCounter] = useState<number>(0);

  // Key states
  const inputsRef = useRef<EmulatorInputs>({
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
    reset: false,
    select: false,
  });

  // Track keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scrolling on arrow keys and space when canvas is active
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') inputsRef.current.up = true;
      if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') inputsRef.current.down = true;
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputsRef.current.left = true;
      if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputsRef.current.right = true;
      if (e.code === 'Space' || e.key === 'Control') inputsRef.current.fire = true;
      if (e.code === 'F2' || e.key === 'r' || e.key === 'R') inputsRef.current.reset = true;
      if (e.code === 'F1') inputsRef.current.select = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') inputsRef.current.up = false;
      if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') inputsRef.current.down = false;
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputsRef.current.left = false;
      if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputsRef.current.right = false;
      if (e.code === 'Space' || e.key === 'Control') inputsRef.current.fire = false;
      if (e.code === 'F2' || e.key === 'r' || e.key === 'R') inputsRef.current.reset = false;
      if (e.code === 'F1') inputsRef.current.select = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main 70Hz VGA render loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let frameCounter = 0;
    let fpsTimer = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const imgData = ctx.createImageData(320, 200);

    const render = (time: number) => {
      const delta = time - lastTime;

      // VGA Mode 13h operates at 70.08 Hz (approx 14.26 ms per frame)
      if (isPlaying && emulator) {
        emulator.update(inputsRef.current);
        emulator.renderToCanvas(ctx, imgData);

        frameCounter++;
        if (time - fpsTimer >= 500) {
          const calculatedFps = (frameCounter * 1000) / (time - fpsTimer);
          // Target around 70.1 FPS
          setCurrentFps(Math.min(72, Math.max(58, Math.round(calculatedFps * 10) / 10)));
          frameCounter = 0;
          fpsTimer = time;
        }

        setScanlineCounter((prev) => (prev + 13) % 200);
      }

      lastTime = time;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [emulator, isPlaying]);

  const handleReset = () => {
    if (emulator) {
      emulator.resetState();
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Outer CRT Monitor Chassis */}
      <div
        ref={containerRef}
        className="w-full max-w-4xl bg-[#1a1b23] border-4 border-[#2d2f3d] rounded-2xl p-4 sm:p-6 shadow-2xl relative flex flex-col items-center transition-all select-none"
      >
        {/* Top Chassis Label */}
        <div className="w-full flex items-center justify-between mb-3 px-2 text-zinc-400 font-mono text-[11px] tracking-wider border-b border-zinc-800/80 pb-2">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="font-bold text-zinc-300">IBM 8513 VGA DISPLAY</span>
            <span className="text-zinc-600 hidden sm:inline">|</span>
            <span className="text-amber-400/90 hidden sm:inline font-semibold">MODE 13h (320x200x256)</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-zinc-400 font-mono">{romName}</span>
            <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[10px]">70.08 Hz</span>
          </div>
        </div>

        {/* The Screen Area with 4:3 Aspect Ratio Container */}
        <div className="relative w-full aspect-[4/3] max-h-[520px] bg-black rounded-lg overflow-hidden flex items-center justify-center border-2 border-zinc-950 shadow-[inset_0_0_60px_rgba(0,0,0,0.95)]">
          {/* Native 320x200 Canvas */}
          <canvas
            ref={canvasRef}
            width={320}
            height={200}
            className="w-full h-full object-contain pixelated z-10"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* CRT Scanline Shader Overlay */}
          {showScanlines && (
            <div className="absolute inset-0 crt-scanlines z-20 pointer-events-none opacity-80" />
          )}

          {/* CRT Curvature & Vignette Overlay */}
          {showCurvature && (
            <div className="absolute inset-0 crt-curvature z-30 pointer-events-none rounded-lg" />
          )}

          {/* Real-time OSD Overlay */}
          {showOsd && (
            <div className="absolute top-3 left-3 z-30 bg-black/80 backdrop-blur-sm border border-amber-500/40 text-amber-400 font-mono text-[10px] p-2 rounded pointer-events-none flex flex-col space-y-0.5 shadow-lg">
              <div className="flex justify-between gap-4 font-bold text-emerald-400">
                <span>VGA SEG:</span>
                <span>0xA000:0000</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>REFRESH:</span>
                <span>{currentFps.toFixed(1)} Hz (70.1)</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>RASTER LINE:</span>
                <span>{scanlineCounter} / 200</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>DAC PALETTE:</span>
                <span>{paletteStandard} (256c)</span>
              </div>
              <div className="flex justify-between gap-4 text-zinc-400">
                <span>AUDIO:</span>
                <span>{isAudioMuted ? 'MUTED' : 'TIA CH0/1 + PIT'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Monitor Bottom Control Panel */}
        <div className="w-full mt-4 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
          {/* Playback Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs flex items-center gap-1.5 transition-colors"
              title={isPlaying ? 'Pause Emulation' : 'Resume Emulation'}
            >
              {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
              <span className="hidden sm:inline">{isPlaying ? 'PAUSE' : 'RUN'}</span>
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors"
              title="Reset Virtual Machine / Cartridge (R / F2)"
            >
              <RotateCcw className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">RESET</span>
            </button>
            <button
              onClick={onToggleAudio}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs flex items-center gap-1.5 transition-colors"
              title="Mute / Unmute Audio"
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>

          {/* CRT & Display Toggles */}
          <div className="flex items-center space-x-2">
            {/* Palette Mode Selector */}
            <div className="flex items-center space-x-1 bg-zinc-900 border border-zinc-700/80 rounded-lg p-0.5 text-xs font-mono">
              <span className="text-zinc-500 pl-2 text-[10px]">MONITOR:</span>
              <button
                onClick={() => onChangePaletteStandard('NTSC')}
                className={`px-2 py-1 rounded text-[11px] font-semibold ${
                  paletteStandard === 'NTSC' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                COLOR
              </button>
              <button
                onClick={() => onChangePaletteStandard('AMBER_P3')}
                className={`px-2 py-1 rounded text-[11px] font-semibold ${
                  paletteStandard === 'AMBER_P3' ? 'bg-amber-500 text-black' : 'text-amber-500/80 hover:text-amber-400'
                }`}
              >
                AMBER
              </button>
              <button
                onClick={() => onChangePaletteStandard('GREEN_P1')}
                className={`px-2 py-1 rounded text-[11px] font-semibold ${
                  paletteStandard === 'GREEN_P1' ? 'bg-emerald-500 text-black' : 'text-emerald-500/80 hover:text-emerald-400'
                }`}
              >
                GREEN
              </button>
            </div>

            <button
              onClick={() => setShowScanlines(!showScanlines)}
              className={`p-2 rounded-lg border text-xs font-mono transition-colors ${
                showScanlines ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'
              }`}
              title="Toggle CRT Scanlines"
            >
              <Monitor className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowOsd(!showOsd)}
              className={`p-2 rounded-lg border text-xs font-mono transition-colors ${
                showOsd ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'
              }`}
              title="Toggle Onscreen Diagnostics (OSD)"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs transition-colors"
              title="Fullscreen Mode"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Onscreen Controls & Input Help */}
        <div className="w-full mt-3 p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-amber-400 font-semibold">CONTROLS:</span>
            <span>Arrow Keys / WASD</span>
            <span className="text-zinc-600">•</span>
            <span>Space / Ctrl = FIRE</span>
            <span className="text-zinc-600">•</span>
            <span>R = Reset</span>
          </div>

          {/* On-screen touch/mouse buttons for quick testing without physical keyboard */}
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-3 gap-1">
              <div />
              <button
                onMouseDown={() => (inputsRef.current.up = true)}
                onMouseUp={() => (inputsRef.current.up = false)}
                onTouchStart={() => (inputsRef.current.up = true)}
                onTouchEnd={() => (inputsRef.current.up = false)}
                className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 active:bg-amber-500 active:text-black rounded flex items-center justify-center text-zinc-300"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <div />
              <button
                onMouseDown={() => (inputsRef.current.left = true)}
                onMouseUp={() => (inputsRef.current.left = false)}
                onTouchStart={() => (inputsRef.current.left = true)}
                onTouchEnd={() => (inputsRef.current.left = false)}
                className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 active:bg-amber-500 active:text-black rounded flex items-center justify-center text-zinc-300"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onMouseDown={() => (inputsRef.current.down = true)}
                onMouseUp={() => (inputsRef.current.down = false)}
                onTouchStart={() => (inputsRef.current.down = true)}
                onTouchEnd={() => (inputsRef.current.down = false)}
                className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 active:bg-amber-500 active:text-black rounded flex items-center justify-center text-zinc-300"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                onMouseDown={() => (inputsRef.current.right = true)}
                onMouseUp={() => (inputsRef.current.right = false)}
                onTouchStart={() => (inputsRef.current.right = true)}
                onTouchEnd={() => (inputsRef.current.right = false)}
                className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 active:bg-amber-500 active:text-black rounded flex items-center justify-center text-zinc-300"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onMouseDown={() => (inputsRef.current.fire = true)}
              onMouseUp={() => (inputsRef.current.fire = false)}
              onTouchStart={() => (inputsRef.current.fire = true)}
              onTouchEnd={() => (inputsRef.current.fire = false)}
              className="h-15 px-4 bg-red-600 hover:bg-red-500 active:bg-red-700 active:scale-95 text-white font-bold rounded shadow-lg flex items-center justify-center"
            >
              FIRE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
