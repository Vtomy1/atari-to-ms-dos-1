import React from 'react';
import { ConversionConfig, GeneratedBinary } from '../types/atari-dos';
import { Settings, Sliders, RefreshCw, Download, Monitor, CheckCircle2 } from 'lucide-react';

interface ConverterControlsProps {
  config: ConversionConfig;
  onChangeConfig: (newConfig: ConversionConfig) => void;
  binary: GeneratedBinary;
}

export const ConverterControls: React.FC<ConverterControlsProps> = ({
  config,
  onChangeConfig,
  binary,
}) => {
  const updateField = <K extends keyof ConversionConfig>(key: K, value: ConversionConfig[K]) => {
    onChangeConfig({
      ...config,
      [key]: value,
    });
  };

  const handleDownloadRawVga = () => {
    const blob = new Blob([binary.rawVgaFrame as unknown as BlobPart], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = binary.fileName.replace(/\.EXE$/i, '.VGA');
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#12131a] border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col space-y-5 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded bg-amber-500/10 text-amber-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">MODE 13h CONVERSION ENGINE PARAMETERS</h3>
            <p className="text-xs text-zinc-400">Configure VGA register programming, video RAM geometry, and binary structure</p>
          </div>
        </div>

        <button
          onClick={handleDownloadRawVga}
          className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors border border-zinc-700"
          title="Download 64,000 bytes linear Mode 13h video frame"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Dump 0xA000 VRAM (.VGA - 64 KB)</span>
        </button>
      </div>

      {/* Grid of Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {/* Aspect Ratio & Geometry */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3.5 flex flex-col space-y-2.5">
          <span className="font-semibold text-zinc-300">Scanline Centering & Aspect</span>
          <select
            value={config.aspectRatioMode}
            onChange={(e) => updateField('aspectRatioMode', e.target.value as ConversionConfig['aspectRatioMode'])}
            className="w-full bg-[#0a0b0f] border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="CENTERED_192_IN_200">Centered 192 lines in 200 (4-line border)</option>
            <option value="STRETCH_200">Stretched Full 200 Lines</option>
            <option value="OVERSCAN">Overscan Mode</option>
          </select>
          <p className="text-[11px] text-zinc-500">
            Atari VCS displays 192 visible scanlines. Centering preserves authentic aspect ratio on 320x200 VGA displays.
          </p>
        </div>

        {/* Scanline Darkening (CRT Blanking in VRAM) */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3.5 flex flex-col space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-zinc-300">Hardware Scanline Darkening</span>
            <span className="text-amber-400 font-bold">{config.scanlineDarkening}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="70"
            step="5"
            value={config.scanlineDarkening}
            onChange={(e) => updateField('scanlineDarkening', parseInt(e.target.value, 10))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <p className="text-[11px] text-zinc-500">
            Dims alternating video memory scanlines in the generated executable for authentic CRT phosphor spacing.
          </p>
        </div>

        {/* VSync Retrace Wait Loop */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3.5 flex flex-col space-y-2.5">
          <span className="font-semibold text-zinc-300">VGA Retrace Synchronization</span>
          <label className="flex items-center space-x-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={config.vsyncSyncWait}
              onChange={(e) => updateField('vsyncSyncWait', e.target.checked)}
              className="accent-amber-500 rounded"
            />
            <span className="text-zinc-200">Poll Port 0x3DA bit 3 (VSync)</span>
          </label>
          <p className="text-[11px] text-zinc-500">
            Waits for electron beam vertical retrace start and end in x86 loop to prevent horizontal tearing on real CRT monitors.
          </p>
        </div>

        {/* Binary Format */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3.5 flex flex-col space-y-2.5">
          <span className="font-semibold text-zinc-300">Target Executable Architecture</span>
          <div className="flex space-x-2">
            <button
              onClick={() => updateField('targetFormat', 'EXE')}
              className={`flex-1 py-1.5 rounded text-center transition-colors font-semibold ${
                config.targetFormat === 'EXE'
                  ? 'bg-amber-500 text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              MZ .EXE (Relocatable)
            </button>
            <button
              onClick={() => updateField('targetFormat', 'COM')}
              className={`flex-1 py-1.5 rounded text-center transition-colors font-semibold ${
                config.targetFormat === 'COM'
                  ? 'bg-amber-500 text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Flat .COM (Tiny Model)
            </button>
          </div>
          <p className="text-[11px] text-zinc-500">
            MZ .EXE uses 64-byte header and multi-segment allocation. .COM generates flat 64KB image with origin at CS:0100.
          </p>
        </div>

        {/* Text Mode Restore on Exit */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3.5 flex flex-col space-y-2.5">
          <span className="font-semibold text-zinc-300">Clean DOS Exit Routine</span>
          <label className="flex items-center space-x-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={config.addDosExitPrompt}
              onChange={(e) => updateField('addDosExitPrompt', e.target.checked)}
              className="accent-amber-500 rounded"
            />
            <span className="text-zinc-200">INT 10h AH=00h AL=03h + INT 21h</span>
          </label>
          <p className="text-[11px] text-zinc-500">
            Restores 80x25 16-color alphanumeric text mode before terminating process to prevent leaving DOS in graphic mode.
          </p>
        </div>

        {/* Video RAM Clear */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3.5 flex flex-col space-y-2.5">
          <span className="font-semibold text-zinc-300">Video RAM Initialization</span>
          <label className="flex items-center space-x-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={config.clearVideoRamOnInit}
              onChange={(e) => updateField('clearVideoRamOnInit', e.target.checked)}
              className="accent-amber-500 rounded"
            />
            <span className="text-zinc-200">Zero 0xA000 segment on boot</span>
          </label>
          <p className="text-[11px] text-zinc-500">
            Clears old CGA/EGA artifacts in display RAM before writing Atari chunky pixel frame.
          </p>
        </div>
      </div>
    </div>
  );
};
