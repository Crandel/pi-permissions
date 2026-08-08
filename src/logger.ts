import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { getPermissionGlobalDir, getPermissionLocalDir } from "./paths";

const LOG_DIR = path.join(getPermissionGlobalDir(home), 'tmp');
const LOG_FILE = path.join(LOG_DIR, 'permissions.log');

export function log(level: 'INFO' | 'DEBUG' | 'ERROR', message: string): void {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] [${level}] ${message}\n`);
  } catch {
    // Fail silently to avoid breaking the extension
  }
}
