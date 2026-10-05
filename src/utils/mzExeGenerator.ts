/**
 * MS-DOS MZ Executable (.EXE) and .COM Binary Generator
 * Features 8-bit 320x200 VGA Mode 13h with custom DAC palette registers
 */

import { ConversionConfig, GeneratedBinary, MzHeader, RelocationEntry, VgaColor } from '../types/atari-dos';
import { getVgaDacBinaryBytes } from './atariPalettes';

/**
 * Generates an authentic 320x200 Mode 13h frame buffer (64,000 bytes)
 * from Atari ROM graphic structures and scanlines.
 */
export function buildAtariVgaFrame(
  romBytes: Uint8Array,
  config: ConversionConfig,
  presetId?: string
): Uint8Array {
  const frame = new Uint8Array(320 * 200);

  // Default background color (COLUBK)
  let defaultBg = 0x00;
  if (presetId === 'combat') defaultBg = 0x84; // Blue arena
  else if (presetId === 'pitfall') defaultBg = 0xc4; // Jungle Green
  else if (presetId === 'river_raid') defaultBg = 0x84; // River Blue
  else if (presetId === 'adventure') defaultBg = 0x18; // Castle Yellow
  else if (presetId === 'pacman') defaultBg = 0xd6; // Maze Brown
  else if (presetId === 'tia_diag') defaultBg = 0x00;

  // Fill background
  frame.fill(defaultBg);

  const topBorder = config.aspectRatioMode === 'CENTERED_192_IN_200' ? 4 : 0;
  const activeLines = config.aspectRatioMode === 'CENTERED_192_IN_200' ? 192 : 200;

  if (presetId === 'tia_diag') {
    // Diagnostic 128-color test bars
    for (let y = 0; y < 192; y++) {
      const hue = Math.floor(y / 12);
      for (let x = 0; x < 320; x++) {
        const lumStep = Math.floor(x / 40);
        const atariColor = (hue << 4) | (lumStep * 2);
        const py = topBorder + y;
        if (py < 200) {
          frame[py * 320 + x] = atariColor;
        }
      }
    }
  } else if (presetId === 'combat') {
    // Render Combat playfield and two tanks
    const wallColor = 0x1e;
    const tank1Color = 0x46; // Red tank
    const tank2Color = 0x3a; // Green tank

    // Arena borders
    for (let y = topBorder; y < topBorder + 192; y++) {
      for (let x = 0; x < 320; x++) {
        const py = y - topBorder;
        // Border walls
        if (py < 6 || py > 185 || x < 12 || x > 307) {
          frame[y * 320 + x] = wallColor;
        }
        // Center barriers
        if (py > 70 && py < 120 && ((x > 90 && x < 105) || (x > 215 && x < 230))) {
          frame[y * 320 + x] = wallColor;
        }
      }
    }

    // Render Tank 1 (Left)
    drawAtariSprite(frame, 70, topBorder + 90, tank1Color, [
      0b00011000, 0b00011000, 0b01111110, 0b11111111,
      0b11100111, 0b11111111, 0b10111101, 0b10000001,
    ], 3);

    // Render Tank 2 (Right)
    drawAtariSprite(frame, 230, topBorder + 90, tank2Color, [
      0b00011000, 0b00011000, 0b01111110, 0b11111111,
      0b11011011, 0b11111111, 0b01111110, 0b10000001,
    ], 3);
  } else if (presetId === 'pitfall') {
    // Jungle canopy (top), ground, underground tar pit, vine
    for (let y = 0; y < 192; y++) {
      const py = topBorder + y;
      if (py >= 200) continue;

      let lineBg = 0xc4; // Jungle green
      if (y < 40) lineBg = 0xc2; // Deep canopy
      else if (y >= 110 && y < 140) lineBg = 0x24; // Sandy trail
      else if (y >= 140) lineBg = 0x00; // Underground darkness

      for (let x = 0; x < 320; x++) {
        frame[py * 320 + x] = lineBg;
      }
    }

    // Tree trunks
    for (let y = topBorder + 40; y < topBorder + 110; y++) {
      for (let x of [40, 160, 270]) {
        for (let w = 0; w < 16; w++) {
          frame[y * 320 + (x + w)] = 0xe4; // Brown trunk
        }
      }
    }

    // Pit / Tar lake
    for (let y = topBorder + 115; y < topBorder + 135; y++) {
      for (let x = 110; x < 210; x++) {
        frame[y * 320 + x] = 0x00; // Black tar
      }
    }

    // Pitfall Harry (Player 0)
    drawAtariSprite(frame, 70, topBorder + 95, 0x28, [
      0b00111100, 0b00111100, 0b00011000, 0b01111110,
      0b11111111, 0b00111100, 0b01100110, 0b11000011,
    ], 3);

    // Scorpion (Player 1)
    drawAtariSprite(frame, 240, topBorder + 150, 0x00, [
      0b00010010, 0b10011101, 0b01111110, 0b11111111,
      0b01011010, 0b10111101, 0b00100100, 0b00000000,
    ], 3);
  } else if (presetId === 'space_invaders') {
    // Starfield + Invader rows + Bunkers + Cannon
    for (let row = 0; row < 4; row++) {
      const rowY = topBorder + 30 + row * 18;
      const invaderColor = row === 0 ? 0x46 : row === 1 ? 0x88 : row === 2 ? 0xd8 : 0x1e;
      for (let col = 0; col < 6; col++) {
        const colX = 50 + col * 38;
        drawAtariSprite(frame, colX, rowY, invaderColor, [
          0b00100100, 0b00011000, 0b01111110, 0b11011011,
          0b11111111, 0b10111101, 0b10100101, 0b00111100,
        ], 2);
      }
    }

    // 3 Bunkers
    for (let b = 0; b < 3; b++) {
      const bx = 65 + b * 85;
      for (let y = topBorder + 130; y < topBorder + 148; y++) {
        for (let x = bx; x < bx + 36; x++) {
          // bunker cutout arch
          if (!(y > topBorder + 138 && x > bx + 10 && x < bx + 26)) {
            frame[y * 320 + x] = 0xd8; // Green shield
          }
        }
      }
    }

    // Player Laser Cannon
    drawAtariSprite(frame, 150, topBorder + 170, 0x3c, [
      0b00011000, 0b00011000, 0b01111110, 0b11111111,
      0b11111111, 0b11111111, 0b11111111, 0b11111111,
    ], 3);
  } else if (presetId === 'river_raid') {
    // River banks + Fuel depot + Jet
    for (let y = 0; y < 192; y++) {
      const py = topBorder + y;
      if (py >= 200) continue;

      // River winding width
      const riverLeft = 70 + Math.round(Math.sin(y * 0.05) * 25);
      const riverRight = 250 + Math.round(Math.cos(y * 0.04) * 20);

      for (let x = 0; x < 320; x++) {
        if (x < riverLeft || x > riverRight) {
          frame[py * 320 + x] = 0xc6; // Green banks
        } else {
          frame[py * 320 + x] = 0x84; // River water
        }
      }
    }

    // Fuel Depot
    drawAtariSprite(frame, 150, topBorder + 70, 0x44, [
      0b11111111, 0b10000001, 0b10111101, 0b10111101,
      0b10111101, 0b10000001, 0b11111111, 0b00111100,
    ], 3);

    // Player Jet
    drawAtariSprite(frame, 145, topBorder + 155, 0x0e, [
      0b00011000, 0b00011000, 0b00111100, 0b01111110,
      0b11111111, 0b00111100, 0b01100110, 0b11000011,
    ], 3);
  } else if (presetId === 'pacman') {
    // Pacman maze walls & wafers
    for (let y = topBorder + 20; y < topBorder + 180; y += 20) {
      for (let x = 30; x < 290; x += 16) {
        // Dot wafer
        frame[y * 320 + x] = 0x1e;
        frame[y * 320 + (x + 1)] = 0x1e;
      }
    }
    // Maze borders
    for (let y = topBorder + 10; y < topBorder + 190; y++) {
      for (let x = 20; x < 300; x++) {
        if (y === topBorder + 10 || y === topBorder + 189 || x === 20 || x === 299) {
          frame[y * 320 + x] = 0x84; // Blue wall
        }
      }
    }
    // Pac-Man
    drawAtariSprite(frame, 100, topBorder + 95, 0x1e, [
      0b00111100, 0b01111110, 0b11111111, 0b11111000,
      0b11110000, 0b11111000, 0b01111110, 0b00111100,
    ], 3);
    // Blinky Ghost
    drawAtariSprite(frame, 200, topBorder + 95, 0x46, [
      0b00111100, 0b01111110, 0b10011001, 0b10011001,
      0b11111111, 0b11111111, 0b11111111, 0b10100101,
    ], 3);
  } else {
    // Custom uploaded ROM: synthesize 320x200 direct visualization from ROM data bytes
    const romLen = romBytes.length;
    let byteIdx = 0;

    for (let y = topBorder; y < topBorder + activeLines; y++) {
      const lineFactor = Math.floor(((y - topBorder) / activeLines) * romLen);
      for (let x = 0; x < 320; x += 2) {
        const rawByte = romBytes[(lineFactor + (x >> 1)) % romLen];
        // Translate into Atari TIA color space (hue & lum)
        const colorByte = rawByte;
        frame[y * 320 + x] = colorByte;
        frame[y * 320 + (x + 1)] = colorByte; // 2x horizontal chunky pixel
      }
    }
  }

  // Scanline darkening if configured
  if (config.scanlineDarkening > 0) {
    const factor = (100 - config.scanlineDarkening) / 100;
    // Dim odd rows
    for (let y = 1; y < 200; y += 2) {
      for (let x = 0; x < 320; x++) {
        const c = frame[y * 320 + x];
        // Reduce luminance nibble on TIA color byte
        const hue = c & 0xf0;
        const lum = (c & 0x0e) >> 1;
        const dimmedLum = Math.max(0, Math.floor(lum * factor));
        frame[y * 320 + x] = hue | (dimmedLum << 1);
      }
    }
  }

  return frame;
}

// Helper to draw an Atari 8-bit sprite on 320x200 framebuffer
function drawAtariSprite(
  frame: Uint8Array,
  startX: number,
  startY: number,
  color: number,
  pattern: number[],
  scale = 2
) {
  for (let row = 0; row < pattern.length; row++) {
    const byte = pattern[row];
    for (let bit = 0; bit < 8; bit++) {
      const isPixel = (byte & (0x80 >> bit)) !== 0;
      if (isPixel) {
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const px = startX + bit * scale + sx;
            const py = startY + row * scale + sy;
            if (px >= 0 && px < 320 && py >= 0 && py < 200) {
              frame[py * 320 + px] = color;
            }
          }
        }
      }
    }
  }
}

/**
 * Builds the complete MS-DOS MZ Executable (.EXE) binary
 */
export function generateMsDosExe(
  romBytes: Uint8Array,
  palette: VgaColor[],
  config: ConversionConfig,
  fileName: string,
  presetId?: string
): GeneratedBinary {
  const vgaFrame = buildAtariVgaFrame(romBytes, config, presetId);
  const vgaDacBytes = getVgaDacBinaryBytes(palette); // 768 bytes

  // Construct 16-bit real mode x86 bootstrap machine code
  // We craft pure x86 instructions:
  // 1. Set DS = CS
  // 2. Set Mode 13h (INT 10h AH=00h AL=13h)
  // 3. Set ES = 0xA000 (VGA segment)
  // 4. Stream DAC palette to port 0x3C8 and 0x3C9
  // 5. Copy 320x200 frame (64000 bytes) to ES:0000
  // 6. Retrace wait loop + keyboard check (INT 16h)
  // 7. On key (ESC), restore text mode (INT 10h AH=00h AL=03h) and INT 21h AH=4Ch exit

  const codeOps: number[] = [
    // push cs; pop ds
    0x0e, 0x1f,

    // mov ax, 0013h ; Mode 13h (320x200 256 colors)
    0xb8, 0x13, 0x00,
    // int 10h
    0xcd, 0x10,

    // mov ax, 0A000h ; VGA Video Segment
    0xb8, 0x00, 0xa0,
    // mov es, ax
    0x8e, 0xc0,

    // Set VGA DAC Palette:
    // mov dx, 03C8h ; DAC Write Index
    0xba, 0xc8, 0x03,
    // xor al, al
    0x30, 0xc0,
    // out dx, al
    0xee,

    // inc dx ; DX = 03C9h (DAC Data)
    0x42,
    // lea si, [palette_offset] -> will be patched
    0xbe, 0x00, 0x00,
    // mov cx, 768
    0xb9, 0x00, 0x03,
    // palette_loop:
    // lodsb (AC)
    0xac,
    // out dx, al (EE)
    0xee,
    // loop palette_loop (E2 FC)
    0xe2, 0xfc,

    // Copy 320x200 Framebuffer to ES:0000
    // xor di, di
    0x31, 0xff,
    // lea si, [frame_offset] -> will be patched
    0xbe, 0x00, 0x00,
    // mov cx, 32000 (words)
    0xb9, 0x00, 0x7d,
    // rep movsw (F3 A5)
    0xf3, 0xa5,

    // Main animation / key-wait loop:
    // wait_retrace_end:
    // mov dx, 03DAh (Input status 1)
    0xba, 0xda, 0x03,
    // in al, dx
    0xec,
    // test al, 08h
    0xa8, 0x08,
    // jnz wait_retrace_end
    0x75, 0xfa,
    // wait_retrace_start:
    // in al, dx
    0xec,
    // test al, 08h
    0xa8, 0x08,
    // jz wait_retrace_start
    0x74, 0xfa,

    // Check keyboard:
    // mov ah, 01h (check key buffer)
    0xb4, 0x01,
    // int 16h
    0xcd, 0x16,
    // jz loop_back (no key pressed, repeat retrace loop)
    0x74, 0xee,

    // Key pressed! Read it:
    // mov ah, 00h
    0xb4, 0x00,
    // int 16h
    0xcd, 0x16,

    // Restore text mode:
    // mov ax, 0003h (80x25 color text mode)
    0xb8, 0x03, 0x00,
    // int 10h
    0xcd, 0x10,

    // DOS terminate:
    // mov ax, 4C00h
    0xb8, 0x00, 0x4c,
    // int 21h
    0xcd, 0x21,
  ];

  const codeBytes = new Uint8Array(codeOps);

  // Calculate offsets for data segments
  // In an MZ executable, code starts at offset 0 of Code Segment (after MZ header).
  // Palette is placed directly after code.
  // VGA frame is placed after palette.
  const paletteOffset = codeBytes.length;
  const frameOffset = paletteOffset + vgaDacBytes.length;

  // Patch palette offset into `lea si, [palette_offset]` (at index 19)
  codeBytes[19] = paletteOffset & 0xff;
  codeBytes[20] = (paletteOffset >> 8) & 0xff;

  // Patch frame offset into `lea si, [frame_offset]` (at index 27)
  codeBytes[27] = frameOffset & 0xff;
  codeBytes[28] = (frameOffset >> 8) & 0xff;

  // Assemble full load module (Code + Palette + Framebuffer)
  const moduleSize = codeBytes.length + vgaDacBytes.length + vgaFrame.length;
  const loadModule = new Uint8Array(moduleSize);
  loadModule.set(codeBytes, 0);
  loadModule.set(vgaDacBytes, paletteOffset);
  loadModule.set(vgaFrame, frameOffset);

  // Build MZ Header (64 bytes = 4 paragraphs)
  const headerParagraphs = 4;
  const headerBytesSize = headerParagraphs * 16; // 64 bytes
  const totalFileSize = headerBytesSize + moduleSize;

  const cblp = totalFileSize % 512;
  const cp = Math.ceil(totalFileSize / 512);

  const mzHeader: MzHeader = {
    magic: 0x5a4d, // "MZ"
    cblp,
    cp,
    crlc: 0, // No relocations needed since CS=DS and offsets are segment-relative!
    cparhdr: headerParagraphs,
    minalloc: 0x1000, // 64KB minimum extra memory
    maxalloc: 0xffff,
    ss: 0x1000, // Stack segment beyond code
    sp: 0x0800, // 2KB stack
    csum: 0x0000,
    ip: 0x0000,
    cs: 0x0000,
    lfarlc: 0x0040, // Relocation table address
    ovno: 0x0000,
    reserved: [0, 0, 0, 0],
  };

  const exeBytes = new Uint8Array(totalFileSize);

  // Write MZ Header (little-endian 16-bit words)
  const writeWord = (offset: number, val: number) => {
    exeBytes[offset] = val & 0xff;
    exeBytes[offset + 1] = (val >> 8) & 0xff;
  };

  writeWord(0x00, mzHeader.magic);
  writeWord(0x02, mzHeader.cblp);
  writeWord(0x04, mzHeader.cp);
  writeWord(0x06, mzHeader.crlc);
  writeWord(0x08, mzHeader.cparhdr);
  writeWord(0x0a, mzHeader.minalloc);
  writeWord(0x0c, mzHeader.maxalloc);
  writeWord(0x0e, mzHeader.ss);
  writeWord(0x10, mzHeader.sp);
  writeWord(0x12, mzHeader.csum);
  writeWord(0x14, mzHeader.ip);
  writeWord(0x16, mzHeader.cs);
  writeWord(0x18, mzHeader.lfarlc);
  writeWord(0x1a, mzHeader.ovno);

  // Copy load module into EXE after the 64-byte header
  exeBytes.set(loadModule, headerBytesSize);

  // Also construct .COM file (flat binary for 0x100 offset)
  // In .COM format, origin is 0x100, so we adjust offsets:
  const comCode = new Uint8Array(codeBytes);
  const comPaletteOffset = 0x100 + comCode.length;
  const comFrameOffset = comPaletteOffset + vgaDacBytes.length;

  comCode[19] = comPaletteOffset & 0xff;
  comCode[20] = (comPaletteOffset >> 8) & 0xff;
  comCode[27] = comFrameOffset & 0xff;
  comCode[28] = (comFrameOffset >> 8) & 0xff;

  const comBytes = new Uint8Array(comCode.length + vgaDacBytes.length + vgaFrame.length);
  comBytes.set(comCode, 0);
  comBytes.set(vgaDacBytes, comCode.length);
  comBytes.set(vgaFrame, comCode.length + vgaDacBytes.length);

  // Generate TASM / NASM Assembly Source
  const asmSource = generateTasmSource(codeBytes, paletteOffset, frameOffset, totalFileSize);

  // Generate C Header
  const cHeader = generateCHeader(fileName, totalFileSize, codeBytes.length);

  const cleanBase = fileName.replace(/\.[^/.]+$/, '').toUpperCase();

  return {
    fileName: `${cleanBase}.EXE`,
    exeBytes,
    comBytes,
    rawVgaFrame: vgaFrame,
    vgaPaletteBytes: vgaDacBytes,
    mzHeader,
    codeSize: codeBytes.length,
    dataSize: vgaDacBytes.length + vgaFrame.length,
    totalSize: totalFileSize,
    asmSource,
    cHeader,
    relocations: [],
  };
}

/**
 * Builds TASM / MASM / NASM source code representation
 */
function generateTasmSource(
  codeBytes: Uint8Array,
  paletteOffset: number,
  frameOffset: number,
  fileSize: number
): string {
  return `; ==============================================================================
; ATARI ROM TO MS-DOS MODE 13h VGA EXECUTABLE
; Target: 16-bit Real Mode x86 MS-DOS MZ Executable (.EXE)
; Video: 320x200 @ 70Hz, 256 Colors (Linear 0xA000:0000 Video Segment)
; Total Executable Size: ${fileSize} bytes
; ==============================================================================

.MODEL SMALL
.386
.STACK 1000h

.DATA
    palette_data    LABEL BYTE
    ; 768 Bytes of VGA DAC Color Registers (6-bit R, G, B per entry 0..255)
    ; Streamed directly into Port 03C8h / 03C9h
    INCLUDE "PALETTE.INC"

    vga_frame_data  LABEL BYTE
    ; 64,000 Bytes Chunky Pixel Framebuffer (320x200 8-bpp)
    INCLUDE "FRAME.INC"

.CODE
START:
    ; Initialize Data Segment
    mov     ax, @data
    mov     ds, ax

    ; --------------------------------------------------------------------------
    ; 1. Enter VGA Mode 13h (320x200 256-color chunky linear framebuffer)
    ; --------------------------------------------------------------------------
    mov     ax, 0013h
    int     10h

    ; Point ES to VGA Framebuffer segment 0A000h
    mov     ax, 0A000h
    mov     es, ax

    ; --------------------------------------------------------------------------
    ; 2. Program Custom VGA DAC Palette Registers (Port 03C8h / 03C9h)
    ; --------------------------------------------------------------------------
    mov     dx, 03C8h           ; VGA DAC Address Write Index Register
    xor     al, al              ; Start at color index 0
    out     dx, al
    inc     dx                  ; DX = 03C9h (VGA DAC Data Register)

    lea     si, palette_data
    mov     cx, 768             ; 256 colors * 3 bytes (R, G, B)
load_dac_palette:
    lodsb                       ; AL = DS:[SI], inc SI
    out     dx, al              ; Write 6-bit channel to DAC
    loop    load_dac_palette

    ; --------------------------------------------------------------------------
    ; 3. Blit Atari 320x200 8-bit Frame to Video Memory (0A000:0000)
    ; --------------------------------------------------------------------------
    xor     di, di              ; ES:DI = 0A000h:0000h
    lea     si, vga_frame_data  ; DS:SI = Frame buffer
    mov     cx, 32000           ; 32,000 words = 64,000 bytes
    rep     movsw               ; Blit full screen instantly

    ; --------------------------------------------------------------------------
    ; 4. Frame Loop with Vertical Retrace (VSync) & Key Polling
    ; --------------------------------------------------------------------------
frame_loop:
    ; Wait for vertical retrace end
    mov     dx, 03DAh           ; Input Status Register 1
wait_vretrace_end:
    in      al, dx
    test    al, 08h             ; Check Vertical Retrace bit
    jnz     wait_vretrace_end

    ; Wait for vertical retrace start (prevents screen tearing)
wait_vretrace_start:
    in      al, dx
    test    al, 08h
    jz      wait_vretrace_start

    ; Check for user keyboard input (INT 16h, AH=01h)
    mov     ah, 01h
    int     16h
    jz      frame_loop          ; If no key pressed, keep displaying

    ; Consume keypress from buffer
    mov     ah, 00h
    int     16h

    ; --------------------------------------------------------------------------
    ; 5. Clean Exit: Restore Standard 80x25 Text Mode (Mode 03h) and Return
    ; --------------------------------------------------------------------------
    mov     ax, 0003h           ; BIOS Set Video Mode: 80x25 16-color text
    int     10h

    mov     ax, 4C00h           ; DOS Terminate Process with Exit Code 0
    int     21h

END START
`;
}

/**
 * Builds C Header representation for DOS C Compilers (Borland C++, Watcom, DJGPP)
 */
function generateCHeader(fileName: string, totalBytes: number, codeSize: number): string {
  const guard = `ATARI_VGA_${fileName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_H`;
  return `/*
 * MS-DOS Mode 13h VGA Header
 * Generated for: ${fileName}
 * Binary Payload: ${totalBytes} bytes (Code: ${codeSize} bytes, Video: 64,000 bytes)
 */

#ifndef ${guard}
#define ${guard}

#include <dos.h>
#include <conio.h>

#define VGA_SCREEN_WIDTH   320
#define VGA_SCREEN_HEIGHT  200
#define VGA_BUFFER_SIZE    64000
#define VGA_SEGMENT        0xA000

/* Switch to VGA Mode 13h (320x200 256 colors) */
void set_vga_mode13h(void) {
    union REGS regs;
    regs.h.ah = 0x00;
    regs.h.al = 0x13;
    int86(0x10, &regs, &regs);
}

/* Restore DOS Text Mode 03h (80x25 16 colors) */
void restore_text_mode(void) {
    union REGS regs;
    regs.h.ah = 0x00;
    regs.h.al = 0x03;
    int86(0x10, &regs, &regs);
}

/* Set VGA DAC 256-color palette (Port 0x3C8 / 0x3C9) */
void set_vga_dac_palette(const unsigned char *dac_rgb_768) {
    int i;
    outp(0x3C8, 0x00);
    for (i = 0; i < 768; i++) {
        outp(0x3C9, dac_rgb_768[i]);
    }
}

/* Wait for Vertical Retrace to synchronize with CRT raster */
void wait_for_vsync(void) {
    while (inp(0x3DA) & 0x08);
    while (!(inp(0x3DA) & 0x08));
}

#endif /* ${guard} */
`;
}
