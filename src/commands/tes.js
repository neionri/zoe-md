/**
 * COMMAND: .tes
 * SPECIALIST: Neural UI Debugger
 * --------------------------------------
 * Command untuk menguji keberhasilan render externalAdReply (Link Preview)
 * di berbagai versi WhatsApp (Standard vs Business).
 */

import { getVersion } from '../func/versionManager.js';
import fs from 'fs';

export const name = 'tes';
export const aliases = ['testlink', 'previewtest'];
export const description = 'Uji coba render link preview (externalAdReply) secara HD.';
export const category = 'Neural Specialist';
export const isOwnerOnly = true;

export default async (sock, m, { helper, imageHelper }) => {
    const remoteJid = helper.getSender(m);

    await sock.sendMessage(remoteJid, { text: '🧪 *Neural UI Lab*: Memulai pengujian render metadata...' });

    // 1. Ambil foto HD (Landscape & Square)
    let landscapeThumb = null;
    let squareThumb = null;

    if (imageHelper) {
        const lp = await imageHelper.getRandomZoeLandscape();
        if (lp && fs.existsSync(lp)) landscapeThumb = fs.readFileSync(lp);

        const sp = await imageHelper.getRandomZoeLegacySquare();
        if (sp && fs.existsSync(sp)) squareThumb = fs.readFileSync(sp);
    }

    // PENGUJIAN 1: Landscape HD (1200x630) - Standar Messenger
    await sock.sendMessage(remoteJid, { 
        text: 'Test 1: *Landscape HD (1200x630)*\nIni adalah rasio ideal untuk WhatsApp Messenger (WAm).',
        contextInfo: {
            externalAdReply: {
                title: 'ZOE NEURAL LANDSCAPE',
                body: 'Testing HD Landscape Render Ratio (1.91:1)',
                mediaType: 1,
                renderLargerThumbnail: true,
                thumbnail: landscapeThumb,
                sourceUrl: 'https://zoe.assistant.my.id',
                showAdAttribution: true
            }
        }
    }, { quoted: m.messages[0] });

    await new Promise(r => setTimeout(r, 2000));

    // PENGUJIAN 2: Square HD (1:1) - Sering muncul di Business
    await sock.sendMessage(remoteJid, { 
        text: 'Test 2: *Square HD (1:1)*\nBiasanya muncul di WA Business, tapi sering "dropped" di WA Biasa.',
        contextInfo: {
            externalAdReply: {
                title: 'ZOE NEURAL SQUARE',
                body: 'Testing HD Square Render Ratio (1:1)',
                mediaType: 1,
                renderLargerThumbnail: true,
                thumbnail: squareThumb,
                sourceUrl: 'https://zoe.assistant.my.id',
                showAdAttribution: true
            }
        }
    }, { quoted: m.messages[0] });

    await new Promise(r => setTimeout(r, 2000));

    // PENGUJIAN 3: Minimalist Link (No Image Buffer)
    await sock.sendMessage(remoteJid, { 
        text: 'Test 3: *Minimalist (No Local Buffer)*\nMengandalkan URL gambar eksternal.',
        contextInfo: {
            externalAdReply: {
                title: 'ZOE EXTERNAL SOURCE',
                body: 'Testing with External Image URL',
                mediaType: 1,
                thumbnailUrl: 'https://img.icons8.com/clouds/200/link.png',
                sourceUrl: 'https://zoe.assistant.my.id',
                showAdAttribution: false
            }
        }
    }, { quoted: m.messages[0] });

    await new Promise(r => setTimeout(r, 2000));

    // PENGUJIAN 4: Extreme Compressed Local Square (< 50KB)
    let tinySquareThumb = null;
    if (imageHelper) {
        const path = await imageHelper.getRandomZoeLegacySquare(40, 300); // Quality 40, Size 300px
        if (path && fs.existsSync(path)) tinySquareThumb = fs.readFileSync(path);
    }

    await sock.sendMessage(remoteJid, { 
        text: 'Test 4: *Tiny Square Buffer (300px, Q40)*\nMenggunakan foto lokal tapi dipaksa super kecil biar WA nggak nolak.',
        contextInfo: {
            externalAdReply: {
                title: 'ZOE TINY SQUARE',
                body: 'Compressed Buffer Test',
                mediaType: 1, 
                renderLargerThumbnail: true,
                thumbnail: tinySquareThumb,
                sourceUrl: 'https://zoe.assistant.my.id',
                showAdAttribution: false
            }
        }
    }, { quoted: m.messages[0] });

    await new Promise(r => setTimeout(r, 2000));

    // PENGUJIAN 5: Low-Quality Landscape Buffer (Standard Ratio)
    let lowQualLandscape = null;
    if (imageHelper) {
        const path = await imageHelper.getRandomZoeLandscape(30); // Quality 30
        if (path && fs.existsSync(path)) lowQualLandscape = fs.readFileSync(path);
    }

    await sock.sendMessage(remoteJid, { 
        text: 'Test 5: *Low-Quality Landscape (Q30)*\nRasio ideal (1.91:1) dengan kompresi tinggi.',
        contextInfo: {
            externalAdReply: {
                title: 'ZOE LQ LANDSCAPE',
                body: 'Testing Landscape with High Compression',
                mediaType: 1, 
                renderLargerThumbnail: true,
                thumbnail: lowQualLandscape,
                sourceUrl: 'https://zoe.assistant.my.id',
                showAdAttribution: true
            }
        }
    }, { quoted: m.messages[0] });

    await sock.sendMessage(remoteJid, { text: '✅ *Lab Complete*. Coba cek Test 4 & 5 ini, mana yang muncul kotaknya di WA Biasa, Boss?' });
}
