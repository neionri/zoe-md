/**
 * Command: .log (Khusus Owner)
 * Menampilkan error/log syaraf terakhir langsung di chat.
 */

import fs from 'fs';
import path from 'path';
import { synthesizeCommandResult } from '../func/groq.js';

export const name = 'log';
export const aliases = [];
export const hiddenAliases = ['logs', 'errorlog'];
export const description = 'Cek catatan error terakhir Zoe';
export const category = 'System';
export const isOwnerOnly = true;

export default async (sock, m, { args, helper }) => {
    const remoteJid = helper.getSender(m);
    const logPath = global.zoeLogPath || path.join(process.cwd(), 'logs/neural_signals.jsonl');

    if (!fs.existsSync(logPath)) {
        return await sock.sendMessage(remoteJid, { text: "✅ Server bersih Boss, belum ada log error yang tercatat." }, { quoted: m.messages[0] });
    }

    try {
        const content = fs.readFileSync(logPath, 'utf8').trim();
        if (!content) {
            return await sock.sendMessage(remoteJid, { text: "✅ Server bersih Boss, belum ada log error yang tercatat." }, { quoted: m.messages[0] });
        }

        const lines = content.split('\n');
        
        // Ambil jumlah baris dari args (default 3 terakhir)
        let count = 3;
        if (args[0] && !isNaN(parseInt(args[0]))) {
            count = parseInt(args[0]);
        }
        
        // Batasi maksimal 10 agar tidak terlalu panjang di WA
        count = Math.min(Math.max(count, 1), 10);

        const lastLogs = lines.slice(-count).filter(l => l).map(line => {
            try {
                const parsed = JSON.parse(line);
                const time = new Date(parsed.timestamp).toLocaleTimeString('id-ID');
                return `[${time}] ${parsed.message}\n> _${parsed.stack?.split('\\n')[0] || 'No Trace'}_`;
            } catch (e) {
                return `[Mentah]: ${line}`;
            }
        });

        let msg = `📜 *ZOE NEURAL LOGS* (Terakhir ${lastLogs.length})\n\n`;
        msg += lastLogs.join('\n\n');
        
        if (args[0] === 'clear') {
            fs.writeFileSync(logPath, '');
            msg = `🧹 *ZOE NEURAL LOGS*\n\nSemua riwayat syaraf berhasil dibersihkan, Boss!`;
        }

        await sock.sendMessage(remoteJid, { text: msg }, { quoted: m.messages[0] });

    } catch (err) {
        helper.coolLog('ERROR', `Failed reading log file: ${err.message}`);
        await sock.sendMessage(remoteJid, { text: `⚠️ Gagal baca log Boss: ${err.message}` }, { quoted: m.messages[0] });
    }
};
