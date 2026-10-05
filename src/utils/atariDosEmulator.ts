/**
 * Interactive MS-DOS Mode 13h (320x200 8-bpp) Virtual Machine & Game Runner
 * Emulates direct 0xA000 linear framebuffer blitting and Atari TIA interactions
 */

import { ConversionConfig, VgaColor } from '../types/atari-dos';
import { retroAudio } from './atariAudio';

export interface EmulatorInputs {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  fire: boolean;
  reset: boolean;
  select: boolean;
}

export class AtariDosEmulator {
  // Virtual VGA Video RAM: 64,000 bytes mapped at 0xA000:0000
  public videoRam: Uint8Array = new Uint8Array(320 * 200);
  private initialFrame: Uint8Array;
  private presetId: string = 'combat';
  private palette: VgaColor[] = [];
  private config: ConversionConfig;

  // Game state
  private frameCount: number = 0;
  private p1X: number = 70;
  private p1Y: number = 90;
  private p1Dir: number = 0; // 0=Right, 1=Down, 2=Left, 3=Up
  private p2X: number = 230;
  private p2Y: number = 90;
  private p2Dir: number = 2;
  private bullets: { x: number; y: number; dx: number; dy: number; life: number; color: number }[] = [];

  // Platformer/Invader state
  private jumping: boolean = false;
  private jumpVelocity: number = 0;
  private invadersOffset: number = 0;
  private invadersDir: number = 1;
  private riverScroll: number = 0;
  private scoreP1: number = 0;
  private scoreP2: number = 0;

  // Stats
  public fps: number = 70.1;
  public writesPerSec: number = 0;
  private writeCounter: number = 0;
  private lastStatsTime: number = performance.now();

  constructor(
    initialFrame: Uint8Array,
    palette: VgaColor[],
    config: ConversionConfig,
    presetId = 'combat'
  ) {
    this.initialFrame = new Uint8Array(initialFrame);
    this.videoRam.set(initialFrame);
    this.palette = palette;
    this.config = config;
    this.presetId = presetId;
    this.resetState();
  }

  public updatePalette(palette: VgaColor[]) {
    this.palette = palette;
  }

  public updateConfig(config: ConversionConfig) {
    this.config = config;
  }

  public resetState() {
    this.videoRam.set(this.initialFrame);
    this.frameCount = 0;
    this.bullets = [];
    this.p1X = this.presetId === 'space_invaders' ? 150 : this.presetId === 'river_raid' ? 145 : 70;
    this.p1Y = this.presetId === 'space_invaders' ? 170 : this.presetId === 'pitfall' ? 95 : 90;
    this.p1Dir = 0;
    this.p2X = 230;
    this.p2Y = 90;
    this.p2Dir = 2;
    this.jumping = false;
    this.jumpVelocity = 0;
    this.invadersOffset = 0;
    this.invadersDir = 1;
    this.riverScroll = 0;
    this.scoreP1 = 0;
    this.scoreP2 = 0;
  }

  /**
   * Ticks 1 frame of simulation (targets VGA 70.08 Hz)
   */
  public update(inputs: EmulatorInputs) {
    this.frameCount++;
    this.writeCounter += 320 * 200;

    // Calculate FPS and writes/sec
    const now = performance.now();
    if (now - this.lastStatsTime >= 1000) {
      this.writesPerSec = this.writeCounter;
      this.writeCounter = 0;
      this.lastStatsTime = now;
    }

    if (inputs.reset) {
      this.resetState();
      retroAudio.playBeeperSound(400, 100);
      return;
    }

    if (this.presetId === 'combat') {
      this.updateCombat(inputs);
    } else if (this.presetId === 'pitfall') {
      this.updatePitfall(inputs);
    } else if (this.presetId === 'space_invaders') {
      this.updateSpaceInvaders(inputs);
    } else if (this.presetId === 'river_raid') {
      this.updateRiverRaid(inputs);
    } else if (this.presetId === 'pacman') {
      this.updatePacman(inputs);
    } else if (this.presetId === 'adventure') {
      this.updateAdventure(inputs);
    } else {
      // Diagnostic or custom ROM: animate subtle raster bars or scanline effect
      this.updateDiagnostic();
    }
  }

  private updateCombat(inputs: EmulatorInputs) {
    // Player 1 controls
    if (inputs.left) {
      this.p1X = Math.max(16, this.p1X - 2);
      this.p1Dir = 2;
    }
    if (inputs.right) {
      this.p1X = Math.min(290, this.p1X + 2);
      this.p1Dir = 0;
    }
    if (inputs.up) {
      this.p1Y = Math.max(14, this.p1Y - 2);
      this.p1Dir = 3;
    }
    if (inputs.down) {
      this.p1Y = Math.min(176, this.p1Y + 2);
      this.p1Dir = 1;
    }

    if (inputs.fire && this.bullets.length < 2 && this.frameCount % 8 === 0) {
      let dx = this.p1Dir === 0 ? 4 : this.p1Dir === 2 ? -4 : 0;
      let dy = this.p1Dir === 1 ? 4 : this.p1Dir === 3 ? -4 : 0;
      if (dx === 0 && dy === 0) dx = 4;
      this.bullets.push({ x: this.p1X + 12, y: this.p1Y + 8, dx, dy, life: 60, color: 0x1e });
      retroAudio.playFireLaser();
    }

    // AI Tank 2 simple patrol
    if (this.frameCount % 2 === 0) {
      if (this.p2Y > this.p1Y) this.p2Y -= 1;
      else if (this.p2Y < this.p1Y) this.p2Y += 1;

      if (this.p2X > this.p1X + 50) this.p2X -= 1;
      else if (this.p2X < this.p1X + 50) this.p2X += 1;
    }

    if (this.frameCount % 90 === 0 && Math.random() > 0.4) {
      this.bullets.push({ x: this.p2X, y: this.p2Y + 8, dx: -4, dy: 0, life: 60, color: 0x3a });
      retroAudio.playBeeperSound(600, 30);
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.dx;
      b.y += b.dy;
      b.life--;

      // Check collision with Tank 2
      if (Math.abs(b.x - this.p2X) < 14 && Math.abs(b.y - this.p2Y) < 14) {
        this.scoreP1++;
        retroAudio.playExplosion();
        this.p2X = 250;
        this.p2Y = 40 + Math.floor(Math.random() * 100);
        this.bullets.splice(i, 1);
        continue;
      }

      // Check collision with Tank 1
      if (Math.abs(b.x - this.p1X) < 14 && Math.abs(b.y - this.p1Y) < 14) {
        this.scoreP2++;
        retroAudio.playExplosion();
        this.p1X = 50;
        this.p1Y = 40 + Math.floor(Math.random() * 100);
        this.bullets.splice(i, 1);
        continue;
      }

      // Wall bounce
      if (b.x < 14 || b.x > 304) b.dx = -b.dx;
      if (b.y < 12 || b.y > 184) b.dy = -b.dy;

      if (b.life <= 0) {
        this.bullets.splice(i, 1);
      }
    }

    // Redraw screen into 0xA000 video RAM
    this.videoRam.set(this.initialFrame);

    // Draw P1 Tank
    this.blitSprite(this.p1X, this.p1Y, 0x46, [
      0b00011000, 0b00011000, 0b01111110, 0b11111111,
      0b11100111, 0b11111111, 0b10111101, 0b10000001,
    ], 3);

    // Draw P2 Tank
    this.blitSprite(this.p2X, this.p2Y, 0x3a, [
      0b00011000, 0b00011000, 0b01111110, 0b11111111,
      0b11011011, 0b11111111, 0b01111110, 0b10000001,
    ], 3);

    // Draw Bullets
    for (const b of this.bullets) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const px = Math.floor(b.x + dx);
          const py = Math.floor(b.y + dy);
          if (px >= 0 && px < 320 && py >= 0 && py < 200) {
            this.videoRam[py * 320 + px] = b.color;
          }
        }
      }
    }

    // Draw Score on top border (Atari 7-segment style digits)
    this.drawDigit(100, 6, this.scoreP1, 0x46);
    this.drawDigit(210, 6, this.scoreP2, 0x3a);
  }

  private updatePitfall(inputs: EmulatorInputs) {
    if (inputs.left) {
      this.p1X = Math.max(20, this.p1X - 3);
    }
    if (inputs.right) {
      this.p1X = Math.min(290, this.p1X + 3);
    }

    // Jumping physics
    if (inputs.fire && !this.jumping) {
      this.jumping = true;
      this.jumpVelocity = -8;
      retroAudio.playBeeperSound(750, 80);
    }

    if (this.jumping) {
      this.p1Y += this.jumpVelocity;
      this.jumpVelocity += 0.6; // gravity
      if (this.p1Y >= 95) {
        this.p1Y = 95;
        this.jumping = false;
        this.jumpVelocity = 0;
      }
    }

    // Patrol scorpion
    this.p2X += this.p2Dir === 2 ? -1.5 : 1.5;
    if (this.p2X < 120) this.p2Dir = 0;
    if (this.p2X > 260) this.p2Dir = 2;

    this.videoRam.set(this.initialFrame);

    // Harry
    this.blitSprite(this.p1X, Math.floor(this.p1Y), 0x28, [
      0b00111100, 0b00111100, 0b00011000, 0b01111110,
      0b11111111, 0b00111100, 0b01100110, 0b11000011,
    ], 3);

    // Scorpion
    this.blitSprite(Math.floor(this.p2X), 150, 0x00, [
      0b00010010, 0b10011101, 0b01111110, 0b11111111,
      0b01011010, 0b10111101, 0b00100100, 0b00000000,
    ], 3);

    // Swinging Vine oscillation
    const vineAngle = Math.sin(this.frameCount * 0.05);
    const vineBottomX = 160 + vineAngle * 50;
    const vineBottomY = 40 + Math.cos(vineAngle) * 55;
    for (let t = 0; t <= 1; t += 0.05) {
      const vx = Math.round(160 + (vineBottomX - 160) * t);
      const vy = Math.round(40 + (vineBottomY - 40) * t);
      if (vx >= 0 && vx < 320 && vy >= 0 && vy < 200) {
        this.videoRam[vy * 320 + vx] = 0x56; // Brown vine
      }
    }
  }

  private updateSpaceInvaders(inputs: EmulatorInputs) {
    if (inputs.left) this.p1X = Math.max(30, this.p1X - 3);
    if (inputs.right) this.p1X = Math.min(270, this.p1X + 3);

    if (inputs.fire && this.bullets.length < 3 && this.frameCount % 10 === 0) {
      this.bullets.push({ x: this.p1X + 11, y: 168, dx: 0, dy: -5, life: 50, color: 0x3c });
      retroAudio.playFireLaser();
    }

    // Invaders marching step
    if (this.frameCount % 20 === 0) {
      this.invadersOffset += this.invadersDir * 4;
      if (this.invadersOffset > 30 || this.invadersOffset < -20) {
        this.invadersDir = -this.invadersDir;
      }
      retroAudio.playAtariTone(0, 4, 25 - Math.abs(this.invadersOffset) % 10, 6);
    }

    // Update player missiles
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.y += b.dy;
      b.life--;
      if (b.y < 20 || b.life <= 0) {
        this.bullets.splice(i, 1);
      }
    }

    this.videoRam.set(this.initialFrame);

    // Cannon
    this.blitSprite(this.p1X, 170, 0x3c, [
      0b00011000, 0b00011000, 0b01111110, 0b11111111,
      0b11111111, 0b11111111, 0b11111111, 0b11111111,
    ], 3);

    // Bullets
    for (const b of this.bullets) {
      const px = Math.floor(b.x);
      const py = Math.floor(b.y);
      if (px >= 0 && px < 320 && py >= 0 && py < 200) {
        this.videoRam[py * 320 + px] = 0x0e;
        if (py + 1 < 200) this.videoRam[(py + 1) * 320 + px] = 0x0e;
      }
    }
  }

  private updateRiverRaid(inputs: EmulatorInputs) {
    if (inputs.left) this.p1X = Math.max(90, this.p1X - 3);
    if (inputs.right) this.p1X = Math.min(230, this.p1X + 3);

    if (inputs.fire && this.bullets.length < 2 && this.frameCount % 8 === 0) {
      this.bullets.push({ x: this.p1X + 11, y: 150, dx: 0, dy: -6, life: 40, color: 0x0e });
      retroAudio.playFireLaser();
    }

    this.riverScroll = (this.riverScroll + 2) % 200;

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.y += b.dy;
      b.life--;
      if (b.y < 10 || b.life <= 0) this.bullets.splice(i, 1);
    }

    this.videoRam.set(this.initialFrame);

    // Draw Jet
    this.blitSprite(this.p1X, 155, 0x0e, [
      0b00011000, 0b00011000, 0b00111100, 0b01111110,
      0b11111111, 0b00111100, 0b01100110, 0b11000011,
    ], 3);

    // Bullets
    for (const b of this.bullets) {
      const px = Math.floor(b.x);
      const py = Math.floor(b.y);
      if (px >= 0 && px < 320 && py >= 0 && py < 200) {
        this.videoRam[py * 320 + px] = 0x1e;
        if (py + 1 < 200) this.videoRam[(py + 1) * 320 + px] = 0x1e;
      }
    }
  }

  private updatePacman(inputs: EmulatorInputs) {
    if (inputs.left) this.p1X = Math.max(30, this.p1X - 2);
    if (inputs.right) this.p1X = Math.min(270, this.p1X + 2);
    if (inputs.up) this.p1Y = Math.max(30, this.p1Y - 2);
    if (inputs.down) this.p1Y = Math.min(160, this.p1Y + 2);

    if (this.frameCount % 12 === 0) {
      retroAudio.playChomp();
    }

    this.videoRam.set(this.initialFrame);

    // Pacman
    this.blitSprite(this.p1X, this.p1Y, 0x1e, [
      0b00111100, 0b01111110, 0b11111111, 0b11111000,
      0b11110000, 0b11111000, 0b01111110, 0b00111100,
    ], 3);

    // Ghost
    const ghostColor = this.frameCount % 30 < 15 ? 0x46 : 0x88;
    this.blitSprite(200, 95, ghostColor, [
      0b00111100, 0b01111110, 0b10011001, 0b10011001,
      0b11111111, 0b11111111, 0b11111111, 0b10100101,
    ], 3);
  }

  private updateAdventure(inputs: EmulatorInputs) {
    if (inputs.left) this.p1X = Math.max(20, this.p1X - 3);
    if (inputs.right) this.p1X = Math.min(280, this.p1X + 3);
    if (inputs.up) this.p1Y = Math.max(20, this.p1Y - 3);
    if (inputs.down) this.p1Y = Math.min(170, this.p1Y + 3);

    this.videoRam.set(this.initialFrame);

    // Protagonist square
    for (let dy = 0; dy < 10; dy++) {
      for (let dx = 0; dx < 10; dx++) {
        const px = this.p1X + dx;
        const py = this.p1Y + dy;
        if (px >= 0 && px < 320 && py >= 0 && py < 200) {
          this.videoRam[py * 320 + px] = 0x0e;
        }
      }
    }
  }

  private updateDiagnostic() {
    // Subtle color raster pulse across lines 180-195
    const barLine = (Math.floor(this.frameCount / 2) % 190) + 5;
    for (let x = 0; x < 320; x++) {
      if (barLine < 200) {
        this.videoRam[barLine * 320 + x] = ((this.frameCount + x) & 0xff);
      }
    }
  }

  // Draw 8-bit sprite with scaling
  private blitSprite(startX: number, startY: number, color: number, pattern: number[], scale = 2) {
    for (let row = 0; row < pattern.length; row++) {
      const byte = pattern[row];
      for (let bit = 0; bit < 8; bit++) {
        if ((byte & (0x80 >> bit)) !== 0) {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const px = startX + bit * scale + sx;
              const py = startY + row * scale + sy;
              if (px >= 0 && px < 320 && py >= 0 && py < 200) {
                this.videoRam[py * 320 + px] = color;
              }
            }
          }
        }
      }
    }
  }

  // Simple 7-segment digit drawer for scores
  private drawDigit(x: number, y: number, num: number, color: number) {
    const digitPatterns: number[][] = [
      [0x7e, 0x81, 0x81, 0x81, 0x7e], // 0
      [0x00, 0x82, 0xff, 0x80, 0x00], // 1
      [0x82, 0xc1, 0xa1, 0x91, 0x8e], // 2
      [0x42, 0x81, 0x89, 0x89, 0x76], // 3
      [0x30, 0x28, 0x24, 0xff, 0x20], // 4
      [0x4f, 0x89, 0x89, 0x89, 0x71], // 5
      [0x7e, 0x89, 0x89, 0x89, 0x72], // 6
      [0x01, 0xe1, 0x11, 0x09, 0x07], // 7
      [0x76, 0x89, 0x89, 0x89, 0x76], // 8
      [0x4e, 0x91, 0x91, 0x91, 0x7e], // 9
    ];
    const pat = digitPatterns[num % 10] || digitPatterns[0];
    for (let c = 0; c < pat.length; c++) {
      const col = pat[c];
      for (let r = 0; r < 8; r++) {
        if ((col & (1 << r)) !== 0) {
          const px = x + c * 2;
          const py = y + r * 2;
          if (px >= 0 && px < 320 && py >= 0 && py < 200) {
            this.videoRam[py * 320 + px] = color;
            this.videoRam[py * 320 + px + 1] = color;
            this.videoRam[(py + 1) * 320 + px] = color;
            this.videoRam[(py + 1) * 320 + px + 1] = color;
          }
        }
      }
    }
  }

  /**
   * Renders current 64,000-byte video RAM buffer through the 256-color VGA DAC palette
   * into a browser Canvas 2D context.
   */
  public renderToCanvas(ctx: CanvasRenderingContext2D, imgData: ImageData) {
    const data = imgData.data;
    const vram = this.videoRam;
    const pal = this.palette;

    for (let i = 0; i < 64000; i++) {
      const colorIdx = vram[i];
      const c = pal[colorIdx] || pal[0];
      const pIdx = i * 4;
      data[pIdx + 0] = c.r8;
      data[pIdx + 1] = c.g8;
      data[pIdx + 2] = c.b8;
      data[pIdx + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
  }
}
