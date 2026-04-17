/**
 * Command: .bersih / .clean
 * Menghapus file sampah di folder scratch dan temp. Khusus Owner.
 */

import fs from 'fs';
import path from 'path';
import { synthesizeCommandResult } from '../func/groq.js';

export const name = 'bersih';
export const aliases = [];
export const hiddenAliases = ['sapu'];
export const description = 'Membersihkan cache dan memori sampah';
export const category = 'System';
export const isOwnerOnly = true;

const TARGET_DIRS = [
    './temp',
    './scratch/voice',
    './scratch/sticker',
    './scratch/download',
    './scratch/temp_visuals'
];

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default async (sock, m, { helper }) => {
    const remoteJid = helper.getSender(m);

    // Kasih tanda loading ngetik
    await sock.sendPresenceUpdate('composing', remoteJid);

    let totalDeleted = 0;
    let bytesFreed = 0;

    for (const dirPath of TARGET_DIRS) {
        const fullPath = path.resolve(dirPath);
        if (!fs.existsSync(fullPath)) continue;

        const files = fs.readdirSync(fullPath);
        for (const file of files) {
            const filePath = path.join(fullPath, file);
            try {
                const stat = fs.statSync(filePath);
                if (stat.isFile()) {
                    bytesFreed += stat.size;
                    fs.unlinkSync(filePath);
                    totalDeleted++;
                }
            } catch (err) { }
        }
    }

    // --- SWEEPER KHUSUS BAILEYS SESSION (auth_info) ---
    const authDir = path.resolve('./auth_info');
    let baileysDeleted = 0;
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (fs.existsSync(authDir)) {
        const authFiles = fs.readdirSync(authDir);
        for (const file of authFiles) {
            // SANGAT PENTING: JANGAN PERNAH HAPUS CREDS.JSON ATAU BOT AKAN LOGOUT
            if (file.toLowerCase() === 'creds.json') continue;

            const filePath = path.join(authDir, file);
            try {
                const stat = fs.statSync(filePath);
                // Hanya hapus jika umurnya sudah lebih dari 7 hari semenjak terakhir diakses/dimodifikasi
                if (stat.isFile() && (now - stat.mtimeMs > SEVEN_DAYS_MS)) {
                    bytesFreed += stat.size;
                    fs.unlinkSync(filePath);
                    baileysDeleted++;
                    totalDeleted++;
                }
            } catch (err) { }
        }
    }

    if (totalDeleted === 0) {
        const cleanMsg = await synthesizeCommandResult(
            'system_clean',
            `Tidak ada sampah. STB sudah bersih. Sesi WA masih segar.`,
            remoteJid,
            'Beritahu Boss dengan gaya asisten elit bahwa sistem STB dan sesi Baileys WhatsApp sudah dalam keadaan resik sempurna tanpa cache yang mengendap. Singkat saja.'
        );
        return await sock.sendMessage(remoteJid, { text: cleanMsg }, { quoted: m.messages[0] });
    }

    const freedStr = formatBytes(bytesFreed);
    const successMsg = await synthesizeCommandResult(
        'system_clean',
        `Berhasil menghapus ${totalDeleted} file temp/scratch & ${baileysDeleted} file Sesi Baileys basi. Membebaskan ${freedStr} space SSD.`,
        remoteJid,
        'Beritahu Boss layaknya tukang sapu digital yang sadis bahwa kamu baru saja membasmi file sampah temp dan file sesi WhatsApp kedaluwarsa. Ruang penyimpanan berhasil dilegakan. Pamerkan size dan total datanya.'
    );

    await sock.sendMessage(remoteJid, { text: successMsg }, { quoted: m.messages[0] });
    
    helper.coolLog('SYSTEM', `Cache Sweeper Action: ${totalDeleted} files purged (${baileysDeleted} Baileys sessions), ${freedStr} reclaimed.`);
};
