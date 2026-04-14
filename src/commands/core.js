/**
 * COMMAND: .core
 * SPECIALIST: Neural Health Monitor
 * --------------------------------------
 * Menampilkan status kesehatan jaringan saraf Zoe (Tier, Keys, Specialists)
 * dengan desain Enterprise yang dibekali link preview premium.
 */

import { getVersion } from '../func/versionManager.js';
import fs from 'fs';

export const name = 'core';
export const aliases = ['status', 'brain', 'neural', 'saraf'];
export const description = 'Monitor kesehatan jaringan saraf dan performa API Zoe.';
export const category = 'Neural Specialist';
export const isOwnerOnly = false;

export default async (sock, m, { helper, groq, imageHelper }) => {
    const remoteJid = helper.getSender(m);
    
    // Ambil data status dari groq.js yang sudah disinkronisasi
    const statusText = await groq.getZoeBrainStatus();
    
    // Ambil thumbnail visual HD secara acak dari folder /zoe
    let thumbnail = null;
    if (imageHelper) {
        const thumbPath = await imageHelper.getRandomZoeLandscape();
        if (thumbPath && fs.existsSync(thumbPath)) {
            thumbnail = fs.readFileSync(thumbPath);
        }
    }

    // Kirim Dashboard dengan Link Preview Premium (Enterprise Look)
    await sock.sendMessage(remoteJid, { 
        text: statusText,
        contextInfo: {
            externalAdReply: {
                title: `[ ZOE NEURAL INTERFACE v${getVersion()} ]`,
                body: 'Categorized Command & Neural Reference',
                mediaType: 1, 
                renderLargerThumbnail: true,
                thumbnail: thumbnail, // Menggunakan thumbnail HD acak
                sourceUrl: 'https://zoe.assistant.my.id',
                showAdAttribution: true,
                containsAutoReply: true
            }
        }
    }, { quoted: m.messages[0] });

    helper.coolLog('SUCCESS', 'Neural health dashboard dispatched.');
}
