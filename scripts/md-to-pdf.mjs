#!/usr/bin/env node
// Converts a Markdown report to a PDF with correct Arabic (right-to-left) text,
// tables, code blocks and Mermaid diagrams. Rendering is done by a local
// Chrome or Edge in headless mode, so Arabic letters are shaped and ordered by
// the browser's text engine. Everything it needs (fonts, marked, mermaid) is
// bundled in ./vendor, so it works offline and needs no npm install.
//
// Usage: node md-to-pdf.mjs <input.md> [output.pdf] [--rtl | --ltr]
// Set CHROME_PATH to use a specific browser.

import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir, platform } from 'node:os';

const vendor = join(dirname(fileURLToPath(import.meta.url)), 'vendor');

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const [input, outputArg] = args.filter((a) => !a.startsWith('--'));
if (!input) {
  console.error('Usage: node md-to-pdf.mjs <input.md> [output.pdf] [--rtl | --ltr]');
  process.exit(2);
}
const inPath = resolve(input);
const outPath = resolve(outputArg ?? inPath.replace(/\.md$/i, '') + '.pdf');
const markdown = readFileSync(inPath, 'utf8');

// Page direction: forced by a flag, otherwise right-to-left when the text is
// mostly Arabic. Technical reports carry many English names, so Arabic wins
// at a lower share.
const arabicCount = (markdown.match(/[\u0600-\u06FF\u0750-\u077F]/g) || []).length;
const latinCount = (markdown.match(/[A-Za-z]/g) || []).length;
const rtl = flags.has('--rtl') || (!flags.has('--ltr') && arabicCount > 0 && arabicCount >= latinCount * 0.3);

const fontFace = (weight) => {
  const data = readFileSync(join(vendor, 'fonts', `noto-naskh-arabic-arabic-${weight}.woff2`)).toString('base64');
  return `@font-face{font-family:'Report Arabic';font-style:normal;font-weight:${weight};font-display:block;
src:url(data:font/woff2;base64,${data}) format('woff2');
unicode-range:U+0600-06FF,U+0750-077F,U+0870-08FF,U+200C-200F,U+FB50-FDFF,U+FE70-FEFF;}`;
};

const hasMermaid = /```mermaid/.test(markdown);
const inlineScript = (file) => readFileSync(join(vendor, file), 'utf8').replace(/<\/script/gi, '<\\/script');
// JSON in a <script> must not be able to close the tag.
const markdownJson = JSON.stringify(markdown).replace(/</g, '\\u003c');
const title = (markdown.match(/^#\s+(.+)$/m)?.[1] ?? 'Report').replace(/[<&]/g, '');

const fonts = `'Report Arabic', 'Segoe UI', 'Noto Sans', Arial, sans-serif`;
const html = `<!doctype html>
<html lang="${rtl ? 'ar' : 'en'}" dir="${rtl ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
${fontFace(400)}
${fontFace(700)}
@page { size: A4; margin: 18mm 16mm; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: ${fonts}; font-size: 11.5pt; line-height: 1.8; color: #1f2328; margin: 0; }
h1, h2, h3, h4 { line-height: 1.4; page-break-after: avoid; break-after: avoid; }
h1 { font-size: 22pt; border-bottom: 3px solid #1f6feb; padding-bottom: 6px; margin: 0 0 18px; }
h2 { font-size: 16pt; color: #1f6feb; border-bottom: 1px solid #d0d7de; padding-bottom: 4px; margin-top: 28px; }
h3 { font-size: 13pt; margin-top: 20px; }
p, li { text-align: start; }
ul, ol { padding-inline-start: 1.6em; }
a { color: #1f6feb; text-decoration: none; }
code { font-family: Consolas, 'Cascadia Mono', 'Courier New', monospace; font-size: 0.88em;
  background: #f1f3f5; border-radius: 4px; padding: 1px 5px; unicode-bidi: isolate; }
pre { direction: ltr; text-align: left; background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px;
  padding: 10px 12px; font-size: 9.5pt; line-height: 1.5; white-space: pre-wrap; word-break: break-word;
  page-break-inside: avoid; break-inside: avoid; }
pre code { background: none; padding: 0; font-size: inherit; }
table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 10.5pt; page-break-inside: auto; }
tr { page-break-inside: avoid; break-inside: avoid; }
th, td { border: 1px solid #d0d7de; padding: 6px 9px; text-align: start; vertical-align: top; }
th { background: #eef3fb; font-weight: 700; }
tr:nth-child(even) td { background: #fafbfc; }
blockquote { margin: 12px 0; padding: 6px 14px; color: #57606a; border-inline-start: 4px solid #d0d7de; }
.mermaid { direction: ltr; text-align: center; margin: 16px 0; page-break-inside: avoid; break-inside: avoid; }
.mermaid svg { max-width: 100%; height: auto; }
img { max-width: 100%; }
hr { border: none; border-top: 1px solid #d0d7de; margin: 22px 0; }
</style>
</head>
<body>
<main id="content"></main>
<script>window.__markdown = ${markdownJson};</script>
<script>${inlineScript('marked.min.js')}</script>
<script>
  const root = document.getElementById('content');
  root.innerHTML = marked.parse(window.__markdown, { gfm: true });
  // Each block picks its own direction, so an English-only line stays
  // left-to-right inside an Arabic page and the reverse.
  root.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, td, th, blockquote, dt, dd')
    .forEach((el) => el.setAttribute('dir', 'auto'));
  // Code, paths and identifiers are always left-to-right.
  root.querySelectorAll('code').forEach((el) => el.setAttribute('dir', 'ltr'));
  root.querySelectorAll('pre > code.language-mermaid').forEach((code) => {
    const div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = code.textContent;
    code.parentElement.replaceWith(div);
  });
</script>
${hasMermaid ? `<script>${inlineScript('mermaid.min.js')}</script>
<script>
  mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'strict',
    fontFamily: ${JSON.stringify(fonts)}, flowchart: { htmlLabels: true } });
  document.fonts.ready.then(() => mermaid.run({ querySelector: '.mermaid' }));
</script>` : ''}
</body>
</html>`;

function findBrowser() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates = {
    win32: [
      join(process.env.ProgramFiles ?? 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
      join(process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
      join(process.env.LOCALAPPDATA ?? '', 'Google\\Chrome\\Application\\chrome.exe'),
      join(process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)', 'Microsoft\\Edge\\Application\\msedge.exe'),
      join(process.env.ProgramFiles ?? 'C:\\Program Files', 'Microsoft\\Edge\\Application\\msedge.exe'),
    ],
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ],
  }[platform()] ?? [];
  for (const path of candidates) if (existsSync(path)) return path;
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']) {
    const found = spawnSync('which', [name], { encoding: 'utf8' });
    if (found.status === 0 && found.stdout.trim()) return found.stdout.trim();
  }
  return null;
}

const browser = findBrowser();
if (!browser) {
  console.error('No Chrome, Edge or Chromium found. Install one, or set CHROME_PATH.');
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), 'md-to-pdf-'));
try {
  const htmlPath = join(work, 'report.html');
  writeFileSync(htmlPath, html, 'utf8');
  if (existsSync(outPath)) rmSync(outPath);
  const result = spawnSync(browser, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${join(work, 'profile')}`,
    '--no-pdf-header-footer',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=30000',
    `--print-to-pdf=${outPath}`,
    pathToFileURL(htmlPath).href,
  ], { encoding: 'utf8', timeout: 180000 });
  if (!existsSync(outPath) || statSync(outPath).size === 0) {
    console.error(`PDF was not created.\n${result.stderr ?? ''}`);
    process.exit(1);
  }
  console.log(`PDF saved: ${outPath} (${rtl ? 'right-to-left' : 'left-to-right'})`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
