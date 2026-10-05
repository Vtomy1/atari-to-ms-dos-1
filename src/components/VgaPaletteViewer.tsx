import React, { useState } from 'react';
import { VgaColor, PaletteStandard } from '../types/atari-dos';
import { Palette, Download, Eye, Sparkles } from 'lucide-react';
import { getVgaDacBinaryBytes } from '../utils/atariPalettes';

interface VgaPaletteViewerProps {
  palette: VgaColor[];
  paletteStandard: PaletteStandard;
  onChangeStandard: (std: PaletteStandard) => void;
}

export const VgaPaletteViewer: React.FC<VgaPaletteViewerProps> = ({
  palette,
  paletteStandard,
  onChangeStandard,
}) => {
  const [selectedColor, setSelectedColor] = useState<VgaColor>(palette[0]);

  const handleDownloadPal = () => {
    const rawBytes = getVgaDacBinaryBytes(palette);
    const blob = new Blob([rawBytes as unknown as BlobPart], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VGA_DAC_${paletteStandard}.PAL`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#12131a] border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col space-y-5 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">VGA DAC 256-COLOR PALETTE MATRIX</h3>
            <p className="text-xs text-zinc-400">Mapped Atari TIA color space to 18-bit VGA DAC registers (Port 0x3C8/0x3C9)</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Palette Preset Selector */}
          <div className="flex items-center bg-zinc-900 border border-zinc-700/80 rounded-lg p-0.5 text-xs">
            {(['NTSC', 'PAL', 'SECAM', 'AMBER_P3', 'GREEN_P1'] as PaletteStandard[]).map((std) => (
              <button
                key={std}
                onClick={() => onChangeStandard(std)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  paletteStandard === std ? 'bg-amber-500 text-black font-semibold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {std}
              </button>
            ))}
          </div>

          <button
            onClick={handleDownloadPal}
            className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors border border-zinc-700"
            title="Download 768-byte VGA DAC raw palette binary"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.PAL (768 B)</span>
          </button>
        </div>
      </div>

      {/* Main Grid & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 16x16 Palette Grid */}
        <div className="lg:col-span-2 bg-[#090a0f] border border-zinc-900 rounded-lg p-3">
          <div className="grid grid-cols-16 gap-1 w-full aspect-square max-h-[380px]">
            {palette.map((c) => {
              const isSelected = selectedColor?.index === c.index;
              return (
                <button
                  key={c.index}
                  onClick={() => setSelectedColor(c)}
                  onMouseEnter={() => setSelectedColor(c)}
                  style={{ backgroundColor: `rgb(${c.r8}, ${c.g8}, ${c.b8})` }}
                  className={`w-full h-full rounded-sm transition-transform active:scale-95 ${
                    isSelected ? 'ring-2 ring-white scale-110 z-10 shadow-lg' : 'hover:scale-105'
                  }`}
                  title={`Color Index: ${c.index} (0x${c.index.toString(16).toUpperCase()})`}
                />
              );
            })}
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 flex justify-between">
            <span>Index 0 (00h)</span>
            <span>Hover or click swatches to inspect 6-bit DAC values</span>
            <span>Index 255 (FFh)</span>
          </div>
        </div>

        {/* Selected Color Inspector Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
              <span className="text-xs text-zinc-400 font-bold">DAC REGISTER DETAIL</span>
              <span className="text-xs text-amber-400 font-bold">INDEX #{selectedColor.index}</span>
            </div>

            {/* Color Swatch Preview */}
            <div
              className="w-full h-16 rounded-md border-2 border-zinc-700 shadow-inner flex items-center justify-center mb-4"
              style={{
                backgroundColor: `rgb(${selectedColor.r8}, ${selectedColor.g8}, ${selectedColor.b8})`,
              }}
            >
              <span
                className="text-xs font-bold px-2 py-1 rounded bg-black/60 backdrop-blur-sm"
                style={{
                  color: selectedColor.r8 * 0.3 + selectedColor.g8 * 0.6 + selectedColor.b8 * 0.1 > 128 ? '#000' : '#fff',
                }}
              >
                #{selectedColor.r8.toString(16).padStart(2, '0')}{selectedColor.g8.toString(16).padStart(2, '0')}{selectedColor.b8.toString(16).padStart(2, '0')}
              </span>
            </div>

            {/* Metrics */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-500">Hex Byte:</span>
                <span className="text-emerald-400 font-bold">0x{selectedColor.index.toString(16).padStart(2, '0').toUpperCase()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-500">Atari TIA Mapping:</span>
                <span className="text-amber-400 font-bold">{selectedColor.atariHueLum}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-500">VGA 6-bit DAC (0-63):</span>
                <span className="text-cyan-400 font-bold">R:{selectedColor.r6} G:{selectedColor.g6} B:{selectedColor.b6}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-500">24-bit RGB (0-255):</span>
                <span className="text-zinc-200">R:{selectedColor.r8} G:{selectedColor.g8} B:{selectedColor.b8}</span>
              </div>
            </div>
          </div>

          {/* x86 Assembly snippet for this color */}
          <div className="bg-[#090a0f] p-2.5 rounded border border-zinc-800 text-[11px] text-zinc-400">
            <div className="text-zinc-500 text-[10px] mb-1">x86 DAC Port Output:</div>
            <div className="text-amber-400 font-mono">mov dx, 03C8h</div>
            <div className="text-amber-400 font-mono">mov al, {selectedColor.index}</div>
            <div className="text-amber-400 font-mono">out dx, al</div>
            <div className="text-cyan-400 font-mono">inc dx ; port 03C9h</div>
            <div className="text-emerald-400 font-mono">; out dx: {selectedColor.r6}, {selectedColor.g6}, {selectedColor.b6}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
