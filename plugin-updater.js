import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Plugin updater for multilingual support
class PluginUpdater {
    constructor() {
        this.pluginsDir = path.join(__dirname, '..', 'plugins')
        this.updatedCount = 0
        this.errorCount = 0
        this.skippedCount = 0
    }

    // Common Italian text patterns to replace with translation keys
    getReplacementPatterns() {
        return [
            // Error messages
            { pattern: /❌ Questo comando funziona solo nei gruppi!/g, key: 'smsOnlyGroup' },
            { pattern: /❌ Solo gli admin possono usare questo comando!/g, key: 'smsOnlyAdmin' },
            { pattern: /❌ Solo il proprietario può usare questo comando!/g, key: 'smsOnlyOwner' },
            { pattern: /💎 Questo comando è disponibile solo per utenti premium!/g, key: 'smsOnlyPremium' },
            { pattern: /❌ Comando non valido/g, key: 'smsInvalidCommand' },
            { pattern: /❌ Inserisci del testo/g, key: 'smsNoText' },
            { pattern: /❌ Invia o rispondi a un media/g, key: 'smsNoMedia' },

            // Success messages
            { pattern: /✅ Operazione completata con successo/g, key: 'smsSuccess' },
            { pattern: /⏳ Caricamento\.\.\./g, key: 'smsWait' },
            { pattern: /🔄 Elaborazione in corso\.\.\./g, key: 'smsProcessing' },

            // Common phrases
            { pattern: /⚠️ Attenzione!/g, key: 'smsAvisoMG' },
            { pattern: /❌ Si è verificato un errore/g, key: 'smsError' },

            // Admin messages
            { pattern: /👑 Solo gli amministratori possono usare questo comando!/g, key: 'adminOnly' },
            { pattern: /🔒 Solo il proprietario del bot può usare questo comando!/g, key: 'ownerOnly' },

            // File messages
            { pattern: /📁 File non trovato/g, key: 'fileNotFound' },
            { pattern: /📁 File troppo grande/g, key: 'fileTooLarge' },
            { pattern: /📁 Formato file non valido/g, key: 'invalidFormat' },

            // Download messages
            { pattern: /⬇️ Download iniziato\.\.\./g, key: 'downloadStarted' },
            { pattern: /✅ Download completato!/g, key: 'downloadCompleted' },
            { pattern: /❌ Download fallito/g, key: 'downloadFailed' },

            // Music messages
            { pattern: /🎵 Musica non trovata/g, key: 'musicNotFound' },
            { pattern: /🎵 Download musica in corso\.\.\./g, key: 'musicDownloading' },
            { pattern: /🎵 Musica pronta!/g, key: 'musicReady' },

            // Sticker messages
            { pattern: /🎨 Sticker creato con successo!/g, key: 'stickerCreated' },
            { pattern: /❌ Impossibile creare lo sticker/g, key: 'stickerFailed' }
        ]
    }

    // Update a single plugin file
    async updatePlugin(filePath) {
        try {
            let content = await fs.promises.readFile(filePath, 'utf8')
            let modified = false

            // Skip if already has language import
            if (content.includes("import '../lib/language.js'") || content.includes('global.t(')) {
                this.skippedCount++
                return { success: true, modified: false, reason: 'Already updated' }
            }

            // Add language import after other imports
            const importRegex = /^(import .+\n)+/m
            const importMatch = content.match(importRegex)

            if (importMatch && !content.includes("import '../lib/language.js'")) {
                const lastImportIndex = importMatch.index + importMatch[0].length
                content = content.slice(0, lastImportIndex) + 
                         "import '../lib/language.js'\n" + 
                         content.slice(lastImportIndex)
                modified = true
            }

            // Replace hardcoded Italian text with translation function calls
            const patterns = this.getReplacementPatterns()

            for (const { pattern, key } of patterns) {
                if (pattern.test(content)) {
                    // Replace with translation function
                    content = content.replace(pattern, (match) => {
                        // Check if it's in a template literal or string
                        return `\${global.t('${key}', m.sender, m.isGroup ? m.chat : null)}`
                    })
                    modified = true
                }
            }

            // Replace common reply patterns
            const replyPatterns = [
                {
                    pattern: /conn\.reply\(m\.chat,\s*['"`]([^'"`]+)['"`],\s*m\)/g,
                    replacement: (match, text) => {
                        // Check if text contains translation keys
                        const patterns = this.getReplacementPatterns()
                        for (const { pattern: p, key } of patterns) {
                            if (p.test(text)) {
                                return `conn.reply(m.chat, global.t('${key}', m.sender, m.isGroup ? m.chat : null), m)`
                            }
                        }
                        return match
                    }
                },
                {
                    pattern: /m\.reply\(['"`]([^'"`]+)['"`]\)/g,
                    replacement: (match, text) => {
                        const patterns = this.getReplacementPatterns()
                        for (const { pattern: p, key } of patterns) {
                            if (p.test(text)) {
                                return `m.reply(global.t('${key}', m.sender, m.isGroup ? m.chat : null))`
                            }
                        }
                        return match
                    }
                }
            ]

            for (const { pattern, replacement } of replyPatterns) {
                if (pattern.test(content)) {
                    content = content.replace(pattern, replacement)
                    modified = true
                }
            }

            if (modified) {
                await fs.promises.writeFile(filePath, content, 'utf8')
                this.updatedCount++
                return { success: true, modified: true }
            } else {
                this.skippedCount++
                return { success: true, modified: false, reason: 'No changes needed' }
            }

        } catch (error) {
            this.errorCount++
            return { success: false, error: error.message }
        }
    }

    // Update all plugins in the directory
    async updateAllPlugins() {
        console.log('🔄 Starting plugin update for multilingual support...')

        try {
            const files = await fs.promises.readdir(this.pluginsDir)
            const jsFiles = files.filter(file => file.endsWith('.js'))

            console.log(`📁 Found ${jsFiles.length} JavaScript files`)

            const results = []

            for (const file of jsFiles) {
                const filePath = path.join(this.pluginsDir, file)
                console.log(`🔧 Updating ${file}...`)

                const result = await this.updatePlugin(filePath)
                results.push({ file, ...result })

                if (result.success && result.modified) {
                    console.log(`✅ Updated ${file}`)
                } else if (result.success && !result.modified) {
                    console.log(`⏭️ Skipped ${file} (${result.reason || 'No changes needed'})`)
                } else {
                    console.log(`❌ Failed to update ${file}: ${result.error}`)
                }
            }

            console.log('\n📊 Update Summary:')
            console.log(`✅ Updated: ${this.updatedCount}`)
            console.log(`⏭️ Skipped: ${this.skippedCount}`)
            console.log(`❌ Errors: ${this.errorCount}`)

            return results

        } catch (error) {
            console.error('❌ Failed to read plugins directory:', error)
            return []
        }
    }

    // Update specific plugins by name
    async updateSpecificPlugins(pluginNames) {
        const results = []

        for (const pluginName of pluginNames) {
            const filePath = path.join(this.pluginsDir, `${pluginName}.js`)

            if (await fs.promises.access(filePath).then(() => true).catch(() => false)) {
                const result = await this.updatePlugin(filePath)
                results.push({ file: pluginName, ...result })
            } else {
                results.push({ file: pluginName, success: false, error: 'File not found' })
            }
        }

        return results
    }
}

export default PluginUpdater