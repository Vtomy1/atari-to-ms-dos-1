import React, { useState } from 'react';
import { GeneratedBinary, DisassembledInstruction } from '../types/atari-dos';
import { FileCode, Copy, Check, Download, Code2, Terminal } from 'lucide-react';

interface AssemblyViewerProps {
  binary: GeneratedBinary;
  atariDisassembly: DisassembledInstruction[];
}

export const AssemblyViewer: React.FC<AssemblyViewerProps> = ({
  binary,
  atariDisassembly,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'x86' | '6502' | 'cHeader'>('x86');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAsm = () => {
    const blob = new Blob([binary.asmSource], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = binary.fileName.replace(/\.EXE$/i, '.ASM');
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadC = () => {
    const blob = new Blob([binary.cHeader], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = binary.fileName.replace(/\.EXE$/i, '.H');
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#12131a] border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col space-y-4 font-mono">
      {/* Subtab Bar & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('x86')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'x86'
                ? 'bg-amber-500 text-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>x86 DOS Mode 13h ASM</span>
          </button>
          <button
            onClick={() => setActiveSubTab('6502')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeSubTab === '6502'
                ? 'bg-amber-500 text-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Atari 6502 / TIA Source</span>
          </button>
          <button
            onClick={() => setActiveSubTab('cHeader')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'cHeader'
                ? 'bg-amber-500 text-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>C Header (.H)</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() =>
              handleCopy(
                activeSubTab === 'x86'
                  ? binary.asmSource
                  : activeSubTab === 'cHeader'
                  ? binary.cHeader
                  : atariDisassembly.map((i) => `$${i.address.toString(16).toUpperCase()}: ${i.mnemonic} ${i.operands}`).join('\n')
              )
            }
            className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>

          {activeSubTab === 'x86' && (
            <button
              onClick={handleDownloadAsm}
              className="px-2.5 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .ASM</span>
            </button>
          )}

          {activeSubTab === 'cHeader' && (
            <button
              onClick={handleDownloadC}
              className="px-2.5 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .H</span>
            </button>
          )}
        </div>
      </div>

      {/* x86 Assembly View */}
      {activeSubTab === 'x86' && (
        <div className="bg-[#090a0f] border border-zinc-900 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-[520px]">
          <pre className="text-zinc-300 leading-relaxed">
            {binary.asmSource.split('\n').map((line, idx) => {
              const isComment = line.trim().startsWith(';');
              const isLabel = line.trim().endsWith(':') || line.trim().startsWith('START:') || line.trim().startsWith('.MODEL');
              const isInt = line.includes('int     10h') || line.includes('int     21h') || line.includes('int     16h');
              const isPort = line.includes('03C8h') || line.includes('03C9h') || line.includes('03DAh');

              let lineClass = 'text-zinc-300';
              if (isComment) lineClass = 'text-zinc-600';
              else if (isLabel) lineClass = 'text-amber-400 font-bold';
              else if (isInt) lineClass = 'text-emerald-400 font-bold';
              else if (isPort) lineClass = 'text-cyan-400 font-bold';

              return (
                <div key={idx} className={`${lineClass} hover:bg-zinc-900/50 py-0.5`}>
                  <span className="text-zinc-700 select-none mr-4 inline-block w-8 text-right">
                    {idx + 1}
                  </span>
                  {line}
                </div>
              );
            })}
          </pre>
        </div>
      )}

      {/* 6502 Atari Disassembly View */}
      {activeSubTab === '6502' && (
        <div className="bg-[#090a0f] border border-zinc-900 rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-[520px]">
          <table className="w-full text-left">
            <thead className="text-zinc-500 border-b border-zinc-800 pb-1">
              <tr>
                <th className="p-1 w-20">Address</th>
                <th className="p-1 w-28">Raw Hex</th>
                <th className="p-1 w-20">Mnemonic</th>
                <th className="p-1 w-36">Operands</th>
                <th className="p-1">TIA Register / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {atariDisassembly.slice(0, 150).map((ins, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/60 py-0.5">
                  <td className="p-1 text-zinc-500 font-bold">
                    ${ins.address.toString(16).toUpperCase()}
                  </td>
                  <td className="p-1 text-zinc-600">
                    {ins.rawBytes.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}
                  </td>
                  <td className="p-1 text-amber-400 font-bold">{ins.mnemonic}</td>
                  <td className="p-1 text-zinc-300 font-semibold">{ins.operands}</td>
                  <td className="p-1">
                    {ins.isTiaRegister ? (
                      <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                        {ins.comment}
                      </span>
                    ) : (
                      <span className="text-zinc-500">{ins.comment || ''}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* C Header View */}
      {activeSubTab === 'cHeader' && (
        <div className="bg-[#090a0f] border border-zinc-900 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-[520px]">
          <pre className="text-zinc-300 leading-relaxed">
            {binary.cHeader.split('\n').map((line, idx) => (
              <div key={idx} className="hover:bg-zinc-900/50 py-0.5">
                <span className="text-zinc-700 select-none mr-4 inline-block w-8 text-right">
                  {idx + 1}
                </span>
                <span className={line.startsWith('#') ? 'text-amber-400 font-semibold' : 'text-zinc-300'}>
                  {line}
                </span>
              </div>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
};
