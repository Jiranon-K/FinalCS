/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from 'fs';
import path from 'path';

const localesDir = path.join(process.cwd(), 'src', 'i18n', 'locales');
const thPath = path.join(localesDir, 'th.json');
const enPath = path.join(localesDir, 'en.json');

const th = JSON.parse(fs.readFileSync(thPath, 'utf-8'));
let en = {};
try {
  en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
} catch (e) {
  console.log('en.json not found or invalid, starting fresh.');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function syncObjects(source: any, target: any, keyPath: string = ''): any {
  if (typeof source !== 'object' || source === null) {
    return target !== undefined ? target : `[MISSING] ${source}`;
  }

  const newTarget: any = Array.isArray(source) ? [] : {};

  for (const key in source) {
    const currentKeyPath = keyPath ? `${keyPath}.${key}` : key;
    
    if (target && target.hasOwnProperty(key)) {
        // Type mismatch check: if source is object but target is string (or vice versa)
        const sourceIsObject = typeof source[key] === 'object' && source[key] !== null;
        const targetIsObject = typeof target[key] === 'object' && target[key] !== null;

        if (sourceIsObject !== targetIsObject) {
            console.warn(`Type mismatch at ${currentKeyPath}: source is ${typeof source[key]}, target is ${typeof target[key]}. Overwriting with structure from source.`);
             newTarget[key] = syncObjects(source[key], {}, currentKeyPath);
        } else {
             newTarget[key] = syncObjects(source[key], target[key], currentKeyPath);
        }
    } else {
      console.log(`Adding missing key: ${currentKeyPath}`);
      newTarget[key] = syncObjects(source[key], undefined, currentKeyPath);
    }
  }

  return newTarget;
}

const syncedEn = syncObjects(th, en);

fs.writeFileSync(enPath, JSON.stringify(syncedEn, null, 2), 'utf-8');
console.log('Successfully synced en.json with th.json structure.');
