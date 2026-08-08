import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { getPermissionGlobalDir, getPermissionLocalDir } from "./paths";

const PERM_HOME = getPermissionGlobalDir()
const LOG_FILE = path.join(PERM_HOME, 'permissions.log');

export function log(level: 'INFO' | 'DEBUG' | 'ERROR', message: string): void {
  try {
    if (!fs.existsSync(PERM_HOME)) {
      fs.mkdirSync(PERM_HOME, { recursive: true });
    }
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] [${level}] ${message}\n`);
  } catch {
    // Fail silently to avoid breaking the extension
  }
}
