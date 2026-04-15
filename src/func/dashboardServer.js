import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { coolLog } from './helper.js';
import multer from 'multer';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ZOE NEURAL DASHBOARD SERVER
 * ----------------------------
 * Modul ini menangani antarmuka web monitoring real-time.
 */

let io;
let currentSock = null;

/**
 * Inisialisasi Dashboard Server
 * @param {object} options - Opsi inisialisasi
 */
export async function initDashboard(port = 3000) {
    const app = express();
    const server = createServer(app);
    io = new Server(server);

    const publicPath = path.join(__dirname, '../dashboard/public');
    
    // Middleware
    app.use(express.json());
    app.use(express.static(publicPath));

    // Dashboard Authentication Gate
    app.post('/api/auth', (req, res) => {
        const { pin } = req.body;
        const correctPin = process.env.DASHBOARD_PIN || '1234';
        
        if (pin === correctPin) {
            res.json({ success: true, token: 'ZOE_NEURAL_AUTH_SUCCESS' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid Neural PIN' });
        }
    });

    // API: Dynamic Neural Avatar
    app.get('/api/bot/avatar', async (req, res) => {
        try {
            const fs = await import('fs/promises');
            const zoePath = path.join(__dirname, '../../zoe');
            const files = await fs.readdir(zoePath);
            const images = files.filter(f => /\.(jpg|jpeg|png|webp|gif|jfif)$/i.test(f));
            
            if (images.length === 0) {
                return res.status(404).send('No neural portraits found');
            }

            const randomImage = images[Math.floor(Math.random() * images.length)];
            res.sendFile(path.join(zoePath, randomImage));
        } catch (err) {
            res.status(500).send('Neural gallery offline');
        }
    });

    // API: Bot Identity info
    app.get('/api/bot/info', async (req, res) => {
        try {
            const os = await import('os');
            const { getApiHealthStatus } = await import('./groq.js');
            const health = await getApiHealthStatus();

            // Map tier to human-readable model name
            const tierModels = {
                '70b':  'GPT-OSS 120B (Flagship)',
                'beta': 'Llama 3.3 70B (Versatile)',
                'safe': 'GPT-OSS 20B (Fast)'
            };
            const aiModel = tierModels[health.tier] || 'Groq Neural Engine';
            
            const uptimeSeconds = Math.floor(process.uptime());
            const hours   = Math.floor(uptimeSeconds / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);

            // os.loadavg is Linux/macOS only — safe fallback for Windows
            const cpuRaw   = os.loadavg ? os.loadavg()[0] : 0;
            const cpuLoad  = Math.min(Math.round(cpuRaw * 10), 100);
            const ramTotal = os.totalmem();
            const ramFree  = os.freemem();
            const ramUsage = Math.round(((ramTotal - ramFree) / ramTotal) * 100);

            res.json({
                name:     process.env.BOT_NAME    || 'Zoe Core',
                owner:    process.env.OWNER_NAME  || 'Admin',
                version:  'v3.3.1',
                aiModel,
                uptime:   `${hours}h ${minutes}m`,
                uptimeSeconds: uptimeSeconds,
                cpuLoad:  String(cpuLoad),
                ramUsage: String(ramUsage)
            });
        } catch (err) {
            coolLog('ERROR', `Bot info API failed: ${err.message}`);
            // Return safe fallbacks so dashboard never shows undefined
            const uptimeSeconds = Math.floor(process.uptime());
            res.json({
                name:     process.env.BOT_NAME   || 'Zoe Core',
                owner:    process.env.OWNER_NAME || 'Admin',
                version:  'v3.3.1',
                aiModel:  'Groq Neural Engine',
                uptime:   `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`,
                uptimeSeconds: uptimeSeconds,
                cpuLoad:  '0',
                ramUsage: '0'
            });
        }
    });

    // API: User Management List
    app.get('/api/users/list', async (req, res) => {
        try {
            const mongoose = (await import('mongoose')).default;
            const UserConfig = mongoose.model('UserConfig');
            const users = await UserConfig.find({}).sort({ addedAt: -1 }).limit(100);
            
            const formattedUsers = users.map(u => ({
                jid: u.jid,
                tier: u.tier || 'free',
                addedAt: u.addedAt ? new Date(u.addedAt).toLocaleDateString() : 'N/A',
                usage: u.dailyUsage ? {
                    mb: (u.dailyUsage.get('downloadMB') || 0).toFixed(1),
                    stickers: (u.dailyUsage.get('stickerPhoto') || 0) + (u.dailyUsage.get('stickerVideo') || 0)
                } : { mb: 0, stickers: 0 }
            }));

            res.json(formattedUsers);
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch user matrix' });
        }
    });

    // API: Update User Tier
    app.post('/api/users/update-tier', async (req, res) => {
        const { jid, tier } = req.body;
        if (!jid || !tier) return res.status(400).json({ error: 'Invalid payload' });

        try {
            const mongoose = (await import('mongoose')).default;
            const UserConfig = mongoose.model('UserConfig');
            await UserConfig.findOneAndUpdate({ jid }, { $set: { tier } }, { upsert: true });
            
            coolLog('SECURITY', `User ${jid} tier elevated/demoted to ${tier.toUpperCase()} via Dashboard.`);
            res.json({ success: true, message: `User tier synchronized to ${tier}` });
        } catch (err) {
            res.status(500).json({ error: 'Matrix update failed' });
        }
    });

    // API: System Control (Restart)
    app.post('/api/control/restart', (req, res) => {
        coolLog('SYSTEM', 'Neural Restart triggered from Dashboard.');
        res.json({ success: true });
        setTimeout(() => { process.exit(0); }, 1000);
    });

    // API: Broadcast Message via Baileys
    app.post('/api/broadcast', async (req, res) => {
        const { jid, message } = req.body;
        if (!jid || !message) return res.status(400).json({ error: 'JID and message required' });
        if (!currentSock) return res.status(503).json({ error: 'Neural link offline — Zoe not connected' });
        try {
            const fullJid = jid.includes('@') ? jid : `${jid.replace(/\D/g,'')}@s.whatsapp.net`;
            await currentSock.sendMessage(fullJid, { text: message });
            coolLog('SYSTEM', `Broadcast sent to ${fullJid} via Dashboard.`);
            res.json({ success: true, to: fullJid });
        } catch (err) {
            res.status(500).json({ error: `Send failed: ${err.message}` });
        }
    });

    // API: Command Execution Stats
    app.get('/api/commands/stats', async (req, res) => {
        try {
            const { getCommandStats } = await import('./db.js');
            const stats = await getCommandStats();
            res.json(stats);
        } catch (err) {
            res.status(500).json({ success: 0, failed: 0, recent: [] });
        }
    });

    // --- NEW SETTINGS API ENGINES ---
    
    // API: Update WhatsApp Bio
    app.post('/api/settings/update-bio', async (req, res) => {
        const { bio } = req.body;
        if (!bio) return res.status(400).json({ error: 'Bio is empty' });
        if (!currentSock) return res.status(503).json({ error: 'Not connected' });
        
        try {
            await currentSock.updateProfileStatus(bio);
            coolLog('SYSTEM', `Neural bio updated via Dashboard: "${bio}"`);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // API: Update WhatsApp PFP
    const upload = multer({ dest: 'temp/' });
    app.post('/api/settings/update-pfp', upload.single('pfp'), async (req, res) => {
        if (!req.file || !currentSock) return res.status(400).json({ error: 'No file or offline' });
        
        try {
            const jid = currentSock.user.id;
            await currentSock.updateProfilePicture(jid, { url: req.file.path });
            coolLog('SYSTEM', `Neural Profile Picture updated via Dashboard.`);
            await fs.unlink(req.file.path); // Clean up
            res.json({ success: true });
        } catch (err) {
            coolLog('ERROR', `PFP Error: ${err.message}`);
            // PFP updates can fail due to WhatsApp compression/timeout protocols
            res.status(500).json({ error: err.message });
        }
    });

    // API: Get System Settings Status
    app.get('/api/settings/status', (req, res) => {
        res.json({
            success: true,
            maintenance: !!global.maintenanceMode
        });
    });

    // API: Set Maintenance Mode
    app.post('/api/settings/maintenance', async (req, res) => {
        const { enabled } = req.body;
        global.maintenanceMode = !!enabled;
        
        try {
            const { updateGroupConfig } = await import('./db.js');
            await updateGroupConfig('GLOBAL', { maintenanceMode: global.maintenanceMode });
            coolLog('SYSTEM', `Maintenance Mode: ${global.maintenanceMode ? 'ENABLED' : 'DISABLED'} (Persistent)`);
            res.json({ success: true, maintenance: global.maintenanceMode });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Get Banned Commands
    app.get('/api/settings/banned-commands', async (req, res) => {
        try {
            const mongoose = (await import('mongoose')).default;
            const GroupConfig = mongoose.model('GroupConfig');
            const globalCfg = await GroupConfig.findOne({ jid: 'GLOBAL' });
            res.json({ success: true, banned: globalCfg ? globalCfg.bannedCommands : [] });
        } catch (err) { res.status(500).json({ success: false }); }
    });

    // API: Ban/Unban Command
    app.post('/api/settings/ban-command', async (req, res) => {
        const { command, action } = req.body; // action = 'ban' or 'unban'
        if(!command) return res.status(400).json({ error: 'Invalid payload' });
        
        try {
            const mongoose = (await import('mongoose')).default;
            const GroupConfig = mongoose.model('GroupConfig');
            
            if (action === 'ban') {
                await GroupConfig.findOneAndUpdate({ jid: 'GLOBAL' }, { $addToSet: { bannedCommands: command } }, { upsert: true });
                coolLog('SECURITY', `Global Ban added for command: .${command}`);
            } else if (action === 'unban') {
                await GroupConfig.findOneAndUpdate({ jid: 'GLOBAL' }, { $pull: { bannedCommands: command } }, { upsert: true });
                coolLog('SECURITY', `Global Ban lifted for command: .${command}`);
            }
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: 'Failed' }); }
    });

    // WebSocket: Real-time Connection
    io.on('connection', (socket) => {
        coolLog('NETWORK', 'Dashboard linked to Neural Matrix.');
        
        // Kirim status awal
        socket.emit('statusUpdate', {
            connected: !!currentSock,
            version: process.env.npm_package_version || '3.3.0',
            owner: process.env.OWNER_NAME || 'Unknown'
        });

        // Trigger update metrik pertama kali
        broadcastMetrics();

        socket.on('disconnect', () => {
            coolLog('NETWORK', 'Dashboard link severed.');
        });
    });

    // Loop Update Metrik Global (Setiap 10 Detik)
    setInterval(broadcastMetrics, 10000);

    server.listen(port, () => {
        coolLog('SYSTEM', `Neural Dashboard active at http://localhost:${port}`);
    });

    return { app, server, io };
}

/**
 * Agregasi Metrik Global & Broadcast ke Dashboard
 */
async function broadcastMetrics() {
    if (!io) return;
    
    try {
        const mongoose = (await import('mongoose')).default;
        const UserConfig = mongoose.model('UserConfig');
        const users = await UserConfig.find({});
        
        let totalMB = 0;
        let totalStickers = 0;

        users.forEach(u => {
            if (u.dailyUsage) {
                totalMB += u.dailyUsage.get('downloadMB') || 0;
                totalStickers += (u.dailyUsage.get('stickerPhoto') || 0) + (u.dailyUsage.get('stickerVideo') || 0);
            }
        });

        io.emit('metricsUpdate', {
            totalMB: totalMB.toFixed(2),
            totalStickers: totalStickers
        });
    } catch (err) {
        // Quiet fail untuk menghindari spam log jika DB belum siap
    }
}

/**
 * Update Connection Status di Dashboard
 * @param {object} sock - Instansi Baileys
 */
export function setDashboardSock(sock) {
    currentSock = sock;
    if (io) {
        io.emit('statusUpdate', { connected: !!sock });
    }
}

/**
 * Broadcast Command Execution Log ke Dashboard + Simpan ke Database
 * @param {object} data - { user, command, status, reason }
 */
export async function broadcastCommandLog(data) {
    // 1. Emit real-time ke dashboard
    if (io) {
        io.emit('commandLog', {
            ...data,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
    }
    // 2. Simpan ke MongoDB (non-blocking)
    try {
        const { saveCommandLog } = await import('./db.js');
        await saveCommandLog(data.command, data.user, data.status, data.reason || '');
    } catch (_) {}
}

/**
 * Broadcast Incoming Message ke Dashboard
 * @param {object} data - { jid, name, text, tier }
 */
export function broadcastIncomingMessage(data) {
    if (io) {
        io.emit('incomingMessage', {
            ...data,
            time: new Date().toLocaleTimeString()
        });
    }
}

/**
 * Broadcast Log ke Dashboard
 * @param {string} level - Level log (SYSTEM/BRAIN/etc)
 * @param {string} message - Isi pesan
 */
export function broadcastLog(level, message) {
    if (io) {
        io.emit('neuralLog', {
            time: new Date().toLocaleTimeString(),
            level,
            message
        });
    }
}
