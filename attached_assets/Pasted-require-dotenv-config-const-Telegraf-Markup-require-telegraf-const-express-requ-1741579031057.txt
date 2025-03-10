require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// Initialize database
const adapter = new FileSync('db.json');
const db = low(adapter);

// Set default database state
db.defaults({ orders: [] }).write();

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// VPN configurations
const vpnConfigs = [
    {
     id: '1month',
     name: '1 Month Basic',
     details: '30GB Traffic • 1 Month • 2 Devices',
     price: 42000,
   },
   {
     id: '3month',
     name: '3 Months Pro',
     details: '100GB Traffic • 3 Months • 3 Devices',
     price: 110000,
   },
   {
     id: '6month',
     name: '6 Months Premium',
     details: '250GB Traffic • 6 Months • 5 Devices',
     price: 200000,
   },
   {
     id: '30GB-1M-3D',
     name: '1 Month 30GB + 3 Devices',
     details: '30GB Traffic • 1 Month • 3 Devices',
     price: 90000,
   },
   {
     id: '45GB-1M-3D',
     name: '1 Month 45GB + 3 Devices',
     details: '45GB Traffic • 1 Month • 3 Devices',
     price: 115000,
   },
   {
     id: '100GB-2M-5D',
     name: '2 Months 100GB + 5 Devices',
     details: '100GB Traffic • 2 Months • 5 Devices',
     price: 210000,
   },
   {
     id: '150GB-3M-10D',
     name: '3 Months 150GB + 10 Devices',
     details: '150GB Traffic • 3 Months • 10 Devices',
     price: 300000,
   },
 
 {
     id: '15GB-1M',
     name: '1 Month 15GB',
     details: '15GB Traffic • 1 Month • 1 Device',
     price: 60000,
   },
  {
     id: '20GB-1M',
     name: '1 Month 20GB',
     details: '20GB Traffic • 1 Month • 1 Device',
     price: 70000,
   },
   {
     id: '30GB-2M-5D',
     name: '2 Months 30GB + 5 Devices',
     details: '30GB Traffic • 2 Months • 5 Devices',
     price: 130000,
   },
   {
     id: '70GB-1M-3D',
     name: '1 Month 70GB + 3 Devices',
     details: '70GB Traffic • 1 Month • 3 Devices',
     price: 140000,
   },
   
 ];

// Welcome message
bot.command('start', (ctx) => {
    const welcomeMessage = `👋 Welcome to VPN Service Bot!

Choose from our premium VPN configurations below:`;
    
    ctx.reply(welcomeMessage, getConfigKeyboard());
});

// Help command
bot.command('help', (ctx) => {
    const helpMessage = `🔍 Available Commands:
/start - Start the bot and see VPN configurations
/plans - View available VPN plans
/orders - View your orders
/help - Show this help message`;
    
    ctx.reply(helpMessage);
});

// Plans command
bot.command('plans', (ctx) => {
    ctx.reply('Choose a VPN configuration:', getConfigKeyboard());
});

// Generate keyboard for VPN configs
function getConfigKeyboard() {
    return Markup.inlineKeyboard(
        vpnConfigs.map(config => [
            Markup.button.callback(
                `${config.name} - ${config.price}`,
                `buy_${config.id}`
            )
        ])
    );
}

// Handle configuration selection
bot.action(/buy_(.+)/, async (ctx) => {
    const configId = ctx.match[1];
    const config = vpnConfigs.find(c => c.id === configId);
    
    if (!config) {
        return ctx.reply('Configuration not found.');
    }

    const orderDetails = `📦 Order Details:
    
Name: ${config.name}
Details: ${config.details}
Price: ${config.price}

To complete your order, please send the payment to:
[Your Payment Details Here]

After payment, send a screenshot of the payment to confirm your order.`;

    // Store order in database
    const orderId = Date.now().toString();
    db.get('orders')
        .push({
            id: orderId,
            userId: ctx.from.id,
            username: ctx.from.username,
            config: config,
            status: 'pending',
            timestamp: new Date().toISOString()
        })
        .write();

    // Notify admin
    const adminMessage = `🔔 New Order:
Order ID: ${orderId}
User: @${ctx.from.username}
Product: ${config.name}
Price: ${config.price}`;

    try {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, adminMessage);
    } catch (error) {
        console.error('Failed to notify admin:', error);
    }

    await ctx.reply(orderDetails);
});

// Setup express for web server (required for hosting)
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('VPN Bot Service is running!');
});

// Start express server
app.listen(port, () => {
    console.log(`Web server is running on port ${port}`);
});

// Start bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 