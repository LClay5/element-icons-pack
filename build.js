const fs = require('fs');
const path = require('path');

const palettes = JSON.parse(fs.readFileSync('themes/palettes.json', 'utf-8'));
const srcDir = 'src';
const distDir = 'dist';

function hexToRgb(h) {
  const r = parseInt(h.slice(1,3), 16);
  const g = parseInt(h.slice(3,5), 16);
  const b = parseInt(h.slice(5,7), 16);
  return [r,g,b];
}

function rgbToHex(r,g,b) {
  return '#' + [r,g,b].map(c=>Math.max(0,Math.min(255,Math.round(c))).toString(16).padStart(2,'0')).join('');
}

function darken(hex, factor) {
  const [r,g,b] = hexToRgb(hex);
  return rgbToHex(r*factor, g*factor, b*factor);
}

function nightPalette(day) {
  return {
    bg:   day.bg   ? darken(day.bg, 0.08) : '#0a0a0a',
    c1:   day.c1   ? darken(day.c1, 0.6) : '#555',
    c2:   day.c2   ? darken(day.c2, 0.5) : '#444',
    c3:   day.c3   ? darken(day.c3, 0.4) : '#333',
    accent: day.accent ? darken(day.accent, 0.85) : '#ccc',
  };
}

function writeThemedSVGs(outDir, colors, svgFiles) {
  for (const svgFile of svgFiles) {
    let content = fs.readFileSync(path.join(srcDir, svgFile), 'utf-8');
    content = content.replace(/\{\{(\w+)\}\}/g, (_, token) => colors[token] || token);
    fs.writeFileSync(path.join(outDir, svgFile), content, 'utf-8');
  }
}

const svgFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.svg'));
const allThemes = [];

for (const [elem, elemData] of Object.entries(palettes)) {
  for (const [season, dayColors] of Object.entries(elemData)) {
    if (season === 'name' || season === 'base') continue;

    const dayDir = path.join(distDir, `${elem}-${season}-day`);
    const nightDir = path.join(distDir, `${elem}-${season}-night`);
    fs.mkdirSync(dayDir, { recursive: true });
    fs.mkdirSync(nightDir, { recursive: true });

    writeThemedSVGs(dayDir, dayColors, svgFiles);
    writeThemedSVGs(nightDir, nightPalette(dayColors), svgFiles);

    allThemes.push({ key: `${elem}-${season}-day`, element: elem, season, time: 'day',
      label: `${elemData.name} ${dayColors.name} ☀️` });
    allThemes.push({ key: `${elem}-${season}-night`, element: elem, season, time: 'night',
      label: `${elemData.name} ${dayColors.name} 🌙` });
  }
}

fs.writeFileSync(path.join(distDir, 'themes.json'), JSON.stringify(allThemes, null, 2), 'utf-8');
const icons = svgFiles.map(f => f.replace('.svg', ''));
fs.writeFileSync(path.join(distDir, 'icons.json'), JSON.stringify(icons, null, 2), 'utf-8');

console.log(`Generated ${allThemes.length} themes × ${icons.length} icons = ${allThemes.length * icons.length} SVGs`);
console.log(`Themes: ${allThemes.map(t=>t.label).join(', ')}`);
