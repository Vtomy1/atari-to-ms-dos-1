import React, { useState, useMemo } from 'react';
import { GeneratedBinary } from '../types/atari-dos';
import { Search, ChevronLeft, ChevronRight, Binary, FileDown } from 'lucide-react';

interface HexViewerProps {
  binary: GeneratedBinary;
}

export const HexViewer: React.FC<HexViewerProps> = ({ binary }) => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [searchHex, setSearchHex] = useState<string>('');
  const bytesPerPage = 512; // 32 lines of 16 bytes

  const totalBytes = binary.exeBytes.length;
  const totalPages = Math.ceil(totalBytes / bytesPerPage);

  const codeStart = 64;
  const paletteStart = codeStart + binary.codeSize;
  const frameStart = paletteStart + 768;

  // Jump targets
  const jumpTo = (offset: number) => {
    setCurrentPage(Math.floor(offset / bytesPerPage));
  };

  const currentSlice = useMemo(() => {
    const start = currentPage * bytesPerPage;
    const end = Math.min(totalBytes, start + bytesPerPage);
    return binary.exeBytes.slice(start, end);
  }, [binary.exeBytes, currentPage, totalBytes]);

  const rows = useMemo(() => {
    const r: { offset: number; bytes: number[]; ascii: string }[] = [];
    const baseOffset = currentPage * bytesPerPage;

    for (let i = 0; i < currentSlice.length; i += 16) {
      const rowBytes: number[] = [];
      let ascii = '';
      for (let j = 0; j < 16; j++) {
        if (i + j < currentSlice.length) {
          const b = currentSlice[i + j];
          rowBytes.push(b);
          ascii += b >= 32 && b <= 126 ? String.fromCharCode(b) : '.';
        }
      }
      r.push({
        offset: baseOffset + i,
        bytes: rowBytes,
        ascii,
      });
    }
    return r;
  }, [currentSlice, currentPage]);

  const getByteColor = (offset: number) => {
    if (offset < 64) return 'text-blue-400 bg-blue-500/10'; // MZ Header
    if (offset < paletteStart) return 'text-amber-400 bg-amber-500/10'; // x86 Code
    if (offset < frameStart) return 'text-cyan-400 bg-cyan-500/10'; // VGA Palette
    return 'text-emerald-400/90'; // 320x200 Frame buffer
  };

  return (
    <div className="bg-[#12131a] border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col space-y-4 font-mono">
      {/* Header and Quick Jump Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400">
            <Binary className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">BINARY HEXADECIMAL INSPECTOR</h3>
            <p className="text-xs text-zinc-400 font-mono">Byte-level view of compiled MS-DOS .EXE structure</p>
          </div>
        </div>

        {/* Legend & Jumps */}
        <div className="flex items-center space-x-1.5 text-xs">
          <button
            onClick={() => jumpTo(0)}
            className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
          >
            MZ Header (00h)
          </button>
          <button
            onClick={() => jumpTo(codeStart)}
            className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
          >
            x86 Code ({codeStart.toString(16).toUpperCase()}h)
          </button>
          <button
            onClick={() => jumpTo(paletteStart)}
            className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
          >
            VGA DAC ({paletteStart.toString(16).toUpperCase()}h)
          </button>
          <button
            onClick={() => jumpTo(frameStart)}
            className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
          >
            320x200 Frame ({frameStart.toString(16).toUpperCase()}h)
          </button>
        </div>
      </div>

      {/* Hex Grid Table */}
      <div className="overflow-x-auto bg-[#0a0b0f] border border-zinc-900 rounded-lg p-3 text-xs leading-relaxed select-text">
        {/* Column Index Header */}
        <div className="flex text-zinc-500 font-bold border-b border-zinc-800 pb-1 mb-1">
          <div className="w-24 text-zinc-600">OFFSET</div>
          <div className="flex-1 grid grid-cols-16 gap-1 text-center">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="text-zinc-600">
                {i.toString(16).toUpperCase().padStart(2, '0')}
              </span>
            ))}
          </div>
          <div className="w-36 text-center text-zinc-600">ASCII DECODE</div>
        </div>

        {/* Rows */}
        {rows.map((row) => (
          <div key={row.offset} className="flex hover:bg-zinc-900/60 py-0.5 items-center">
            {/* Offset column */}
            <div className="w-24 text-zinc-500">
              0x{row.offset.toString(16).padStart(6, '0').toUpperCase()}
            </div>

            {/* 16 Hex bytes */}
            <div className="flex-1 grid grid-cols-16 gap-1 text-center">
              {row.bytes.map((b, idx) => {
                const absoluteOffset = row.offset + idx;
                const colorClass = getByteColor(absoluteOffset);
                return (
                  <span
                    key={idx}
                    className={`rounded px-0.5 ${colorClass}`}
                    title={`Offset: 0x${absoluteOffset.toString(16).toUpperCase()} (${absoluteOffset})\nValue: 0x${b.toString(16).padStart(2, '0').toUpperCase()} (${b})`}
                  >
                    {b.toString(16).padStart(2, '0').toUpperCase()}
                  </span>
                );
              })}
              {/* Fill remaining empty spaces if row < 16 */}
              {Array.from({ length: 16 - row.bytes.length }).map((_, idx) => (
                <span key={idx} className="text-zinc-800">
                  ..
                </span>
              ))}
            </div>

            {/* ASCII Column */}
            <div className="w-36 text-center tracking-widest text-zinc-400 font-mono">
              {row.ascii}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800/80 pt-3">
        <div>
          Page <strong className="text-white">{currentPage + 1}</strong> of <strong className="text-white">{totalPages}</strong> (
          {totalBytes.toLocaleString()} total bytes)
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none text-zinc-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-zinc-300">
            0x{(currentPage * bytesPerPage).toString(16).toUpperCase()} - 0x{Math.min(totalBytes - 1, (currentPage + 1) * bytesPerPage - 1).toString(16).toUpperCase()}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none text-zinc-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
