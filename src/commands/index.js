import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadCommands() {
    const commands = new Map();
    const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js') && file !== 'index.js');

    const metadata = [];

    for (const file of commandFiles) {
        try {
            const commandModule = await import(`./${file}?t=${Date.now()}`);
            if (commandModule.default && commandModule.name) {
                const cmdData = {
                    name: commandModule.name,
                    description: commandModule.description || 'No description',
                    aliases: commandModule.aliases || [],
                    hiddenAliases: commandModule.hiddenAliases || [],
                    category: commandModule.category || 'Misc',
                    isOwnerOnly: commandModule.isOwnerOnly || false
                };
                metadata.push(cmdData);
                
                commands.set(commandModule.name, { ...cmdData, run: commandModule.default });
                if (commandModule.aliases) {
                    commandModule.aliases.forEach(alias => commands.set(alias, { ...cmdData, run: commandModule.default }));
                }
                if (commandModule.hiddenAliases) {
                    commandModule.hiddenAliases.forEach(alias => commands.set(alias, { ...cmdData, run: commandModule.default }));
                }
            }
        } catch (error) {
            // Catat modul yang gagal ke papan pengumuman global
            if (!global.failedModules) global.failedModules = [];
            global.failedModules.push({ file, message: error.message });
            try {
                const { coolLog } = await import('../func/helper.js');
                coolLog('ERROR', `Neural Link Failure [${file}]: ${error.message}`, error);
            } catch (e) {
                console.error(`Error loading command ${file}:`, error);
            }
        }
    }
    
    return { map: commands, list: metadata };
}
