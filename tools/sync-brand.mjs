import { readFile, mkdir, writeFile } from 'node:fs/promises';
const source = new URL('../../../assets/tracecore-colores-planos.svg', import.meta.url);
const destination = new URL('../public/assets/brand/tracecore-colores-planos.svg', import.meta.url);
const original = await readFile(source);
if (!original.toString().includes('viewBox="90 125 1300 710"'))
  throw new Error('Revisar la guía antes de cambiar las proporciones del SVG de marca.');
await mkdir(new URL('../public/assets/brand/', import.meta.url), { recursive: true });
await writeFile(destination, original);
console.log('SVG de marca sincronizado sin modificar el original.');
