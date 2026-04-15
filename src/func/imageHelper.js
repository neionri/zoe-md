import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';

/**
 * Picks a random image from the /zoe directory, crops it to the Official 1.91:1 ratio,
 * and returns the path to the temporary cropped image.
 * @param {number} quality JPEG Quality (default 85)
 * @returns {Promise<string|null>} Path to the cropped image
 */
export async function getRandomZoeLandscape(quality = 85) {
    const imagesDir = path.resolve('./zoe');
    const tempDir = path.resolve('./scratch/temp_visuals');

    try {
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const files = fs.readdirSync(imagesDir).filter(f => 
            f.toLowerCase().endsWith('.jpg') || 
            f.toLowerCase().endsWith('.png') || 
            f.toLowerCase().endsWith('.jpeg')
        );

        if (files.length === 0) return null;

        const randomFile = files[Math.floor(Math.random() * files.length)];
        const inputPath = path.join(imagesDir, randomFile);
        const outputPath = path.join(tempDir, `zoe_hd_${Date.now()}.jpg`);

        const image = sharp(inputPath);
        const metadata = await image.metadata();
        
        // 1.91:1 Aspect Ratio (Official Standard for Platforms like Facebook/WhatsApp)
        const targetWidth = 800; 
        const targetHeight = 418;

        const scale = targetWidth / metadata.width;
        const scaledHeight = Math.round(metadata.height * scale);

        let topOffset = 0;
        if (scaledHeight > targetHeight) {
            topOffset = Math.round((scaledHeight - targetHeight) * 0.25); // Northern/Face focus
        }

        await image
            .resize(targetWidth, null) 
            .extract({ left: 0, top: topOffset, width: targetWidth, height: targetHeight })
            .jpeg({ quality: quality, chromaSubsampling: '4:4:4' })
            .toFile(outputPath);

        return outputPath;

    } catch (error) {
        console.error('[ImageHelper] Gagal process HD landscape:', error.message);
        return null;
    }
}

/**
 * Picks a random image from /zoe and crops it to a legacy square.
 * @param {number} quality JPEG Quality (default 85)
 * @param {number} targetSize Pixel size (default 600)
 */
export async function getRandomZoeLegacySquare(quality = 85, targetSize = 600) {
    const imagesDir = path.resolve('./zoe');
    const tempDir = path.resolve('./scratch/temp_visuals');

    try {
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const files = fs.readdirSync(imagesDir).filter(f => 
            f.toLowerCase().endsWith('.jpg') || 
            f.toLowerCase().endsWith('.png') || 
            f.toLowerCase().endsWith('.jpeg')
        );

        if (files.length === 0) return null;

        const randomFile = files[Math.floor(Math.random() * files.length)];
        const inputPath = path.join(imagesDir, randomFile);
        const outputPath = path.join(tempDir, `zoe_square_${Date.now()}.jpg`);

        const image = sharp(inputPath);
        const metadata = await image.metadata();
        const targetSize = 600; // Large enough for HD on Desktop, small enough for Protobuf

        await image
            .resize(targetSize, targetSize, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: quality, chromaSubsampling: '4:4:4' })
            .toFile(outputPath);

        return outputPath;

    } catch (error) {
        console.error('[ImageHelper] Gagal process legacy square:', error.message);
        return null;
    }
}

/**
 * Picks a random image from /zoe and crops it SLIGHTLY from TOP and BOTTOM only.
 * This ensures the image feels personal/custom but maintains its horizontal essence.
 * @returns {Promise<string|null>} Path to the processed image
 */
export async function getRandomZoePap() {
    const imagesDir = path.resolve('./zoe');
    const tempDir = path.resolve('./scratch/temp_visuals');

    try {
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const files = fs.readdirSync(imagesDir).filter(f => 
            f.toLowerCase().endsWith('.jpg') || 
            f.toLowerCase().endsWith('.png') || 
            f.toLowerCase().endsWith('.jpeg')
        );

        if (files.length === 0) return null;

        const randomFile = files[Math.floor(Math.random() * files.length)];
        const inputPath = path.join(imagesDir, randomFile);
        const outputPath = path.join(tempDir, `zoe_pap_${Date.now()}.jpg`);

        const image = sharp(inputPath);
        const metadata = await image.metadata();
        
        // 5% Crop from Top and 5% Crop from Bottom
        const verticalMargin = Math.round(metadata.height * 0.05);
        const targetHeight = metadata.height - (verticalMargin * 2);

        await image
            .extract({ left: 0, top: verticalMargin, width: metadata.width, height: targetHeight })
            .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
            .toFile(outputPath);

        return outputPath;

    } catch (error) {
        console.error('[ImageHelper] Gagal process PAP image:', error.message);
        return null;
    }
}

/**
 * Cleanup function to remove old temp images
 */
export function cleanupTempVisuals() {
    const tempDir = path.resolve('./scratch/temp_visuals');
    if (!fs.existsSync(tempDir)) return;

    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    files.forEach(f => {
        const filePath = path.join(tempDir, f);
        try {
            const stats = fs.statSync(filePath);
            // Sync with cooldown: 3 minutes
            if (now - stats.mtimeMs > 3 * 60 * 1000) {
                fs.unlinkSync(filePath);
            }
        } catch(e) {}
    });
}

/**
 * ZOE IDENTITY CORE (Hashing & Indexing)
 */

/**
 * Generates an SHA-256 hash for an image buffer.
 */
export function calculateHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Indexes the entire /zoe gallery to establish Zoe's visual identity.
 * Runs on startup to sync disk files with Neural Brain (DB).
 */
export async function indexGallery(db) {
    const imagesDir = path.resolve('./zoe');
    if (!fs.existsSync(imagesDir)) {
        console.warn('[ImageHelper] /zoe directory not found. Skipping indexing.');
        return;
    }

    try {
        const files = fs.readdirSync(imagesDir).filter(f => 
            f.toLowerCase().endsWith('.jpg') || 
            f.toLowerCase().endsWith('.png') || 
            f.toLowerCase().endsWith('.jpeg')
        );

        console.log(`[ImageHelper] Synchronizing ${files.length} neural portraits...`);
        
        let indexedCount = 0;
        for (const file of files) {
            const filePath = path.join(imagesDir, file);
            const buffer = fs.readFileSync(filePath);
            const hash = calculateHash(buffer);
            
            await db.saveGalleryHash(file, hash);
            indexedCount++;
        }

        console.log(`[ImageHelper] Success: ${indexedCount} visual signatures indexed.`);
    } catch (error) {
        console.error('[ImageHelper] Indexing failed:', error.message);
    }
}
