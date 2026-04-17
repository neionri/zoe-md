/**
 * Command: .status
 * Laporan kesehatan sistem Zoe secara real-time.
 */

import os from 'os';
import { synthesizeCommandResult } from '../func/groq.js';
import { getVersion } from '../func/versionManager.js';

export const name = 'system';
export const aliases = [];
export const hiddenAliases = ['sys', 'server', 'sysinfo', 'stats'];
export const description = 'Laporan kesehatan sistem Zoe';
export const category = 'System';
export const isOwnerOnly = false;

export default async (sock, m, { helper }) => {
    const remoteJid = helper.getSender(m);

    // === KUMPULKAN DATA SISTEM ===
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = ((usedMem / totalMem) * 100).toFixed(1);

    const uptimeSec = process.uptime();
    const hours = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    const seconds = Math.floor(uptimeSec % 60);
    const uptimeStr = `${hours}j ${minutes}m ${seconds}d`;

    const toMB = (bytes) => (bytes / 1024 / 1024).toFixed(1);

    const cpuModel = os.cpus()[0]?.model || 'Unknown CPU';
    const cpuCores = os.cpus().length;
    const platform = os.platform();
    const nodeVersion = process.version;
    const zoeVersion = getVersion();
    const commandCount = global.zoeCommands?.size || 0;
    const memHeap = process.memoryUsage();

    const rawData = `
Zoe Version: v${zoeVersion}
Node.js: ${nodeVersion}
Platform: ${platform}
CPU: ${cpuModel} (${cpuCores} core)
RAM Total: ${toMB(totalMem)} MB
RAM Dipakai: ${toMB(usedMem)} MB (${memPercent}%)
RAM Bebas: ${toMB(freeMem)} MB
Heap JS: ${toMB(memHeap.heapUsed)} MB / ${toMB(memHeap.heapTotal)} MB
Uptime Bot: ${uptimeStr}
Command Aktif: ${commandCount} modul
Maintenance: ${global.maintenanceMode ? 'AKTIF' : 'NONAKTIF'}
    `.trim();

    const response = await synthesizeCommandResult(
        'status',
        rawData,
        remoteJid,
        'Laporkan kondisi sistem dengan gaya data center analyst yang keren. Singkat, padat, sedikit sarkastik kalau sistem sehat. Gunakan emoji yang relevan.'
    );

    await sock.sendMessage(remoteJid, { text: response }, { quoted: m.messages[0] });
};
