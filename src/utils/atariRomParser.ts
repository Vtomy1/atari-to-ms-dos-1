/**
 * Atari 2600 / 7800 / 8-bit ROM Parser & 6502 Disassembler
 */

import { DisassembledInstruction, RomMetadata } from '../types/atari-dos';

export const TIA_REGISTER_NAMES: Record<number, string> = {
  0x00: 'VSYNC',
  0x01: 'VBLANK',
  0x02: 'WSYNC',
  0x03: 'RSYNC',
  0x04: 'NUSIZ0',
  0x05: 'NUSIZ1',
  0x06: 'COLUP0',
  0x07: 'COLUP1',
  0x08: 'COLUPF',
  0x09: 'COLUBK',
  0x0a: 'CTRLPF',
  0x0b: 'REFP0',
  0x0c: 'REFP1',
  0x0d: 'PF0',
  0x0e: 'PF1',
  0x0f: 'PF2',
  0x10: 'RESP0',
  0x11: 'RESP1',
  0x12: 'RESM0',
  0x13: 'RESM1',
  0x14: 'RESBL',
  0x15: 'AUDC0',
  0x16: 'AUDC1',
  0x17: 'AUDF0',
  0x18: 'AUDF1',
  0x19: 'AUDV0',
  0x1a: 'AUDV1',
  0x1b: 'GRP0',
  0x1c: 'GRP1',
  0x1d: 'ENAM0',
  0x1e: 'ENAM1',
  0x1f: 'ENABL',
  0x20: 'HMP0',
  0x21: 'HMP1',
  0x22: 'HMM0',
  0x23: 'HMM1',
  0x24: 'HMBL',
  0x25: 'VDELP0',
  0x26: 'VDELP1',
  0x27: 'VDELBL',
  0x28: 'RESMP0',
  0x29: 'RESMP1',
  0x2a: 'HMOVE',
  0x2b: 'HMCLR',
  0x2c: 'CXCLR',
};

export const RIOT_REGISTER_NAMES: Record<number, string> = {
  0x0280: 'SWCHA',
  0x0281: 'SWACNT',
  0x0282: 'SWCHB',
  0x0283: 'SWBCNT',
  0x0284: 'INTIM',
  0x0294: 'TIM1T',
  0x0295: 'TIM8T',
  0x0296: 'TIM64T',
  0x0297: 'T1024T',
};

// 6502 Opcode table for disassembler
interface OpcodeInfo {
  name: string;
  bytes: number;
  mode: 'imp' | 'acc' | 'imm' | 'zp' | 'zpx' | 'zpy' | 'abs' | 'abx' | 'aby' | 'ind' | 'izx' | 'izy' | 'rel';
}

const OPCODES_6502: Record<number, OpcodeInfo> = {
  0x00: { name: 'BRK', bytes: 1, mode: 'imp' },
  0x01: { name: 'ORA', bytes: 2, mode: 'izx' },
  0x05: { name: 'ORA', bytes: 2, mode: 'zp' },
  0x06: { name: 'ASL', bytes: 2, mode: 'zp' },
  0x08: { name: 'PHP', bytes: 1, mode: 'imp' },
  0x09: { name: 'ORA', bytes: 2, mode: 'imm' },
  0x0A: { name: 'ASL', bytes: 1, mode: 'acc' },
  0x0D: { name: 'ORA', bytes: 3, mode: 'abs' },
  0x0E: { name: 'ASL', bytes: 3, mode: 'abs' },
  0x10: { name: 'BPL', bytes: 2, mode: 'rel' },
  0x11: { name: 'ORA', bytes: 2, mode: 'izy' },
  0x15: { name: 'ORA', bytes: 2, mode: 'zpx' },
  0x16: { name: 'ASL', bytes: 2, mode: 'zpx' },
  0x18: { name: 'CLC', bytes: 1, mode: 'imp' },
  0x19: { name: 'ORA', bytes: 3, mode: 'aby' },
  0x1D: { name: 'ORA', bytes: 3, mode: 'abx' },
  0x1E: { name: 'ASL', bytes: 3, mode: 'abx' },
  0x20: { name: 'JSR', bytes: 3, mode: 'abs' },
  0x21: { name: 'AND', bytes: 2, mode: 'izx' },
  0x24: { name: 'BIT', bytes: 2, mode: 'zp' },
  0x25: { name: 'AND', bytes: 2, mode: 'zp' },
  0x26: { name: 'ROL', bytes: 2, mode: 'zp' },
  0x28: { name: 'PLP', bytes: 1, mode: 'imp' },
  0x29: { name: 'AND', bytes: 2, mode: 'imm' },
  0x2A: { name: 'ROL', bytes: 1, mode: 'acc' },
  0x2C: { name: 'BIT', bytes: 3, mode: 'abs' },
  0x2D: { name: 'AND', bytes: 3, mode: 'abs' },
  0x2E: { name: 'ROL', bytes: 3, mode: 'abs' },
  0x30: { name: 'BMI', bytes: 2, mode: 'rel' },
  0x31: { name: 'AND', bytes: 2, mode: 'izy' },
  0x35: { name: 'AND', bytes: 2, mode: 'zpx' },
  0x36: { name: 'ROL', bytes: 2, mode: 'zpx' },
  0x38: { name: 'SEC', bytes: 1, mode: 'imp' },
  0x39: { name: 'AND', bytes: 3, mode: 'aby' },
  0x3D: { name: 'AND', bytes: 3, mode: 'abx' },
  0x3E: { name: 'ROL', bytes: 3, mode: 'abx' },
  0x40: { name: 'RTI', bytes: 1, mode: 'imp' },
  0x41: { name: 'EOR', bytes: 2, mode: 'izx' },
  0x45: { name: 'EOR', bytes: 2, mode: 'zp' },
  0x46: { name: 'LSR', bytes: 2, mode: 'zp' },
  0x48: { name: 'PHA', bytes: 1, mode: 'imp' },
  0x49: { name: 'EOR', bytes: 2, mode: 'imm' },
  0x4A: { name: 'LSR', bytes: 1, mode: 'acc' },
  0x4C: { name: 'JMP', bytes: 3, mode: 'abs' },
  0x4D: { name: 'EOR', bytes: 3, mode: 'abs' },
  0x4E: { name: 'LSR', bytes: 3, mode: 'abs' },
  0x50: { name: 'BVC', bytes: 2, mode: 'rel' },
  0x51: { name: 'EOR', bytes: 2, mode: 'izy' },
  0x55: { name: 'EOR', bytes: 2, mode: 'zpx' },
  0x56: { name: 'LSR', bytes: 2, mode: 'zpx' },
  0x58: { name: 'CLI', bytes: 1, mode: 'imp' },
  0x59: { name: 'EOR', bytes: 3, mode: 'aby' },
  0x5D: { name: 'EOR', bytes: 3, mode: 'abx' },
  0x5E: { name: 'LSR', bytes: 3, mode: 'abx' },
  0x60: { name: 'RTS', bytes: 1, mode: 'imp' },
  0x61: { name: 'ADC', bytes: 2, mode: 'izx' },
  0x65: { name: 'ADC', bytes: 2, mode: 'zp' },
  0x66: { name: 'ROR', bytes: 2, mode: 'zp' },
  0x68: { name: 'PLA', bytes: 1, mode: 'imp' },
  0x69: { name: 'ADC', bytes: 2, mode: 'imm' },
  0x6A: { name: 'ROR', bytes: 1, mode: 'acc' },
  0x6C: { name: 'JMP', bytes: 3, mode: 'ind' },
  0x6D: { name: 'ADC', bytes: 3, mode: 'abs' },
  0x6E: { name: 'ROR', bytes: 3, mode: 'abs' },
  0x70: { name: 'BVS', bytes: 2, mode: 'rel' },
  0x71: { name: 'ADC', bytes: 2, mode: 'izy' },
  0x75: { name: 'ADC', bytes: 2, mode: 'zpx' },
  0x76: { name: 'ROR', bytes: 2, mode: 'zpx' },
  0x78: { name: 'SEI', bytes: 1, mode: 'imp' },
  0x79: { name: 'ADC', bytes: 3, mode: 'aby' },
  0x7D: { name: 'ADC', bytes: 3, mode: 'abx' },
  0x7E: { name: 'ROR', bytes: 3, mode: 'abx' },
  0x81: { name: 'STA', bytes: 2, mode: 'izx' },
  0x84: { name: 'STY', bytes: 2, mode: 'zp' },
  0x85: { name: 'STA', bytes: 2, mode: 'zp' },
  0x86: { name: 'STX', bytes: 2, mode: 'zp' },
  0x88: { name: 'DEY', bytes: 1, mode: 'imp' },
  0x8A: { name: 'TXA', bytes: 1, mode: 'imp' },
  0x8C: { name: 'STY', bytes: 3, mode: 'abs' },
  0x8D: { name: 'STA', bytes: 3, mode: 'abs' },
  0x8E: { name: 'STX', bytes: 3, mode: 'abs' },
  0x90: { name: 'BCC', bytes: 2, mode: 'rel' },
  0x91: { name: 'STA', bytes: 2, mode: 'izy' },
  0x94: { name: 'STY', bytes: 2, mode: 'zpx' },
  0x95: { name: 'STA', bytes: 2, mode: 'zpx' },
  0x96: { name: 'STX', bytes: 2, mode: 'zpy' },
  0x98: { name: 'TYA', bytes: 1, mode: 'imp' },
  0x99: { name: 'STA', bytes: 3, mode: 'aby' },
  0x9A: { name: 'TXS', bytes: 1, mode: 'imp' },
  0x9D: { name: 'STA', bytes: 3, mode: 'abx' },
  0xA0: { name: 'LDY', bytes: 2, mode: 'imm' },
  0xA1: { name: 'LDA', bytes: 2, mode: 'izx' },
  0xA2: { name: 'LDX', bytes: 2, mode: 'imm' },
  0xA4: { name: 'LDY', bytes: 2, mode: 'zp' },
  0xA5: { name: 'LDA', bytes: 2, mode: 'zp' },
  0xA6: { name: 'LDX', bytes: 2, mode: 'zp' },
  0xA8: { name: 'TAY', bytes: 1, mode: 'imp' },
  0xA9: { name: 'LDA', bytes: 2, mode: 'imm' },
  0xAA: { name: 'TAX', bytes: 1, mode: 'imp' },
  0xAC: { name: 'LDY', bytes: 3, mode: 'abs' },
  0xAD: { name: 'LDA', bytes: 3, mode: 'abs' },
  0xAE: { name: 'LDX', bytes: 3, mode: 'abs' },
  0xB0: { name: 'BCS', bytes: 2, mode: 'rel' },
  0xB1: { name: 'LDA', bytes: 2, mode: 'izy' },
  0xB4: { name: 'LDY', bytes: 2, mode: 'zpx' },
  0xB5: { name: 'LDA', bytes: 2, mode: 'zpx' },
  0xB6: { name: 'LDX', bytes: 2, mode: 'zpy' },
  0xB8: { name: 'CLV', bytes: 1, mode: 'imp' },
  0xB9: { name: 'LDA', bytes: 3, mode: 'aby' },
  0xBA: { name: 'TSX', bytes: 1, mode: 'imp' },
  0xBC: { name: 'LDY', bytes: 3, mode: 'abx' },
  0xBD: { name: 'LDA', bytes: 3, mode: 'abx' },
  0xBE: { name: 'LDX', bytes: 3, mode: 'aby' },
  0xC0: { name: 'CPY', bytes: 2, mode: 'imm' },
  0xC1: { name: 'CMP', bytes: 2, mode: 'izx' },
  0xC4: { name: 'CPY', bytes: 2, mode: 'zp' },
  0xC5: { name: 'CMP', bytes: 2, mode: 'zp' },
  0xC6: { name: 'DEC', bytes: 2, mode: 'zp' },
  0xC8: { name: 'INY', bytes: 1, mode: 'imp' },
  0xC9: { name: 'CMP', bytes: 2, mode: 'imm' },
  0xCA: { name: 'DEX', bytes: 1, mode: 'imp' },
  0xCC: { name: 'CPY', bytes: 3, mode: 'abs' },
  0xCD: { name: 'CMP', bytes: 3, mode: 'abs' },
  0xCE: { name: 'DEC', bytes: 3, mode: 'abs' },
  0xD0: { name: 'BNE', bytes: 2, mode: 'rel' },
  0xD1: { name: 'CMP', bytes: 2, mode: 'izy' },
  0xD5: { name: 'CMP', bytes: 2, mode: 'zpx' },
  0xD6: { name: 'DEC', bytes: 2, mode: 'zpx' },
  0xD8: { name: 'CLD', bytes: 1, mode: 'imp' },
  0xD9: { name: 'CMP', bytes: 3, mode: 'aby' },
  0xDD: { name: 'CMP', bytes: 3, mode: 'abx' },
  0xDE: { name: 'DEC', bytes: 3, mode: 'abx' },
  0xE0: { name: 'CPX', bytes: 2, mode: 'imm' },
  0xE1: { name: 'SBC', bytes: 2, mode: 'izx' },
  0xE4: { name: 'CPX', bytes: 2, mode: 'zp' },
  0xE5: { name: 'SBC', bytes: 2, mode: 'zp' },
  0xE6: { name: 'INC', bytes: 2, mode: 'zp' },
  0xE8: { name: 'INX', bytes: 1, mode: 'imp' },
  0xE9: { name: 'SBC', bytes: 2, mode: 'imm' },
  0xEA: { name: 'NOP', bytes: 1, mode: 'imp' },
  0xEC: { name: 'CPX', bytes: 3, mode: 'abs' },
  0xED: { name: 'SBC', bytes: 3, mode: 'abs' },
  0xEE: { name: 'INC', bytes: 3, mode: 'abs' },
  0xF0: { name: 'BEQ', bytes: 2, mode: 'rel' },
  0xF1: { name: 'SBC', bytes: 2, mode: 'izy' },
  0xF5: { name: 'SBC', bytes: 2, mode: 'zpx' },
  0xF6: { name: 'INC', bytes: 2, mode: 'zpx' },
  0xF8: { name: 'SED', bytes: 1, mode: 'imp' },
  0xF9: { name: 'SBC', bytes: 3, mode: 'aby' },
  0xFD: { name: 'SBC', bytes: 3, mode: 'abx' },
  0xFE: { name: 'INC', bytes: 3, mode: 'abx' },
};

/**
 * Detects format and metadata of an Atari ROM binary
 */
export function inspectAtariRom(romBytes: Uint8Array, fileName: string): RomMetadata {
  const size = romBytes.length;
  let format: RomMetadata['format'] = 'CUSTOM';

  if (size === 2048) {
    format = '2K';
  } else if (size === 4096) {
    format = '4K';
  } else if (size === 8192) {
    format = '8K_F8';
  } else if (size === 16384) {
    format = '16K_F6';
  }

  // Calculate standard 16-bit CRC/checksum
  let checksum = 0;
  for (let i = 0; i < size; i++) {
    checksum = (checksum + romBytes[i]) & 0xffff;
  }

  const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[_.-]/g, ' ');

  return {
    name: cleanName,
    size,
    format,
    checksum,
    estimatedCycles: 1193182, // Standard NTSC colorburst / 3 = 1.19 MHz
    description: `Atari VCS cartridge image (${(size / 1024).toFixed(1)} KB, Format: ${format})`,
  };
}

/**
 * Disassembles 6502 machine code from the Atari ROM
 */
export function disassemble6502(
  romBytes: Uint8Array,
  originAddress: number = 0xf000,
  maxInstructions: number = 300
): DisassembledInstruction[] {
  const instructions: DisassembledInstruction[] = [];
  let pc = 0;

  // Atari 2600 4K ROM starts at 0xF000; 2K ROM is mirrored at 0xF800
  const baseAddr = romBytes.length <= 2048 ? 0xf800 : originAddress;

  while (pc < romBytes.length && instructions.length < maxInstructions) {
    const addr = baseAddr + pc;
    const opcode = romBytes[pc];
    const info = OPCODES_6502[opcode];

    if (!info) {
      // Unofficial opcode or raw data byte
      instructions.push({
        address: addr,
        rawBytes: [opcode],
        mnemonic: '.BYTE',
        operands: `$${opcode.toString(16).padStart(2, '0').toUpperCase()}`,
        comment: 'Data / Unmapped byte',
      });
      pc += 1;
      continue;
    }

    const raw: number[] = [opcode];
    let operands = '';
    let comment = '';
    let isTiaRegister = false;

    if (info.bytes === 1) {
      if (info.mode === 'acc') operands = 'A';
    } else if (info.bytes === 2) {
      const b1 = romBytes[pc + 1] ?? 0;
      raw.push(b1);
      switch (info.mode) {
        case 'imm':
          operands = `#$${b1.toString(16).padStart(2, '0').toUpperCase()}`;
          break;
        case 'zp': {
          const regName = TIA_REGISTER_NAMES[b1];
          if (regName) {
            operands = `${regName}`;
            comment = `TIA ${regName} ($${b1.toString(16).padStart(2, '0').toUpperCase()})`;
            isTiaRegister = true;
          } else {
            operands = `$${b1.toString(16).padStart(2, '0').toUpperCase()}`;
          }
          break;
        }
        case 'zpx':
          operands = `$${b1.toString(16).padStart(2, '0').toUpperCase()},X`;
          break;
        case 'zpy':
          operands = `$${b1.toString(16).padStart(2, '0').toUpperCase()},Y`;
          break;
        case 'izx':
          operands = `($${b1.toString(16).padStart(2, '0').toUpperCase()},X)`;
          break;
        case 'izy':
          operands = `($${b1.toString(16).padStart(2, '0').toUpperCase()}),Y`;
          break;
        case 'rel': {
          const signedOffset = b1 > 127 ? b1 - 256 : b1;
          const targetAddr = addr + 2 + signedOffset;
          operands = `$${targetAddr.toString(16).padStart(4, '0').toUpperCase()}`;
          break;
        }
        default:
          operands = `$${b1.toString(16).padStart(2, '0').toUpperCase()}`;
      }
    } else if (info.bytes === 3) {
      const b1 = romBytes[pc + 1] ?? 0;
      const b2 = romBytes[pc + 2] ?? 0;
      raw.push(b1, b2);
      const absVal = (b2 << 8) | b1;
      const riotReg = RIOT_REGISTER_NAMES[absVal];
      const tiaReg = TIA_REGISTER_NAMES[absVal & 0x3f];

      switch (info.mode) {
        case 'abs':
          if (riotReg) {
            operands = `${riotReg}`;
            comment = `RIOT 6532: ${riotReg}`;
          } else if (absVal < 0x40 && tiaReg) {
            operands = `${tiaReg}`;
            comment = `TIA: ${tiaReg}`;
            isTiaRegister = true;
          } else {
            operands = `$${absVal.toString(16).padStart(4, '0').toUpperCase()}`;
          }
          break;
        case 'abx':
          operands = `$${absVal.toString(16).padStart(4, '0').toUpperCase()},X`;
          break;
        case 'aby':
          operands = `$${absVal.toString(16).padStart(4, '0').toUpperCase()},Y`;
          break;
        case 'ind':
          operands = `($${absVal.toString(16).padStart(4, '0').toUpperCase()})`;
          break;
        default:
          operands = `$${absVal.toString(16).padStart(4, '0').toUpperCase()}`;
      }
    }

    instructions.push({
      address: addr,
      rawBytes: raw,
      mnemonic: info.name,
      operands,
      comment: comment || undefined,
      isTiaRegister,
    });

    pc += info.bytes;
  }

  return instructions;
}

/**
 * Extracts candidate 8xN sprites and graphic patterns found in ROM
 */
export function extractSpriteBitmaps(romBytes: Uint8Array): { offset: number; pattern: number[] }[] {
  const sprites: { offset: number; pattern: number[] }[] = [];
  // Look for consecutive non-zero bytes with sprite-like entropy
  for (let i = 0; i < romBytes.length - 8; i += 4) {
    let nonZero = 0;
    const slice: number[] = [];
    for (let j = 0; j < 8; j++) {
      const b = romBytes[i + j];
      slice.push(b);
      if (b !== 0x00 && b !== 0xff) nonZero++;
    }
    // Good candidate if between 3 and 7 distinct patterned bytes
    if (nonZero >= 4 && sprites.length < 24) {
      sprites.push({ offset: i, pattern: slice });
      i += 8; // skip ahead
    }
  }
  return sprites;
}
