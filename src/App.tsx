/**
 * Atari ROM to MS-DOS Mode 13h VGA EXE Converter Application
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ROM_PRESETS, RomPreset } from './utils/romPresets';
import { generateVgaPalette } from './utils/atariPalettes';
import { inspectAtariRom, disassemble6502 } from './utils/atariRomParser';
import { generateMsDosExe } from './utils/mzExeGenerator';
import { AtariDosEmulator } from './utils/atariDosEmulator';
import { retroAudio } from './utils/atariAudio';
import { ConversionConfig, GeneratedBinary, PaletteStandard, RomMetadata } from './types/atari-dos';

import { Navbar } from './components/Navbar';
import { CrtDisplay } from './components/CrtDisplay';
import { RomSelector } from './components/RomSelector';
import { MzHeaderInspector } from './components/MzHeaderInspector';
import { HexViewer } from './components/HexViewer';
import { AssemblyViewer } from './components/AssemblyViewer';
import { VgaPaletteViewer } from './components/VgaPaletteViewer';
import { ConverterControls } from './components/ConverterControls';
import { DosBoxGuideModal } from './components/DosBoxGuideModal';

export default function App() {
  const [currentPreset, setCurrentPreset] = useState<RomPreset>(ROM_PRESETS[0]);
  const [romBytes, setRomBytes] = useState<Uint8Array>(() => ROM_PRESETS[0].generateRom());
  const [romFileName, setRomFileName] = useState<string>('COMBAT.BIN');
  const [activeTab, setActiveTab] = useState<'emulator' | 'mzHeader' | 'hex' | 'asm' | 'palette'>('emulator');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isDosBoxModalOpen, setIsDosBoxModalOpen] = useState<boolean>(false);

  // Conversion options
  const [config, setConfig] = useState<ConversionConfig>({
    targetFormat: 'EXE',
    paletteStandard: 'NTSC',
    scanlineDarkening: 0,
    aspectRatioMode: 'CENTERED_192_IN_200',
    vsyncSyncWait: true,
    enableSoundStub: true,
    clearVideoRamOnInit: true,
    addDosExitPrompt: true,
    embedDisassemblyComments: true,
  });

  // Generate VGA DAC 256-color palette
  const palette = useMemo(() => {
    return generateVgaPalette(config.paletteStandard);
  }, [config.paletteStandard]);

  // Inspect ROM metadata
  const romMetadata: RomMetadata = useMemo(() => {
    return inspectAtariRom(romBytes, romFileName);
  }, [romBytes, romFileName]);

  // Disassemble 6502 instructions
  const atariDisassembly = useMemo(() => {
    return disassemble6502(romBytes);
  }, [romBytes]);

  // Generate MS-DOS MZ Executable (.EXE) binary
  const binary: GeneratedBinary = useMemo(() => {
    return generateMsDosExe(romBytes, palette, config, romFileName, currentPreset?.id);
  }, [romBytes, palette, config, romFileName, currentPreset]);

  // Initialize Atari + DOS virtual machine
  const [emulator, setEmulator] = useState<AtariDosEmulator | null>(null);

  useEffect(() => {
    const emu = new AtariDosEmulator(
      binary.rawVgaFrame,
      palette,
      config,
      currentPreset?.id
    );
    setEmulator(emu);
  }, [binary.rawVgaFrame, palette, config, currentPreset]);

  // Preset switch
  const handleSelectPreset = useCallback((preset: RomPreset) => {
    setCurrentPreset(preset);
    const bytes = preset.generateRom();
    setRomBytes(bytes);
    setRomFileName(`${preset.id.toUpperCase()}.BIN`);
  }, []);

  // Custom ROM upload
  const handleUploadCustomRom = useCallback((bytes: Uint8Array, fileName: string) => {
    setCurrentPreset({
      id: 'custom',
      name: fileName,
      year: 'Custom',
      category: 'User Upload',
      description: 'Custom cartridge uploaded by user.',
      sizeBytes: bytes.length,
      generateRom: () => bytes,
    });
    setRomBytes(bytes);
    setRomFileName(fileName);
  }, []);

  // Toggle audio
  const handleToggleAudio = useCallback(() => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    retroAudio.setMuted(nextMuted);
  }, [isAudioMuted]);

  // Change palette
  const handleChangePaletteStandard = useCallback((std: PaletteStandard) => {
    setConfig((prev) => ({ ...prev, paletteStandard: std }));
  }, []);

  return (
    <div className="min-h-screen bg-[#0c0d12] text-zinc-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        binary={binary}
        isAudioMuted={isAudioMuted}
        onToggleAudio={handleToggleAudio}
        onOpenDosBoxGuide={() => setIsDosBoxModalOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col space-y-6">
        {/* ROM Source Selector */}
        <RomSelector
          currentPresetId={currentPreset?.id || 'custom'}
          onSelectPreset={handleSelectPreset}
          onUploadCustomRom={handleUploadCustomRom}
          romMetadata={romMetadata}
        />

        {/* Tab View Container */}
        <div className="w-full">
          {activeTab === 'emulator' && (
            <div className="space-y-6">
              <CrtDisplay
                emulator={emulator}
                romName={romMetadata.name}
                isAudioMuted={isAudioMuted}
                onToggleAudio={handleToggleAudio}
                paletteStandard={config.paletteStandard}
                onChangePaletteStandard={handleChangePaletteStandard}
              />
              <ConverterControls
                config={config}
                onChangeConfig={setConfig}
                binary={binary}
              />
            </div>
          )}

          {activeTab === 'mzHeader' && (
            <MzHeaderInspector binary={binary} />
          )}

          {activeTab === 'hex' && (
            <HexViewer binary={binary} />
          )}

          {activeTab === 'asm' && (
            <AssemblyViewer
              binary={binary}
              atariDisassembly={atariDisassembly}
            />
          )}

          {activeTab === 'palette' && (
            <VgaPaletteViewer
              palette={palette}
              paletteStandard={config.paletteStandard}
              onChangeStandard={handleChangePaletteStandard}
            />
          )}
        </div>
      </main>

      {/* Footer Specs */}
      <footer className="border-t border-zinc-900 bg-[#08090d] text-zinc-500 text-xs font-mono py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-zinc-400 font-bold">SPECIFICATIONS:</span>
            <span>VGA Mode 13h (320x200, 8-bpp Chunky)</span>
            <span>•</span>
            <span>256 Colors from 262,144 Palette</span>
            <span>•</span>
            <span>Video Segment 0xA000:0000</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Atari TIA 128 Color Remapper</span>
            <span>•</span>
            <span className="text-zinc-400">MS-DOS MZ Executable v1.0</span>
          </div>
        </div>
      </footer>

      {/* DOSBox Guide Modal */}
      <DosBoxGuideModal
        isOpen={isDosBoxModalOpen}
        onClose={() => setIsDosBoxModalOpen(false)}
        fileName={binary.fileName}
      />
    </div>
  );
}
