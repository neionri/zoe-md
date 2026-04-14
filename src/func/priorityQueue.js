/**
 * ZOE GLOBAL PRIORITY QUEUE (v3.2.0)
 * ----------------------------------
 * Sistem antrean prioritas untuk mengatur urutan eksekusi pesan
 * berdasarkan kasta user. VIP > Premium > Free.
 */

import { coolLog } from './helper.js';

class PriorityQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.tierWeights = {
            vip: 100,
            premium: 50,
            free: 10
        };
    }

    /**
     * Menambahkan tugas ke antrean dan mengurutkan ulang
     */
    async enqueue(task) {
        const priority = this.tierWeights[task.tier] || 10;
        this.queue.push({ ...task, priority, addedAt: Date.now() });

        // Sorting: Prioritas paling tinggi di depan. 
        // Jika prioritas sama, yang masuk duluan diproses duluan.
        this.queue.sort((a, b) => b.priority - a.priority || a.addedAt - b.addedAt);

        coolLog('NETWORK', `Synapse queued: ${task.remoteJid.split('@')[0]} [Tier: ${task.tier.toUpperCase()}] | Queue: ${this.queue.length}`);
        
        if (!this.isProcessing) {
            this.process();
        }
    }

    /**
     * Pekerja Otomatis (Sequential Worker)
     */
    async process() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const task = this.queue.shift();

        try {
            // Artificial Delay untuk kasta FREE (Simulasi Antrean Standar)
            if (task.tier === 'free') {
                coolLog('SYSTEM', `Applying Standard Lane throttling for ${task.remoteJid.split('@')[0]}...`);
                await new Promise(resolve => setTimeout(resolve, 1800)); // Jeda 1.8 detik
            }

            // Eksekusi Logika Neural Utama
            await task.execute();

        } catch (error) {
            console.error('[PriorityQueue] Execution Error:', error);
        }

        // Lanjut ke antrean berikutnya
        this.process();
    }
}

// Gunakan global agar antrean tidak hilang saat Hot-Reload
if (!global.zoeQueue) global.zoeQueue = new PriorityQueue();

export const enqueueNeuralTask = (task) => global.zoeQueue.enqueue(task);
