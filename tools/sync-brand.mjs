import { readFile, mkdir, writeFile } from 'node:fs/promises';
for (const [name, viewBox] of [
  ['tracecore-colores-planos.svg', '90 125 1300 710'],
  ['tracecore-isotipo.svg', '330 130 730 490'],
]) {
  const source = new URL(`../../../assets/${name}`, import.meta.url);
  const destination = new URL(`../public/assets/brand/${name}`, import.meta.url);
  const original = await readFile(source);
  if (!original.toString().includes(`viewBox="${viewBox}"`))
    throw new Error(`Revisar la guía antes de cambiar las proporciones de ${name}.`);
  await mkdir(new URL('../public/assets/brand/', import.meta.url), { recursive: true });
  await writeFile(destination, original);
  if (!original.equals(await readFile(destination)))
    throw new Error(`Copia de marca distinta: ${name}`);
}
console.log('Logotipo e isotipo sincronizados sin modificar los originales.');
