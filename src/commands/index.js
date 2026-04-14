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
                    category: commandModule.category || 'Misc',
                    isOwnerOnly: commandModule.isOwnerOnly || false
                };
                metadata.push(cmdData);
                
                commands.set(commandModule.name, { ...cmdData, run: commandModule.default });
                if (commandModule.aliases) {
                    commandModule.aliases.forEach(alias => commands.set(alias, { ...cmdData, run: commandModule.default }));
                }
            }
        } catch (error) {
            console.error(`Error loading command ${file}:`, error);
        }
    }
    
    return { map: commands, list: metadata };
}
