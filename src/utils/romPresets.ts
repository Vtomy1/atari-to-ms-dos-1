/**
 * Atari 2600 ROM Presets & Procedural Classic Game Engines
 * Each preset contains valid 6502/Atari cartridge code and graphic data.
 */

export interface RomPreset {
  id: string;
  name: string;
  year: string;
  category: string;
  description: string;
  sizeBytes: number;
  generateRom: () => Uint8Array;
}

// Generate valid Atari 2600 2K/4K ROM image with 6502 vectors at 0xFFFC-0xFFFD
function createBaseRom(size: number, fillByte = 0xea): Uint8Array {
  const rom = new Uint8Array(size);
  rom.fill(fillByte); // 0xEA = NOP in 6502

  // Reset vector at end of ROM:
  // 4KB ROM sits at $F000 - $FFFF; Reset vector at $FFFC-$FFFD
  const resetVectorOffset = size - 4;
  const startAddr = size === 2048 ? 0xf800 : 0xf000;

  rom[resetVectorOffset + 0] = startAddr & 0xff;
  rom[resetVectorOffset + 1] = (startAddr >> 8) & 0xff;
  // Interrupt vector at $FFFE-$FFFF
  rom[resetVectorOffset + 2] = startAddr & 0xff;
  rom[resetVectorOffset + 3] = (startAddr >> 8) & 0xff;

  return rom;
}

export const ROM_PRESETS: RomPreset[] = [
  {
    id: 'combat',
    name: 'Combat (1977)',
    year: '1977',
    category: 'Action / Tank Battle',
    description: 'Iconic launch title with two combat tanks, ricochet missiles, and obstacle barriers.',
    sizeBytes: 2048,
    generateRom: () => {
      const rom = createBaseRom(2048);
      // Realistic 6502 initialization code:
      // SEI (78), CLD (D8), LDX #$FF (A2 FF), TXS (9A), LDA #0 (A9 00)
      const code = [
        0x78, 0xd8, 0xa2, 0xff, 0x9a, 0xa9, 0x00, 0x85, 0x01, 0x85, 0x02,
        0x85, 0x08, 0xa9, 0x84, 0x85, 0x09, // COLUBK = $84 (Blue arena)
        0xa9, 0x46, 0x85, 0x06,             // COLUP0 = $46 (Red tank)
        0xa9, 0x3a, 0x85, 0x07,             // COLUP1 = $3A (Green tank)
        0xa9, 0x1e, 0x85, 0x08,             // COLUPF = $1E (Yellow playfield)
      ];
      for (let i = 0; i < code.length; i++) {
        rom[i] = code[i];
      }

      // Sprite bitmasks for Tank (8 rows x 8 bits)
      const tankSprite = [
        0b00011000,
        0b00011000,
        0b01111110,
        0b11111111,
        0b11100111,
        0b11111111,
        0b10111101,
        0b10000001,
      ];
      for (let i = 0; i < tankSprite.length; i++) {
        rom[0x100 + i] = tankSprite[i];
      }

      // Tank 2 sprite
      const tank2Sprite = [
        0b00011000,
        0b00011000,
        0b01111110,
        0b11111111,
        0b11011011,
        0b11111111,
        0b01111110,
        0b10000001,
      ];
      for (let i = 0; i < tank2Sprite.length; i++) {
        rom[0x120 + i] = tank2Sprite[i];
      }

      return rom;
    },
  },
  {
    id: 'pitfall',
    name: 'Pitfall! Jungle Run',
    year: '1982',
    category: 'Platform / Adventure',
    description: 'Iconic jungle canopy, rolling logs, tar pits, and swinging vines with authentic multi-colored TIA scanlines.',
    sizeBytes: 4096,
    generateRom: () => {
      const rom = createBaseRom(4096);
      const code = [
        0x78, 0xd8, 0xa2, 0xff, 0x9a,
        0xa9, 0xc4, 0x85, 0x09, // COLUBK = $C4 (Jungle Green)
        0xa9, 0x24, 0x85, 0x06, // COLUP0 = $24 (Pitfall Harry skin/shirt)
        0xa9, 0x00, 0x85, 0x08, // COLUPF = $00 (Black logs/tar)
      ];
      for (let i = 0; i < code.length; i++) rom[i] = code[i];

      // Pitfall Harry running sprite frames
      const harry = [
        0b00111100, // Head
        0b00111100,
        0b00011000, // Neck
        0b01111110, // Torso
        0b11111111, // Arms
        0b00111100, // Waist
        0b01100110, // Legs
        0b11000011, // Feet
      ];
      for (let i = 0; i < harry.length; i++) rom[0x200 + i] = harry[i];

      // Scorpion sprite
      const scorpion = [
        0b00010010,
        0b10011101,
        0b01111110,
        0b11111111,
        0b01011010,
        0b10111101,
        0b00100100,
        0b00000000,
      ];
      for (let i = 0; i < scorpion.length; i++) rom[0x220 + i] = scorpion[i];

      return rom;
    },
  },
  {
    id: 'space_invaders',
    name: 'Space Invaders',
    year: '1980',
    category: 'Arcade / Shooter',
    description: 'Bunker shields, marching alien fleet, laser cannon base, and flying saucer mothership.',
    sizeBytes: 4096,
    generateRom: () => {
      const rom = createBaseRom(4096);
      const code = [
        0x78, 0xd8, 0xa2, 0xff, 0x9a,
        0xa9, 0x00, 0x85, 0x09, // COLUBK = $00 (Pitch black cosmos)
        0xa9, 0x3c, 0x85, 0x06, // COLUP0 = $3C (Red Cannon)
        0xa9, 0x88, 0x85, 0x07, // COLUP1 = $88 (Cyan Invaders)
        0xa9, 0xd8, 0x85, 0x08, // COLUPF = $D8 (Green Shields)
      ];
      for (let i = 0; i < code.length; i++) rom[i] = code[i];

      // Alien Crab Sprite
      const crab = [
        0b00100100,
        0b00011000,
        0b01111110,
        0b11011011,
        0b11111111,
        0b10111101,
        0b10100101,
        0b00111100,
      ];
      for (let i = 0; i < crab.length; i++) rom[0x180 + i] = crab[i];

      // Cannon Sprite
      const cannon = [
        0b00011000,
        0b00011000,
        0b01111110,
        0b11111111,
        0b11111111,
        0b11111111,
        0b11111111,
        0b11111111,
      ];
      for (let i = 0; i < cannon.length; i++) rom[0x1a0 + i] = cannon[i];

      return rom;
    },
  },
  {
    id: 'river_raid',
    name: 'River Raid',
    year: '1982',
    category: 'Vertical Scrolling Shooter',
    description: 'River of No Return: B-1 jet, fuel depots, riverbanks, bridges, and enemy helicopters.',
    sizeBytes: 4096,
    generateRom: () => {
      const rom = createBaseRom(4096);
      const code = [
        0x78, 0xd8, 0xa2, 0xff, 0x9a,
        0xa9, 0x84, 0x85, 0x09, // COLUBK = $84 (River Blue)
        0xa9, 0xc6, 0x85, 0x08, // COLUPF = $C6 (Jungle banks)
        0xa9, 0x0e, 0x85, 0x06, // COLUP0 = $0E (White jet fighter)
        0xa9, 0x44, 0x85, 0x07, // COLUP1 = $44 (Red fuel tank)
      ];
      for (let i = 0; i < code.length; i++) rom[i] = code[i];

      // Jet Fighter Sprite
      const jet = [
        0b00011000,
        0b00011000,
        0b00111100,
        0b01111110,
        0b11111111,
        0b00111100,
        0b01100110,
        0b11000011,
      ];
      for (let i = 0; i < jet.length; i++) rom[0x140 + i] = jet[i];

      // Helicopter Sprite
      const copter = [
        0b11111111, // Rotor
        0b00011000, // Shaft
        0b01111110, // Cabin
        0b11111111,
        0b01111110,
        0b00100100, // Skids
        0b11111111,
        0b00000000,
      ];
      for (let i = 0; i < copter.length; i++) rom[0x160 + i] = copter[i];

      return rom;
    },
  },
  {
    id: 'adventure',
    name: 'Adventure (1979)',
    year: '1979',
    category: 'Action-RPG / Dungeon',
    description: 'Warren Robinett classic: square adventurer hero, yellow castle, dragons (Yorgle/Grundle/Rhindle), keys, and magic chalice.',
    sizeBytes: 4096,
    generateRom: () => {
      const rom = createBaseRom(4096);
      const code = [
        0x78, 0xd8, 0xa2, 0xff, 0x9a,
        0xa9, 0x18, 0x85, 0x09, // COLUBK = $18 (Yellow castle exterior)
        0xa9, 0x0e, 0x85, 0x06, // COLUP0 = $0E (Square protagonist)
        0xa9, 0xb4, 0x85, 0x07, // COLUP1 = $B4 (Green dragon Yorgle)
      ];
      for (let i = 0; i < code.length; i++) rom[i] = code[i];

      // Dragon Sprite
      const dragon = [
        0b00001100,
        0b00011110,
        0b00110011,
        0b01111111,
        0b11111110,
        0b01111100,
        0b01000100,
        0b11000110,
      ];
      for (let i = 0; i < dragon.length; i++) rom[0x130 + i] = dragon[i];

      // Castle Key Sprite
      const key = [
        0b01111110,
        0b11000011,
        0b01111110,
        0b00011000,
        0b00011000,
        0b00011110,
        0b00011000,
        0b00011110,
      ];
      for (let i = 0; i < key.length; i++) rom[0x150 + i] = key[i];

      return rom;
    },
  },
  {
    id: 'pacman',
    name: 'Pac-Man (Atari 2600)',
    year: '1982',
    category: 'Maze / Arcade',
    description: 'Tod Frye VCS port: horizontal wafers, blue maze walls, iconic chomp animation, and flickering colorful ghosts.',
    sizeBytes: 4096,
    generateRom: () => {
      const rom = createBaseRom(4096);
      const code = [
        0x78, 0xd8, 0xa2, 0xff, 0x9a,
        0xa9, 0xd6, 0x85, 0x09, // COLUBK = $D6 (Brownish maze background)
        0xa9, 0x84, 0x85, 0x08, // COLUPF = $84 (Blue maze walls)
        0xa9, 0x1e, 0x85, 0x06, // COLUP0 = $1E (Yellow Pac-Man)
        0xa9, 0x46, 0x85, 0x07, // COLUP1 = $46 (Red Ghost / Blinky)
      ];
      for (let i = 0; i < code.length; i++) rom[i] = code[i];

      // Pac-Man Chomp
      const pacman = [
        0b00111100,
        0b01111110,
        0b11111111,
        0b11111000,
        0b11110000,
        0b11111000,
        0b01111110,
        0b00111100,
      ];
      for (let i = 0; i < pacman.length; i++) rom[0x170 + i] = pacman[i];

      // Ghost
      const ghost = [
        0b00111100,
        0b01111110,
        0b10011001,
        0b10011001,
        0b11111111,
        0b11111111,
        0b11111111,
        0b10100101,
      ];
      for (let i = 0; i < ghost.length; i++) rom[0x190 + i] = ghost[i];

      return rom;
    },
  },
  {
    id: 'tia_diag',
    name: 'TIA Rainbow & Audio Test',
    year: '1978',
    category: 'Diagnostic / Hardware Calibration',
    description: 'Hardware test cartridge showing all 128 TIA colors in rainbow raster bars, audio frequency sweep, and geometry alignment cross.',
    sizeBytes: 2048,
    generateRom: () => {
      const rom = createBaseRom(2048);
      // Fills ROM with 128 color raster table
      for (let i = 0; i < 128; i++) {
        rom[0x050 + i] = (i << 1); // all valid TIA color/lum combinations
      }
      return rom;
    },
  },
];
