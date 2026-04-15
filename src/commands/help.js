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
        
        if (isInfo) {
            const aliasStr = cmd.aliases.length > 0 ? ` (${cmd.aliases.join(', ')})` : '';
            categories[cat].push(` ◈ *${prefix}${cmd.name}*${aliasStr}\n    └ _${cmd.description}_`);
        } else {
            // Tampilkan secara vertikal satu per baris agar lebih 'legit' dan enak dibaca
            [cmd.name, ...cmd.aliases].forEach(a => {
                categories[cat].push(`◈ \`${prefix}${a}\``);
            });
        }
    });

    // Ambil visual 1:1 secara acak dari folder /zoe (Neural Signature)
    const thumbPath = await imageHelper.getRandomZoeLegacySquare();

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
    
    // Ambil thumbnail Landscape untuk preview yang lebih lebar (Official 1.91:1)
    let thumbnail = null;
    if (thumbPath) {
        // Karena thumbPath tadi square (dari line 56), kita ambil ulang yang landscape
        const landscapePath = await imageHelper.getRandomZoeLandscape();
        if (landscapePath && fs.existsSync(landscapePath)) {
            thumbnail = fs.readFileSync(landscapePath);
        }
    }

    // Kirim Menu sebagai Teks dengan Link Preview Luxury (Standard WA Compatible)
    await sock.sendMessage(remoteJid, { 
        text: finalMessage,
        contextInfo: {
            externalAdReply: {
                title: `ZOE CORE NEURAL v${getVersion()} ]`,
                body: 'Autonomous Sentiment & Neural Commands',
                mediaType: 1, 
                renderLargerThumbnail: true,
                thumbnail: thumbnail,
                sourceUrl: 'https://zoe.assistant.my.id',
                showAdAttribution: false // MATIKAN: Biar muncul di WA Biasa
            }
        }
    }, { quoted: m.messages[0] });
};
