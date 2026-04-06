import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import './index.css';
import { SPRITEMAP, initSprites } from './sprites';
import angryEmoji from './assets/image.png';

// Initialize
initSprites();

const MAP_W = 25; 
const MAP_H = 18; 
const TILE_RES = 16;

const TOWN_MAP = Array(MAP_H).fill(0).map(() => Array(MAP_W).fill(0));
for (let y = 0; y < MAP_H; y++) {
  for (let x = 0; x < MAP_W; x++) {
    const r = Math.random();
    let bg = 'grass_0';
    if(r > 0.6 && r < 0.8) bg = 'grass_1';
    else if(r >= 0.8 && r < 0.9) bg = 'grass_2';
    else if(r >= 0.9) bg = 'grass_3';
    TOWN_MAP[y][x] = bg;
    if ((x >= 4 && x <= 20 && (y === 5 || y === 12)) || (y >= 5 && y <= 12 && (x === 4 || x === 20))) {
      TOWN_MAP[y][x] = Math.random()>0.5 ? 'path_0' : 'path_1';
    }
  }
}

const BUILDINGS = [
  { id: 'house', name: "Shin's House", w: 5, h: 4, tx: 2, ty: 1, sprite: 'house' },
  { id: 'park', name: "Kasukabe Park", w: 5, h: 4, tx: 15, ty: 1, sprite: 'park' },
  { id: 'kindergarten', name: "Futaba Kindergarten", w: 6, h: 4, tx: 2, ty: 13, sprite: 'school' },
  { id: 'theater', name: "Action Kamen Theater", w: 5, h: 5, tx: 15, ty: 12, sprite: 'theater' }
];

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(' ');
  let line = '';
  let currentY = y;

  for (let index = 0; index < words.length; index += 1) {
    const testLine = `${line}${words[index]} `;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && index > 0) {
      ctx.fillText(line, x, currentY);
      line = `${words[index]} `;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  ctx.fillText(line, x, currentY);
}

export default function App() {
  const [gameState, setGameState] = useState('intro');
  const [completedGames, setCompletedGames] = useState({ house: false, park: false, kindergarten: false, theater: false });
  const [profile, setProfile] = useState(() => {
    let savedScore = null;
    try {
      const raw = window.localStorage.getItem('girlfriendQuestTheaterScore');
      if (raw != null && raw !== '') {
        const parsed = Number(raw);
        if (Number.isFinite(parsed) && parsed > 0) savedScore = Math.floor(parsed);
      }
    } catch {}
    return { snackChoice: null, topChoice: null, quizAnswers: [], rhythmScore: null, theaterScore: savedScore };
  });
  const [player, setPlayer] = useState({ x: 12 * TILE_RES, y: 8 * TILE_RES, dir: 'down', moving: false });
  
  const allCompleted = Object.values(completedGames).every(Boolean);

  const exitBuilding = useCallback((buildingId, profileData = {}) => {
    if (typeof profileData.theaterScore === 'number' && Number.isFinite(profileData.theaterScore)) {
      try {
        window.localStorage.setItem('girlfriendQuestTheaterScore', String(Math.max(0, Math.floor(profileData.theaterScore))));
      } catch {}
    }
    setProfile(prev => ({ ...prev, ...profileData }));
    setCompletedGames(prev => ({ ...prev, [buildingId]: true }));
    setGameState('overworld');
    setPlayer(p => ({ ...p, y: p.y + TILE_RES }));
  }, []);

  const enterKindergarten = useCallback(() => setGameState('kindergarten'), []);
  const enterTheater = useCallback(() => setGameState('theater'), []);

  const worldLighting = (gameState === 'overworld' || gameState === 'transition') ? 'kasukabe-lighting' : '';

  return (
    <div className={`canvas-container ${worldLighting}`.trim()}>
      {gameState === 'intro' && <IntroStory onStart={() => setGameState('overworld')} />}
      {(gameState === 'overworld' || gameState === 'transition') && (
        <GameCanvas 
          player={player} setPlayer={setPlayer}
          completed={completedGames} allCompleted={allCompleted}
          enterKindergarten={enterKindergarten}
          enterTheater={enterTheater}
          onEnterSnack={() => setGameState('snack')}
          onEnterPark={() => setGameState('park')}
          onEnterSlides={() => setGameState('slides')}
        />
      )}
      
      {gameState === 'snack' && <SnackGame onFinish={(data) => exitBuilding('house', data)} />}
      {gameState === 'park' && <ParkGame onFinish={(data) => exitBuilding('park', data)} />}
      {gameState === 'kindergarten' && <KindergartenGame onFinish={(data) => exitBuilding('kindergarten', data)} />}
      {gameState === 'theater' && <TheaterGame profile={profile} onFinish={(data) => exitBuilding('theater', data)} />}
      
      {gameState === 'slides' && <SlideDeck profile={profile} />}
    </div>
  );
}

function IntroStory({ onStart }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        onStart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div className="intro-screen">
      <div className="intro-frame">
        <p className="intro-kicker">A Shin-chan story</p>
        <h1 className="intro-title">one ridiculous afternoon in Kasukabe</h1>
        <p className="intro-copy">
          The pudding is missing, Kazama has invented a park election, Yoshinaga-sensei's diary has
          fallen into the wrong hands, and Action Kamen's stage show is collapsing on stage. Shin-chan
          needs help surviving the entire day without letting the chaos escape.
        </p>
        <p className="intro-copy">
          Help him solve the pudding case, win the park debate, sit through the classroom crisis,
          and shoot through the theater disaster. The story is his. You just make the decisions.
        </p>
        <button className="snes-button intro-start" onClick={onStart}>Start the chaos</button>
        <p className="intro-hint">Press Space or Enter to begin.</p>
      </div>
    </div>
  );
}

// ================= CANVAS ENGINE =================
function GameCanvas({
  player,
  setPlayer,
  completed,
  allCompleted,
  enterKindergarten,
  enterTheater,
  onEnterSnack,
  onEnterPark,
  onEnterSlides,
}) {
  const canvasRef = useRef(null);
  const keys = useRef({});
  const lastTime = useRef(performance.now());
  const dialogue = useRef(null);
  const wipeTarget = useRef(null);
  const wipeProg = useRef(0);
  const [readySlide, setReadySlide] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const kd = (e) => { keys.current[e.key] = true; };
    const ku = (e) => { keys.current[e.key] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    
    return () => { 
       window.removeEventListener('resize', handleResize);
       window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); 
    };
  }, []);

  const drawWrappedText = (ctx, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(' '); let line = ''; let cy = y;
    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, cy);
        line = words[n] + ' '; cy += lineHeight;
      } else { line = testLine; }
    }
    ctx.fillText(line, x, cy);
  };

  const wrapCanvasText = (ctx, text, x, y, maxWidth, lineHeight) => {
    const words = String(text).split(' ');
    let line = '';
    let currentY = y;

    for (let index = 0; index < words.length; index += 1) {
      const testLine = `${line}${words[index]} `;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && index > 0) {
        ctx.fillText(line, x, currentY);
        line = `${words[index]} `;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }

    ctx.fillText(line, x, currentY);
  };

  const drawDialogueBox = (ctx, text, cvsW, cvsH) => {
    const boxH = 100;
    const boxY = 20;
    ctx.fillStyle = 'rgba(10, 10, 30, 0.92)';
    ctx.fillRect(16, boxY, cvsW - 32, boxH);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
    ctx.strokeRect(16, boxY, cvsW - 32, boxH);
    ctx.strokeStyle = '#333355'; ctx.lineWidth = 1;
    ctx.strokeRect(20, boxY + 4, cvsW - 40, boxH - 8);
    ctx.fillStyle = '#FFFFFF'; ctx.font = '10px "Press Start 2P"';
    drawWrappedText(ctx, text, 36, boxY + 30, cvsW - 64, 20);
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.fillText('▼', cvsW - 40, boxY + boxH - 16);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = false;
    let reqId;
    
    // Scale Logic
    const mapCols = MAP_W; const mapRows = MAP_H;
    
    const frame = (time) => {
      reqId = requestAnimationFrame(frame);
      ctx.imageSmoothingEnabled = false; 

      // Reset transforms
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const cvsW = canvas.width; const cvsH = canvas.height;
      const dt = time - lastTime.current;
      lastTime.current = time;

      // Scale the world to cover the full viewport instead of fitting inside it.
      const SCALE = Math.max(cvsW / (mapCols * TILE_RES), cvsH / (mapRows * TILE_RES));
      const TILE_W = TILE_RES * SCALE;
      
      const vW = cvsW / SCALE;
      const vH = cvsH / SCALE;

      // Handle wipe transition
      if (wipeTarget.current) {
         wipeProg.current += dt / 20; // 1 col per 20ms
         const cols = Math.floor(wipeProg.current);
         // Blank rects from left to right
         ctx.fillStyle = 'black';
         ctx.fillRect(0, 0, cols * TILE_W, cvsH);
         
         if (cols * TILE_W >= cvsW && wipeTarget.current !== 'pixelRain') {
           const target = wipeTarget.current;
           wipeTarget.current = null;
           if (target === 'snack') onEnterSnack();
           else if (target === 'park') onEnterPark();
         }
         if (wipeTarget.current === 'pixelRain') {
             if (cols * TILE_W >= cvsW + 400 && !readySlide) {
            setReadySlide(true); setTimeout(() => onEnterSlides(), 500);
             }
         }
         return; 
      }

      // Movement
      const moveSpeed = 60 * (dt / 1000); 
      let dx = 0; let dy = 0;
      if (keys.current['ArrowUp'] || keys.current['w']) dy = -moveSpeed;
      if (keys.current['ArrowDown'] || keys.current['s']) dy = moveSpeed;
      if (keys.current['ArrowLeft'] || keys.current['a']) dx = -moveSpeed;
      if (keys.current['ArrowRight'] || keys.current['d']) dx = moveSpeed;

      const moving = (dx !== 0 || dy !== 0);
      let newX = player.x; let newY = player.y;

      if (moving && !dialogue.current) {
         newX += dx; newY += dy;
         newX = Math.max(0, Math.min(newX, MAP_W * TILE_RES - TILE_RES));
         newY = Math.max(0, Math.min(newY, MAP_H * TILE_RES - TILE_RES));
         
         let nearBuilding = null;
         BUILDINGS.forEach(b => {
           const bx = b.tx * TILE_RES; const by = b.ty * TILE_RES;
           const centerX = bx + (b.w * TILE_RES) / 2;
           const entryY = by + b.h * TILE_RES - TILE_RES * 0.75;
           const playerCenterX = newX + TILE_RES / 2;
           const playerBottomY = newY + TILE_RES;
           const closeX = Math.abs(playerCenterX - centerX) < TILE_RES * 2;
           const closeY = Math.abs(playerBottomY - entryY) < TILE_RES * 1.5;
           if (closeX && closeY && !completed[b.id]) nearBuilding = b;
         });

         if (nearBuilding) dialogue.current = `Enter ${nearBuilding.name}?`;
         if (allCompleted) {
             const cx = Math.floor(MAP_W/2)*TILE_RES; const cy = Math.floor(MAP_H/2)*TILE_RES;
             if (Math.abs(newX - cx) < 20 && Math.abs(newY - cy) < 20 && !dialogue.current) {
                 dialogue.current = "FINAL_ACT";
             }
         }

         setPlayer(p => ({
            ...p, x: newX, y: newY, moving: true,
            dir: dx < 0 ? 'left' : (dx > 0 ? 'right' : p.dir)
         }));
      } else if (!moving && player.moving) {
         setPlayer(p => ({ ...p, moving: false }));
      }

      // Spacebar
      if (keys.current[' '] && dialogue.current) {
         keys.current[' '] = false;
         if (dialogue.current === "FINAL_ACT") {
             dialogue.current = null;
             wipeTarget.current = 'pixelRain'; wipeProg.current = 0;
         } else if (dialogue.current.startsWith('Enter')) {
           const building = BUILDINGS.find(b => dialogue.current.includes(b.name));
           const bId = building.id;
             dialogue.current = null;
           if (bId === 'house') {
             wipeTarget.current = 'snack';
             wipeProg.current = 0;
           } else if (bId === 'park') {
             wipeTarget.current = 'park';
             wipeProg.current = 0;
           } else if (bId === 'kindergarten') {
             enterKindergarten();
           } else if (bId === 'theater') {
             enterTheater();
           }
         }
      }

      if (keys.current['Escape'] && dialogue.current && dialogue.current.startsWith('Enter')) {
        keys.current['Escape'] = false;
        dialogue.current = null;
      }

      // Camera Math (Zelda follow)
      let camX = player.x - Math.floor(vW / 2);
      let camY = player.y - Math.floor(vH / 2);
      camX = Math.max(0, Math.min(camX, MAP_W * TILE_RES - vW));
      camY = Math.max(0, Math.min(camY, MAP_H * TILE_RES - vH));
      camX = Math.floor(camX); camY = Math.floor(camY);

      // BG
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, cvsW, cvsH);

      // Start Scaled World Drawing
      ctx.save();
      ctx.scale(SCALE, SCALE);
      
      const startC = Math.max(0, Math.floor(camX / TILE_RES));
      const endC = Math.min(MAP_W, Math.ceil((camX + vW) / TILE_RES));
      const startR = Math.max(0, Math.floor(camY / TILE_RES));
      const endR = Math.min(MAP_H, Math.ceil((camY + vH) / TILE_RES));

      for (let y = startR; y < endR; y++) {
         for (let x = startC; x < endC; x++) {
            const tileKey = TOWN_MAP[y][x];
            ctx.drawImage(SPRITEMAP[tileKey], x * TILE_RES - camX, y * TILE_RES - camY);
         }
      }

      // Collect items for Depth Sorting (Y Coordinate)
      const renderQueue = [];
      BUILDINGS.forEach(b => {
          const px = b.tx * TILE_RES - camX; const py = b.ty * TILE_RES - camY;
          renderQueue.push({ type: 'building', b, y: b.ty * TILE_RES + b.h * TILE_RES, px, py });
      });

      const ppx = Math.floor(player.x - camX); const ppy = Math.floor(player.y - camY);
      renderQueue.push({ type: 'player', y: Math.floor(player.y), px: ppx, py: ppy });
      
      if (allCompleted) {
        renderQueue.push({ type: 'door', y: Math.floor((MAP_H/2)*TILE_RES), px: Math.floor((MAP_W/2)*TILE_RES) - camX, py: Math.floor((MAP_H/2)*TILE_RES) - camY });
      }

      renderQueue.sort((a,b) => a.y - b.y);

      // Draw Sorted
      renderQueue.forEach(item => {
         if (item.type === 'building') {
            const { b, px, py } = item;
            // Shadow (2 tile dark, offset 3px)
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(px + 3, py + 3, b.w * TILE_RES, b.h * TILE_RES);
            // Sprite
            if (SPRITEMAP[b.sprite]) ctx.drawImage(SPRITEMAP[b.sprite], px, py);
            
            if (completed[b.id]) {
                ctx.fillStyle = '#fcdb05'; ctx.font = '8px monospace'; ctx.fillText('v', px + 4, py - 4);
            }
            // Sparkle
            if (dialogue.current && dialogue.current.includes(b.name) && Math.floor(time / 200) % 2 === 0) {
                const spx = px + (b.w*TILE_RES)/2 - 8;
                if(SPRITEMAP.sparkle) ctx.drawImage(SPRITEMAP.sparkle, spx, py - 16);
            }
         } else if (item.type === 'door') {
            ctx.fillStyle = '#fcdb05'; ctx.fillRect(item.px, item.py, TILE_RES, TILE_RES);
            ctx.fillStyle = '#000'; ctx.fillRect(item.px+4, item.py+4, 8, 8);
         } else if (item.type === 'player') {
            let spr = SPRITEMAP.shin_idle1;
            if (player.moving) {
               const idx = Math.floor(time / 150) % 4;
               if(idx===0) spr = SPRITEMAP.shin_walk1;
               else if(idx===1) spr = SPRITEMAP.shin_walk2;
               else if(idx===2) spr = SPRITEMAP.shin_walk3;
               else spr = SPRITEMAP.shin_walk4;
            } else {
               spr = Math.floor(time / 400) % 2 === 0 ? SPRITEMAP.shin_idle1 : SPRITEMAP.shin_idle2;
            }
            ctx.save();
            if (player.dir === 'left') {
               ctx.translate(item.px + TILE_RES, item.py); ctx.scale(-1, 1);
               ctx.drawImage(spr, 0, 0);
            } else {
               ctx.drawImage(spr, item.px, item.py);
            }
            ctx.restore();
         }
      });
      ctx.restore(); // Restore Scale for unscaled/ui elements

      // Name Labels (Floats, drawn at scale 1x crisp text relative to canvas)
      renderQueue.forEach(item => {
         if (item.type === 'building' || item.type === 'player') {
             const label = item.type === 'player' ? "Schin-chan" : item.b.name;
             const realX = item.px * SCALE; 
             const realY = item.py * SCALE;
             const cx = realX + ((item.type==='player'?16:item.b.w*16)/2)*SCALE;
             const labelFontSize = item.type === 'building' ? 18 : 12;
             const labelPaddingY = item.type === 'building' ? 18 : 12;
             const labelBoxHeight = item.type === 'building' ? 22 : 16;
             
           ctx.font = `${labelFontSize}px "Press Start 2P"`;
             const w = ctx.measureText(label).width;
             const lx = Math.floor(cx - w/2);
           const ly = Math.floor(realY - labelPaddingY * SCALE);
             
             // Backing
             ctx.fillStyle = 'rgba(0,0,0,0.7)';
           ctx.fillRect(lx - 4, ly - 10, w + 8, labelBoxHeight);
             ctx.fillStyle = '#FFF'; 
             ctx.fillText(label, lx, ly);
         }
      });

      // UI
      if (dialogue.current) {
         if (dialogue.current === "FINAL_ACT") {
            drawDialogueBox(ctx, "Shin-chan: Okay so... my friend Niggesh told me to show you something. He's too scared to do it himself obviously. Big surprise.", cvsW, cvsH);
        } else {
          drawDialogueBox(ctx, `Shin-chan: ${dialogue.current} Space = yes, Esc = no.`, cvsW, cvsH);
         }
      }
    };

    reqId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(reqId);
  }, [player, completed, allCompleted, readySlide, onEnterSlides]);

  return <canvas ref={canvasRef} style={{display:'block'}} />;
}

// ================= DOM MINI GAMES =================

function SnackGame({ onFinish }) {
  const canvasRef = useRef(null);
  const [sceneStarted, setSceneStarted] = useState(false);
  const roundRef = useRef(0);
  const hoverRef = useRef(-1);
  const selectedRef = useRef({ side: -1, at: 0 });
  const boardsRef = useRef([]);
  const transitionRef = useRef({ mode: 'idle', start: 0, nextRound: 0 });
  const typeRef = useRef({ full: '', shown: '', at: 0 });
  const dialogueRef = useRef({ full: '', shown: '', at: 0 });
  const webImagesRef = useRef({ ready: false, assets: {} });
  const continueBtnRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const rounds = [
    { left: { id: 'biscuits', name: 'Chocolate Biscuits' }, right: { id: 'chips', name: 'Chips' }, line: 'Round 1. Exhibit A versus B. Pick the guilty snack.' },
    { left: { id: 'biryani', name: 'Biryani' }, right: { id: 'pizza', name: 'Pizza Slice' }, line: 'Round 2. Biryani against pizza. Court is watching.' },
    { left: { id: 'mango', name: 'Mango Ice Cream' }, right: { id: 'chocoIce', name: 'Chocolate Ice Cream' }, line: 'Round 3. Two frozen suspects. One verdict.' },
    { left: { id: 'maggi', name: 'Maggi' }, right: { id: 'burger', name: 'Burger' }, line: 'Round 4. Noodles versus burger. Choose wisely.' },
    { left: { id: 'samosa', name: 'Samosa' }, right: { id: 'chai', name: 'Chai Cup' }, line: 'Round 5. Samosa and chai are on trial.' },
    { left: { id: 'coffee', name: 'Cold Coffee' }, right: { id: 'pudding', name: 'Kasukabe Pudding' }, line: 'Final round. Legendary pudding enters the courtroom.' }
  ];

  const setDialogue = (txt, now) => {
    dialogueRef.current = { full: txt, shown: '', at: now };
  };

  const setHoverType = (txt, now) => {
    typeRef.current = { full: txt, shown: '', at: now };
  };

  const drawFood = (ctx, id, x, y, scale, time) => {
    const webFood = webImagesRef.current.assets[id];
    if (webFood && webFood.complete) {
      const size = Math.max(70, Math.min(150, 58 * scale));
      ctx.save();
      ctx.translate(x, y);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;
      ctx.drawImage(webFood, -size / 2, -size / 2, size, size);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    if (id === 'biscuits') {
      ctx.fillStyle = '#FFD700'; ctx.fillRect(-36, 24, 72, 12);
      ctx.fillStyle = '#6B3A2A'; ctx.fillRect(-34, -20, 68, 48);
      ctx.fillStyle = '#3D1A0A'; for (let yy = -18; yy < -2; yy += 4) ctx.fillRect(-30, yy, 60, 2);
      ctx.fillStyle = '#8B5A3A'; for (let yy = -2; yy < 20; yy += 6) for (let xx = -26; xx < 26; xx += 8) ctx.fillRect(xx, yy, 3, 3);
    } else if (id === 'chips') {
      ctx.fillStyle = '#FFD700'; ctx.fillRect(-30, -28, 60, 18); ctx.fillRect(-36, -10, 72, 36); ctx.fillRect(-25, 26, 50, 20);
      ctx.fillStyle = '#CC2200'; for (let i = -28; i < 34; i += 6) ctx.fillRect(i, -4 + Math.floor(i / 10), 16, 4);
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-14, 4, 30, 18);
      ctx.fillStyle = '#FFDB58'; ctx.beginPath(); ctx.ellipse(0, -18, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
    } else if (id === 'biryani') {
      ctx.fillStyle = '#8B4513'; ctx.fillRect(-40, 16, 80, 24);
      ctx.fillStyle = '#FFFFF0'; ctx.fillRect(-34, -8, 68, 24);
      ctx.fillStyle = '#FFD700'; for (let i = -30; i < 32; i += 6) ctx.fillRect(i, -4 + ((i / 6) % 2), 4, 4);
      ctx.fillStyle = '#CC2200'; for (let i = 0; i < 9; i += 1) ctx.fillRect(-28 + i * 6, 6 + (i % 3), 2, 2);
      ctx.fillStyle = '#2D8A2D'; for (let i = 0; i < 8; i += 1) ctx.fillRect(-26 + i * 7, 10 + (i % 2), 3, 2);
    } else if (id === 'pizza') {
      ctx.fillStyle = '#E8922A'; ctx.beginPath(); ctx.moveTo(-44, 26); ctx.lineTo(44, 26); ctx.lineTo(0, -36); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#C47820'; ctx.fillRect(-44, 18, 88, 10);
      ctx.fillStyle = '#CC2200'; ctx.fillRect(-36, 8, 72, 8);
      ctx.fillStyle = '#FFD700'; ctx.fillRect(-38, -20, 76, 30);
      ctx.fillStyle = '#8B0000'; [-18, 8, -2, 18, -26].forEach((xx, i) => { ctx.beginPath(); ctx.arc(xx, -6 + i * 5, 4, 0, Math.PI * 2); ctx.fill(); });
    } else if (id === 'mango' || id === 'chocoIce') {
      ctx.fillStyle = '#C4935A'; ctx.beginPath(); ctx.moveTo(-24, 34); ctx.lineTo(24, 34); ctx.lineTo(0, -18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = id === 'mango' ? '#FF9A3C' : '#4A2200'; ctx.beginPath(); ctx.arc(0, -26, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFF'; ctx.fillRect(-10, -34, 6, 6);
    } else if (id === 'maggi') {
      ctx.fillStyle = '#EEEEEE'; ctx.fillRect(-40, 14, 80, 30);
      ctx.fillStyle = '#AAAAAA'; ctx.fillRect(-40, 14, 80, 3);
      const cols = ['#FF9A3C', '#FFB347', '#FFC870'];
      for (let i = 0; i < 10; i += 1) { ctx.fillStyle = cols[i % 3]; ctx.fillRect(-34 + i * 7, 22 + (i % 2) * 2, 16, 2); }
    } else if (id === 'burger') {
      ctx.fillStyle = '#E8922A'; ctx.fillRect(-40, 20, 80, 16);
      ctx.fillStyle = '#3D1A00'; ctx.fillRect(-37, 8, 74, 12);
      ctx.fillStyle = '#FFD700'; ctx.fillRect(-40, 0, 80, 8);
      ctx.fillStyle = '#3D8A3D'; for (let i = -42; i <= 42; i += 8) ctx.fillRect(i, -8 + ((i / 8) % 2), 8, 8);
      ctx.fillStyle = '#E8922A'; ctx.beginPath(); ctx.ellipse(0, -16, 40, 16, 0, 0, Math.PI * 2); ctx.fill();
    } else if (id === 'samosa') {
      ctx.fillStyle = '#C4935A'; ctx.beginPath(); ctx.moveTo(-34, 30); ctx.lineTo(34, 30); ctx.lineTo(0, -30); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#B08040'; for (let yy = 24; yy > -22; yy -= 8) ctx.fillRect(-26 + ((yy / 8) % 2) * 4, yy, 52, 2);
    } else if (id === 'chai') {
      ctx.fillStyle = '#FFFFF0'; ctx.fillRect(-22, -8, 44, 50);
      ctx.fillStyle = '#8B4513'; ctx.fillRect(-18, -4, 36, 34);
      ctx.fillStyle = '#EEEEEE'; ctx.beginPath(); ctx.ellipse(0, 42, 32, 6, 0, 0, Math.PI * 2); ctx.fill();
    } else if (id === 'coffee') {
      ctx.strokeStyle = '#AAAAAA'; ctx.lineWidth = 2; ctx.strokeRect(-20, -24, 40, 70);
      ctx.fillStyle = '#3D1A00'; ctx.fillRect(-18, 18, 36, 26);
      ctx.fillStyle = '#C4935A'; ctx.fillRect(-18, 3, 36, 15);
      ctx.fillStyle = '#FFFDE0'; ctx.fillRect(-18, -12, 36, 15);
    } else if (id === 'pudding') {
      const pulse = 1 + Math.sin(time / 280) * 0.03;
      ctx.scale(pulse, pulse);
      ctx.fillStyle = 'rgba(255,215,0,0.2)'; ctx.beginPath(); ctx.arc(0, 0, 64, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
      for (let i = 0; i < 8; i += 1) {
        const a = (Math.PI * 2 * i) / 8;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * 34, Math.sin(a) * 34); ctx.lineTo(Math.cos(a) * 56, Math.sin(a) * 56); ctx.stroke();
      }
      ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.ellipse(0, 8, 36, 28, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#C47820'; ctx.fillRect(-24, -6, 4, 20); ctx.fillRect(-8, -12, 4, 24); ctx.fillRect(8, -8, 4, 20); ctx.fillRect(20, -6, 4, 18);
    }
    ctx.restore();
  };

  useEffect(() => {
    let cancelled = false;
    const urls = {
      biscuits: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f36a.png',
      chips: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f35f.png',
      biryani: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f35b.png',
      pizza: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f355.png',
      mango: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f96d.png',
      chocoIce: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f368.png',
      maggi: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f35c.png',
      burger: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f354.png',
      samosa: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f95f.png',
      chai: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2615.png',
      coffee: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f964.png',
      pudding: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f36e.png'
    };
    const entries = Object.entries(urls);
    const loaded = {};
    let complete = 0;
    entries.forEach(([key, url]) => {
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        loaded[key] = img;
        complete += 1;
        if (complete === entries.length) webImagesRef.current = { ready: true, assets: loaded };
      };
      img.onerror = () => {
        complete += 1;
        if (complete === entries.length) webImagesRef.current = { ready: Object.keys(loaded).length > 0, assets: loaded };
      };
      img.src = url;
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.imageSmoothingEnabled = false;
    };

    const beginRound = (idx, now) => {
      setDialogue(rounds[idx].line, now);
      setHoverType('', now);
      selectedRef.current = { side: -1, at: 0 };
    };

    const onMove = (event) => {
      if (!sceneStarted) {
        canvas.style.cursor = 'default';
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const hit = boardsRef.current.findIndex(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
      hoverRef.current = hit;
      canvas.style.cursor = hit >= 0 ? 'pointer' : 'default';
      if (hit >= 0) {
        const item = hit === 0 ? rounds[roundRef.current].left.name : rounds[roundRef.current].right.name;
        const text = `EXHIBIT ${roundRef.current + 1}: ${item.toUpperCase()}`;
        if (text !== typeRef.current.full) setHoverType(text, performance.now());
      }
    };

    const onDown = (event) => {
      const now = performance.now();
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (!sceneStarted) {
        const btn = continueBtnRef.current;
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          setSceneStarted(true);
          setDialogue('Round 1. Exhibit A versus B. Pick the guilty snack.', now);
        }
        return;
      }

      if (transitionRef.current.mode !== 'idle' || selectedRef.current.side !== -1) return;
      const side = boardsRef.current.findIndex(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
      if (side < 0) return;
      const currentRound = rounds[roundRef.current];
      const picked = side === 0 ? currentRound.left : currentRound.right;
      selectedRef.current = { side, at: now };
      setDialogue(`GUILTY STAMPED. ${picked.name.toUpperCase()} ENTERS THE RECORD.`, now);

      const nextRound = roundRef.current + 1;
      if (nextRound >= rounds.length) {
        window.setTimeout(() => onFinish({ snackChoice: picked.name }), 900);
      } else {
        window.setTimeout(() => {
          transitionRef.current = { mode: 'exit', start: performance.now(), nextRound };
        }, 850);
      }
    };

    resize();
    beginRound(0, performance.now());

    window.addEventListener('resize', resize);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);

    let frameId = 0;
    const render = (time) => {
      frameId = requestAnimationFrame(render);
      const w = canvas.width;
      const h = canvas.height;
      const fs = Math.max(8, Math.floor(Math.min(w, h) * 0.011));
      ctx.clearRect(0, 0, w, h);

      // Background room
      const wallGradient = ctx.createLinearGradient(0, 0, 0, h * 0.56);
      wallGradient.addColorStop(0, '#efe3c3');
      wallGradient.addColorStop(1, '#dcc89f');
      ctx.fillStyle = wallGradient;
      ctx.fillRect(0, 0, w, h * 0.56);
      ctx.fillStyle = '#b99763';
      ctx.fillRect(0, 0, w, 18);
      ctx.fillStyle = '#7a5a2f';
      ctx.fillRect(0, h * 0.56 - 5, w, 5);
      const floorCellW = Math.max(72, Math.floor(w * 0.06));
      const floorCellH = Math.max(34, Math.floor(h * 0.045));
      for (let y = Math.floor(h * 0.56); y < h; y += floorCellH) {
        for (let x = 0; x < w; x += floorCellW) {
          ctx.fillStyle = ((x / floorCellW + y / floorCellH) % 2 === 0) ? '#b79562' : '#a98958';
          ctx.fillRect(x, y, floorCellW, floorCellH);
          ctx.strokeStyle = '#8d6f45'; ctx.lineWidth = 1; ctx.strokeRect(x, y, floorCellW, floorCellH);
        }
      }

      // Decorative walls
      ctx.fillStyle = '#f4ecd7';
      ctx.fillRect(w * 0.05, 30, w * 0.15, h * 0.34);
      ctx.strokeStyle = '#8B6230'; ctx.lineWidth = 2; ctx.strokeRect(w * 0.05, 30, w * 0.15, h * 0.34);
      ctx.fillStyle = '#f4ecd7';
      ctx.fillRect(w * 0.8, 30, w * 0.15, h * 0.34);
      ctx.strokeStyle = '#8B6230'; ctx.lineWidth = 2; ctx.strokeRect(w * 0.8, 30, w * 0.15, h * 0.34);

      // Banner
      ctx.save();
      ctx.translate(w * 0.5, h * 0.12);
      ctx.rotate(-2 * Math.PI / 180);
      ctx.fillStyle = '#FFFDE0'; ctx.fillRect(-w * 0.12, -18, w * 0.24, 36);
      ctx.fillStyle = '#CC2200'; ctx.beginPath(); ctx.arc(-w * 0.12, -18, 4, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(w * 0.12, -18, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#CC2200'; ctx.font = `${Math.max(6, fs - 3)}px "Press Start 2P"`; ctx.fillText('COURT OF JUSTICE (shin-chan presiding)', -w * 0.1, 4);
      ctx.restore();

      // Desk and shin
      const deskW = Math.max(180, w * 0.16);
      const deskH = Math.max(24, h * 0.03);
      const deskX = w * 0.5 - deskW / 2;
      const deskY = h * 0.45;
      ctx.fillStyle = '#8B6230'; ctx.fillRect(deskX, deskY, deskW, deskH);
      ctx.fillStyle = '#7A5220'; ctx.fillRect(deskX + 10, deskY + 8, deskW - 20, 2);
      ctx.fillStyle = '#FFD700'; ctx.fillRect(deskX + deskW * 0.52, deskY + 6, 12, 14);

      const slam = Math.floor(time / 2200) % 2 === 1 && (time % 2200) < 160;
      const shakeX = slam ? (Math.random() - 0.5) * 2 : 0;
      const shakeY = slam ? (Math.random() - 0.5) * 2 : 0;
      const shinSize = Math.max(72, h * 0.12);
      if (SPRITEMAP.shin_idle1 && SPRITEMAP.shin_idle1.complete) {
        ctx.drawImage(SPRITEMAP.shin_idle1, 0, 0, 16, 16, w * 0.5 - shinSize / 2 + shakeX, h * 0.34 + shakeY, shinSize, shinSize);
      } else {
        ctx.fillStyle = '#ffebc8'; ctx.fillRect(w * 0.5 - 18 + shakeX, h * 0.36 + shakeY, 36, 36);
      }
      ctx.fillStyle = '#000'; ctx.fillRect(w * 0.5 - 16 + shakeX, h * 0.34 + shakeY, 32, 8);
      ctx.fillStyle = '#8B4513'; ctx.fillRect(w * 0.5 + 20 + shakeX, h * 0.34 + (slam ? 8 : 0) + shakeY, 3, 38);
      ctx.fillStyle = '#CC2200'; ctx.fillRect(w * 0.5 + 18 + shakeX, h * 0.33 + (slam ? 8 : 0) + shakeY, 8, 8);

      // Transition and board positioning
      let p = 0;
      if (transitionRef.current.mode !== 'idle') {
        p = Math.min(1, (time - transitionRef.current.start) / 320);
        if (p >= 1 && transitionRef.current.mode === 'exit') {
          roundRef.current = transitionRef.current.nextRound;
          beginRound(roundRef.current, time);
          transitionRef.current = { mode: 'enter', start: time, nextRound: roundRef.current };
        } else if (p >= 1 && transitionRef.current.mode === 'enter') {
          transitionRef.current = { mode: 'idle', start: 0, nextRound: roundRef.current };
        }
      }

      const boardW = Math.max(320, w * 0.24);
      const boardH = Math.max(260, h * 0.34);
      const baseY = h * 0.5;
      const leftBaseX = w * 0.26;
      const rightBaseX = w * 0.74;
      const leftX = transitionRef.current.mode === 'exit' ? leftBaseX - p * w * 0.55 : transitionRef.current.mode === 'enter' ? leftBaseX - (1 - p) * w * 0.55 : leftBaseX;
      const rightX = transitionRef.current.mode === 'exit' ? rightBaseX + p * w * 0.55 : transitionRef.current.mode === 'enter' ? rightBaseX + (1 - p) * w * 0.55 : rightBaseX;
      const currentRound = rounds[roundRef.current];

      const drawBoard = (cx, side, item) => {
        const hover = hoverRef.current === side;
        const by = baseY - boardH / 2 + (hover ? -5 : 0);
        const bx = cx - boardW / 2;
        boardsRef.current[side] = { x: bx, y: by, w: boardW, h: boardH };
        ctx.strokeStyle = '#8B6230'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(cx - boardW * 0.34, by + boardH + 32); ctx.lineTo(cx - boardW * 0.16, by + boardH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + boardW * 0.34, by + boardH + 32); ctx.lineTo(cx + boardW * 0.16, by + boardH); ctx.stroke();
        ctx.fillStyle = '#FFFDE0'; ctx.fillRect(bx, by, boardW, boardH);
        ctx.strokeStyle = hover ? '#FFD700' : '#333'; ctx.lineWidth = 4; ctx.strokeRect(bx, by, boardW, boardH);
        ctx.fillStyle = '#CC2200'; ctx.fillRect(bx + 16, by + 14, 104, 22);
        ctx.fillStyle = '#FFFDE0'; ctx.font = `${Math.max(6, fs - 3)}px "Press Start 2P"`; ctx.fillText(`EXHIBIT ${roundRef.current + 1 + side}`, bx + 22, by + 29);
        if (hover) {
          ctx.fillStyle = 'rgba(255,255,200,0.15)';
          ctx.beginPath(); ctx.moveTo(cx, 30); ctx.lineTo(cx - boardW * 0.32, by + boardH); ctx.lineTo(cx + boardW * 0.32, by + boardH); ctx.closePath(); ctx.fill();
        }
        const foodScale = Math.max(1.6, Math.min(boardW / 180, boardH / 150));
        drawFood(ctx, item.id, cx, by + boardH * 0.57, foodScale, time);

        // Always-visible food label under each item so names are not hover-only.
        ctx.fillStyle = 'rgba(10,10,30,0.85)';
        ctx.fillRect(bx + 16, by + boardH - 54, boardW - 32, 34);
        ctx.strokeStyle = hover ? '#FFD700' : '#8B6230';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + 16, by + boardH - 54, boardW - 32, 34);
        ctx.fillStyle = '#FFFDE0';
        ctx.font = `${Math.max(9, fs)}px "Press Start 2P"`;
        const label = item.name.toUpperCase();
        const maxLabelW = boardW - 56;
        const labelW = ctx.measureText(label).width;
        const labelX = bx + 16 + Math.max(8, (maxLabelW - labelW) / 2);
        ctx.fillText(label, labelX, by + boardH - 31);

        if (selectedRef.current.side === side) {
          const age = Math.min(1, (time - selectedRef.current.at) / 160);
          const scale = 2 - age;
          ctx.save();
          ctx.translate(cx, by + boardH * 0.56);
          ctx.rotate(-10 * Math.PI / 180);
          ctx.scale(scale, scale);
          ctx.fillStyle = 'rgba(204,34,0,0.88)'; ctx.fillRect(-64, -20, 128, 40);
          ctx.strokeStyle = '#8B0000'; ctx.strokeRect(-64, -20, 128, 40);
          ctx.fillStyle = '#FFF'; ctx.font = `${Math.max(10, fs + 2)}px "Press Start 2P"`; ctx.fillText('GUILTY', -46, 8);
          ctx.restore();
        }
      };

      drawBoard(leftX, 0, currentRound.left);
      drawBoard(rightX, 1, currentRound.right);

      // Top badge
      ctx.fillStyle = 'rgba(20,16,8,0.92)'; ctx.fillRect(w - 188, 12, 176, 40);
      ctx.strokeStyle = '#FFD700'; ctx.strokeRect(w - 188, 12, 176, 40);
      ctx.fillStyle = '#FFD700'; ctx.font = `${Math.max(9, fs)}px "Press Start 2P"`;
      ctx.fillText(`ROUND ${roundRef.current + 1}/${rounds.length}`, w - 174, 36);

      // Typewriter hover line
      if (sceneStarted && typeRef.current.full) {
        if (time >= typeRef.current.at && typeRef.current.shown.length < typeRef.current.full.length) {
          typeRef.current.shown = typeRef.current.full.slice(0, typeRef.current.shown.length + 1);
          typeRef.current.at = time + 24;
        }
        ctx.fillStyle = '#FFD700'; ctx.font = `${Math.max(8, fs - 1)}px "Press Start 2P"`;
        ctx.fillText(typeRef.current.shown, w * 0.28, h * 0.7);
      }

      // Dialogue typing
      if (time >= dialogueRef.current.at && dialogueRef.current.shown.length < dialogueRef.current.full.length) {
        dialogueRef.current.shown = dialogueRef.current.full.slice(0, dialogueRef.current.shown.length + 1);
        dialogueRef.current.at = time + 14;
      }
      const boxX = 16;
      const boxY = h - 150;
      const boxW = w - 32;
      const boxH = 134;
      ctx.fillStyle = 'rgba(10,10,30,0.93)'; ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2; ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.strokeStyle = '#333355'; ctx.lineWidth = 1; ctx.strokeRect(boxX + 4, boxY + 4, boxW - 8, boxH - 8);
      ctx.fillStyle = '#ffebc8'; ctx.fillRect(boxX + 16, boxY + 20, 22, 22);
      ctx.fillStyle = '#111'; ctx.fillRect(boxX + 19, boxY + 25, 4, 4); ctx.fillRect(boxX + 29, boxY + 25, 4, 4);
      ctx.fillStyle = '#c22'; ctx.fillRect(boxX + 21, boxY + 33, 10, 3);
      ctx.fillStyle = '#FFD700'; ctx.font = `${Math.max(10, fs + 1)}px "Press Start 2P"`; ctx.fillText('SHIN-CHAN', boxX + 46, boxY + 36);
      ctx.fillStyle = '#FFF';
      ctx.font = `${Math.max(10, fs)}px "Press Start 2P"`;
      wrapCanvasText(ctx, dialogueRef.current.shown, boxX + 22, boxY + 68, boxW - 44, Math.max(18, fs + 8));

      if (!sceneStarted) {
        ctx.fillStyle = 'rgba(8, 10, 20, 0.76)';
        ctx.fillRect(0, 0, w, h);

        const panelW = Math.min(980, w * 0.86);
        const panelH = Math.min(520, h * 0.72);
        const panelX = (w - panelW) / 2;
        const panelY = (h - panelH) / 2;
        ctx.fillStyle = 'rgba(12, 12, 34, 0.97)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        ctx.fillStyle = '#FFD700';
        ctx.font = `${Math.max(15, Math.floor(fs * 1.8))}px "Press Start 2P"`;
        ctx.fillText('SHIN\'S HOUSE: SNACK COURT', panelX + 28, panelY + 58);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${Math.max(10, Math.floor(fs * 1.2))}px "Press Start 2P"`;
        wrapCanvasText(
          ctx,
          'Story: Shin-chan has turned his house into a dramatic snack courtroom. Every round has two exhibits. Your job is to pick one snack each round and stamp it as guilty.',
          panelX + 28,
          panelY + 110,
          panelW - 56,
          Math.max(24, Math.floor(fs * 1.8))
        );
        wrapCanvasText(
          ctx,
          'How to play: Click one food card in each round. The game will move to the next matchup automatically.',
          panelX + 28,
          panelY + 250,
          panelW - 56,
          Math.max(24, Math.floor(fs * 1.8))
        );

        const btnW = Math.min(360, panelW * 0.5);
        const btnH = 72;
        const btnX = panelX + (panelW - btnW) / 2;
        const btnY = panelY + panelH - 108;
        continueBtnRef.current = { x: btnX, y: btnY, w: btnW, h: btnH };
        ctx.fillStyle = '#ffb347';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = '#3b1f00';
        ctx.lineWidth = 3;
        ctx.strokeRect(btnX, btnY, btnW, btnH);
        ctx.fillStyle = '#111';
        ctx.font = `${Math.max(12, Math.floor(fs * 1.4))}px "Press Start 2P"`;
        ctx.fillText('CLICK TO CONTINUE', btnX + 28, btnY + 44);
      }
    };

    frameId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.style.cursor = 'default';
    };
  }, [onFinish, sceneStarted]);

  return <canvas ref={canvasRef} className="interior-canvas" />;
}

function ParkGame({ onFinish }) {
  const canvasRef = useRef(null);
  const boardItems = useRef([
    'Eating Maggi at 2AM', 'Texting first after 3 days of silence', 'Going on a random trip with no plan',
    'Watching 6 episodes in one sitting', 'Sending a voice note instead of typing', 'Leaving without saying bye', 'Rewatching the same show a 3rd time'
  ]);
  const dragRef = useRef({ index: -1, offsetY: 0, active: false, pointerId: null });
  const [hoverDone, setHoverDone] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const getPos = (event) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const hitNote = (x, y) => {
      const w = canvas.width;
      const h = canvas.height;
      const boardX = w * 0.16;
      const boardY = h * 0.18;
      const boardW = w * 0.68;
      const noteX = boardX + 26;
      const noteW = boardW - 52;
      const positions = boardItems.current.map((_, index) => boardY + 40 + index * 66);
      for (let index = 0; index < positions.length; index += 1) {
        const noteY = positions[index];
        if (x >= noteX && x <= noteX + noteW && y >= noteY && y <= noteY + 48) return index;
      }
      return -1;
    };

    const pointerDown = (event) => {
      const { x, y } = getPos(event);
      const index = hitNote(x, y);
      if (index >= 0) {
        dragRef.current = { index, offsetY: y - (canvas.height * 0.18 + 40 + index * 66), active: true, pointerId: event.pointerId };
        if (typeof canvas.setPointerCapture === 'function') {
          try { canvas.setPointerCapture(event.pointerId); } catch {}
        }
        canvas.style.cursor = 'grabbing';
      }
    };

    const pointerMove = (event) => {
      if (dragRef.current.active && dragRef.current.pointerId != null && event.pointerId !== dragRef.current.pointerId) return;
      if (dragRef.current.active) {
        const { y } = getPos(event);
        const base = canvas.height * 0.18 + 40;
        const noteY = Math.max(base, Math.min(base + 6 * 66, y - dragRef.current.offsetY));
        const current = [...boardItems.current];
        const moving = current.splice(dragRef.current.index, 1)[0];
        const targetIndex = Math.max(0, Math.min(current.length, Math.round((noteY - base) / 66)));
        current.splice(targetIndex, 0, moving);
        boardItems.current = current;
        dragRef.current.index = targetIndex;
        canvas.style.cursor = 'grabbing';
        return;
      }

      const { x, y } = getPos(event);
      const hit = hitNote(x, y);
      if (hit >= 0) {
        canvas.style.cursor = 'grab';
      } else if (x > canvas.width * 0.81 && x < canvas.width * 0.81 + 120 && y > canvas.height * 0.82 && y < canvas.height * 0.82 + 42) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }
    };

    const pointerUp = (event) => {
      if (dragRef.current.pointerId != null && event.pointerId != null && dragRef.current.pointerId !== event.pointerId) return;
      if (dragRef.current.active && typeof canvas.releasePointerCapture === 'function' && dragRef.current.pointerId != null) {
        try { canvas.releasePointerCapture(dragRef.current.pointerId); } catch {}
      }
      dragRef.current = { index: -1, offsetY: 0, active: false, pointerId: null };
      canvas.style.cursor = 'default';
    };

    const doneClick = (event) => {
      const { y } = getPos(event);
      const { x } = getPos(event);
      if (!dragRef.current.active && x > canvas.width * 0.81 && x < canvas.width * 0.81 + 120 && y > canvas.height * 0.82 && y < canvas.height * 0.82 + 42) {
        onFinish({ topChoice: boardItems.current[0] });
      }
    };

    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', pointerUp);
    canvas.addEventListener('pointerdown', doneClick);

    let frameId = 0;
    const render = (time) => {
      frameId = requestAnimationFrame(render);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.4);
      sky.addColorStop(0, '#87CEEB');
      sky.addColorStop(1, '#B0E0FF');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h * 0.4);
      for (let y = h * 0.4; y < h; y += 16) {
        for (let x = 0; x < w; x += 16) {
          ctx.fillStyle = ((x / 16 + y / 16) % 3 === 0) ? '#5ea84b' : ((x / 16 + y / 16) % 3 === 1) ? '#6bb753' : '#4e9440';
          ctx.fillRect(x, y, 16, 16);
        }
      }
      const sway = Math.sin(time / 800) * 1.2;
      const drawTree = (x, y) => {
        ctx.fillStyle = '#6B3A2A'; ctx.fillRect(x, y + 42, 20, 88);
        ctx.fillStyle = '#2f6e2c'; ctx.beginPath(); ctx.ellipse(x + 10, y + 30, 42, 22, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3d8f3e'; ctx.beginPath(); ctx.ellipse(x + 10, y + 10, 30, 18, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#6abf4b'; ctx.beginPath(); ctx.ellipse(x + 10, y + 52, 34, 20, 0, 0, Math.PI * 2); ctx.fill();
      };
      drawTree(36 + sway, h * 0.28);
      drawTree(w - 120 - sway, h * 0.28);
      // swing set
      ctx.fillStyle = '#8B6914'; ctx.fillRect(w * 0.46, h * 0.42, 10, 150); ctx.fillRect(w * 0.56, h * 0.42, 10, 150); ctx.fillRect(w * 0.44, h * 0.42, w * 0.14, 10);
      ctx.fillStyle = '#5c3e13'; ctx.fillRect(w * 0.42, h * 0.55, w * 0.18, 8);
      ctx.fillStyle = '#ffd700'; for (let i = 0; i < 9; i += 1) ctx.fillRect(w * 0.44 + i * 18, h * 0.73, 4, 4);
      // Kazama on podium
      ctx.fillStyle = '#8B6914'; ctx.fillRect(w * 0.38, h * 0.42, 130, 22); ctx.fillRect(w * 0.41, h * 0.44, 18, 72); ctx.fillRect(w * 0.49, h * 0.44, 18, 72);
      ctx.fillStyle = '#1A1A6E'; ctx.fillRect(w * 0.425, h * 0.36, 52, 50); ctx.fillStyle = '#C8A850'; ctx.fillRect(w * 0.435, h * 0.34, 32, 16); ctx.fillStyle = '#fff'; ctx.font = '10px "Press Start 2P"'; ctx.fillText('VOTE', w * 0.428, h * 0.35);
      ctx.fillStyle = '#000'; ctx.fillRect(w * 0.445, h * 0.39, 5, 5); ctx.fillRect(w * 0.462, h * 0.39, 5, 5);
      // Shin-chan
      ctx.fillStyle = '#ffebc8'; ctx.fillRect(w * 0.58, h * 0.58, 24, 24); ctx.fillStyle = '#111'; ctx.fillRect(w * 0.585, h * 0.59, 5, 5); ctx.fillRect(w * 0.602, h * 0.59, 5, 5); ctx.fillStyle = '#c22'; ctx.fillRect(w * 0.592, h * 0.64, 12, 3);
      // board
      const boardX = w * 0.16, boardY = h * 0.18, boardW = w * 0.68, boardH = h * 0.56;
      ctx.fillStyle = '#8B6914'; ctx.fillRect(boardX, boardY, boardW, boardH);
      ctx.fillStyle = '#C4A882'; ctx.fillRect(boardX + 10, boardY + 10, boardW - 20, boardH - 20);
      ctx.strokeStyle = '#5d4421'; ctx.lineWidth = 4; ctx.strokeRect(boardX, boardY, boardW, boardH);
      ctx.fillStyle = '#2a1d10'; ctx.font = '12px "Press Start 2P"'; ctx.fillText('KAZAMA POLICY BOARD', boardX + 24, boardY + 26);
      ctx.fillText('DRAG NOTES UP OR DOWN', boardX + 24, boardY + 44);
      const base = boardY + 72;
      boardItems.current.forEach((item, index) => {
        const noteX = boardX + 26;
        const noteY = base + index * 66;
        ctx.fillStyle = '#f5e2b0'; ctx.fillRect(noteX, noteY, boardW - 52, 48);
        ctx.fillStyle = '#7b5a31'; ctx.fillRect(noteX + 8, noteY - 6, 8, 8);
        ctx.fillRect(noteX + boardW - 72, noteY - 6, 8, 8);
        ctx.fillStyle = '#1a1a1a'; ctx.font = '10px "Press Start 2P"'; ctx.fillText(`${index + 1}. ${item}`, noteX + 12, noteY + 28);
      });
      ctx.fillStyle = '#ffebc8'; ctx.fillRect(w * 0.07, h * 0.63, 80, 44);
      ctx.fillStyle = '#111'; ctx.font = '10px "Press Start 2P"'; ctx.fillText('SHIN-CHAN', w * 0.072, h * 0.65);
      ctx.fillText('ANNOTATES THE BOARD', w * 0.072, h * 0.68);
      ctx.fillStyle = 'rgba(10,12,32,0.92)'; ctx.fillRect(w * 0.18, h * 0.80, w * 0.64, 64); ctx.strokeStyle = '#fff'; ctx.strokeRect(w * 0.18, h * 0.80, w * 0.64, 64);
      ctx.fillStyle = '#fff'; ctx.font = '11px "Press Start 2P"'; ctx.fillText('KAZAMA made a park election. Shin-chan is ruining it with policy.', w * 0.2, h * 0.835);
      ctx.fillText('Drag the notes. Then click the board to lock it in.', w * 0.2, h * 0.865);
      const doneX = w * 0.81, doneY = h * 0.82;
      ctx.fillStyle = hoverDone ? '#ffb347' : '#ffd44d'; ctx.fillRect(doneX, doneY, 120, 42); ctx.fillStyle = '#000'; ctx.fillText('DONE', doneX + 38, doneY + 26);
    };
    render();
    const moveHover = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const doneHover = x > canvas.width * 0.81 && x < canvas.width * 0.81 + 120 && y > canvas.height * 0.82 && y < canvas.height * 0.82 + 42;
      setHoverDone(doneHover);
    };
    canvas.addEventListener('pointermove', moveHover);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointerdown', doneClick);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', pointerUp);
      canvas.removeEventListener('pointermove', moveHover);
      canvas.style.cursor = 'default';
    };
  }, [onFinish]);

  return <canvas ref={canvasRef} className="interior-canvas" />;
}

function KindergartenGame({ onFinish }) {
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const typingPoolRef = useRef([]);
  const typingPoolIndexRef = useRef(0);
  const optionRectsRef = useRef([]);
  const hoverRef = useRef(-1);
  const selectedRef = useRef({ index: -1, start: 0 });
  const eraserRef = useRef({ active: false, start: 0 });
  const qIndexRef = useRef(0);
  const answersRef = useRef([]);
  const doneRef = useRef(false);
  const lookAtClassRef = useRef(0);
  const pointerRaiseRef = useRef(-1);
  const boardTextRef = useRef({ full: '', shown: '', nextAt: 0 });
  const dialogueRef = useRef({ full: 'I am sensei now. Sit down. This exam is real.', shown: '', nextAt: 0 });

  const questions = [
    {
      prompt: 'Diary page one says someone vanished for three days then returned smiling. What did Yoshinaga-sensei think?',
      options: [
        { id: 'A', text: 'She was deeply suspicious' },
        { id: 'B', text: 'She stayed polite and quiet' },
        { id: 'C', text: 'She kept the evidence' },
        { id: 'D', text: 'She did not forget that' }
      ],
      reactions: { A: 'Correct. Suspicion level maximum.', B: 'Polite answer, risky outcome.', C: 'Evidence filing wins points.', D: 'Exactly. Memory never forgets.' }
    },
    {
      prompt: 'The diary says a boy confessed and then disappeared for weeks. The class concludes:',
      options: [
        { id: 'A', text: 'That is suspicious' },
        { id: 'B', text: 'He got scared and hid' },
        { id: 'C', text: 'She should move on' },
        { id: 'D', text: 'This sounds familiar' }
      ],
      reactions: { A: 'Reasonable. Jury approved.', B: 'Generous reading.', C: 'Cold but valid.', D: 'You noticed too much.' }
    },
    {
      prompt: 'Question three: perfect day off according to the notes is probably:',
      options: [
        { id: 'A', text: 'A calm drive with music' },
        { id: 'B', text: 'Coffee and silence' },
        { id: 'C', text: 'Random no-plan adventure' },
        { id: 'D', text: 'Staying home and recovering' }
      ],
      reactions: { A: 'Grounded answer.', B: 'Quiet power.', C: 'Chaos accepted.', D: 'Sane answer.' }
    },
    {
      prompt: 'At 11 PM when sleep refuses to happen, the probable move is:',
      options: [
        { id: 'A', text: 'Scroll forever' },
        { id: 'B', text: 'Reply to one text' },
        { id: 'C', text: 'Start one episode' },
        { id: 'D', text: 'Actually sleep' }
      ],
      reactions: { A: 'Screen glow is guilty.', B: 'Honest and risky.', C: 'Classic mistake.', D: 'Rare noble move.' }
    },
    {
      prompt: 'Someone remembered a tiny detail from long ago. That feeling is:',
      options: [
        { id: 'A', text: 'Extremely seen' },
        { id: 'B', text: 'A little famous' },
        { id: 'C', text: 'Confused but happy' },
        { id: 'D', text: 'Fine maybe a little' }
      ],
      reactions: { A: 'That hit direct.', B: 'Famous mode on.', C: 'Honest answer.', D: 'Nobody believes that.' }
    },
    {
      prompt: 'Ideal Saturday according to the evidence board:',
      options: [
        { id: 'A', text: 'Outside all day' },
        { id: 'B', text: 'Half out half home' },
        { id: 'C', text: 'Home and chores' },
        { id: 'D', text: 'Couch mode forever' }
      ],
      reactions: { A: 'High stamina.', B: 'Balanced strategy.', C: 'Responsible pick.', D: 'Realistic champion.' }
    },
    {
      prompt: 'Final: when you see someone familiar in public, instinct is:',
      options: [
        { id: 'A', text: 'Run up immediately' },
        { id: 'B', text: 'Wait for eye contact' },
        { id: 'C', text: 'Pretend not to see' },
        { id: 'D', text: 'Text I SEE YOU' }
      ],
      reactions: { A: 'No hesitation approved.', B: 'Classic safe strategy.', C: 'Stealth expert answer.', D: 'Ridiculously funny.' }
    }
  ];

  const ensureAudio = () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  };

  useEffect(() => {
    const src = 'https://actions.google.com/sounds/v1/foley/typewriter_key.ogg';
    const pool = Array.from({ length: 8 }, () => {
      const a = new Audio(src);
      a.preload = 'auto';
      a.volume = 0.3;
      a.playbackRate = 0.78;
      return a;
    });
    typingPoolRef.current = pool;
    return () => {
      typingPoolRef.current.forEach(a => {
        a.pause();
        a.src = '';
      });
      typingPoolRef.current = [];
    };
  }, []);

  const playScratch = () => {
    const pool = typingPoolRef.current;
    if (pool.length > 0) {
      const idx = typingPoolIndexRef.current % pool.length;
      typingPoolIndexRef.current += 1;
      const snd = pool[idx];
      try {
        snd.currentTime = 0;
        snd.playbackRate = 0.74 + Math.random() * 0.08;
        const p = snd.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        return;
      } catch {}
    }

    const audio = ensureAudio();
    if (!audio) return;
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'square';
    const base = 220 + Math.random() * 70;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 0.64, now + 0.05);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    osc.connect(gain).connect(audio.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  };

  const setDialogue = (text, now) => {
    dialogueRef.current = { full: text, shown: '', nextAt: now };
  };

  const setQuestionText = (now) => {
    const q = questions[qIndexRef.current];
    boardTextRef.current = { full: q.prompt, shown: '', nextAt: now };
  };

  const selectAnswer = useCallback((idx) => {
    if (doneRef.current || eraserRef.current.active || selectedRef.current.index !== -1) return;
    const q = questions[qIndexRef.current];
    const option = q.options[idx];
    if (!option) return;

    selectedRef.current = { index: idx, start: performance.now() };
    pointerRaiseRef.current = idx;
    lookAtClassRef.current = performance.now() + 700;
    answersRef.current.push(option.id);
    setDialogue(q.reactions[option.id], performance.now());

    if (qIndexRef.current === questions.length - 1) {
      doneRef.current = true;
      window.setTimeout(() => onFinish({ quizAnswers: answersRef.current }), 1300);
      return;
    }

    window.setTimeout(() => {
      eraserRef.current = { active: true, start: performance.now() };
    }, 800);
  }, [onFinish]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === '1' || event.key === 'a' || event.key === 'A') selectAnswer(0);
      else if (event.key === '2' || event.key === 'b' || event.key === 'B') selectAnswer(1);
      else if (event.key === '3' || event.key === 'c' || event.key === 'C') selectAnswer(2);
      else if (event.key === '4' || event.key === 'd' || event.key === 'D') selectAnswer(3);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectAnswer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.imageSmoothingEnabled = false;
    };

    const handleMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const hit = optionRectsRef.current.findIndex(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
      hoverRef.current = hit;
      canvas.style.cursor = hit >= 0 ? 'pointer' : 'default';
      if (hit >= 0) lookAtClassRef.current = performance.now() + 450;
    };

    const handleClick = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const hit = optionRectsRef.current.findIndex(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
      if (hit >= 0) selectAnswer(hit);
    };

    resize();
    setQuestionText(performance.now());
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointermove', handleMove);
    canvas.addEventListener('pointerdown', handleClick);

    let frameId = 0;
    const render = (time) => {
      frameId = requestAnimationFrame(render);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const wallBottom = Math.floor(h * 0.55);
      ctx.fillStyle = '#E8D5A3'; ctx.fillRect(0, 0, w, wallBottom);
      ctx.fillStyle = '#D4B896'; ctx.fillRect(0, 0, w, 20);
      ctx.fillStyle = '#555'; ctx.fillRect(Math.floor(w * 0.5) - 1, 20, 2, 20);
      ctx.fillStyle = '#FFE87A'; ctx.fillRect(Math.floor(w * 0.5) - 10, 40, 20, 10);
      const glow = ctx.createRadialGradient(w * 0.5, 50, 8, w * 0.5, 110, 160);
      glow.addColorStop(0, 'rgba(255,232,122,0.22)'); glow.addColorStop(1, 'rgba(255,232,122,0)');
      ctx.fillStyle = glow; ctx.fillRect(w * 0.5 - 180, 20, 360, 200);

      for (let y = wallBottom; y < h; y += 16) {
        const plank = Math.floor((y - wallBottom) / 16);
        ctx.fillStyle = plank % 2 === 0 ? '#C4935A' : '#B8864E';
        ctx.fillRect(0, y, w, 16);
        ctx.fillStyle = '#7A5535'; ctx.fillRect(0, y + 15, w, 1);
      }
      ctx.fillStyle = '#8B6230'; ctx.fillRect(0, wallBottom - 4, w, 4);

      // Header sign
      ctx.fillStyle = '#333';
      for (let y = 0; y < 16; y += 2) {
        ctx.fillRect(140, y, 2, 2); ctx.fillRect(142, y + 1, 2, 2);
        ctx.fillRect(w - 144, y, 2, 2); ctx.fillRect(w - 142, y + 1, 2, 2);
      }
      ctx.fillStyle = '#8B6230'; ctx.fillRect(96, 16, w - 192, 34);
      ctx.fillStyle = '#7A5220'; for (let gy = 18; gy < 48; gy += 8) ctx.fillRect(100, gy, w - 200, 1);
      ctx.fillStyle = '#FFE87A'; ctx.font = '8px "Press Start 2P"'; ctx.fillText('FUTABA KINDERGARTEN', w * 0.5 - 118, 38);
      ctx.fillStyle = '#CC2200'; ctx.fillRect(110, 28, 8, 8); ctx.fillRect(118, 30, 6, 6);
      ctx.fillStyle = '#2D8A2D'; ctx.fillRect(116, 24, 4, 3);
      ctx.fillStyle = '#8B4513'; ctx.fillRect(114, 22, 2, 3);
      ctx.fillStyle = '#FFFDE0'; ctx.font = '7px "Press Start 2P"'; ctx.fillText(`Q ${qIndexRef.current + 1}/${questions.length}`, w - 176, 37);

      // Blackboard
      const boardX = w * 0.2;
      const boardY = h * 0.05;
      const boardW = w * 0.6;
      const boardH = h * 0.32;
      ctx.fillStyle = '#8B6230'; ctx.fillRect(boardX - 8, boardY - 8, boardW + 16, boardH + 16);
      ctx.fillStyle = '#2D5A27'; ctx.fillRect(boardX, boardY, boardW, boardH);
      ctx.fillStyle = '#A0785A'; ctx.fillRect(boardX, boardY + boardH - 6, boardW, 6);
      for (let i = 0; i < 4; i += 1) { ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(boardX + 30 + i * (boardW / 5), boardY + boardH - 4, 4, 2); }

      if (eraserRef.current.active) {
        const p = Math.min(1, (time - eraserRef.current.start) / 300);
        ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.35 * (1 - p)})`;
        ctx.fillRect(boardX + p * (boardW - 30), boardY + 12, 28, boardH - 28);
        if (p >= 1) {
          eraserRef.current.active = false;
          qIndexRef.current += 1;
          selectedRef.current = { index: -1, start: 0 };
          pointerRaiseRef.current = -1;
          setQuestionText(time);
          setDialogue('Next question. No cheating. I can see everyone.', time);
        }
      }

      if (!eraserRef.current.active && boardTextRef.current.shown.length < boardTextRef.current.full.length && time >= boardTextRef.current.nextAt) {
        boardTextRef.current.shown = boardTextRef.current.full.slice(0, boardTextRef.current.shown.length + 1);
        boardTextRef.current.nextAt = time + 27;
        playScratch();
      }
      ctx.fillStyle = '#FFFDE0'; ctx.font = '9px "Press Start 2P"';
      wrapCanvasText(ctx, boardTextRef.current.shown, boardX + 20, boardY + 34, boardW - 40, 16);
      ctx.font = '7px "Press Start 2P"'; ctx.fillText(`Q ${qIndexRef.current + 1}/${questions.length}`, boardX + boardW - 70, boardY + 20);

      // Desks
      const drawDesk = (x, y, scale) => {
        const dw = 40 * scale;
        const dh = 20 * scale;
        ctx.fillStyle = '#C4935A'; ctx.fillRect(x, y, dw, dh);
        ctx.fillStyle = '#8B6230'; ctx.fillRect(x, y + dh, 2 * scale, 16 * scale); ctx.fillRect(x + dw - 2 * scale, y + dh, 2 * scale, 16 * scale);
        ctx.fillStyle = '#EEEEEE'; ctx.fillRect(x + 6 * scale, y + 4 * scale, 8 * scale, 6 * scale);
        ctx.fillStyle = '#AACCFF'; ctx.fillRect(x + 6 * scale, y + 6 * scale, 8 * scale, 1 * scale); ctx.fillRect(x + 6 * scale, y + 8 * scale, 8 * scale, 1 * scale);
        ctx.fillStyle = '#CC2200'; ctx.fillRect(x + 18 * scale, y + 6 * scale, 4 * scale, 2 * scale);
      };
      const rows = [{ y: h * 0.55, s: 0.8 }, { y: h * 0.65, s: 0.9 }, { y: h * 0.75, s: 1.0 }];
      rows.forEach(row => {
        const spread = w * 0.7;
        const startX = (w - spread) / 2;
        for (let i = 0; i < 4; i += 1) drawDesk(startX + i * (spread / 3) - 20 * row.s, row.y, row.s);
      });

      // Shin sprite and pointer
      const shinX = w * 0.15;
      const shinY = h * 0.42;
      const faceClass = time < lookAtClassRef.current;
      const tapFrame = Math.floor(time / 2000) % 2;
      const pointerAngle = pointerRaiseRef.current >= 0 ? -0.55 : (tapFrame ? -0.08 : 0.02);
      if (SPRITEMAP.shin_idle1 && SPRITEMAP.shin_idle1.complete) {
        ctx.save();
        if (!faceClass) {
          ctx.translate(shinX + 48, shinY);
          ctx.scale(-1, 1);
          ctx.drawImage(SPRITEMAP.shin_idle1, 0, 0, 16, 16, 0, 0, 48, 48);
        } else {
          ctx.drawImage(SPRITEMAP.shin_idle1, 0, 0, 16, 16, shinX, shinY, 48, 48);
        }
        ctx.restore();
      } else {
        ctx.fillStyle = '#ffebc8'; ctx.fillRect(shinX + 10, shinY + 6, 24, 24);
        ctx.fillStyle = '#f4cf6b'; ctx.fillRect(shinX + 6, shinY + 28, 32, 16);
      }
      ctx.save();
      ctx.translate(shinX + 30, shinY + 24);
      ctx.rotate(pointerAngle);
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, 0, 20, 1);
      ctx.restore();

      // Answer cards
      const q = questions[Math.min(qIndexRef.current, questions.length - 1)];
      const cardW = w * 0.38;
      const cardH = h * 0.13;
      const gapX = w * 0.04;
      const gapY = h * 0.03;
      const gridW = cardW * 2 + gapX;
      const gridX = (w - gridW) / 2;
      const gridY = h * 0.54;
      optionRectsRef.current = [];
      q.options.forEach((option, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = gridX + col * (cardW + gapX);
        const y = gridY + row * (cardH + gapY);
        const hover = hoverRef.current === index;
        const clickAge = selectedRef.current.index === index ? time - selectedRef.current.start : 9999;
        const flash = clickAge >= 0 && clickAge < 80;
        const yShift = hover ? -3 : 0;
        optionRectsRef.current.push({ x, y: y + yShift, w: cardW, h: cardH });

        ctx.fillStyle = flash ? '#FFFFFF' : '#FFFDE0'; ctx.fillRect(x, y + yShift, cardW, cardH);
        ctx.strokeStyle = hover ? '#CC2200' : '#333333'; ctx.lineWidth = 2; ctx.strokeRect(x, y + yShift, cardW, cardH);
        ctx.fillStyle = '#E8D4A0'; ctx.beginPath(); ctx.moveTo(x + cardW - 14, y + yShift); ctx.lineTo(x + cardW, y + yShift); ctx.lineTo(x + cardW, y + yShift + 14); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#CC2200'; ctx.font = '10px "Press Start 2P"'; ctx.fillText(option.id, x + 8, y + yShift + 16);
        if (hover && Math.floor(time / 250) % 2 === 0) ctx.fillText('*', x + 22, y + yShift + 16);
        ctx.fillStyle = '#1A1A1A'; ctx.font = '7px "Press Start 2P"'; wrapCanvasText(ctx, option.text, x + 10, y + yShift + 34, cardW - 20, 12);

        if (selectedRef.current.index === index && clickAge > 60) {
          const p = Math.min(1, (clickAge - 60) / 220);
          ctx.strokeStyle = '#CC2200'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(x + 16, y + yShift + cardH * 0.58);
          if (p < 0.45) {
            const t = p / 0.45;
            ctx.lineTo(x + 16 + 12 * t, y + yShift + cardH * 0.58 + 12 * t);
          } else {
            ctx.lineTo(x + 28, y + yShift + cardH * 0.70);
            const t = (p - 0.45) / 0.55;
            ctx.lineTo(x + 28 + 24 * t, y + yShift + cardH * 0.70 - 22 * t);
          }
          ctx.stroke();
        }
      });

      // Dialogue box
      if (dialogueRef.current.shown.length < dialogueRef.current.full.length && time >= dialogueRef.current.nextAt) {
        dialogueRef.current.shown = dialogueRef.current.full.slice(0, dialogueRef.current.shown.length + 1);
        dialogueRef.current.nextAt = time + 16;
      }
      const boxX = 16;
      const boxY = h - 100;
      const boxW = w - 32;
      const boxH = 84;
      ctx.fillStyle = 'rgba(10,10,30,0.93)'; ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.strokeStyle = '#333355'; ctx.lineWidth = 1; ctx.strokeRect(boxX + 4, boxY + 4, boxW - 8, boxH - 8);
      ctx.fillStyle = '#ffebc8'; ctx.fillRect(boxX + 12, boxY + 18, 16, 16);
      ctx.fillStyle = '#111'; ctx.fillRect(boxX + 15, boxY + 22, 3, 3); ctx.fillRect(boxX + 22, boxY + 22, 3, 3);
      ctx.fillStyle = '#CC2200'; ctx.fillRect(boxX + 16, boxY + 29, 8, 2);
      ctx.fillStyle = '#FFD700'; ctx.font = '7px "Press Start 2P"'; ctx.fillText('Shin-chan:', boxX + 34, boxY + 28);
      ctx.fillStyle = '#FFF'; ctx.font = '7px "Press Start 2P"'; wrapCanvasText(ctx, dialogueRef.current.shown, boxX + 80, boxY + 28, boxW - 98, 12);
      if (dialogueRef.current.shown.length >= dialogueRef.current.full.length && Math.floor(time / 400) % 2 === 0) ctx.fillText('v', boxX + boxW - 18, boxY + boxH - 10);
    };

    frameId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', handleMove);
      canvas.removeEventListener('pointerdown', handleClick);
      canvas.style.cursor = 'default';
    };
  }, [onFinish, selectAnswer]);

  return <canvas ref={canvasRef} className="interior-canvas" />;
}

function TheaterGame({ profile, onFinish }) {
  const canvasRef = useRef(null);
  const runningRef = useRef(true);
  const enemiesRef = useRef([]);
  const bulletsRef = useRef([]);
  const particlesRef = useRef([]);
  const keysRef = useRef({});
  const playerRef = useRef({ x: 0.5, cooldown: 0, lives: 3, combo: 0 });
  const niggeshScoreRef = useRef(0);
  if (niggeshScoreRef.current === 0) niggeshScoreRef.current = 3800 + Math.floor(Math.random() * 1200);
  const targetScore = useMemo(() => {
    const own = Number(profile?.theaterScore);
    return Number.isFinite(own) && own > 0 ? Math.floor(own) : niggeshScoreRef.current;
  }, [profile]);
  const introRef = useRef({ active: true, until: performance.now() + 3200 });
  const stateRef = useRef({ score: 0, hits: 0, miss: 0, timeLeft: 40, wave: 1, message: `Niggesh scored ${targetScore}. Beat that.` });
  const lastRef = useRef(performance.now());
  const spawnTimerRef = useRef(0);
  const timerRef = useRef(0);

  const finish = useCallback(() => {
    if (!runningRef.current) return;
    runningRef.current = false;
    clearInterval(spawnTimerRef.current);
    clearInterval(timerRef.current);
    const s = stateRef.current.score;
    const lives = playerRef.current.lives;
    const beatTarget = s >= targetScore;
    const rank = beatTarget || (s > 5000 && lives >= 2) ? 'high' : s > 2400 ? 'mid' : 'low';
    onFinish({ rhythmScore: rank, theaterScore: s, theaterTarget: targetScore, beatNiggesh: beatTarget });
  }, [onFinish, targetScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.imageSmoothingEnabled = false;
    };

    const onKeyDown = (event) => {
      keysRef.current[event.code] = true;
      if (event.code === 'Space') event.preventDefault();
    };

    const onKeyUp = (event) => {
      keysRef.current[event.code] = false;
    };

    const onPointerMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      playerRef.current.x = Math.max(0.08, Math.min(0.92, x));
    };

    const shoot = () => {
      const p = playerRef.current;
      if (p.cooldown > 0 || !runningRef.current) return;
      p.cooldown = 0.1;
      bulletsRef.current.push({ x: p.x, y: 0.82, vy: -1.1, w: 6, h: 18 });
    };

    const onPointerDown = () => shoot();

    const spawnEnemy = () => {
      if (!runningRef.current) return;
      if (introRef.current.active) return;
      const wave = stateRef.current.wave;
      const typeRoll = Math.random();
      const type = typeRoll < 0.15 ? 'tank' : typeRoll < 0.5 ? 'zigzag' : 'grunt';
      const speed = type === 'tank' ? 0.12 + wave * 0.04 : type === 'zigzag' ? 0.2 + wave * 0.05 : 0.16 + wave * 0.05;
      const hp = type === 'tank' ? 3 : 1;
      enemiesRef.current.push({
        x: 0.1 + Math.random() * 0.8,
        y: -0.08,
        w: type === 'tank' ? 52 : 34,
        h: type === 'tank' ? 46 : 32,
        hp,
        type,
        speed,
        phase: Math.random() * Math.PI * 2
      });
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);

    const spawnRate = () => {
      clearInterval(spawnTimerRef.current);
      const wave = stateRef.current.wave;
      const ms = wave === 1 ? 780 : wave === 2 ? 560 : 420;
      spawnTimerRef.current = window.setInterval(spawnEnemy, ms);
    };

    spawnRate();
    timerRef.current = window.setInterval(() => {
      if (!runningRef.current) return;
      if (introRef.current.active) return;
      stateRef.current.timeLeft -= 1;
      if (stateRef.current.timeLeft === 27) { stateRef.current.wave = 2; stateRef.current.message = 'Wave 2: speed increased.'; spawnRate(); }
      if (stateRef.current.timeLeft === 14) { stateRef.current.wave = 3; stateRef.current.message = 'Final wave: hold your line.'; spawnRate(); }
      if (stateRef.current.timeLeft <= 0 || playerRef.current.lives <= 0) finish();
    }, 1000);

    const drawEnemy = (enemy, w, h, time) => {
      const x = enemy.x * w;
      const y = enemy.y * h;
      const ew = enemy.w;
      const eh = enemy.h;
      ctx.save();
      ctx.translate(x, y);
      const blink = Math.floor(time / 180) % 2 === 0;
      if (enemy.type === 'tank') {
        ctx.fillStyle = '#1C1C1C'; ctx.fillRect(-ew / 2, -eh / 2, ew, eh);
        ctx.fillStyle = '#CC0000'; ctx.fillRect(-ew * 0.42, -eh * 0.44, ew * 0.84, eh * 0.34);
        ctx.fillStyle = blink ? '#FFF' : '#FFAAAA'; ctx.fillRect(-ew * 0.26, -eh * 0.08, ew * 0.16, eh * 0.12); ctx.fillRect(ew * 0.1, -eh * 0.08, ew * 0.16, eh * 0.12);
      } else {
        ctx.fillStyle = '#111'; ctx.fillRect(-ew / 2, -eh / 2, ew, eh);
        ctx.fillStyle = '#CC0000'; ctx.fillRect(-ew * 0.38, -eh * 0.42, ew * 0.76, eh * 0.32);
        ctx.fillStyle = blink ? '#FFF' : '#FFB6B6'; ctx.fillRect(-ew * 0.26, -eh * 0.05, ew * 0.16, eh * 0.12); ctx.fillRect(ew * 0.1, -eh * 0.05, ew * 0.16, eh * 0.12);
      }
      ctx.restore();
    };

    const drawStage = (w, h, time) => {
      const floorTop = h * 0.24;
      const stageTop = h * 0.74;
      ctx.fillStyle = '#090412'; ctx.fillRect(0, 0, w, h);
      const bg = ctx.createLinearGradient(0, 0, 0, floorTop + 60);
      bg.addColorStop(0, '#1c0d33');
      bg.addColorStop(1, '#120826');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, floorTop + 60);

      const curtainW = Math.max(140, w * 0.13);
      for (let i = 0; i < 20; i += 1) {
        const c = i % 3 === 0 ? '#7C0000' : i % 3 === 1 ? '#A80000' : '#5A0000';
        ctx.fillStyle = c;
        ctx.fillRect((curtainW / 20) * i, 0, curtainW / 20 + 1, h * 0.9);
        ctx.fillRect(w - curtainW + (curtainW / 20) * i, 0, curtainW / 20 + 1, h * 0.9);
      }

      ctx.fillStyle = '#101020'; ctx.fillRect(0, floorTop, w, stageTop - floorTop);
      for (let x = 0; x < w; x += 16) {
        ctx.fillStyle = (x / 16) % 2 === 0 ? '#6F5516' : '#7E611B';
        ctx.fillRect(x, stageTop, 16, h - stageTop);
      }
      ctx.fillStyle = '#FFD700'; ctx.fillRect(0, stageTop, w, 3);

      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(w * 0.22, h * 0.08, w * 0.56, 34);
      ctx.fillStyle = '#FFD700'; ctx.font = `${Math.max(12, Math.floor(w * 0.013))}px "Press Start 2P"`;
      ctx.fillText('ACTION KAMEN DEFENSE', w * 0.27, h * 0.105);
      for (let x = w * 0.24; x < w * 0.76; x += 14) {
        ctx.fillStyle = Math.floor(time / 220) % 2 === Math.floor((x / 14) % 2) ? '#FFD700' : '#333';
        ctx.fillRect(x, h * 0.075, 5, 5);
      }
    };

    const tick = (time) => {
      if (!runningRef.current) return;
      requestAnimationFrame(tick);
      const dt = Math.min(0.04, (time - lastRef.current) / 1000);
      lastRef.current = time;
      const w = canvas.width;
      const h = canvas.height;

      drawStage(w, h, time);

      const p = playerRef.current;
      const s = stateRef.current;
      const introActive = introRef.current.active && time < introRef.current.until;
      if (introRef.current.active && !introActive) {
        introRef.current.active = false;
        s.message = `Target locked: ${targetScore}. Good luck.`;
      }

      if (!introActive) {
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) p.x -= dt * 0.6;
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) p.x += dt * 0.6;
        if (keysRef.current['Space']) {
          if (p.cooldown <= 0) {
            p.cooldown = 0.1;
            bulletsRef.current.push({ x: p.x, y: 0.82, vy: -1.1, w: 6, h: 18 });
          }
        }
      }
      p.x = Math.max(0.08, Math.min(0.92, p.x));
      p.cooldown = Math.max(0, p.cooldown - dt);

      enemiesRef.current.forEach(enemy => {
        enemy.y += enemy.speed * dt;
        if (enemy.type === 'zigzag') enemy.x += Math.sin(time / 200 + enemy.phase) * 0.0018;
        enemy.x = Math.max(0.06, Math.min(0.94, enemy.x));
      });
      bulletsRef.current.forEach(b => { b.y += b.vy * dt; });

      // Collisions
      for (let i = bulletsRef.current.length - 1; i >= 0; i -= 1) {
        const b = bulletsRef.current[i];
        const bx = b.x * w;
        const by = b.y * h;
        let hit = false;
        for (let j = enemiesRef.current.length - 1; j >= 0; j -= 1) {
          const e = enemiesRef.current[j];
          const ex = e.x * w;
          const ey = e.y * h;
          if (Math.abs(bx - ex) < e.w * 0.6 && Math.abs(by - ey) < e.h * 0.6) {
            e.hp -= 1;
            hit = true;
            if (e.hp <= 0) {
              enemiesRef.current.splice(j, 1);
              s.hits += 1;
              p.combo += 1;
              s.score += 120 + p.combo * 8;
              particlesRef.current.push({ x: e.x, y: e.y, life: 16, dx: 0.015, dy: -0.015 });
              s.message = p.combo > 8 ? 'Hot streak! Keep firing!' : 'Nice hit. Keep pressure on.';
            }
            break;
          }
        }
        if (hit) bulletsRef.current.splice(i, 1);
      }

      // Missed enemies
      for (let i = enemiesRef.current.length - 1; i >= 0; i -= 1) {
        if (enemiesRef.current[i].y > 0.84) {
          enemiesRef.current.splice(i, 1);
          s.miss += 1;
          p.combo = 0;
          p.lives -= 1;
          s.message = 'A henchman slipped through. Focus.';
          if (p.lives <= 0) {
            finish();
            return;
          }
        }
      }

      bulletsRef.current = bulletsRef.current.filter(b => b.y > -0.1);

      particlesRef.current = particlesRef.current
        .map(pt => ({ ...pt, x: pt.x + pt.dx, y: pt.y + pt.dy, life: pt.life - 1 }))
        .filter(pt => pt.life > 0);

      // Draw units
      bulletsRef.current.forEach(b => {
        ctx.fillStyle = '#94FF70';
        ctx.fillRect(b.x * w - b.w / 2, b.y * h - b.h, b.w, b.h);
      });
      enemiesRef.current.forEach(e => drawEnemy(e, w, h, time));
      particlesRef.current.forEach(pt => {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(pt.x * w, pt.y * h, 3, 3);
      });

      // Player
      const px = p.x * w;
      const py = h * 0.84;
      if (SPRITEMAP.actionKamen && SPRITEMAP.actionKamen.complete) {
        ctx.drawImage(SPRITEMAP.actionKamen, 0, 0, 16, 16, px - 28, py - 46, 56, 56);
      } else {
        ctx.fillStyle = '#B0C4DE'; ctx.fillRect(px - 18, py - 40, 36, 34);
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(px - 10, py - 46, 20, 12);
      }
      ctx.fillStyle = '#7fe1ff'; ctx.fillRect(px - 2, py - 60, 4, 18);

      // HUD + message
      const hudFont = Math.max(10, Math.floor(w * 0.011));
      const panelW = Math.max(260, w * 0.23);
      ctx.fillStyle = 'rgba(8,8,12,0.9)'; ctx.fillRect(18, 16, panelW, 150);
      ctx.strokeStyle = '#FFF'; ctx.strokeRect(18, 16, panelW, 150);
      ctx.fillStyle = '#FFF'; ctx.font = `${hudFont}px "Press Start 2P"`;
      ctx.fillText(`SCORE ${s.score}`, 30, 42);
      ctx.fillText(`HITS ${s.hits}`, 30, 68);
      ctx.fillText(`TIME ${s.timeLeft}s`, 30, 94);
      ctx.fillText(`WAVE ${s.wave}`, 30, 120);
      ctx.fillText(`TARGET ${targetScore}`, 30, 146);

      ctx.fillStyle = 'rgba(8,8,12,0.9)'; ctx.fillRect(w - 210, 16, 192, 94);
      ctx.strokeStyle = '#FFD700'; ctx.strokeRect(w - 210, 16, 192, 94);
      ctx.fillStyle = '#FFD700'; ctx.font = `${Math.max(9, hudFont - 1)}px "Press Start 2P"`;
      ctx.fillText(`LIVES ${p.lives}`, w - 194, 42);
      ctx.fillText(`COMBO ${p.combo}`, w - 194, 66);
      ctx.fillText(`NIGGESH ${targetScore}`, w - 194, 90);

      ctx.fillStyle = 'rgba(5,7,16,0.92)'; ctx.fillRect(18, h - 92, w - 36, 72);
      ctx.strokeStyle = '#FFD700'; ctx.strokeRect(18, h - 92, w - 36, 72);
      ctx.fillStyle = '#FFF'; ctx.font = `${Math.max(9, hudFont - 1)}px "Press Start 2P"`;
      wrapCanvasText(ctx, `Shin-chan: ${s.message} Move: A/D or Arrow Keys. Shoot: Space or Click.`, 30, h - 58, w - 58, Math.max(13, hudFont + 2));

      if (introActive) {
        ctx.fillStyle = 'rgba(4, 4, 12, 0.74)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#ffd44d';
        ctx.font = `${Math.max(18, Math.floor(w * 0.028))}px "Press Start 2P"`;
        ctx.fillText(`Niggesh scored ${targetScore}`, w * 0.14, h * 0.44);
        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.max(14, Math.floor(w * 0.018))}px "Press Start 2P"`;
        ctx.fillText('How? Let us see if you can beat him.', w * 0.14, h * 0.5);
      }

      if (!introActive && s.score >= targetScore) {
        s.message = 'Target beaten. Action Kamen approves.';
        finish();
        return;
      }

      if (s.timeLeft <= 0) finish();
    };

    requestAnimationFrame(tick);
    return () => {
      runningRef.current = false;
      clearInterval(spawnTimerRef.current);
      clearInterval(timerRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [finish]);

  return <canvas ref={canvasRef} className="interior-canvas" />;
}


function ShinCorner({ pose = 'idle', className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    canvas.width = 48;
    canvas.height = 48;
    ctx.clearRect(0, 0, 48, 48);
    ctx.save();
    if (pose === 'faceDown') {
      ctx.translate(24, 28);
      ctx.rotate(Math.PI / 2);
      ctx.translate(-24, -28);
    }
    if (pose === 'run') {
      ctx.translate(2, 0);
    }
    ctx.fillStyle = '#ffebc8'; ctx.fillRect(18, 10, 16, 16);
    ctx.fillStyle = '#111'; ctx.fillRect(21, 14, 3, 3); ctx.fillRect(28, 14, 3, 3);
    ctx.fillStyle = '#c22'; ctx.fillRect(21, 20, 10, 3);
    ctx.fillStyle = '#666'; ctx.fillRect(12, 14, 10, 4);
    ctx.fillRect(11, 16, 4, 14);
    ctx.fillRect(30, 16, 4, 14);
    if (pose === 'sign') {
      ctx.fillStyle = '#f7f7f7'; ctx.fillRect(5, 2, 18, 10);
      ctx.fillStyle = '#111'; ctx.font = '6px "Press Start 2P"'; ctx.fillText('YES', 7, 10);
    }
    if (pose === 'mouth') {
      ctx.fillStyle = '#ffebc8'; ctx.fillRect(18, 10, 16, 16);
      ctx.fillStyle = '#111'; ctx.fillRect(21, 14, 3, 3); ctx.fillRect(28, 14, 3, 3);
      ctx.fillStyle = '#c22'; ctx.fillRect(21, 20, 10, 5);
    }
    ctx.restore();
  }, [pose]);

  return <canvas ref={canvasRef} className={`shin-corner ${className}`.trim()} />;
}

// ================= ACT 2: Complete visual overhaul =================
function SlideDeck({ profile }) {
  const [slide, setSlide] = useState(1);

  return (
    <div className="slides-container cinematic-act2">
       {slide === 1 && <Slide1 onNext={() => setSlide(2)} />}
       {slide === 2 && <Slide3 profile={profile} onNext={() => setSlide(3)} />}
       {slide === 3 && <Slide2 profile={profile} onNext={() => setSlide(4)} />}
       {slide === 4 && <Slide4 profile={profile} onNext={() => setSlide(5)} />}
       {slide === 5 && <Slide5 profile={profile} onNext={() => setSlide(6)} />}
       {slide === 6 && <Slide6 profile={profile} onYes={() => setSlide(7)} />}
       {slide === 7 && <Slide7 profile={profile} />}
    </div>
  );
}

function Slide1({ onNext }) {
  const [text, setText] = useState('');
  const [showSub, setShowSub] = useState(false);
  const [done, setDone] = useState(false);
  const target = "okay so heres waht happened.";

  useEffect(() => {
    let index = 0;
    let cancelled = false;

    const step = () => {
      if (cancelled) return;
      if (index <= target.length) {
        setText(target.slice(0, index));
        index += 1;
        const delay = 28 + Math.floor(Math.random() * 90);
        setTimeout(step, delay);
      } else {
        setTimeout(() => {
          if (cancelled) return;
          let back = target.length;
          const erase = () => {
            if (cancelled) return;
            if (back > 12) {
              back -= 1;
              setText(target.slice(0, back));
              setTimeout(erase, 35);
            } else {
              let fix = 'okay so here\'s what happened.';
              let reveal = 0;
              const typeFix = () => {
                if (cancelled) return;
                if (reveal <= fix.length) {
                  setText(fix.slice(0, reveal));
                  reveal += 1;
                  setTimeout(typeFix, 40 + Math.random() * 50);
                } else {
                  setShowSub(true);
                  setDone(true);
                }
              };
              typeFix();
            }
          };
          erase();
        }, 500);
      }
    };

    step();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="act2-scene scene-1 act2-frame act2-frame-dark" onClick={() => done && onNext()}>
      <div className="terminal-cursor" />
      <h1 className="typewriter-line">{text}</h1>
      {showSub && <p className="handwritten-sub">and i need you to understand how astronomically idiotic this whole situation has been.</p>}
      {done && <p className="scene-hint">tap to continue</p>}
      <ShinCorner pose="idle" className="corner-bottom-right" />
      <div className="scanline-overlay" />
    </div>
  );
}

function Slide2({ profile, onNext }) {
  const canvasRef = useRef(null);
  const [visible, setVisible] = useState(1);
  const [done, setDone] = useState(false);
  const events = useMemo(() => [
    'He liked her first. Said nothing.',
    'Had a lot to say. Typed nothing.',
    'Tried to explain. Immediately panicked.',
    'Disappeared for a while. Classic move.',
    'She started liking him during silence. Irony.',
    `Meanwhile you chose ${profile.snackChoice || 'a suspicious snack'} in court.`,
    `You ranked ${profile.topChoice || 'chaotic behavior'} as Priority 1.`,
    'Talk happened. Confusion reduced.',
    'Date happened. We are here now.'
  ], [profile]);

  const advance = useCallback(() => {
    setVisible(v => {
      const next = Math.min(events.length, v + 1);
      if (next >= events.length) setDone(true);
      return next;
    });
  }, [events.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    let rafId = 0;

    const wrapText = (text, maxWidth) => {
      const words = text.split(' ');
      const lines = [];
      let line = '';
      words.forEach(word => {
        const next = line ? `${line} ${word}` : word;
        if (ctx.measureText(next).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = next;
        }
      });
      if (line) lines.push(line);
      return lines;
    };

    const draw = () => {
      rafId = requestAnimationFrame(draw);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#f5f0e8';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(26,26,26,0.05)';
      for (let y = 0; y < h; y += 6) {
        for (let x = 0; x < w; x += 6) ctx.fillRect(x, y, 1, 1);
      }

      const top = 88;
      const bottom = h - 120;
      const centerX = w * 0.5;
      const step = (bottom - top) / Math.max(1, events.length - 1);
      const cardW = Math.min(480, w * 0.38);
      const cardH = Math.max(64, Math.min(108, step * 0.8));

      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, top - 24);
      ctx.lineTo(centerX, bottom + 24);
      ctx.stroke();

      for (let i = 0; i < visible; i += 1) {
        const y = top + i * step;
        const left = i % 2 === 0;
        const cardX = left ? centerX - cardW - 42 : centerX + 42;
        const dotX = left ? centerX - 8 : centerX + 8;

        ctx.fillStyle = '#fff9ef';
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.fillRect(cardX, y - cardH / 2, cardW, cardH);
        ctx.strokeRect(cardX, y - cardH / 2, cardW, cardH);

        ctx.fillStyle = '#1a1a1a';
        ctx.font = '18px Caveat, cursive';
        const lines = wrapText(events[i], cardW - 24);
        lines.slice(0, 3).forEach((line, idx) => {
          ctx.fillText(line, cardX + 12, y - cardH / 2 + 24 + idx * 22);
        });

        ctx.fillStyle = '#CC2200';
        ctx.beginPath();
        ctx.arc(dotX, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.moveTo(left ? dotX + 8 : dotX - 8, y);
        ctx.lineTo(left ? cardX + cardW : cardX, y);
        ctx.stroke();
      }

      if (done) {
        ctx.save();
        ctx.translate(w * 0.1, h * 0.92);
        ctx.rotate(-0.06);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = '24px Caveat, cursive';
        ctx.fillText("brought to you by Niggesh, who still can't believe this worked.", 0, 0);
        ctx.restore();
      }
    };
    draw();
    const handle = () => {
      if (done) onNext(); else advance();
    };
    canvas.addEventListener('pointerdown', handle);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', handle);
    };
  }, [advance, done, onNext, visible]);

  return (
    <div className="act2-scene scene-2 paper-world">
      <canvas ref={canvasRef} className="scene-canvas" />
      <p className="paper-hint">{done ? 'tap to continue ▼' : 'tap to reveal timeline'}</p>
    </div>
  );
}

function Slide3({ profile, onNext }) {
  const energyTone = useMemo(() => {
    const top = (profile.topChoice || '').toLowerCase();
    if (top.includes('trip') || top.includes('adventure')) return 'adventure';
    if (top.includes('home') || top.includes('couch')) return 'calm';
    return 'chaos';
  }, [profile]);

  const reportLines = useMemo(() => [
    'KASUKABE DETECTIVE AGENCY',
    'Case No. 00492 - "The Player Profile"',
    'Investigator: Nohara Shinnosuke, Age 5',
    'Clearance Level: Action Kamen Gold',
    '',
    'FINDING 1:',
    `Subject selected ${profile.snackChoice || 'something suspicious'} under`,
    'extreme pudding-trial pressure.',
    '',
    'FINDING 2:',
    `Subject ranked ${profile.topChoice || 'chaotic behavior'} as Priority 1.`,
    '',
    'FINDING 3:',
    `Diary response on the ghost question: ${profile.quizAnswers?.[0] || 'unknown'}.`,
    `Personality inference: ${energyTone.toUpperCase()} ENERGY.`,
    '',
    'CONCLUSION:',
    'something about this is dangerous but correct.'
  ], [profile, energyTone]);
  const [visible, setVisible] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (visible < reportLines.length) {
      const timer = setTimeout(() => setVisible(v => v + 1), 220);
      return () => clearTimeout(timer);
    }
    setDone(true);
  }, [visible, reportLines.length]);

  return (
    <div className={`act2-scene scene-3 act2-frame act2-frame-paper profile-tone-${energyTone}`} onClick={() => (done ? onNext() : setVisible(v => Math.min(reportLines.length, v + 1)))}>
      <div className="paper-report">
        <div className="report-header">
          <div>KASUKABE INVESTIGATION REPORT</div>
          <div className="classified">CLASSIFIED</div>
        </div>
        <div className="report-grid">
          {reportLines.slice(0, visible).map((entry, index) => <div key={index} className={`report-line ${index < 5 ? 'report-meta' : ''}`}>{entry}</div>)}
        </div>
        <div className="report-signature">Signed: Shin-chan  Co-signed: Shiro</div>
      </div>
      <ShinCorner pose="mouth" className="corner-bottom-right" />
      {done && <p className="scene-hint paper-hint">▼</p>}
    </div>
  );
}

function Slide4({ profile, onNext }) {
  const words = ['he', 'liked', 'you', 'first.'];
  const [index, setIndex] = useState(-1);
  const [ghost, setGhost] = useState(false);
  const [stamp, setStamp] = useState(false);
  const [done, setDone] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setIndex(0), 800),
      setTimeout(() => setIndex(1), 1500),
      setTimeout(() => setIndex(2), 2100),
      setTimeout(() => setIndex(3), 2800),
      setTimeout(() => setShake(true), 2800),
      setTimeout(() => setShake(false), 3400),
      setTimeout(() => setGhost(true), 5000),
      setTimeout(() => setStamp(true), 5400),
      setTimeout(() => setDone(true), 8200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className={`act2-scene scene-4 act2-frame act2-frame-dark ${shake ? 'scene-shake' : ''}`} onClick={() => done && onNext()}>
      {index >= 0 && !ghost && <div className={`center-word ${index === 3 ? 'first-word' : ''}`}>{words[index]}</div>}
      {ghost && <div className="ghost-word">first.</div>}
      {stamp && <div className="massive-stamp">FIRST.</div>}
      <div className="record-line-wrap">
        <p className="record-line">on record. officially. can't undo it. it's done. also: {profile.topChoice || 'chaos'} was definitely a clue.</p>
      </div>
      <ShinCorner pose="faceDown" className="corner-bottom-right" />
      {done && <p className="scene-hint">▼</p>}
    </div>
  );
}

function Slide5({ profile, onNext }) {
  const action = (profile.topChoice || 'show up').toLowerCase();
  const [noStage, setNoStage] = useState(0);
  const [ballText, setBallText] = useState('');
  const [reformed, setReformed] = useState(false);
  const [done, setDone] = useState(false);
  const [tint, setTint] = useState(false);

  useEffect(() => {
    if (noStage !== 2) return;
    const phrase = 'okay. okay. okay okay okay okay.';
    let index = 0;
    setBallText('');
    const timer = setInterval(() => {
      index += 1;
      setBallText(phrase.split(' ').slice(0, index).join(' '));
      if (index >= phrase.split(' ').length) clearInterval(timer);
    }, 200);
    const finishTimer = setTimeout(() => {
      try {
        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
        if (AudioContextCtor) {
          const audio = new AudioContextCtor();
          const osc = audio.createOscillator();
          const gain = audio.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(220, audio.currentTime);
          osc.frequency.exponentialRampToValueAtTime(90, audio.currentTime + 0.35);
          gain.gain.setValueAtTime(0.1, audio.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.35);
          osc.connect(gain).connect(audio.destination);
          osc.start();
          osc.stop(audio.currentTime + 0.36);
        }
      } catch {}
      setReformed(true);
      setTimeout(() => setDone(true), 700);
    }, 3000);
    return () => { clearInterval(timer); clearTimeout(finishTimer); };
  }, [noStage]);

  const handleNo = () => {
    if (noStage === 0) {
      setNoStage(1);
      setTint(true);
      setTimeout(() => setTint(false), 2200);
      return;
    }
    if (noStage === 1) {
      setNoStage(2);
      setTint(true);
    }
  };

  return (
    <div className={`act2-scene scene-5 act2-frame act2-frame-dark ${tint ? 'red-tint' : ''}`} onClick={() => done && onNext()}>
      <div className="yesno-wrap">
        <h2 className="small-load">loading courage... calibrated for {action || 'chaos'} mode</h2>
        <h1 className="pulse-question">will you be his girlfriend?</h1>
        <div className="ask-buttons exact-two">
          <button className="yes-btn yes-glow" onClick={() => setDone(true)}>YES</button>
          {noStage < 2 ? (
            <button className={`no-btn ${noStage === 1 ? 'small-no' : ''}`} onClick={handleNo}>NO 😡</button>
          ) : (
            <button className="no-btn no-turned-yes" onClick={() => setDone(true)}>yes (enthusiastically)</button>
          )}
        </div>
      </div>
      {noStage > 0 && (
        <div className={`angry-ball ${noStage === 2 ? 'big-ball rapid-shake' : 'small-ball shake'}`}>
          <div className="angry-emoji">
            <img src={angryEmoji} alt="angry emoji" className="angry-emoji-img" />
          </div>
          <div className="ball-copy">{noStage === 1 ? '...excuse me???' : ballText}</div>
        </div>
      )}
      {reformed && <p className="after-error">the management has updated your options.</p>}
      <ShinCorner pose={noStage >= 2 ? 'run' : 'idle'} className="corner-bottom-right" />
      {done && <p className="scene-hint">▼</p>}
    </div>
  );
}

function Slide6({ profile, onYes }) {
  const [phase, setPhase] = useState('load');
  const [progress, setProgress] = useState(0);
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [state, setState] = useState(0);
  const [flash, setFlash] = useState('');

  useEffect(() => {
    if (phase !== 'load') return;
    const timer = setInterval(() => {
      setProgress(v => {
        const next = Math.min(100, v + 8);
        if (next === 100) {
          clearInterval(timer);
          setTimeout(() => setPhase('question'), 420);
        }
        return next;
      });
    }, 110);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'question') return;
    const line1 = `so, after ${profile.snackChoice || 'all this'} -`;
    const line2 = 'will you be his girlfriend?';
    let i = 0;
    let j = 0;

    const type2 = () => {
      if (j <= line2.length) {
        setQ2(line2.slice(0, j));
        j += 1;
        setTimeout(type2, 90 + Math.random() * 170);
      }
    };

    const type1 = () => {
      if (i <= line1.length) {
        setQ1(line1.slice(0, i));
        i += 1;
        setTimeout(type1, 120 + Math.random() * 220);
      } else {
        setTimeout(type2, 900);
      }
    };

    type1();
  }, [phase, profile]);

  const handleNo = () => {
    if (state === 0) {
      setState(1);
      setFlash('flash-one');
      setTimeout(() => setFlash(''), 800);
      return;
    }
    if (state === 1) {
      setState(2);
      setFlash('flash-two');
      setTimeout(() => setFlash(''), 900);
    }
  };

  return (
    <div className={`act2-scene scene-6 act2-frame act2-frame-dark ${flash}`}>
      {phase === 'load' && (
        <div className="courage-loader">
          <h3>loading courage...</h3>
          <div className="load-bar"><div style={{ width: `${progress}%` }} /></div>
          <p>{progress >= 80 ? 'ERROR: too scared... retrying.' : 'loading the thing. he made me do this.'}</p>
        </div>
      )}

      {phase === 'question' && (
        <div className="ask-wrap yesno-wrap">
          <h2>{q1}</h2>
          <h1 className="pulse-question">{q2}</h1>
          <div className="ask-buttons exact-two">
            <button className="yes-btn yes-glow" onClick={onYes}>YES</button>
            <button className={`no-btn ${state > 0 ? 'broken' : ''} ${state === 2 ? 'no-turned-yes' : ''}`} onClick={state === 2 ? onYes : handleNo}>{state === 2 ? 'yes (enthusiastically)' : 'NO 😡'}</button>
          </div>
          {state > 0 && (
            <div className="angry-emoji-pop">
              <img src={angryEmoji} alt="angry emoji" className="angry-emoji-pop-img" />
            </div>
          )}
        </div>
      )}
      {phase === 'question' && <ShinCorner pose={state === 2 ? 'run' : 'sign'} className="corner-bottom-right" />}
    </div>
  );
}

function Slide7({ profile }) {
  const [step, setStep] = useState(0);
  const runnerRef = useRef(null);

  useEffect(() => {
    const end = Date.now() + 3800;
    const frame = () => {
      confetti({ particleCount: 12, spread: 70, origin: { x: Math.random(), y: Math.random() * 0.4 }, colors: ['#f9d423', '#ff4e50', '#53d8fb', '#9bff8a'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    const timers = [setTimeout(() => setStep(1), 1200), setTimeout(() => setStep(2), 3200), setTimeout(() => setStep(3), 5000)];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const canvas = runnerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    canvas.width = 220;
    canvas.height = 80;
    let t = 0;
    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const x = 20 + ((t * 2.6) % 180);
      ctx.fillStyle = '#ffebc8'; ctx.fillRect(x, 22, 20, 20);
      ctx.fillStyle = '#111'; ctx.fillRect(x + 4, 28, 4, 4); ctx.fillRect(x + 10, 28, 4, 4);
      ctx.fillStyle = '#c22'; ctx.fillRect(x + 4, 35, 10, 3);
      ctx.fillStyle = '#666'; ctx.fillRect(x - 6, 26 + Math.sin(t / 5) * 2, 10, 4);
      ctx.fillRect(x - 6, 34 + Math.sin(t / 5) * 2, 6, 14);
      ctx.fillRect(x + 16, 34 + Math.cos(t / 5) * 2, 6, 14);
      requestAnimationFrame(draw);
    };
    draw();
  }, []);

  return (
    <div className="act2-scene scene-7 act2-frame act2-frame-dark">
      <canvas ref={runnerRef} className="runner-canvas" />
      <div className="end-lines">
        {step >= 1 && <p>Niggesh is going to be so embarrassed you saw this.</p>}
        {step >= 2 && <p>good.</p>}
        {step >= 2 && <p>you picked {profile.snackChoice || 'evidence'} and ranked {profile.topChoice || 'chaos'} first. very on brand.</p>}
        {step >= 3 && <p>date 2 loading...</p>}
      </div>
      {step >= 3 && (
        <div className="gps-loader">
          <div className="tile-grid" />
          <div className="route-line" />
          <div className="destination-pin">wherever you want</div>
          <div className="gps-label">📍 date 2 loading...</div>
          <div className="gps-ready">ready when you are.</div>
        </div>
      )}
      <ShinCorner pose="run" className="corner-bottom-right" />
      {step >= 3 && <p className="scene-hint paper-hint">▼</p>}
    </div>
  );
}
