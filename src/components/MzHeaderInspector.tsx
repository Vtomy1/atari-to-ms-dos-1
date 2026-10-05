import React, { useState } from 'react';
import { MzHeader, GeneratedBinary } from '../types/atari-dos';
import { Info, Layers, CheckCircle2, Cpu, HardDrive } from 'lucide-react';

interface MzHeaderInspectorProps {
  binary: GeneratedBinary;
}

interface HeaderField {
  offset: string;
  name: string;
  type: string;
  valueHex: string;
  valueDec: number;
  description: string;
  loaderAction: string;
}

export const MzHeaderInspector: React.FC<MzHeaderInspectorProps> = ({ binary }) => {
  const { mzHeader } = binary;
  const [selectedField, setSelectedField] = useState<HeaderField | null>(null);

  const fields: HeaderField[] = [
    {
      offset: '0x0000',
      name: 'e_magic',
      type: 'WORD (16-bit)',
      valueHex: `0x${mzHeader.magic.toString(16).toUpperCase()}`,
      valueDec: mzHeader.magic,
      description: 'Signature ASCII "MZ" (0x5A4D, Mark Zbikowski initials). Identifies valid MS-DOS Executable.',
      loaderAction: 'MS-DOS kernel verifies this signature first. If missing, DOS aborts with "Program too big to fit in memory" or executes as flat .COM.',
    },
    {
      offset: '0x0002',
      name: 'e_cblp',
      type: 'WORD (16-bit)',
      valueHex: `0x${mzHeader.cblp.toString(16).padStart(4, '0').toUpperCase()}`,
      valueDec: mzHeader.cblp,
      description: 'Number of bytes in the last 512-byte page of the executable file.',
      loaderAction: 'Used together with e_cp to calculate exact binary file length in bytes.',
    },
    {
      offset: '0x0004',
      name: 'e_cp',
      type: 'WORD (16-bit)',
      valueHex: `0x${mzHeader.cp.toString(16).padStart(4, '0').toUpperCase()}`,
      valueDec: mzHeader.cp,
      description: 'Total number of 512-byte disk pages occupied by the executable file.',
      loaderAction: 'DOS allocates memory blocks according to total page size.',
    },
    {
      offset: '0x0006',
      name: 'e_crlc',
      type: 'WORD (16-bit)',
      valueHex: `0x${mzHeader.crlc.toString(16).padStart(4, '0').toUpperCase()}`,
      valueDec: mzHeader.crlc,
      description: 'Count of relocation table pointer items.',
      loaderAction: 'Loader iterates through relocation entries at e_lfarlc and patches segment addresses to runtime segment base.',
    },
    {
      offset: '0x0008',
      name: 'e_cparhdr',
      type: 'WORD (16-bit)',
      valueHex: `0x${mzHeader.cparhdr.toString(16).padStart(4, '0').toUpperCase()}`,
      valueDec: mzHeader.cparhdr,
      description: 'Size of the header in 16-byte paragraphs (4 paragraphs = 64 bytes).',
      loaderAction: 'DOS skips (e_cparhdr * 16) bytes in file to find the start of the loadable program image (CS:0000).',
    },
    {
      offset: '0x000A',
      name: 'e_minalloc',
      type: 'WORD (16-bit)',
      valueHex: `0x${mzHeader.minalloc.toString(16).padStart(4, '0').toUpperCase()}`,
      valueDec: mzHeader.minalloc,
      description: 'Minimum extra paragraphs needed by program above code image (e.g. 0x1000 = 64KB for Mode 13h buffer).',
      loaderAction: 'DOS fails execution with Insufficient Memory error if less free heap paragraphs are available.',
    },
    {
      offset: '0x000C',
      name: 'e_maxalloc',
      type: 'WORD (16-bit)',
      valueHex: `0x${mzHeader.maxalloc.toString(16).padStart(4, '0').toUpperCase()}`,
      valueDec: mzHeader.maxalloc,
      description: 'Maximum extra paragraphs desired (0xFFFF requests all remaining conventional DOS memory).',
      loaderAction: 'DOS assigns all free conventional memory up to this limit to the program heap.',
    },
    {
      offset: '0x000E',
      name: 'e_ss',
      type: 'WORD (16-bit)',
      valueHex: `0x${mzHeader.ss.toString(16).padStart(4, '0').toUpperCase()}`,
      valueDec: mzHeader.ss,
      description: 'Initial Stack Segment (SS) relative to start of load module.',
      loaderAction: 'DOS computes SS = StartSegment + e_ss upon loading before jumping to code.',
    },
    {
      offset: '0x0010',
      name: 'e_sp',
      type: 'WORD (16-bit)',
      valueHex: `0x${mzHeader.sp.toString(16).padStart(4, '0').toUpperCase()}`,
      valueDec: mzHeader.sp,
      description: 'Initial Stack Pointer (SP) value.',
      loaderAction: 'DOS sets x86 CPU SP register to this value (e.g. 0x0800 for 2KB stack).',
    },
    {
      offset: '0x0012',
      name: 'e_csum',
      type: 'WORD (16-bit)',
      valueHex: `0x${mzHeader.csum.toString(16).padStart(4, '0').toUpperCase()}`,
      valueDec: mzHeader.csum,
      description: 'Complemented checksum of the executable (usually ignored by DOS loaders).',
      loaderAction: 'Unused by standard MS-DOS versions 2.0 through 6.22; preserved for historical integrity.',
    },
    {
      offset: '0x0014',
      name: 'e_ip',
      type: 'WORD (16-bit)',
      valueHex: `0x${mzHeader.ip.toString(16).padStart(4, '0').toUpperCase()}`,
      valueDec: mzHeader.ip,
      description: 'Initial Instruction Pointer (IP) - Program entry point offset.',
      loaderAction: 'DOS sets x86 CPU IP register to this offset (typically 0x0000 for START label).',
    },
    {
      offset: '0x0016',
      name: 'e_cs',
      type: 'WORD (16-bit)',
      valueHex: `0x${mzHeader.cs.toString(16).padStart(4, '0').toUpperCase()}`,
      valueDec: mzHeader.cs,
      description: 'Initial Code Segment (CS) relative to start of load module.',
      loaderAction: 'DOS computes CS = StartSegment + e_cs and executes JMP FAR CS:IP to launch the binary.',
    },
    {
      offset: '0x0018',
      name: 'e_lfarlc',
      type: 'WORD (16-bit)',
      valueHex: `0x${mzHeader.lfarlc.toString(16).padStart(4, '0').toUpperCase()}`,
      valueDec: mzHeader.lfarlc,
      description: 'Byte offset from start of file to the relocation pointer table.',
      loaderAction: 'Points directly to offset 0x0040 (immediately following standard 64-byte MZ header).',
    },
    {
      offset: '0x001A',
      name: 'e_ovno',
      type: 'WORD (16-bit)',
      valueHex: `0x${mzHeader.ovno.toString(16).padStart(4, '0').toUpperCase()}`,
      valueDec: mzHeader.ovno,
      description: 'Overlay number (0 = root executable module).',
      loaderAction: 'Used by DOS overlay managers (e.g., Borland Turbo C overlays) to identify secondary stages.',
    },
  ];

  return (
    <div className="bg-[#12131a] border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded bg-blue-500/10 text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">MS-DOS MZ EXECUTABLE HEADER INSPECTOR</h3>
            <p className="text-xs text-zinc-400">Standard 64-byte DOS Relocatable Executable structure (IMAGE_DOS_HEADER)</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
          <span>Header: <strong className="text-emerald-400">64 bytes</strong></span>
          <span>•</span>
          <span>Load Module: <strong className="text-amber-400">{binary.totalSize - 64} bytes</strong></span>
        </div>
      </div>

      {/* Visual Memory Map Diagram */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3.5 flex flex-col space-y-2">
        <h4 className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
          MS-DOS Real-Mode Memory Layout at Launch
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
          <div className="p-2 rounded bg-zinc-800/80 border border-zinc-700/80 flex flex-col">
            <span className="text-[10px] text-zinc-400">0x0000:0000</span>
            <span className="font-bold text-zinc-200 mt-1">DOS PSP</span>
            <span className="text-[10px] text-zinc-500">256 bytes prefix</span>
          </div>
          <div className="p-2 rounded bg-blue-950/80 border border-blue-800/80 flex flex-col">
            <span className="text-[10px] text-blue-300">CS:0000</span>
            <span className="font-bold text-blue-200 mt-1">x86 Code</span>
            <span className="text-[10px] text-blue-400/80">{binary.codeSize} bytes</span>
          </div>
          <div className="p-2 rounded bg-amber-950/80 border border-amber-800/80 flex flex-col">
            <span className="text-[10px] text-amber-300">DS:0000</span>
            <span className="font-bold text-amber-200 mt-1">DAC & Video Data</span>
            <span className="text-[10px] text-amber-400/80">64,768 bytes</span>
          </div>
          <div className="p-2 rounded bg-emerald-950/80 border border-emerald-800/80 flex flex-col">
            <span className="text-[10px] text-emerald-300">0xA000:0000</span>
            <span className="font-bold text-emerald-200 mt-1">VGA Mode 13h</span>
            <span className="text-[10px] text-emerald-400/80">320x200 VRAM</span>
          </div>
          <div className="p-2 rounded bg-purple-950/80 border border-purple-800/80 flex flex-col">
            <span className="text-[10px] text-purple-300">SS:SP</span>
            <span className="font-bold text-purple-200 mt-1">Stack Segment</span>
            <span className="text-[10px] text-purple-400/80">2,048 bytes</span>
          </div>
        </div>
      </div>

      {/* Header Fields Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="p-2.5">Offset</th>
              <th className="p-2.5">Field Name</th>
              <th className="p-2.5">Type</th>
              <th className="p-2.5">Hex Value</th>
              <th className="p-2.5">Decimal</th>
              <th className="p-2.5">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 bg-[#0e1017]">
            {fields.map((f) => (
              <tr
                key={f.name}
                onClick={() => setSelectedField(f)}
                className={`cursor-pointer transition-colors ${
                  selectedField?.name === f.name ? 'bg-amber-500/10 text-white' : 'hover:bg-zinc-800/40 text-zinc-300'
                }`}
              >
                <td className="p-2.5 text-zinc-500">{f.offset}</td>
                <td className="p-2.5 font-bold text-amber-400">{f.name}</td>
                <td className="p-2.5 text-zinc-400">{f.type}</td>
                <td className="p-2.5 font-bold text-emerald-400">{f.valueHex}</td>
                <td className="p-2.5 text-zinc-300">{f.valueDec}</td>
                <td className="p-2.5 text-zinc-400 truncate max-w-xs">{f.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Field Inspector Card */}
      {selectedField ? (
        <div className="bg-zinc-900 border border-amber-500/40 rounded-lg p-4 font-mono text-xs flex flex-col space-y-2">
          <div className="flex items-center justify-between text-amber-400">
            <span className="font-bold text-sm">{selectedField.name} ({selectedField.offset})</span>
            <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">{selectedField.type}</span>
          </div>
          <p className="text-zinc-300 leading-relaxed">{selectedField.description}</p>
          <div className="mt-2 pt-2 border-t border-zinc-800 flex flex-col space-y-1">
            <span className="text-emerald-400 font-semibold">MS-DOS Kernel Loader Behavior:</span>
            <span className="text-zinc-400">{selectedField.loaderAction}</span>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 text-center text-xs text-zinc-400 font-mono">
          Click any MZ header row above to inspect byte mechanics and DOS loader routines.
        </div>
      )}
    </div>
  );
};
