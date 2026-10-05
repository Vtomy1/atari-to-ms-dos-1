/**
 * Types and interfaces for Atari ROM to MS-DOS Mode 13h EXE Conversion
 */

export interface MzHeader {
  magic: number;        // 0x5A4D ("MZ")
  cblp: number;         // Bytes on last page (512-byte page)
  cp: number;           // Total 512-byte pages in file
  crlc: number;         // Number of relocation entries
  cparhdr: number;      // Size of header in paragraphs (16-byte blocks)
  minalloc: number;     // Minimum extra paragraphs needed
  maxalloc: number;     // Maximum extra paragraphs needed
  ss: number;           // Initial relative SS (Stack Segment)
  sp: number;           // Initial SP (Stack Pointer)
  csum: number;         // Checksum (usually 0)
  ip: number;           // Initial IP (Instruction Pointer)
  cs: number;           // Initial relative CS (Code Segment)
  lfarlc: number;       // File address of relocation table
  ovno: number;         // Overlay number
  reserved: number[];   // Reserved words
}

export interface RelocationEntry {
  offset: number;
  segment: number;
}

export type PaletteStandard = 'NTSC' | 'PAL' | 'SECAM' | 'VGA_DEFAULT' | 'AMBER_P3' | 'GREEN_P1';

export interface VgaColor {
  index: number;
  r6: number; // 6-bit Red (0-63)
  g6: number; // 6-bit Green (0-63)
  b6: number; // 6-bit Blue (0-63)
  r8: number; // 8-bit Red (0-255)
  g8: number; // 8-bit Green (0-255)
  b8: number; // 8-bit Blue (0-255)
  atariHueLum?: string;
}

export interface RomMetadata {
  name: string;
  size: number;
  format: '2K' | '4K' | '8K_F8' | '16K_F6' | 'CUSTOM' | 'DEMO';
  checksum: number;
  estimatedCycles: number;
  description: string;
  year?: string;
  author?: string;
}

export interface ConversionConfig {
  targetFormat: 'EXE' | 'COM';
  paletteStandard: PaletteStandard;
  scanlineDarkening: number; // 0 to 100%
  aspectRatioMode: 'CENTERED_192_IN_200' | 'STRETCH_200' | 'OVERSCAN';
  vsyncSyncWait: boolean;
  enableSoundStub: boolean;
  clearVideoRamOnInit: boolean;
  addDosExitPrompt: boolean;
  embedDisassemblyComments: boolean;
}

export interface GeneratedBinary {
  fileName: string;
  exeBytes: Uint8Array;
  comBytes: Uint8Array;
  rawVgaFrame: Uint8Array;
  vgaPaletteBytes: Uint8Array; // 768 bytes (256 * 3)
  mzHeader: MzHeader;
  codeSize: number;
  dataSize: number;
  totalSize: number;
  asmSource: string;
  cHeader: string;
  relocations: RelocationEntry[];
}

export interface DisassembledInstruction {
  address: number;
  rawBytes: number[];
  mnemonic: string;
  operands: string;
  comment?: string;
  isTiaRegister?: boolean;
}

export interface TiaState {
  colubk: number;
  colupf: number;
  colup0: number;
  colup1: number;
  playfield: number[];
  player0: number;
  player1: number;
  missile0: boolean;
  missile1: boolean;
  ball: boolean;
  scanline: number;
  frame: number;
}
