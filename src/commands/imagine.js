/**
 * Command: .imagine
 * Generate gambar AI dari teks menggunakan Pollinations.ai (Gratis, No API Key).
 */

import { synthesizeCommandResult } from '../func/groq.js';

export const name = 'imagine';
export const aliases = [];
export const hiddenAliases = ['img', 'gambar', 'draw', 'ig'];
export const description = 'Minta Zoe menggambarkan sesuatu';
export const category = 'AI';
export const isOwnerOnly = false;

export default async (sock, m, { args, helper, memory, userConfig, isOwner }) => {
    const remoteJid = helper.getSender(m);

    // SISTEM LIMIT/QUOTA BERDARAKAN KASTA
    const tier = userConfig?.tier || 'free';
    const limitMap = { free: 5, premium: 20, vip: Infinity };
    const maxLimit = isOwner ? Infinity : limitMap[tier];
    
    // Refresh / Reset Harian
    const today = new Date().toISOString().split('T')[0];
    let imgDaily = userConfig?.imgDaily || { date: today, count: 0 };
    if (imgDaily.date !== today) {
        imgDaily = { date: today, count: 0 };
    }

    if (imgDaily.count >= maxLimit) {
        return await sock.sendMessage(remoteJid, { 
            text: `⚠️ *Neural Limit Reached* ⚠️\n\nKasta kamu: *${tier.toUpperCase()}*\nJatah fitur Imagine: *${maxLimit}x sehari*.\n\nSistem saraf kamu butuh istirahat. Silakan coba lagi besok hari atau upgrade kasta.`
        }, { quoted: m.messages[0] });
    }

    const promptInput = args.join(' ').trim();
    if (!promptInput) {
        const hint = await synthesizeCommandResult(
            'imagine',
            'User lupa masukin prompt gambar.',
            remoteJid,
            'Marahin dikit karena lupa kasih deskripsi gambar. Contoh: .imagine Kucing terbang pakai kacamata hitam. DILARANG KERAS MENGGUNAKAN EMOJI.'
        );
        return await sock.sendMessage(remoteJid, { text: hint }, { quoted: m.messages[0] });
    }

    // Kasih pesan tunggu karena generate gambar butuh waktu
    const waitMsg = await synthesizeCommandResult(
        'imagine',
        `Sedang menggambar: ${promptInput}`,
        remoteJid,
        'Kasih tau user kalau Zoe lagi mulai melukis/merender gambar tersebut. Singkat dan keren.'
    );
    const { key } = await sock.sendMessage(remoteJid, { text: waitMsg }, { quoted: m.messages[0] });

    try {
        // Optimasi prompt via Groq agar hasilnya lebih bagus dalam bahasa Inggris
        const promptEnhancementData = `User request: ${promptInput}\nTranslate to English and enhance the prompt with aesthetic keywords (like detailed, masterpiece, 8k, cinematic lighting). Return ONLY the enhanced prompt string.`;
        let enhancedPrompt = await synthesizeCommandResult(
            'imagine_enhancer',
            promptEnhancementData,
            remoteJid,
            'Your ONLY job is to translate and enhance the prompt for an AI image generator. Reply ONLY with the final prompt, NO introductory text, NO quotes.'
        );

        // Fallback jika Groq ngaco
        if (enhancedPrompt.length > 500) enhancedPrompt = promptInput;

        // Encode ke URL untuk Pollinations
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1024&height=1024&nologo=true`;

        const caption = await synthesizeCommandResult(
            'imagine',
            `Gambar selesai untuk prompt asal: ${promptInput}`,
            remoteJid,
            'Beritahukan gambar sudah jadi dengan gaya Zoe. Pujilah mahakaryanya sendiri.'
        );

        // Hapus pesan tunggu
        await sock.sendMessage(remoteJid, { delete: key });

        // Kirim gambar
        await sock.sendMessage(remoteJid, { 
            image: { url: imageUrl }, 
            caption: caption 
        }, { quoted: m.messages[0] });

        // Update kuota harian setelah sukses
        imgDaily.count += 1;
        await memory.updateUserConfig(remoteJid, { imgDaily });

    } catch (err) {
        await sock.sendMessage(remoteJid, { delete: key });
        const errMsg = await synthesizeCommandResult(
            'imagine',
            `Gagal generate gambar: ${err.message}`,
            remoteJid,
            'Beritahu kalau kanvasnya lagi sobek atau ada error sistem waktu mau gambar.'
        ).catch(() => '⚠️ Gagal bikin gambar. Servernya lagi pusing.');

        await sock.sendMessage(remoteJid, { text: errMsg }, { quoted: m.messages[0] });
    }
};
