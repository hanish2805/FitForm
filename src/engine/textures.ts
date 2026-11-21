import * as THREE from 'three';

function configureColorTexture(tex: THREE.CanvasTexture, maxAnisotropy: number, repeatX = 1, repeatY = 1) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createGymRubberTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#181e1a';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle rubber flecks
  for (let i = 0; i < 650; i++) {
    const x = (i * 73) % 256;
    const y = (i * 137) % 256;
    ctx.fillStyle = i % 9 === 0 ? 'rgba(199,255,0,0.14)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Interlocking tile seams
  ctx.strokeStyle = '#0d110e';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, 125, 125);
  ctx.strokeRect(129.5, 1.5, 125, 125);
  ctx.strokeRect(1.5, 129.5, 125, 125);
  ctx.strokeRect(129.5, 129.5, 125, 125);

  return configureColorTexture(new THREE.CanvasTexture(canvas), maxAnisotropy, 12, 12);
}

export function createGrassTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#253d27';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 900; i++) {
    const x = (i * 59) % 256;
    const y = (i * 97) % 256;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(141,175,38,0.16)' : 'rgba(15,28,17,0.2)';
    ctx.fillRect(x, y, 3, 6);
  }

  return configureColorTexture(new THREE.CanvasTexture(canvas), maxAnisotropy, 36, 36);
}

export function createTrackTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#9c3a2c';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle rubber track grain
  for (let i = 0; i < 500; i++) {
    const x = (i * 41) % 256;
    const y = (i * 83) % 256;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Lane dividers
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  for (let y = 0; y < 256; y += 64) {
    ctx.fillRect(0, y, 256, 4);
  }

  return configureColorTexture(new THREE.CanvasTexture(canvas), maxAnisotropy, 6, 1);
}

export function createWalkwayTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#2d3330';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#1f2421';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 256; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  return configureColorTexture(new THREE.CanvasTexture(canvas), maxAnisotropy, 10, 10);
}

export function createWoodFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#6c4f37';
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 32) {
    ctx.fillStyle = y % 64 === 0 ? 'rgba(255,235,205,0.06)' : 'rgba(0,0,0,0.07)';
    ctx.fillRect(0, y, 256, 30);
    ctx.fillStyle = '#3e2c1d';
    ctx.fillRect(0, y + 30, 256, 2);
  }

  return configureColorTexture(new THREE.CanvasTexture(canvas), maxAnisotropy, 4, 4);
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.22)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function createSignTexture(
  title: string,
  subtitle: string,
  accentColor: string,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0c120e';
  ctx.fillRect(0, 0, 512, 160);

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 148);

  ctx.fillStyle = accentColor;
  ctx.fillRect(20, 28, 8, 104);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px Space Grotesk, Inter, sans-serif';
  ctx.fillText(title.toUpperCase(), 44, 74);

  ctx.fillStyle = '#a5aca6';
  ctx.font = '600 22px Inter, sans-serif';
  ctx.fillText(subtitle, 44, 118);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createTurfTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1b4a26';
  ctx.fillRect(0, 0, 256, 512);

  // Synthetic turf blade grain
  for (let i = 0; i < 1600; i++) {
    const x = (i * 61) % 256;
    const y = (i * 113) % 512;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(199,255,0,0.08)' : 'rgba(10,24,14,0.22)';
    ctx.fillRect(x, y, 2, 4);
  }

  // Crisp lane borders & meter hash lines
  ctx.fillStyle = '#e5efe7';
  ctx.fillRect(10, 0, 6, 512);
  ctx.fillRect(240, 0, 6, 512);
  for (let y = 32; y < 512; y += 64) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(16, y, 224, 4);
    ctx.fillStyle = 'rgba(199,255,0,0.85)';
    ctx.fillRect(118, y - 6, 20, 16);
  }

  // Stencil mark
  ctx.save();
  ctx.translate(128, 256);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.font = 'bold 34px Space Grotesk, Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FITFORM TURF', 0, 12);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createOakPlatformTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8b6340';
  ctx.fillRect(0, 0, 256, 256);

  for (let x = 0; x < 256; x += 24) {
    ctx.fillStyle = x % 48 === 0 ? 'rgba(255,235,205,0.09)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect(x, 0, 22, 256);
    ctx.fillStyle = '#5b3f27';
    ctx.fillRect(x + 22, 0, 2, 256);
  }

  // Center FITFORM Olympic stencil
  ctx.strokeStyle = 'rgba(199,255,0,0.65)';
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, 208, 208);
  ctx.fillStyle = 'rgba(15,20,16,0.65)';
  ctx.fillRect(58, 108, 140, 40);
  ctx.fillStyle = '#C7FF00';
  ctx.font = 'bold 20px Space Grotesk, Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FITFORM LIFT', 128, 135);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createTreadmillConsoleTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#090e0b';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 120);

  ctx.fillStyle = '#C7FF00';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('PACE 04:15', 18, 42);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('148 BPM  2.5%', 18, 72);

  // Bar equalizer graph
  for (let i = 0; i < 10; i++) {
    const h = 14 + ((i * 13) % 24);
    ctx.fillStyle = i > 6 ? '#C7FF00' : '#38bdf8';
    ctx.fillRect(18 + i * 22, 112 - h, 14, h);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createGymWallMuralTexture(
  title: string,
  subtitle: string,
  accentColor: string,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#111713';
  ctx.fillRect(0, 0, 512, 192);

  // Diagonal athletic stripe motif
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(42, 0);
  ctx.lineTo(18, 192);
  ctx.lineTo(0, 192);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 496, 176);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 46px Space Grotesk, Inter, sans-serif';
  ctx.fillText(title.toUpperCase(), 58, 92);

  ctx.fillStyle = accentColor;
  ctx.font = '700 22px Inter, sans-serif';
  ctx.fillText(subtitle.toUpperCase(), 58, 138);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createParkPavingTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3b423c';
  ctx.fillRect(0, 0, 256, 256);

  // Interlocking stone paver pattern
  for (let row = 0; row < 8; row++) {
    const offset = row % 2 === 0 ? 0 : 32;
    for (let col = -1; col < 5; col++) {
      const x = col * 64 + offset;
      const y = row * 32;
      ctx.fillStyle = (row + col) % 3 === 0 ? '#444d46' : '#373e38';
      ctx.fillRect(x + 2, y + 2, 60, 28);
    }
  }

  return configureColorTexture(new THREE.CanvasTexture(canvas), maxAnisotropy, 6, 6);
}

export function createWaterTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 16, 128, 128, 140);
  grad.addColorStop(0, '#0ea5e9');
  grad.addColorStop(0.55, '#0369a1');
  grad.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle caustic shimmer rings
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.25)';
  ctx.lineWidth = 2;
  [36, 68, 102].forEach((r) => {
    ctx.beginPath();
    ctx.arc(128, 128, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  return configureColorTexture(new THREE.CanvasTexture(canvas), maxAnisotropy, 1, 1);
}

export function createNutritionMenuTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#09110c';
  ctx.fillRect(0, 0, 512, 192);
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 5;
  ctx.strokeRect(5, 5, 502, 182);

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 26px Space Grotesk, Inter, sans-serif';
  ctx.fillText('FUEL PAVILION · DAILY MENU', 24, 42);

  const rows = [
    ['POWER BOWL COMBO', '42g PROT · +45 ENR'],
    ['GREEN HYDRATION', 'ELECTROLYTES · +25 ENR'],
    ['RECOVERY SMOOTHIE', 'BERRIES + OATS · +35 ENR'],
  ];
  rows.forEach(([name, macro], idx) => {
    const y = 84 + idx * 34;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText(name, 24, y);
    ctx.fillStyle = '#C7FF00';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(macro, 276, y);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createArenaScoreboardTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 224;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0a0d0b';
  ctx.fillRect(0, 0, 512, 224);
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 212);

  ctx.fillStyle = '#f97316';
  ctx.fillRect(20, 20, 472, 42);
  ctx.fillStyle = '#080B09';
  ctx.font = 'bold 26px Space Grotesk, Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SUMMIT COMPETITION ARENA', 256, 50);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#C7FF00';
  ctx.font = 'bold 28px monospace';
  ctx.fillText('TIMED TRIALS · 1.45x XP', 32, 108);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 21px Inter, sans-serif';
  ctx.fillText('TEST STRENGTH, STAMINA & FORM STREAKS', 32, 148);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('WIN ARENA TRIALS TO UNLOCK ELITE TIERS', 32, 186);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createHomeScreenTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0b0a14';
  ctx.fillRect(0, 0, 256, 160);
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 152);

  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 18px Space Grotesk, Inter, sans-serif';
  ctx.fillText('ATHLETE POD OS', 16, 32);

  ctx.fillStyle = '#C7FF00';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('RECOVERY   [||||||]', 16, 68);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('WARDROBE   READY', 16, 98);
  ctx.fillStyle = '#e5e7eb';
  ctx.fillText('SCHEDULE   4 ZONES', 16, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createCampusMapSignTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#090e0b';
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = '#C7FF00';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 244);

  ctx.fillStyle = '#C7FF00';
  ctx.font = 'bold 26px Space Grotesk, Inter, sans-serif';
  ctx.fillText('FITFORM CAMPUS DIRECTORY', 24, 44);

  const items: [string, string, string][] = [
    ['N  TRAINING CENTER', 'Gym · Weights · Turf · Cardio', '#C7FF00'],
    ['E  OUTDOOR PARK', 'Track · Calisthenics · Pond', '#38bdf8'],
    ['W  PLAYER HOME', 'Sleep · Recovery · Wardrobe', '#a78bfa'],
    ['SW NUTRITION PAVILION', 'Fuel Bar · Bistro · Macros', '#34d399'],
    ['SE COMPETITION ARENA', 'Stadium Trials · Tier Ranks', '#f97316'],
  ];
  items.forEach(([zone, desc, col], idx) => {
    const y = 84 + idx * 34;
    ctx.fillStyle = col;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(zone, 24, y);
    ctx.fillStyle = '#a5aca6';
    ctx.font = '500 17px Inter, sans-serif';
    ctx.fillText(desc, 256, y);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}


