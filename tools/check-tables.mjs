import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { HtmlParser } from '@angular/compiler';

const parser = new HtmlParser();
const failures = [];
let tables = 0;
let filesWithTables = 0;

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : path.endsWith('.html') ? [path] : [];
  });
}

function visit(nodes, ancestors, path) {
  for (const node of nodes) {
    if (!node.attrs) {
      visit(node.children ?? [], ancestors, path);
      continue;
    }
    const attrs = Object.fromEntries(node.attrs.map((attr) => [attr.name, attr.value]));
    const location = `${relative('.', path)}:${node.sourceSpan.start.line + 1}`;
    const error = (message) => failures.push(`${location}: ${message}`);
    if (node.name === 'tc-data-table') {
      if (!('label' in attrs) && !('[label]' in attrs)) error('Missing accessible label');
      if (ancestors.some((parent) => parent.name === 'tc-data-table'))
        error('Nested DataTable scroll regions');
    }
    if (node.name === 'table') {
      tables++;
      if (!ancestors.some((parent) => parent.name === 'tc-data-table'))
        error('Native table outside DataTable');
      if (!node.children.some((child) => child.name === 'caption')) error('Missing native caption');
      if (
        ancestors.some((parent) =>
          parent.attrs?.some(
            (attr) => attr.name === 'class' && /\btable-(scroll|wrap)\b/.test(attr.value),
          ),
        )
      ) {
        error('Legacy scroll wrapper around table');
      }
    }
    if (
      node.name === 'th' &&
      ancestors.some((parent) => parent.name === 'table') &&
      !('scope' in attrs)
    ) {
      error('Missing header scope');
    }
    visit(node.children ?? [], [...ancestors, node], path);
  }
}

for (const path of files('src/app/features')) {
  const source = readFileSync(path, 'utf8');
  const parsed = parser.parse(source, path);
  failures.push(...parsed.errors.map((error) => error.toString()));
  const before = tables;
  visit(parsed.rootNodes, [], path);
  if (tables > before) filesWithTables++;
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `${tables} tables in ${filesWithTables} templates: shared presentation, captions, header scope and a single scroll owner verified.`,
  );
}
