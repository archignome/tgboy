require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');
const { registerHandlers } = require('./handlers/messageHandler');
const supabase = require('./db/supabaseClient');

// Check required environment variables
const requiredEnvVars = ['BOT_TOKEN', 'SUPABASE_URL', 'SUPABASE_KEY'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`Error: ${varName} environment variable is missing`);
    process.exit(1);
  }
}

// Initialize Telegram bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Register all message handlers
registerHandlers(bot);

// Set up Express server (required for hosting)
const app = express();
const port = process.env.PORT || 5000;

// Health check endpoint
app.get('/', async (req, res) => {
  try {
    // Test Supabase connection
    const { error } = await supabase.from('orders').select('id').limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed',
        details: error.message
      });
    }
    
    res.json({ 
      status: 'ok', 
      message: 'VPN Bot Service is running!',
      databaseConnection: 'connected'
    });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Service error', 
      details: err.message 
    });
  }
});

// Start Express server
app.listen(port, '0.0.0.0', () => {
  console.log(`Web server is running on port ${port}`);
});

// Add debug middleware for logging all updates from Telegram
bot.use((ctx, next) => {
  console.log(`[${new Date().toISOString()}] Received update from Telegram:`, {
    from: ctx.from ? {
      id: ctx.from.id,
      username: ctx.from.username,
      firstName: ctx.from.first_name
    } : 'Unknown',
    updateType: ctx.updateType,
    updateSubType: ctx.updateSubTypes?.length ? ctx.updateSubTypes[0] : 'none'
  });
  return next();
});

// Start bot
bot.launch()
  .then(() => {
    console.log('Telegram bot started');
    
    // Enable webhook for Telegram
    // Note: For production, you should use webhooks instead of polling if possible
    if (process.env.TELEGRAM_WEBHOOK_URL) {
      bot.telegram.setWebhook(process.env.TELEGRAM_WEBHOOK_URL)
        .then(() => console.log('Webhook set successfully'))
        .catch(e => console.error('Error setting webhook:', e));
    }
  })
  .catch(err => {
    console.error('Failed to start Telegram bot:', err);
    process.exit(1);
  });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
