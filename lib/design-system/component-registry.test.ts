import { readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { componentCategories, componentRegistry } from './component-registry';

const toPascalCase = (fileName: string) =>
  basename(fileName, '.tsx')
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');

const componentFiles = readdirSync(resolve(process.cwd(), 'components'), {
  recursive: true,
  withFileTypes: true,
})
  .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx'))
  .map((entry) => entry.name)
  .filter(
    (name) =>
      !name.endsWith('.stories.tsx') &&
      !name.endsWith('.test.tsx') &&
      name !== 'index.tsx' &&
      name !== 'jsonld.tsx'
  );

const writerPatternFiles = readdirSync(resolve(process.cwd(), 'app/write'), {
  withFileTypes: true,
})
  .filter(
    (entry) =>
      entry.isFile() &&
      entry.name.endsWith('.tsx') &&
      !entry.name.endsWith('.test.tsx') &&
      entry.name !== 'page.tsx'
  )
  .map((entry) => entry.name);

describe('componentRegistry', () => {
  it('keeps component names unique', () => {
    const names = componentRegistry.map((component) => component.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('documents every component with purpose, states, and accessibility responsibility', () => {
    for (const component of componentRegistry) {
      expect(component.purpose.length).toBeGreaterThan(0);
      expect(component.states.length).toBeGreaterThan(0);
      expect(component.accessibility.length).toBeGreaterThan(0);
    }
  });

  it('covers every public component category', () => {
    for (const category of componentCategories) {
      expect(componentRegistry.some((component) => component.category === category)).toBe(true);
    }
  });

  it('registers every shared component and writer pattern', () => {
    const registeredNames = new Set(componentRegistry.map((component) => component.name));
    const sourceNames = new Set([...componentFiles, ...writerPatternFiles].map(toPascalCase));

    expect([...sourceNames].filter((name) => !registeredNames.has(name))).toEqual([]);
  });
});
