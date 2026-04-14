/**
 * ZOE NEURAL INTERFACE (Help Menu)
 * ---------------------------------
 * Command ini menampilkan daftar semua fitur yang tersedia.
 * Menggunakan sistem kategori otomatis dan desain 'Ultra-Premium' dengan
 * pratinjau link yang diproses secara cerdas.
 */

import { synthesizeCommandResult } from '../func/groq.js';
import { getVersion } from '../func/versionManager.js';
import fs from 'fs';
import path from 'path';

export const name = 'help';
export const aliases = ['menu', 'h', '?'];
export const description = 'Lihat semua command yang gue punya.';
export const category = 'Misc';
export const isOwnerOnly = false;

/**
 * Handler Utama Command Help
 */
export default async (sock, m, { args, helper, imageHelper, isOwner }) => {
    const remoteJid = helper.getSender(m);
    const prefix = process.env.PREFIX || '.';
    
    // Pastikan asisten visual siap (Dynamic Helper Check)
    if (!imageHelper) {
        return await sock.sendMessage(remoteJid, { text: 'Saraf visual sedang sinkronisasi, coba sesaat lagi.' });
    }

    // Bersihkan file sampah lama di folder temp
    imageHelper.cleanupTempVisuals();

    if (!global.commandsList) {
        return await sock.sendMessage(remoteJid, { text: 'Saraf perintah sedang sinkronisasi, coba sesaat lagi.' });
    }

    const isInfo = args[0]?.toLowerCase() === 'info';
    const categories = {};

    // Kelompokkan semua perintah berdasarkan kategorinya
    global.commandsList.forEach(cmd => {
        if (cmd.isOwnerOnly && !isOwner) return; // Sembunyikan fitur Owner dari user biasa
        const cat = cmd.category || 'Misc';
        if (!categories[cat]) categories[cat] = [];
        const aliasStr = cmd.aliases.length > 0 ? ` (${cmd.aliases.join(', ')})` : '';
        if (isInfo) {
            categories[cat].push(` ◈ *${prefix}${cmd.name}*${aliasStr}\n    └ _${cmd.description}_`);
        } else {
            categories[cat].push(`◈ \`${prefix}${cmd.name}\``);
        }
    });

    // Ambil visual HD secara acak dari folder /zoe (Self-Host)
    const thumbPath = await imageHelper.getRandomZoeLandscape();
    const thumbnail = thumbPath ? fs.readFileSync(thumbPath) : null;

    // ReadMore: Trik untuk menyembunyikan menu di bawah tombol "Baca Selengkapnya"
    const readMore = String.fromCharCode(8206).repeat(4001);
    
    let menuText = `🌸 *ZOE SYSTEM INTERFACE* 🌸\n`;
    menuText += `──────────────────────\n${readMore}\n`;

    for (const [cat, cmds] of Object.entries(categories)) {
        menuText += `\n🤖 *${cat.toUpperCase()}*\n`;
        menuText += isInfo ? cmds.join('\n\n') : cmds.join('\n');
        menuText += `\n`;
    }

    menuText += `\n──────────────────────\n`;
    if (!isInfo) menuText += `*Tip:* Ketik \`.help info\` untuk detail fungsi.\n\n`;

    const rawData = `Help requested. Count: ${Object.keys(categories).length} categories shown.`;
    
    // Gunakan AI untuk menyuruh user baca menu dengan gaya Sultan/Sarkas
    const aiClosing = await synthesizeCommandResult('help', rawData, remoteJid, 'Beritahu user buat baca menu di atas dengan teliti. Gunakan gaya Sultan yang agak meremehkan tapi cerdas.');

    const finalMessage = `${menuText}\n${aiClosing}`;
    
    // Authority Domain Masking: Link pengecoh agar cache WhatsApp di HP tidak nyangkut
    const authorityDomains = ['google.com', 'pinterest.com', 'unsplash.com', 'github.com'];
    const randomHost = authorityDomains[Math.floor(Math.random() * authorityDomains.length)];

    await sock.sendMessage(remoteJid, { 
        text: finalMessage,
        contextInfo: {
            externalAdReply: {
                title: `🌸 ZOE NEURAL CORE v${getVersion()}`,
                body: `System Response: 200 OK • Node: ${randomHost}`,
                thumbnail: thumbnail,
                jpegThumbnail: thumbnail,
                sourceUrl: `https://zoe.${randomHost}`,
                mediaType: 1, 
                renderLargerThumbnail: true,
                showAdAttribution: true,
                containsAutoReply: true
            }
        }
    }, { quoted: m.messages[0] });
};
