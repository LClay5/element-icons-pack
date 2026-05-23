const fs = require('fs');
const path = require('path');

const palettes = JSON.parse(fs.readFileSync('themes/palettes.json', 'utf-8'));
const srcDir = 'src';
const distDir = 'dist';

function slug(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

const themeKeys = [];
for (const [elem, elemData] of Object.entries(palettes)) {
  for (const [time, _] of Object.entries(elemData)) {
    if (time === 'name' || time === 'base') continue;
    themeKeys.push(`${elem}-${time}`);
  }
}

for (const tk of themeKeys) {
  fs.mkdirSync(path.join(distDir, tk), { recursive: true });
}

const svgFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.svg'));

for (const [elem, elemData] of Object.entries(palettes)) {
  for (const [time, colors] of Object.entries(elemData)) {
    if (time === 'name' || time === 'base') continue;

    const outDir = path.join(distDir, `${elem}-${time}`);

    for (const svgFile of svgFiles) {
      let content = fs.readFileSync(path.join(srcDir, svgFile), 'utf-8');
      content = content.replace(/\{\{(\w+)\}\}/g, (_, token) => colors[token] || token);
      fs.writeFileSync(path.join(outDir, svgFile), content, 'utf-8');
    }
  }
}

const names = themeKeys.map(tk => {
  const [elem, seasonKey] = tk.split('-');
  const season = palettes[elem][seasonKey];
  return { key: tk, element: elem, season: seasonKey, label: `${palettes[elem].name} ${season.name}` };
});

fs.writeFileSync(path.join(distDir, 'themes.json'), JSON.stringify(names, null, 2), 'utf-8');

const icons = svgFiles.map(f => f.replace('.svg', ''));
fs.writeFileSync(path.join(distDir, 'icons.json'), JSON.stringify(icons, null, 2), 'utf-8');

console.log(`Generated ${themeKeys.length} themes × ${svgFiles.length} icons = ${themeKeys.length * svgFiles.length} SVGs`);
console.log(`Themes: ${names.map(n => n.label).join(', ')}`);
