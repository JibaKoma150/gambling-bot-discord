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
    const data = fs.readFileSync('users.json', 'utf8');
    if (data) {
        users = JSON.parse(data);
    }
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
        for (const key in shop) {
            shopMsg += `- ${shop[key].name} : ${shop[key].price}$ (commande: !buy ${key})\n`;
        }
        message.reply(shopMsg);
    }

    // --- BUY ---
    if (message.content.startsWith("!buy ")) {
        const args = message.content.split(" ");
        const itemKey = args[1];
        const item = shop[itemKey];
        if (!item) return message.reply("❌ Cet objet n’existe pas !");
        if (users[id].money < item.price) return message.reply("❌ Pas assez d’argent !");
        users[id].money -= item.price;
        if (itemKey === "ticket") users[id].tickets += 1;
        saveUsers();
        message.reply(`✅ Tu as acheté **${item.name}** pour ${item.price}$ !`);
    }

    // --- INVENTORY ---
    if (message.content === "!inventory") {
        message.reply(`💰 Argent : ${users[id].money}$\n🎟️ Tickets Casino : ${users[id].tickets}`);
    }

    // --- BALANCE ---
    if (message.content === "!balance") {
        message.reply(`💰 Tu as **${users[id].money}$**`);
    }

    // --- DONATE ---
    if (message.content.startsWith("!donate ")) {
        const args = message.content.split(" ");
        const target = message.mentions.users.first();
        const amount = parseInt(args[2]);
        if (!target) return message.reply("❌ Mentionne quelqu'un !");
        if (isNaN(amount)) return message.reply("❌ Montant invalide !");
        if (users[id].money < amount) return message.reply("❌ Pas assez d'argent !");
        if (!users[target.id]) users[target.id] = { money: 0, tickets: 0, lastDaily: 0, lastHour: 0 };
        users[id].money -= amount;
        users[target.id].money += amount;
        saveUsers();
        message.reply(`✅ Tu as donné **${amount}$** à ${target.username} !`);
    }

    // --- DAILY ---
    if (message.content === "!daily") {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (now - users[id].lastDaily < oneDay) {
            const next = new Date(users[id].lastDaily + oneDay);
            return message.reply(`❌ Tu as déjà pris ton daily ! Prochain : ${next.toLocaleTimeString()}`);
        }
        users[id].money += 300;
        users[id].lastDaily = now;
        saveUsers();
        message.reply("💰 Tu as reçu **300$** pour ton daily !");
    }

    // --- HOUR ---
    if (message.content === "!hour") {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        if (now - users[id].lastHour < oneHour) {
            const next = new Date(users[id].lastHour + oneHour);
            return message.reply(`❌ Tu as déjà pris ton hour ! Prochain : ${next.toLocaleTimeString()}`);
        }
        users[id].money += 50;
        users[id].lastHour = now;
        saveUsers();
        message.reply("💰 Tu as reçu **50$** pour ton hour !");
    }

    // --- GAMBLING ---
    if (message.content === "!gambling") {
        if (users[id].tickets <= 0) {
            return message.reply("❌ Tu dois avoir un 🎟️ Ticket de casino pour jouer ! Achète-en avec `!buy ticket`.");
        }

        // Consomme 1 ticket
        users[id].tickets -= 1;

        const jackpot1000 = Math.floor(Math.random() * 25) === 0;
        const gain100 = Math.floor(Math.random() * 10) === 0;
        let won = 0;

        if (jackpot1000) won = 1000;
        else if (gain100) won = 100;

        users[id].money += won;
        saveUsers();

        if (won > 0) message.reply(`🎉 Tu as gagné **${won}$** !`);
        else message.reply("😢 Pas de chance cette fois !");
    }
});

// Connexion
client.login(TOKEN);
