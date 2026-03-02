const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const srcDir = '../store-screenshots';
const outDir = './';

const screens = [
  {
    file: '01_search_empty.png',
    annotations: [
      { text: 'Tabs, History & Bookmarks<br>Search Everything Instantly', pos: 'top-left' }
    ]
  },
  {
    file: '02_search_results.png',
    annotations: [
      { text: 'Fuzzy Search<br>Find with Vague Keywords✨', pos: 'bottom-left' },
      { text: 'Press Enter<br>to Access Instantly', pos: 'top-right' }
    ]
  },
  {
    file: '03_command_mode.png',
    annotations: [
      { text: 'Press Tab<br>to Switch Between Command & Search Mode', pos: 'top-left' },
      { text: 'Full Browser Control<br>with Keyboard Only⌨️', pos: 'bottom-right' }
    ]
  },
  {
    file: '04_command_search.png',
    annotations: [
      { text: 'Quick Access<br>to Frequently Used Actions🚀', pos: 'bottom-left' },
    ]
  },
  {
    file: '05_popup.png',
    annotations: [
      { text: 'Check Shortcut Keys<br>Anytime', pos: 'top-right' }
    ]
  }
];

function getBackground() {
  return `
      background-color: #0f172a;
      background-image: 
        radial-gradient(circle at 100% 100%, rgba(99, 102, 241, 0.4) 0%, transparent 60%),
        radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.3) 0%, transparent 60%);
      position: relative;
    `;
}

function getOrganicShapes() {
  return `
      <svg class="abstract-shapes" width="1280" height="800" xmlns="http://www.w3.org/2000/svg">
        <path d="M-100,500 C 200,400 400,900 600,600 C 800,300 1000,700 1380,500" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="4"/>
        <path d="M-50,600 C 300,700 500,200 800,500 C 1100,800 1200,300 1380,400" fill="none" stroke="rgba(255, 255, 255, 0.03)" stroke-width="8"/>
        <path d="M 800,-100 C 900,200 1100,100 1300,300" fill="none" stroke="rgba(255, 255, 255, 0.07)" stroke-width="6"/>
      </svg>
    `;
}

function getPositionStyle(pos) {
  let style = "";
  if (pos.includes("top")) style += "top: 60px; ";
  if (pos.includes("bottom")) style += "bottom: 60px; ";
  if (pos.includes("left")) style += "left: 80px; text-align: left; ";
  if (pos.includes("right")) style += "right: 80px; text-align: right; ";
  return style;
}

function getAnnotationsHtml(annotations) {
  let divHtml = '';

  annotations.forEach((ann, i) => {
    const angle = Math.floor(Math.random() * 5) - 2; // Random rotation: -2 to +2 degrees
    const posStyle = getPositionStyle(ann.pos);
    divHtml += `<div class="annotation" style="${posStyle} transform: rotate(${angle}deg);">${ann.text}</div>`;
  });

  return divHtml;
}

function getPageHtml(imgBase64, annotations) {
  return `
    <html>
    <head>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@600;700&display=swap" rel="stylesheet">
    <style>
      body {
        margin: 0; padding: 0;
        width: 1280px; height: 800px;
        font-family: 'Inter', sans-serif;
        overflow: hidden; 
        ${getBackground()}
      }
      .abstract-shapes {
        position: absolute;
        top: 0; left: 0;
        z-index: 0;
        pointer-events: none;
      }
      .container { 
        position: absolute; 
        width: 100%; height: 100%; 
        display: flex; justify-content: center; align-items: center; 
        z-index: 1;
      }
      img.screenshot { 
        width: 65%; 
        border-radius: 12px; 
        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1); 
        object-fit: contain;
      }
      .annotation { 
        position: absolute; 
        color: #f8fafc; 
        font-size: 38px; 
        font-weight: 600;
        line-height: 1.4;
        letter-spacing: 1px;
        z-index: 2;
        background: linear-gradient(135deg, rgba(79, 70, 229, 0.8), rgba(124, 58, 237, 0.8));
        padding: 16px 32px;
        border-radius: 20px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2);
        border: 2px solid rgba(255,255,255,0.15);
        backdrop-filter: blur(8px);
      }
    </style>
    </head>
    <body>
       ${getOrganicShapes()}
       <div class="container">
         <img class="screenshot" src="data:image/png;base64,${imgBase64}">
       </div>
       ${getAnnotationsHtml(annotations)}
    </body>
    </html>
    `;
}

// Icon generation: 128x128 store icon and 440x280 marquee promo image
function getIconHtml(imgBase64, width, height) {
  const isIcon = width === 128;
  return `
    <html>
    <head>
    <style>
      body {
        margin: 0; padding: 0; 
        width: ${width}px; height: ${height}px;
        background: linear-gradient(135deg, #1e1b4b, #312e81);
        display: flex; justify-content: center; align-items: center;
        border-radius: ${isIcon ? '28px' : '0px'};
        overflow: hidden;
      }
      img {
        width: ${isIcon ? '60%' : '20%'};
        height: ${isIcon ? '60%' : '40%'};
        object-fit: contain;
        filter: drop-shadow(0px 4px 8px rgba(0,0,0,0.5));
      }
    </style>
    </head>
    <body>
      <img src="data:image/png;base64,${imgBase64}">
    </body>
    </html>
    `;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();

  // Generate store screenshots
  for (const screen of screens) {
    console.log(`Generating ${screen.file}...`);
    const imgPath = path.join(srcDir, screen.file);
    if (!fs.existsSync(imgPath)) {
      console.error(`Not found: ${imgPath}`);
      continue;
    }
    const imgBase64 = fs.readFileSync(imgPath).toString('base64');
    const html = getPageHtml(imgBase64, screen.annotations);

    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load' });

    // Wait for web fonts to finish loading
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(outDir, screen.file) });
  }

  // Generate store icon (128x128)
  const iconOrigPath = '../assets/icon.png';
  if (fs.existsSync(iconOrigPath)) {
    console.log('Generating Store Icon 128x128...');
    const iconBase64 = fs.readFileSync(iconOrigPath).toString('base64');

    const iconHtml = getIconHtml(iconBase64, 128, 128);
    await page.setViewport({ width: 128, height: 128, deviceScaleFactor: 1 });
    await page.setContent(iconHtml, { waitUntil: 'load' });
    await page.screenshot({ path: path.join(outDir, 'store_icon_128.png'), clip: { x: 0, y: 0, width: 128, height: 128 }, omitBackground: true });

    console.log('Generating Marquee Promo 440x280...');
    const marqueeHtml = getIconHtml(iconBase64, 440, 280);
    await page.setViewport({ width: 440, height: 280, deviceScaleFactor: 1 });
    await page.setContent(marqueeHtml, { waitUntil: 'load' });
    await page.screenshot({ path: path.join(outDir, 'marquee_440x280.png'), clip: { x: 0, y: 0, width: 440, height: 280 } });
  }

  await browser.close();
  console.log('Done!');
})();
