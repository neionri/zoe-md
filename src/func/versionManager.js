/**
 * ZOE EVOLUTION TRACKER (Version Manager)
 * -----------------------------------------
 * Modul untuk mengelola versi sistem secara otomatis.
 * Digunakan untuk menandai setiap 'Hot-Reload' sebagai evolusi sistem.
 * Versi disimpan langsung di package.json agar sinkron dengan NPM.
 */

import fs from 'fs';
import path from 'path';
import { coolLog } from './helper.js';

const PKG_PATH = path.join(process.cwd(), 'package.json');

/**
 * Mendapatkan string versi saat ini dari package.json
 * @returns {string} 
 */
export function getVersion() {
    try {
        const data = fs.readFileSync(PKG_PATH, 'utf-8');
        const pkg = JSON.parse(data);
        return pkg.version || '1.0.0';
    } catch (err) {
        return '1.0.0';
    }
}

/**
 * Menaikkan versi (SemVer) di package.json
 */
export function incrementVersion() {
    try {
        const data = fs.readFileSync(PKG_PATH, 'utf-8');
        if (!data || data.trim() === '') return; // Skip if file is being written
        
        const pkg = JSON.parse(data);
        
        let [major, minor, patch] = (pkg.version || '1.0.0').split('.').map(Number);
        
        patch += 1;
        if (patch > 99) {
            patch = 0;
            minor += 1;
        }
        if (minor > 9) {
            minor = 0;
            major += 1;
        }

        const newVersion = `${major}.${minor}.${patch}`;
        pkg.version = newVersion;

        fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2), 'utf-8');
        coolLog('SUCCESS', `System Version Evolution: v${newVersion}`);
    } catch (err) {
        // Silent failing for race conditions
    }
}
