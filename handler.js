const { Low, JSONFile } = require('lowdb');

// Create a lowdb instance
const file = new JSONFile('db.json');
const db = new Low(file);

// Initialize database
async function initDB() {
    await db.read();
    db.data ||= { users: {}, settings: {}, commands: [] };
    await db.write();
}

// User levelling system
async function updateUserLevel(userId) {
    const user = db.data.users[userId] || { level: 0, xp: 0 };
    user.xp += 10; // Increment XP by 10
    if (user.xp >= 100) { // Level up condition
        user.level += 1;
        user.xp = 0; // Reset XP
    }
    db.data.users[userId] = user;
    await db.write();
}

// Anti-spam functionality
const userMessages = {};
setInterval(() => { 
    for (const userId in userMessages) {
        userMessages[userId].count = 0; // Reset message count every minute
    }
}, 60000);
const checkSpam = (userId) => {
    userMessages[userId] = userMessages[userId] || { count: 0 };
    userMessages[userId].count++;
    if (userMessages[userId].count > 5) {
        // Logic to handle spam (e.g., mute user)
        console.log(`User ${userId} is spamming.`);
    }
};

// Multi-prefix support
const prefixes = ['!', '.', '#'];
const isCommand = (message) => prefixes.some(prefix => message.startsWith(prefix));

// Caching system
const messageCache = new Map();
const cacheMessage = (message) => {
    messageCache.set(message.id, message);
};

// Admin/Owner/Premium differentiation
const admins = ['ownerId1', 'ownerId2'];
const premiumUsers = ['premiumUserId1', 'premiumUserId2'];
const isAdmin = (userId) => admins.includes(userId);
const isPremium = (userId) => premiumUsers.includes(userId);

module.exports = { initDB, updateUserLevel, checkSpam, isCommand, cacheMessage, isAdmin, isPremium };