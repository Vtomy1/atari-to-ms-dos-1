import React, { useState } from 'react';
import { X, Copy, Check, Terminal, ExternalLink, HardDrive } from 'lucide-react';

interface DosBoxGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
}

export const DosBoxGuideModal: React.FC<DosBoxGuideModalProps> = ({
  isOpen,
  onClose,
  fileName,
}) => {
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedConf, setCopiedConf] = useState<boolean>(false);

  if (!isOpen) return null;

  const runScript = `REM ==============================================
REM Run Converted Atari MS-DOS Mode 13h Executable
REM ==============================================
mount c .
c:
${fileName}
`;

  const dosboxConf = `[sdl]
fullscreen=false
autolock=false

[dosbox]
machine=vga
captures=capture
memsize=16

[cpu]
core=normal
cputype=386
cycles=3000
cycleup=500
cycledown=500

[render]
aspect=true
scaler=normal2x

[autoexec]
mount c .
c:
${fileName}
`;

  const copyToClipboard = (text: string, isConf: boolean) => {
    navigator.clipboard.writeText(text);
    if (isConf) {
      setCopiedConf(true);
      setTimeout(() => setCopiedConf(false), 2000);
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-[#141620] border-2 border-amber-500/40 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-zinc-900 px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-amber-400">
            <Terminal className="w-5 h-5" />
            <h3 className="font-bold text-sm text-white">HOW TO RUN IN DOSBOX & FREEDOS</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-zinc-300">
          <div>
            <h4 className="font-bold text-amber-400 text-sm mb-1.5">1. Quick Run in DOSBox / DOSBox-X</h4>
            <p className="text-zinc-400 mb-2">
              Place the downloaded <span className="text-emerald-400 font-bold">{fileName}</span> in your DOS directory, start DOSBox, and run:
            </p>
            <div className="relative bg-[#090a0f] border border-zinc-800 rounded p-3 text-zinc-200">
              <pre className="font-mono text-emerald-400">{runScript}</pre>
              <button
                onClick={() => copyToClipboard(runScript, false)}
                className="absolute top-2 right-2 p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1 text-[11px]"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-amber-400 text-sm mb-1.5">2. Recommended dosbox.conf settings</h4>
            <p className="text-zinc-400 mb-2">
              Configured for 70Hz VGA Mode 13h (320x200 256 colors) with 386 3,000 cycles:
            </p>
            <div className="relative bg-[#090a0f] border border-zinc-800 rounded p-3 text-zinc-200 max-h-40 overflow-y-auto">
              <pre className="font-mono text-xs">{dosboxConf}</pre>
              <button
                onClick={() => copyToClipboard(dosboxConf, true)}
                className="absolute top-2 right-2 p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1 text-[11px]"
              >
                {copiedConf ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedConf ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-amber-400 text-sm mb-1.5">3. Real Hardware Compatibility</h4>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 leading-relaxed">
              <li>Works on any IBM PC compatible with 8086/8088/286/386/486/Pentium and VGA card.</li>
              <li>Executable sets standard BIOS video mode 0x13 via Interrupt 0x10.</li>
              <li>Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-bold border border-zinc-700">ESC</kbd> inside the DOS program to cleanly restore text mode 03h and return to the DOS prompt.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-zinc-900/90 px-5 py-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
