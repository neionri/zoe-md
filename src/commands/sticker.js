import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import WebP from 'node-webpmux';

const execPromise = promisify(exec);

export const name = 'sticker';
export const aliases = ['s', 'stiker'];
export const description = 'Pure FFmpeg Neural Sticker Engine';
export const category = 'Neural Specialist';

export default async (sock, m, { helper, groq }) => {
    const remoteJid = helper.getSender(m);
    const message = m.messages[0];
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const isImage = !!(message.message?.imageMessage || quoted?.imageMessage);
    const isVideo = !!(message.message?.videoMessage || quoted?.videoMessage);
    const isViewOnce = !!(message.message?.viewOnceMessageV2 || quoted?.viewOnceMessageV2);

    if (!isImage && !isVideo && !isViewOnce) {
        const refusal = await groq.getZoeDirective("User mau bikin stiker tapi nggak ngasih gambar atau video. Sindir dia biar pinteran sedikit kalo mo nyuruh AI.", remoteJid);
        return await sock.sendMessage(remoteJid, { text: refusal }, { quoted: message });
    }

    // Setup folder kerja
    const tempDir = './scratch/sticker';
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const timestamp = Date.now();
    const inputPath = path.join(tempDir, `in_${timestamp}_${remoteJid.split('@')[0]}.${isVideo ? 'mp4' : 'jpg'}`);
    const outputPath = path.join(tempDir, `out_${timestamp}.webp`);

    try {
        await sock.sendPresenceUpdate('composing', remoteJid);

        // 1. EKSTRAK & DOWNLOAD MEDIA
        let mediaContent = quoted ? quoted : message.message;
        if (mediaContent?.viewOnceMessageV2) mediaContent = mediaContent.viewOnceMessageV2.message;
        else if (mediaContent?.viewOnceMessage) mediaContent = mediaContent.viewOnceMessage.message;

        const downloadM = quoted ? { message: mediaContent } : message;
        const buffer = await downloadMediaMessage(downloadM, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
        
        if (!buffer || buffer.length === 0) throw new Error("Synapse gagal: Data media kosong.");
        
        fs.writeFileSync(inputPath, buffer);
        helper.coolLog('BRAIN', `Neural Synapse: ${buffer.length} bytes saved to disk.`);

        // 2. FFMPEG CONVERSION ENGINE (Auto-Crop 1:1)
        // Menggunakan filter complex untuk memastikan rasio 1:1 tanpa gepeng
        const ffmpegCmd = isVideo 
            ? `ffmpeg -i ${inputPath} -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512,fps=15" -vcodec libwebp -lossless 0 -compression_level 4 -q:v 50 -loop 0 -an -vsync 0 ${outputPath}`
            : `ffmpeg -i ${inputPath} -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512" -vcodec libwebp -lossless 1 -q:v 75 ${outputPath}`;

        helper.coolLog('SYSTEM', `Executing Pure FFmpeg Engine...`);
        await execPromise(ffmpegCmd);

        // 3. MANUAL EXIF INJECTION (node-webpmux)
        const img = new WebP.Image();
        await img.load(outputPath);

        const json = {
            "sticker-pack-id": "zoe-neural-identity",
            "sticker-pack-name": "Zoe",
            "sticker-pack-publisher": "Neionri",
            "emojis": ["🤩", "🎉"]
        };

        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf-8');
        const exifBuffer = Buffer.concat([exifAttr, jsonBuffer]);
        exifBuffer.writeUIntLE(jsonBuffer.length, 14, 4);

        img.exif = exifBuffer;
        const finalSticker = await img.save(null); // Save to memory buffer

        // 4. DISPATCH
        await sock.sendMessage(remoteJid, { sticker: finalSticker }, { quoted: message });
        helper.coolLog('SUCCESS', 'Neural Sticker (Method 3) dispatched successfully.');

    } catch (error) {
        console.error('Neural Engine Failure (Method 3):', error);
        await sock.sendMessage(remoteJid, { text: `⚠️ Syaraf visual Zoe beneran kram parah boss: ${error.message}` });
    } finally {
        // CLEANUP
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
};
