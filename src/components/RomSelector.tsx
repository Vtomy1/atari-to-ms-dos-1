import React, { useRef, useState } from 'react';
import { Upload, Gamepad2, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { ROM_PRESETS, RomPreset } from '../utils/romPresets';
import { RomMetadata } from '../types/atari-dos';

interface RomSelectorProps {
  currentPresetId: string;
  onSelectPreset: (preset: RomPreset) => void;
  onUploadCustomRom: (bytes: Uint8Array, fileName: string) => void;
  romMetadata: RomMetadata | null;
}

export const RomSelector: React.FC<RomSelectorProps> = ({
  currentPresetId,
  onSelectPreset,
  onUploadCustomRom,
  romMetadata,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'upload'>('presets');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadFile(file);
    }
  };

  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        const bytes = new Uint8Array(reader.result);
        onUploadCustomRom(bytes, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      loadFile(file);
    }
  };

  return (
    <div className="bg-[#12131a] border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col space-y-4">
      {/* Header and Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded bg-amber-500/10 text-amber-400">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">ROM SOURCE & METADATA</h3>
            <p className="text-xs text-zinc-400">Select classic cartridge preset or upload your Atari binary</p>
          </div>
        </div>

        <div className="flex items-center bg-zinc-900 border border-zinc-700/80 rounded-lg p-0.5 text-xs font-mono">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'presets' ? 'bg-amber-500 text-black font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Classic Library
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'upload' ? 'bg-amber-500 text-black font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Upload Custom (.BIN/.A26)
          </button>
        </div>
      </div>

      {/* Preset Cartridge Grid */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {ROM_PRESETS.map((preset) => {
            const isSelected = currentPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-white truncate">{preset.name}</span>
                    <span className="text-[10px] font-mono bg-zinc-800 text-amber-300 px-1.5 py-0.5 rounded">
                      {preset.year}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>{preset.category}</span>
                  <span className="text-zinc-400">{preset.sizeBytes / 1024} KB</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Custom Upload Dropzone */}
      {activeTab === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragging
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-zinc-700/80 hover:border-zinc-500 bg-zinc-900/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".bin,.a26,.rom,.xex,.a78"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-zinc-200 mb-1">Drop Atari ROM file here or click to browse</p>
          <p className="text-xs text-zinc-400 font-mono">Supports .BIN, .A26, .ROM (2KB, 4KB, 8KB F8, 16KB F6)</p>
        </div>
      )}

      {/* Active ROM Metadata Badge */}
      {romMetadata && (
        <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-300 font-bold">{romMetadata.name}</span>
            <span className="text-zinc-500">({romMetadata.format})</span>
          </div>
          <div className="flex items-center space-x-4 text-zinc-400">
            <span>Size: <strong className="text-zinc-200">{romMetadata.size} bytes</strong></span>
            <span>CRC: <strong className="text-amber-400">0x{romMetadata.checksum.toString(16).toUpperCase()}</strong></span>
            <span>Clock: <strong className="text-zinc-200">1.19 MHz</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
