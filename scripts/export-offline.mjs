import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { Script } from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(process.argv[2] || `${process.env.XDG_DATA_HOME || `${homedir()}/.local/share`}/codex/artifacts/na-ni-fan/offline-share/那你烦什么-奶龙版.html`);
const files = ['lib/classics.mjs', 'lib/conversations.mjs', 'lib/engine.mjs', 'lib/music.mjs', 'app.mjs'];
const [template, css, image, ...sources] = await Promise.all([
  readFile(resolve(root, 'dist/index.html'), 'utf8'),
  readFile(resolve(root, 'dist/style.css'), 'utf8'),
  readFile(resolve(root, 'dist/assets/nailoong.png')),
  ...files.map(file => readFile(resolve(root, 'dist', file), 'utf8'))
]);

// This app has only named declarations and single-line local imports.
// Fail when that changes instead of silently producing an incomplete bundle.
const plainSources = sources.map((source, index) => {
  const plain = source.replace(/^import .+ from ['"].+['"];\r?\n/gm, '').replace(/^export (?=(const|function)\b)/gm, '');
  if (/^(import|export)\b/m.test(plain)) throw new Error(`Unsupported module syntax in ${files[index]}`);
  return plain;
});
const dataImage = `data:image/png;base64,${image.toString('base64')}`;
const code = `(() => {\n'use strict';\n${plainSources.join('\n')}\n})();`
  .replaceAll('./assets/nailoong.png', dataImage)
  .replaceAll('href="./" data-action="home"', 'href="#" data-action="home"');
new Script(code, { filename: 'offline-app.js' });

const html = template
  .replace('<link rel="stylesheet" href="./style.css">', () => `<style>\n${css.replace(/<\/style/gi, '<\\/style')}\n</style>`)
  .replace('  <script type="module" src="./app.mjs"></script>\n', '')
  .replace('</body>', () => `<script>\n${code.replace(/<\/script/gi, '<\\/script')}\n</script>\n</body>`);
if (/<(?:script|img)\b[^>]*\bsrc=["'](?:\.\/|https?:)/i.test(html) || /<link\b[^>]*href=["']\.\//i.test(html)) {
  throw new Error('Offline output still refers to an external asset');
}
await mkdir(dirname(output), { recursive: true });
await writeFile(output, html);
console.log(`${output}\n${Buffer.byteLength(html)} bytes; scripts, styles and character image included.`);
