import shinchanSourceGif from './assets/shinchan-source.gif';

export const PALETTE = {
  B: '#1a1a1a', S: '#f4c58a', R: '#cc2200', W: '#ffffff', P: '#ffb3b3',
  G: '#3d8a3d', g: '#2d6a2d', h: '#5aaf5a', F: '#ffffff', f: '#ffe600',
  p: '#d2a679', d: '#b08050',
  Y: '#F5E642', // Shin house yellow
  r: '#CC2200', // House roof / Red
  D: '#4A2800', // Brown door
  w: '#AEE4FF', // Window blue
  C: '#888888', // Chimney grey
  T: '#6B3A2A', // Tree trunk
  b: '#E8D5A3', // School beige
  o: '#2255CC', // School blue door
  M: '#3D1A5C', // Theater purple
  m: '#5C2E8A', // Theater overhang
  O: '#FFD700', // Gold marquee
  A: '#880000', // Red double doors
};

// Character sprites
export const SHIN_IDLE_1 = ["      BBBB      ","     BBBBBB     ","    B S BB B    ","   SSSSSSSSSS   ","   SSBBSSBBSS   ","   SSWWSSWWSS   ","  SPWBBSSWBBPS  ","  SSSSSSSSSSSS  ","   SSSSBBSSSS   ","     RRRRR      ","    SRRRRRS     ","    SRRRRRS     ","     WWWWW      ","     WWWWW      ","      S S       ","     YY YY      "];
export const SHIN_IDLE_2 = ["                ","      BBBB      ","     BBBBBB     ","    B S BB B    ","   SSSSSSSSSS   ","   SSBBSSBBSS   ","   SSWWSSWWSS   ","  SPWBBSSWBBPS  ","  SSSSSSSSSSSS  ","   SSSSBBSSSS   ","     RRRRR      ","    SRRRRRS     ","    SRRRRRS     ","     WWWWW      ","      S S       ","     YY YY      "];
export const SHIN_WALK_1 = ["      BBBB      ","     BBBBBB     ","    B S BB B    ","   SSSSSSSSSS   ","   SSBBSSBBSS   ","   SSWWSSWWSS   ","  SPWBBSSWBBPS  ","  SSSSSSSSSSSS  ","   SSSSBBSSSS   ","     RRRRR      ","    SRRRRRS     ","    SRRRRRS     ","     WWWWW      ","      W W       ","     Y  S       ","         Y      "];
export const SHIN_WALK_3 = ["      BBBB      ","     BBBBBB     ","    B S BB B    ","   SSSSSSSSSS   ","   SSBBSSBBSS   ","   SSWWSSWWSS   ","  SPWBBSSWBBPS  ","  SSSSSSSSSSSS  ","   SSSSBBSSSS   ","     RRRRR      ","    SRRRRRS     ","    SRRRRRS     ","     WWWWW      ","      W W       ","      S  Y      ","     Y          "];

// Tiles
export const TILE_GRASS_1 = ["GGGGGGGGGGGGGGGd","GGghGGGGGGGGgGGd","GgGgGGGGGGGGGGGd","GGGGGGGGGGhGGGGd","GGGGgGGGGGGgGGGd","GGGGhGGGGGGGGGGd","GGGGGGhGGGGGGGGd","GGgGGgGgGGGGgGGd","GGGGGGGGGGGGhGGd","GGGGGGGGgGGGGGGd","GGGGhGGGGGGGGGGd","GGGGGGGGGGgGgGGd","GGhGGGGGGGhGGGGd","GGGGGGgGGGGGGGGd","GGGGGGGGGGGGGGGd","dddddddddddddddd"];
export const TILE_GRASS_FLOWER = ["GGGGGGGGGGGGGGGd","GGGGGGGGGGGGgGGd","GGGGFGGGGGGGGGGd","GGGFfFGGGGhGGGGd","GGGGFGGGGGGgGGGd","GGGGhGGGGGGGGGGd","GGGGGGGGGGGGGGGd","GGgGGGGGGGGGgGGd","GGGGGGGGGGGGhGGd","GGGGGGGGgGGGGGGd","GGGGhGGGGGGGGGGd","GGGGGGGGGFGgGGGd","GGhGGGGGFfFGGGGd","GGGGGGgGGFGGGGGd","GGGGGGGGGGGGGGGd","dddddddddddddddd"];
export const TILE_GRASS_2 = ["GGGGgGGGGGGGGGGd","GGGGgGGGGGGGGGGd","GGGGGGGGGGhGGGGd","GGGGGGGGGGhGGGGd","GGgGGGGGGGGGGGGd","GGGGGGgGGGGGGGGd","GGGGGGGGGGGGGGGd","GGhGGGGGGgGGGGGd","GGGGGGGGGGGGGGGd","GGGGgGGGGGGGGhGd","GGGGGGGGGGGGGGGd","GGhGGGGGGGGGGGGd","GGGGGGGGgGGGGGGd","GGGGGGGGGGGGgGGd","GGGGGGGGGGGGGGGd","dddddddddddddddd"];
export const TILE_GRASS_3 = ["GGGGGGGGGGGGGGGd","GGGGGGGGGGhGGGGd","GGgGGGGGGGGGGGGd","GGgGGGGGGGGgGGGd","GGGGGGGGGGGGGGGd","GGGGhGGGGGGGGGGd","GGGGGGGGGGGGgGGd","GGgGGGGGGGGGGGGd","GGGGGGgGGGGGGGGd","GGhGGGGGGGGGGGGd","GGGGGGGGGGhGGGGd","GGGGGGgGGGGGGGGd","GGgGGGGGGGGGGGGd","GGGGGGGGGGgGGGGd","GGGGGGGGGGGGGGGd","dddddddddddddddd"];

export const TILE_PATH_1 = ["pppppppppppppppd","ppppdppppppppppd","ppppppppdppppppd","pppppppppppppppd","ppdppppppppppppd","ppppppppppdppppd","pppppppppppppppd","pppppdpppppppppd","pppppppppppppppd","pppppppppdpppppd","pppdpppppppppppd","pppppppppppppppd","pppppppppppdpppd","ppppppdppppppppd","pppppppppppppppd","dddddddddddddddd"];
export const TILE_PATH_2 = ["pppppppppppppppd","ppppdppppppppppd","pppppppppppppppd","ppppppppdppppppd","pppppppppppppppd","ppppppppppdppppd","pppppppppppppppd","pppppppppppppppd","ppdppppppppppppd","pppppppppdpppppd","pppppppppppppppd","pppppppppppppppd","pppppppppppdpppd","pppppppppppppppd","ppppppdppppppppd","dddddddddddddddd"];

export const SPRITEMAP = {};

export function renderSprite(matrix) {
  const canvas = document.createElement('canvas'); canvas.width = 16; canvas.height = 16;
  const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const char = matrix[y] ? matrix[y][x] : ' ';
      if (char && char !== ' ' && PALETTE[char]) {
        ctx.fillStyle = PALETTE[char]; ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  return canvas;
}

function createTransparentShinSprite(image) {
  const srcW = image.naturalWidth || image.width;
  const srcH = image.naturalHeight || image.height;

  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = srcW;
  sourceCanvas.height = srcH;
  const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  sourceCtx.drawImage(image, 0, 0, srcW, srcH);

  const imageData = sourceCtx.getImageData(0, 0, srcW, srcH);
  const pixels = imageData.data;

  const samples = [
    0,
    (srcW - 1) * 4,
    ((srcH - 1) * srcW) * 4,
    ((srcH - 1) * srcW + (srcW - 1)) * 4,
  ];

  let bgR = 0;
  let bgG = 0;
  let bgB = 0;
  for (let i = 0; i < samples.length; i += 1) {
    bgR += pixels[samples[i]];
    bgG += pixels[samples[i] + 1];
    bgB += pixels[samples[i] + 2];
  }
  bgR /= samples.length;
  bgG /= samples.length;
  bgB /= samples.length;

  let minX = srcW;
  let minY = srcH;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < srcH; y += 1) {
    for (let x = 0; x < srcW; x += 1) {
      const idx = (y * srcW + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      const dr = r - bgR;
      const dg = g - bgG;
      const db = b - bgB;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      const nearWhite = r > 240 && g > 240 && b > 240;

      if (dist < 52 || nearWhite) {
        pixels[idx + 3] = 0;
      }

      if (pixels[idx + 3] < 140) {
        pixels[idx + 3] = 0;
      } else {
        pixels[idx + 3] = 255;
      }

      if (pixels[idx + 3] > 24) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  sourceCtx.putImageData(imageData, 0, 0);

  if (minX > maxX || minY > maxY) {
    return renderSprite(SHIN_IDLE_1);
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const output = document.createElement('canvas');
  output.width = 16;
  output.height = 16;
  const outputCtx = output.getContext('2d', { willReadFrequently: true });
  outputCtx.imageSmoothingEnabled = false;

  const temp = document.createElement('canvas');
  temp.width = 64;
  temp.height = 64;
  const tempCtx = temp.getContext('2d');
  tempCtx.imageSmoothingEnabled = false;
  const tempScale = Math.min(58 / cropW, 58 / cropH);
  const tempW = Math.floor(cropW * tempScale);
  const tempH = Math.floor(cropH * tempScale);
  const tempX = Math.floor((64 - tempW) / 2);
  const tempY = Math.floor((64 - tempH) / 2);
  tempCtx.clearRect(0, 0, 64, 64);
  tempCtx.drawImage(sourceCanvas, minX, minY, cropW, cropH, tempX, tempY, tempW, tempH);

  outputCtx.drawImage(temp, 0, 0, 64, 64, 0, 0, 16, 16);

  return output;
}

function applyCustomShinSprite() {
  const image = new Image();
  image.onload = () => {
    const customShin = createTransparentShinSprite(image);
    SPRITEMAP.shin_idle1 = customShin;
    SPRITEMAP.shin_idle2 = customShin;
    SPRITEMAP.shin_walk1 = customShin;
    SPRITEMAP.shin_walk2 = customShin;
    SPRITEMAP.shin_walk3 = customShin;
    SPRITEMAP.shin_walk4 = customShin;
  };
  image.onerror = () => {
    console.warn('Could not load custom Shin-chan image, using default pixel sprite.');
  };
  image.src = shinchanSourceGif;
}

export const initSprites = () => {
  SPRITEMAP.shin_idle1 = renderSprite(SHIN_IDLE_1);
  SPRITEMAP.shin_idle2 = renderSprite(SHIN_IDLE_2);
  SPRITEMAP.shin_walk1 = renderSprite(SHIN_WALK_1);
  SPRITEMAP.shin_walk2 = renderSprite(SHIN_IDLE_1);
  SPRITEMAP.shin_walk3 = renderSprite(SHIN_WALK_3);
  SPRITEMAP.shin_walk4 = renderSprite(SHIN_IDLE_1);
  
  SPRITEMAP.grass_0 = renderSprite(TILE_GRASS_1);
  SPRITEMAP.grass_1 = renderSprite(TILE_GRASS_FLOWER);
  SPRITEMAP.grass_2 = renderSprite(TILE_GRASS_2);
  SPRITEMAP.grass_3 = renderSprite(TILE_GRASS_3);
  SPRITEMAP.path_0 = renderSprite(TILE_PATH_1);
  SPRITEMAP.path_1 = renderSprite(TILE_PATH_2);

  // BUILDINGS (Draw as single block off-screen canvas)
  SPRITEMAP.house = buildHouse();
  SPRITEMAP.park = buildPark();
  SPRITEMAP.school = buildSchool();
  SPRITEMAP.theater = buildTheater();

  applyCustomShinSprite();
};

function buildHouse() {
  const w = 5 * 16, h = 4 * 16;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
  
  // Base
  ctx.fillStyle = '#F5E642'; ctx.fillRect(16, 32, w-32, h-32);
  // Roof staircase
  ctx.fillStyle = '#CC2200';
  for(let i=0; i<32; i++) { ctx.fillRect(w/2 - i, i, i*2, 1); }
  ctx.fillRect(16, 30, w-32, 2);
  // Chimney
  ctx.fillStyle = '#888888'; ctx.fillRect(16, 0, 16, 32);
  // Door
  ctx.fillStyle = '#4A2800'; ctx.fillRect(w/2 - 8, h-32, 16, 32);
  // Windows
  ctx.fillStyle = '#AEE4FF';
  ctx.fillRect(20, h-24, 16, 16); ctx.fillRect(w-36, h-24, 16, 16);
  ctx.fillStyle = '#333333';
  ctx.fillRect(28, h-24, 1, 16); ctx.fillRect(20, h-16, 16, 1); // cross
  ctx.fillRect(w-28, h-24, 1, 16); ctx.fillRect(w-36, h-16, 16, 1);
  return c;
}

function buildPark() {
  const w = 5 * 16, h = 4 * 16;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
  
  // Gate
  ctx.fillStyle = '#888888';
  ctx.fillRect(w/2 - 16, h-32, 4, 32); ctx.fillRect(w/2 + 12, h-32, 4, 32);
  ctx.fillRect(w/2 - 16, h-32, 32, 4); // arch
  
  // Draw Trees
  const drawTree = (tx, ty) => {
    ctx.fillStyle = '#6B3A2A'; ctx.fillRect(tx+8, ty+16, 6, 16);
    ctx.fillStyle = '#2d6a2d'; ctx.beginPath(); ctx.arc(tx+11, ty+8, 12, 0, 2*Math.PI); ctx.fill();
    ctx.fillStyle = '#3d8a3d'; ctx.beginPath(); ctx.arc(tx+11, ty+6, 9, 0, 2*Math.PI); ctx.fill();
    ctx.fillStyle = '#5aaf5a'; ctx.beginPath(); ctx.arc(tx+11, ty+4, 5, 0, 2*Math.PI); ctx.fill();
  };
  drawTree(4, 10); drawTree(20, 4); drawTree(50, 10);
  
  // Bench
  ctx.fillStyle = '#888888'; ctx.fillRect(w-24, h-10, 2, 4); ctx.fillRect(w-10, h-10, 2, 4);
  ctx.fillStyle = '#6B3A2A'; ctx.fillRect(w-26, h-14, 20, 4);
  return c;
}

function buildSchool() {
  const w = 6 * 16, h = 4 * 16;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
  
  // Base
  ctx.fillStyle = '#E8D5A3'; ctx.fillRect(0, 16, w, h-16);
  // Parapet roof
  for(let i=0; i<w; i+=16) { ctx.fillRect(i, 0, 8, 16); ctx.fillRect(i+8, 8, 8, 8); }
  
  // Blue Door Arched
  ctx.fillStyle = '#2255CC';
  ctx.fillRect(w/2 - 8, h-24, 16, 24);
  for(let i=1; i<4; i++) { ctx.fillRect(w/2 - 8 + i, h-24 - i, 16 - i*2, 1); }
  
  // Banner
  ctx.fillStyle = '#CC2200'; ctx.fillRect(w/2 - 12, h-40, 24, 10);
  ctx.fillStyle = '#FFFFFF'; ctx.font = '8px monospace'; ctx.fillText('FK', w/2 - 5, h-32);
  
  // Windows
  ctx.fillStyle = '#AEE4FF';
  [12, 34, w-28].forEach(wx => { ctx.fillRect(wx, h-20, 12, 12); });
  return c;
}

function buildTheater() {
  const w = 5 * 16, h = 5 * 16;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
  
  // Base
  ctx.fillStyle = '#3D1A5C'; ctx.fillRect(0, 16, w, h-16);
  // Overhang
  ctx.fillStyle = '#5C2E8A'; ctx.fillRect(0, 16, w, 16);
  // Stars
  ctx.fillStyle = '#FFD700'; ctx.fillRect(8, 20, 2, 2); ctx.fillRect(w-10, 20, 2, 2);
  // Marquee
  ctx.fillStyle = '#000000'; ctx.fillRect(0, 32, w, 32);
  // Double doors
  ctx.fillStyle = '#880000'; ctx.fillRect(w/2 - 16, h-32, 32, 32);
  // Posters
  ctx.fillStyle = '#AEE4FF'; ctx.fillRect(4, h-40, 16, 24);
  ctx.fillStyle = '#fcdb05'; ctx.fillRect(w-20, h-40, 16, 24);
  
  return c;
}
