/**
 * ZOE NEURAL SYSTEM - ENTRY POINT
 * --------------------------------
 * Master file yang bertanggung jawab untuk inisialisasi koneksi,
 * basis data, dan sistem Hot-Reload otomatis.
 */

import 'dotenv/config'; // Memuat variabel lingkungan dari .env
import fs from 'fs';
import path from 'path';
import { coolLog, setNotifySock } from './func/helper.js';
import { fileURLToPath } from 'url';
import { connectToWhatsApp } from './connection/index.js';
import * as db from './func/db.js';
import * as imageHelper from './func/imageHelper.js';
import { incrementVersion, getVersion } from './func/versionManager.js';
import { initNeuralScheduler } from './func/scheduler.js';
import { initDashboard, setDashboardSock, broadcastLog } from './func/dashboardServer.js';
import { setLogBroadcaster } from './func/helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.dirname(__filename);

// Tampilan Header Premium di Terminal
console.clear();
console.log(`
\x1b[35m  ███████╗ ██████╗ ███████╗
  ╚══███╔╝██╔═══██╗██╔════╝
    ███╔╝ ██║   ██║█████╗  
   ███╔╝  ██║   ██║██╔══╝  
  ███████╗╚██████╔╝███████╗
  ╚══════╝ ╚═════╝ ╚══════╝\x1b[0m
  \x1b[36mDigital Sentience Agent v${getVersion()}\x1b[0m
  -----------------------------`);

/**
 * Pemantau File (Recursive Watcher)
 * Fungsi ini memantau perubahan file di folder /src secara real-time.
 * Ketika file diubah, sistem akan memicu Hot-Reload tanpa restart proses.
 * 
 * @param {string} dir - Direktori yang dipantau
 * @param {function} callback - Fungsi yang dijalankan saat ada perubahan
 */
function watchRecursive(dir, callback) {
    let debounceTimer;
    fs.watch(dir, { recursive: true }, (event, filename) => {
        if (filename && !filename.endsWith('.json')) {
            clearTimeout(debounceTimer);
            // Debounce untuk menghindari pemicu ganda dalam waktu singkat
            debounceTimer = setTimeout(() => callback(event, filename), 150);
        }
    });
}

/**
 * Validasi Syaraf Utama (Variable Check)
 */
function validateNeuralPulse() {
    const groqKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEYS;
    const required = ['MONGODB_URI', 'OWNER_LID'];
    const missing = required.filter(key => !process.env[key]);

    if (!groqKey) missing.push('GROQ_API_KEY');

    if (missing.length > 0) {
        console.error(`\x1b[31m[Critical Error]\x1b[0m Syaraf Zoe tidak lengkap. Variabel .env berikut hilang:`);
        missing.forEach(key => console.error(`  - ${key}`));
        console.error(`\x1b[33m[Fix]\x1b[0m Salin .env.example menjadi .env dan isi datanya boss.\x1b[0m`);
        process.exit(1);
    }
}

/**
 * Fungsi Utama (Start Engine)
 */
async function start() {
    // 0. Cek Integritas Lingkungan & Inisialisasi Dashboard
    validateNeuralPulse();
    await initDashboard(process.env.PORT_DASHBOARD || 3000);
    setLogBroadcaster(broadcastLog);

    // 1. Hubungkan ke Database MongoDB & Indeks Galeri Identitas
    await db.connectDB();
    await imageHelper.indexGallery(db);

    // Bootstrap Maintenance Mode from Persistent State
    const globalConfig = await db.getGroupConfig('GLOBAL');
    global.maintenanceMode = !!globalConfig.maintenanceMode;
    coolLog('SYSTEM', `Neural state loaded. Maintenance Mode: ${global.maintenanceMode ? 'ENABLED' : 'DISABLED'}`);
    
    // 2. Impor Message Handler secara dinamis (Awal)
    let messageHandlerModule = await import(`./messageHandler.js?t=${Date.now()}`);
    let handleMessage = messageHandlerModule.handleMessage;

    console.log('\x1b[34m[System]\x1b[0m Matrix monitoring active.');
    
    // 3. Aktifkan Sistem Hot-Reload
    watchRecursive(srcDir, async (event, filename) => {
        // Tandai perintah untuk dimuat ulang di thread berikutnya
        global.reloadCommands = true;

        try {
            // Impor ulang handler setiap ada perubahan file (Cache Busting)
            const module = await import(`./messageHandler.js?t=${Date.now()}`);
            handleMessage = module.handleMessage;
            
            // Evolusi versi sistem otomatis
            incrementVersion();
            
            const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            console.log(`\x1b[90m[${time}]\x1b[0m \x1b[32m[Refreshed]\x1b[0m 🧠 Neural Logic: ${filename}`);
        } catch (err) {
            console.error(`\x1b[31m[Critical Error]\x1b[0m Failed to sync ${filename}`);
        }
    });

    // 4. Hubungkan ke WhatsApp Socket
    connectToWhatsApp((sock, m) => handleMessage(sock, m))
        .then((sock) => {
            console.log('\x1b[35m[Zoe]\x1b[0m Neural connection established.');
            setDashboardSock(sock);
            setNotifySock(sock); // Aktivasi Jalur NEB
            
            // 5. Jalankan Penjaga Waktu (Scheduler)
            initNeuralScheduler(sock);
        })
        .catch(err => console.error('\x1b[31m[Failed]\x1b[0m Initialization error:', err));
}

// PENJAGA SYARAF GLOBAL (NEB Final Defense)
process.on('uncaughtException', (err) => {
    coolLog('ERROR', `FATAL CRASH: ${err.message}`);
    console.error(err);
});

process.on('unhandledRejection', (reason) => {
    coolLog('ERROR', `UNHANDLED REJECTION: ${reason}`);
});

// Jalankan Mesin Utama
start();
