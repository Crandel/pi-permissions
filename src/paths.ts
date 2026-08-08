import { homedir } from "node:os";
import { join } from "node:path";

const PER_DIR = 'permissions';

export function getPermissionGlobalDir(home = homedir()): string {
	return join(home, ".pi", "agent", PER_DIR);
}

export function getPiLabGlobalTmpDir(name?: string, home = homedir()): string {
	const tmpDir = join(getPermissionGlobalDir(home), "tmp");
	return name ? join(tmpDir, name) : tmpDir;
}

export function getPiLabLocalDir(cwd = process.cwd()): string {
	return join(cwd, ".pi", PER_DIR);
}

export function getPiLabLocalTmpDir(name?: string, cwd = process.cwd()): string {
	const tmpDir = join(getPiLabLocalDir(cwd), "tmp");
	return name ? join(tmpDir, name) : tmpDir;
}
