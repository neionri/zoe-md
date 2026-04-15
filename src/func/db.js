import mongoose from 'mongoose';
import { coolLog } from './helper.js';

const GroupConfigSchema = new mongoose.Schema({
    jid: { type: String, required: true, unique: true },
    personality: { type: String, default: '1' },
    history: { type: Array, default: [] },
    summary: { type: String, default: '' },
    facts: { type: Array, default: [] },
    bouncerMode: { type: Boolean, default: false },
    maintenanceMode: { type: Boolean, default: false },
    bannedCommands: { type: Array, default: [] },
    lastPapTime: { type: Date },
    lastActive: { type: Date, default: Date.now }
});

const ApiStateSchema = new mongoose.Schema({
    key: { type: String, default: 'default' },
    currentIndex: { type: Number, default: 0 },
    tier: { type: String, default: '70b' },
    tierResetTime: { type: Number, default: 0 }
});

const UserConfigSchema = new mongoose.Schema({
    jid: { type: String, required: true, unique: true },
    tier: { type: String, default: 'free' }, // free, premium, vip
    premiumUntil: { type: Date, default: null },
    dailyUsage: { 
        type: Map, 
        of: Number, 
        default: { downloadCount: 0, drawCount: 0 } 
    },
    lastReset: { type: String, default: '' }, // format: YYYY-MM-DD
    addedAt: { type: Date, default: Date.now }
});

const ZoeGallerySchema = new mongoose.Schema({
    filename: { type: String, required: true },
    hash: { type: String, required: true, unique: true },
    addedAt: { type: Date, default: Date.now }
});

const ReminderSchema = new mongoose.Schema({
    jid: { type: String, required: true },
    sender: { type: String },
    message: { type: String, required: true },
    timestamp: { type: Number, required: true },
    addedAt: { type: Date, default: Date.now }
});

const GroupConfig = mongoose.model('GroupConfig', GroupConfigSchema);
const UserConfig = mongoose.model('UserConfig', UserConfigSchema);
const ApiState = mongoose.model('ApiState', ApiStateSchema);
const ZoeGallery = mongoose.model('ZoeGallery', ZoeGallerySchema);
const Reminder = mongoose.model('Reminder', ReminderSchema);

// Command Execution Log Schema
const CommandLogSchema = new mongoose.Schema({
    command:   { type: String, required: true },
    user:      { type: String, required: true },
    status:    { type: String, enum: ['SUCCESS', 'FAILED'], required: true },
    reason:    { type: String, default: '' },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 } // Auto-delete after 30 days
});
CommandLogSchema.index({ createdAt: -1 }); // Index for fast sorting
const CommandLog = mongoose.model('CommandLog', CommandLogSchema);

export async function connectDB() {
    if (mongoose.connection.readyState >= 1) return;
    try {
        mongoose.set('strictQuery', false); // Diamkan warning Mongoose
        await mongoose.connect(process.env.MONGODB_URI);
        coolLog('SYSTEM', 'Neural clusters linked (Cloud DB).');
    } catch (error) {
        console.error('[DB] Connection Error:', error);
    }
}

export async function getGroupConfig(jid) {
    let config = await GroupConfig.findOne({ jid });
    if (!config) {
        config = await GroupConfig.create({ jid });
    }
    return config;
}

export async function updateGroupConfig(jid, data) {
    return await GroupConfig.findOneAndUpdate({ jid }, { $set: data }, { returnDocument: 'after', upsert: true });
}

/**
 * USER CONFIG HELPERS (Tiering System)
 */
export async function getUserConfig(jid) {
    let config = await UserConfig.findOne({ jid });
    if (!config) {
        config = await UserConfig.create({ jid });
    }
    return config;
}

export async function updateUserConfig(jid, data) {
    return await UserConfig.findOneAndUpdate({ jid }, { $set: data }, { returnDocument: 'after', upsert: true });
}

export async function getApiStateDb(defaultState) {
    let state = await ApiState.findOne({ key: 'default' });
    if (!state) {
        state = await ApiState.create({ key: 'default', ...defaultState });
    }
    return state;
}

export async function saveApiStateDb(state) {
    return await ApiState.findOneAndUpdate({ key: 'default' }, { $set: state }, { returnDocument: 'after' });
}

/**
 * ZOE GALLERY HELPERS (Visual Identity)
 */
export async function saveGalleryHash(filename, hash) {
    return await ZoeGallery.findOneAndUpdate(
        { hash }, 
        { $set: { filename, hash } }, 
        { upsert: true, returnDocument: 'after' }
    );
}

export async function checkGalleryHash(hash) {
    return await ZoeGallery.findOne({ hash });
}

export async function clearGallery() {
    return await ZoeGallery.deleteMany({});
}

/**
 * REMINDER HELPERS
 */
export async function saveReminder(jid, sender, message, timestamp) {
    return await Reminder.create({ jid, sender, message, timestamp });
}

export async function getDueReminders() {
    const now = Date.now();
    return await Reminder.find({ timestamp: { $lte: now } });
}

export async function deleteReminder(id) {
    return await Reminder.findByIdAndDelete(id);
}

/**
 * COMMAND LOG HELPERS (Analytics + Anti-Overflow)
 * Maks 500 record. Otomatis hapus yang lama jika sudah penuh.
 */
const CMD_LOG_LIMIT = 500;

export async function saveCommandLog(command, user, status, reason = '') {
    try {
        await CommandLog.create({ command, user, status, reason });
        // Anti-overflow: Hapus yang paling lama jika melebihi batas
        const total = await CommandLog.countDocuments();
        if (total > CMD_LOG_LIMIT) {
            const oldest = await CommandLog.find().sort({ createdAt: 1 }).limit(total - CMD_LOG_LIMIT).select('_id');
            await CommandLog.deleteMany({ _id: { $in: oldest.map(d => d._id) } });
        }
    } catch (err) {
        console.error('[DB] CommandLog save error:', err.message);
    }
}

export async function getCommandStats() {
    const [success, failed, recent] = await Promise.all([
        CommandLog.countDocuments({ status: 'SUCCESS' }),
        CommandLog.countDocuments({ status: 'FAILED' }),
        CommandLog.find().sort({ createdAt: -1 }).limit(50).lean()
    ]);
    return { success, failed, recent };
}
