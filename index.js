const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

// Token depuis environment variable
const TOKEN = process.env.TOKEN;

// Créer le client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Charger ou créer la base de données
let users = {};
if (fs.existsSync('users.json')) {
    users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
}
function saveUsers() {
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
}

// Boutique
const shop = {
    ticket: { name: "🎟️ Ticket Casino", price: 50 }
};

client.once('ready', () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    const id = message.author.id;

    if (!users[id]) users[id] = { money: 0, tickets: 0, lastDaily: 0, lastHour: 0 };

    // 1$ par message
    users[id].money += 1;
    saveUsers();

    // --- SHOP ---
    if (message.content === "!shop") {
        let shopMsg = "🛒 **Boutique**\n";
