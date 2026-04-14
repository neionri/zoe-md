import mongoose from 'mongoose';
import { coolLog } from './helper.js';

const GroupConfigSchema = new mongoose.Schema({
    jid: { type: String, required: true, unique: true },
    personality: { type: String, default: '1' },
    history: { type: Array, default: [] },
    summary: { type: String, default: '' },
    facts: { type: Array, default: [] },
    bouncerMode: { type: Boolean, default: false },
    lastPapTime: { type: Date },
    lastActive: { type: Date, default: Date.now }
});

const ApiStateSchema = new mongoose.Schema({
    key: { type: String, default: 'default' },
    currentIndex: { type: Number, default: 0 },
    tier: { type: String, default: '70b' },
    tierResetTime: { type: Number, default: 0 }
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
const ApiState = mongoose.model('ApiState', ApiStateSchema);
const ZoeGallery = mongoose.model('ZoeGallery', ZoeGallerySchema);
const Reminder = mongoose.model('Reminder', ReminderSchema);

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
