import { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function connectToWhatsApp(onMessage) {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, '../../auth_info'));
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: [process.env.BOT_NAME || 'Zoe Bot', 'Chrome', '120.0.0'],
        syncFullHistory: false,
        linkPreviewImageThumbnailWidth: 192,
        defaultQueryTimeoutMs: undefined,
        markOnline: false
    });

    let lastQR = '';
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr && qr !== lastQR) {
            lastQR = qr;
            console.clear();
            console.log('--- SCAN QR CODE ---');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp(onMessage);
            }
        } else if (connection === 'open') {
            const botName = process.env.BOT_NAME || 'Zoe';
            console.log(`[${botName}] Neural connection established.`);
            
            // TRICK: Pancing Online bentar terus Offline biar Last Seen refresh
            await sock.sendPresenceUpdate('available');
            setTimeout(async () => {
                await sock.sendPresenceUpdate('unavailable');
                console.log(`[PRESENCE] Global Signal: [OFFLINE] (Stealth Mode Active)`);
            }, 2000);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        if (onMessage) {
            await onMessage(sock, m);
        }
    });

    return sock;
}
