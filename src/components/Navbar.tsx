import React from 'react';
import { Terminal, Download, HelpCircle, Volume2, VolumeX, Cpu, Layers } from 'lucide-react';
import { GeneratedBinary } from '../types/atari-dos';

interface NavbarProps {
  binary: GeneratedBinary;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  onOpenDosBoxGuide: () => void;
  activeTab: 'emulator' | 'mzHeader' | 'hex' | 'asm' | 'palette';
  onSelectTab: (tab: 'emulator' | 'mzHeader' | 'hex' | 'asm' | 'palette') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  binary,
  isAudioMuted,
  onToggleAudio,
  onOpenDosBoxGuide,
  activeTab,
  onSelectTab,
}) => {
  const downloadFile = (data: Uint8Array, filename: string, mime = 'application/octet-stream') => {
    const blob = new Blob([data as unknown as BlobPart], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadExe = () => {
    downloadFile(binary.exeBytes, binary.fileName);
  };

  const handleDownloadCom = () => {
    const comName = binary.fileName.replace(/\.EXE$/i, '.COM');
    downloadFile(binary.comBytes, comName);
  };

  return (
    <header className="border-b border-zinc-800 bg-[#0e1017]/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Mode info */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-tight text-white flex items-center gap-1.5 font-mono-code text-sm">
                ATARI <span className="text-amber-400">→</span> MS-DOS 13h
              </span>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/80 text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold uppercase">
                MZ EXE
              </span>
              <span className="bg-amber-950 text-amber-300 border border-amber-800/80 text-[10px] font-mono px-1.5 py-0.5 rounded hidden sm:inline-block">
                320x200 @ 70Hz
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
              Linear Framebuffer <span className="text-zinc-200">0xA000:0000</span> • 256 Color DAC
            </p>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="flex items-center space-x-1 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800 text-xs font-mono">
          <button
            onClick={() => onSelectTab('emulator')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'emulator'
                ? 'bg-amber-500 text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>VGA Monitor</span>
          </button>
          <button
            onClick={() => onSelectTab('mzHeader')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'mzHeader'
                ? 'bg-amber-500 text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>MZ Header</span>
          </button>
          <button
            onClick={() => onSelectTab('hex')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'hex'
                ? 'bg-amber-500 text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
            }`}
          >
            <span>Hex View</span>
          </button>
          <button
            onClick={() => onSelectTab('asm')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'asm'
                ? 'bg-amber-500 text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
            }`}
          >
            <span>Assembly (x86/6502)</span>
          </button>
          <button
            onClick={() => onSelectTab('palette')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'palette'
                ? 'bg-amber-500 text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
            }`}
          >
            <span>VGA Palette</span>
          </button>
        </nav>

        {/* Action Controls & Downloads */}
        <div className="flex items-center space-x-2">
          {/* Audio toggle */}
          <button
            onClick={onToggleAudio}
            title={isAudioMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-1.5 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-amber-400 hover:border-amber-500/50 transition-colors"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* DOSBox guide button */}
          <button
            onClick={onOpenDosBoxGuide}
            className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-amber-400 hover:border-amber-500/50 text-xs font-mono flex items-center gap-1.5 transition-colors"
            title="How to run in DOSBox / FreeDOS"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">DOSBox Run Guide</span>
          </button>

          {/* Download EXE */}
          <button
            onClick={handleDownloadExe}
            className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95"
            title="Download MS-DOS MZ Executable (.EXE)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{binary.fileName}</span>
          </button>

          {/* Download COM */}
          <button
            onClick={handleDownloadCom}
            className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-mono text-xs flex items-center gap-1 transition-all active:scale-95 hidden md:flex"
            title="Download MS-DOS Flat Binary (.COM)"
          >
            <span>.COM</span>
          </button>
        </div>
      </div>
    </header>
  );
};
