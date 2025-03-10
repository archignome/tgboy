const { getConfigKeyboard, getAllConfigs, getPlanDetails } = require('./configHandler');
const { handleOrder, getUserOrders } = require('./orderHandler');
const { configsModel } = require('../db/models');

/**
 * Register all bot handlers
 * @param {Object} bot - Telegraf bot instance
 */
function registerHandlers(bot) {
  // Helper function to forward media to admin with user info
  const forwardMediaToAdmin = async (ctx, mediaType) => {
    try {
      console.log(`Received ${mediaType} message`);
      
      // Get the admin ID from environment variables
      const adminId = process.env.ADMIN_ID;
      
      if (!adminId) {
        console.error('Admin ID not set in environment variables');
        return ctx.reply(`Thank you for your ${mediaType}. Our team will review it shortly.`);
      }
      
      // Extract user information
      const user = ctx.from;
      const messageDate = new Date(ctx.message.date * 1000).toISOString();
      
      const userInfo = `
🔔 *New ${mediaType} received*

👤 *From User:*
ID: \`${user.id}\`
Name: ${user.first_name} ${user.last_name || ''}
Username: ${user.username ? '@' + user.username : 'Not set'}
Language: ${user.language_code || 'Not specified'}

📝 Caption: ${ctx.message.caption || 'No caption'}

⏰ Time: ${messageDate}
      `;
      
      // First send the user info message to admin
      await ctx.telegram.sendMessage(adminId, userInfo, {
        parse_mode: 'Markdown'
      });
      
      // Then forward the original message to preserve all metadata
      await ctx.forwardMessage(adminId);
      
      return ctx.reply(`Thank you for your ${mediaType}. Our team will review it shortly.`);
    } catch (error) {
      console.error(`Error forwarding ${mediaType}:`, error);
      return ctx.reply(`Thank you for your ${mediaType}. Our team will review it shortly.`);
    }
  };

  // Handle photo messages
  bot.on('photo', (ctx) => forwardMediaToAdmin(ctx, 'photo'));
  
  // Handle other media types
  bot.on('document', (ctx) => forwardMediaToAdmin(ctx, 'document'));
  bot.on('video', (ctx) => forwardMediaToAdmin(ctx, 'video'));
  bot.on('audio', (ctx) => forwardMediaToAdmin(ctx, 'audio'));
  bot.on('voice', (ctx) => forwardMediaToAdmin(ctx, 'voice message'));
  bot.on('sticker', (ctx) => forwardMediaToAdmin(ctx, 'sticker'));
  bot.on('location', (ctx) => forwardMediaToAdmin(ctx, 'location'));
  bot.on('contact', (ctx) => forwardMediaToAdmin(ctx, 'contact'));

  // Welcome message
  bot.command('start', async (ctx) => {
    const welcomeMessage = `👋 Welcome to VPN Service Bot!

Choose from our premium VPN configurations below:`;
    
    const keyboard = await getConfigKeyboard();
    return ctx.reply(welcomeMessage, keyboard);
  });

  // Help command
  bot.command('help', (ctx) => {
    const helpMessage = `🔍 *Available Commands:*

*Core Commands:*
/start - Start the bot and see VPN configurations
/plans - View available VPN plans
/orders - View your orders

*Information:*
/faq - Frequently asked questions
/payment - Payment methods and information
/download - Download VPN client applications

*Support:*
/help - Show this help message
/support - Contact our support team

_You can also send messages or images directly to this chat to reach our support team._`;
    
    return ctx.reply(helpMessage, { parse_mode: 'Markdown' });
  });

  // Plans command
  bot.command('plans', async (ctx) => {
    const keyboard = await getConfigKeyboard();
    return ctx.reply('Choose a VPN configuration:', keyboard);
  });

  // Orders command
  bot.command('orders', async (ctx) => {
    return await getUserOrders(ctx);
  });
  
  // FAQ command
  bot.command('faq', async (ctx) => {
    const faqMessage = `❓ *Frequently Asked Questions*

*Q: How do I connect to the VPN?*
A: After purchasing a plan, you'll receive configuration files and detailed setup instructions for all major platforms.

*Q: What payment methods do you accept?*
A: We accept credit/debit cards, cryptocurrencies, and bank transfers. Payment details will be provided after selecting a plan.

*Q: Can I use the VPN on multiple devices?*
A: Yes! Each plan specifies the number of devices you can connect simultaneously.

*Q: What is your refund policy?*
A: We offer a 7-day money-back guarantee if you're not satisfied with our service.

*Q: How do I check my data usage?*
A: Use the /usage command to check your current data usage and remaining allowance.

*Q: Is my connection secure?*
A: Yes, we use industry-standard encryption protocols to ensure your connection is secure and private.`;

    return ctx.reply(faqMessage, { parse_mode: 'Markdown' });
  });
  
  // Payment status command
  bot.command('payment', async (ctx) => {
    const paymentMessage = `💳 *Payment Information*

After selecting a plan, you will receive payment instructions.

*Available Payment Methods:*
• Credit/Debit Cards
• Cryptocurrency (BTC, ETH, USDT)
• Bank Transfer

*Payment Process:*
1. Select a VPN plan
2. Follow the payment instructions
3. Send proof of payment (receipt screenshot)
4. Receive your VPN configuration within 24 hours

*Need help with payment?*
Contact our support team by sending a message here.`;

    return ctx.reply(paymentMessage, { parse_mode: 'Markdown' });
  });
  
  // Support command
  bot.command('support', async (ctx) => {
    const supportMessage = `📞 *Contact Support*

Need help with our VPN service? Our team is here to assist you!

*Ways to Contact Us:*
• Send a message directly in this chat
• Send a screenshot of any issues you're experiencing
• Reply with your order ID for order-related queries

*Response Time:*
We typically respond within 24 hours, but most inquiries are addressed within a few hours.

*Common Support Topics:*
• Connection issues
• Payment help
• Account questions
• Technical configuration

Just type your question or concern below and our team will get back to you as soon as possible.`;

    return ctx.reply(supportMessage, { parse_mode: 'Markdown' });
  });
  
  // Download clients command
  bot.command('download', async (ctx) => {
    const downloadMessage = `📱 *VPN Client Downloads*

Our VPN works with the following applications:

*Windows:*
• OpenVPN GUI: [Download](https://openvpn.net/community-downloads/)
• WireGuard: [Download](https://www.wireguard.com/install/)

*macOS:*
• Tunnelblick: [Download](https://tunnelblick.net/downloads.html)
• WireGuard: [Download](https://www.wireguard.com/install/)

*iOS:*
• OpenVPN Connect: [App Store](https://apps.apple.com/app/openvpn-connect/id590379981)
• WireGuard: [App Store](https://apps.apple.com/us/app/wireguard/id1441195209)

*Android:*
• OpenVPN Connect: [Play Store](https://play.google.com/store/apps/details?id=net.openvpn.openvpn)
• WireGuard: [Play Store](https://play.google.com/store/apps/details?id=com.wireguard.android)

*Linux:*
• OpenVPN: Available in your distribution's package manager
• WireGuard: Available in your distribution's package manager

After purchase, you'll receive detailed setup instructions for your device.`;

    return ctx.reply(downloadMessage, { parse_mode: 'Markdown' });
  });

  // View plan details (before buying)
  bot.action(/view_(.+)/, async (ctx) => {
    const configId = ctx.match[1];
    try {
      await ctx.answerCbQuery(); // Acknowledge the callback query
      const { text, keyboard } = await getPlanDetails(configId);
      return ctx.editMessageText(text, keyboard);
    } catch (error) {
      console.error('Error showing plan details:', error);
      return ctx.reply('Sorry, there was an error loading the plan details. Please try again.');
    }
  });

  // Show all plans (used as back button)
  bot.action('show_plans', async (ctx) => {
    try {
      await ctx.answerCbQuery(); // Acknowledge the callback query
      const keyboard = await getConfigKeyboard();
      return ctx.editMessageText('Choose a VPN configuration:', keyboard);
    } catch (error) {
      console.error('Error showing plans:', error);
      return ctx.reply('Sorry, there was an error loading the plans. Please try again.');
    }
  });

  // Handle purchase request
  bot.action(/buy_(.+)/, async (ctx) => {
    const configId = ctx.match[1];
    await ctx.answerCbQuery(); // Acknowledge the callback query
    return await handleOrder(ctx, configId);
  });

  // Fallback handlers for keyboard errors
  bot.action('no_plans', async (ctx) => {
    await ctx.answerCbQuery('No plans available'); // Acknowledge with notification
    return ctx.reply('No VPN plans are currently available. Please try again later.');
  });
  
  bot.action('error_plans', async (ctx) => {
    await ctx.answerCbQuery('Error loading plans'); // Acknowledge with notification
    return ctx.reply('Sorry, there was an error loading the VPN plans. Please try again later.');
  });

  // Handle text messages that aren't commands
  bot.on('text', async (ctx) => {
    if (!ctx.message.text.startsWith('/')) {
      console.log('Received non-command text message:', ctx.message.text);
      
      // Forward non-command text to admin
      try {
        const adminId = process.env.ADMIN_ID;
        
        if (adminId) {
          const user = ctx.from;
          const messageDate = new Date(ctx.message.date * 1000).toISOString();
          
          const userInfo = `
🔔 *New message received*

👤 *From User:*
ID: \`${user.id}\`
Name: ${user.first_name} ${user.last_name || ''}
Username: ${user.username ? '@' + user.username : 'Not set'}
Language: ${user.language_code || 'Not specified'}

📝 Message: "${ctx.message.text}"

⏰ Time: ${messageDate}
          `;
          
          await ctx.telegram.sendMessage(adminId, userInfo, {
            parse_mode: 'Markdown'
          });
        }
      } catch (error) {
        console.error('Error forwarding text message to admin:', error);
      }
      
      // Handle special keywords in non-command text
      const lowerText = ctx.message.text.toLowerCase();
      
      // Check for common keywords and redirect to appropriate commands
      if (lowerText.includes('faq') || lowerText.includes('question')) {
        return ctx.reply('Here are our frequently asked questions:', { reply_markup: { inline_keyboard: [[{ text: 'View FAQ', callback_data: 'show_faq' }]] } });
      } else if (lowerText.includes('payment') || lowerText.includes('pay')) {
        return ctx.reply('Here is our payment information:', { reply_markup: { inline_keyboard: [[{ text: 'Payment Info', callback_data: 'show_payment' }]] } });
      } else if (lowerText.includes('download') || lowerText.includes('client') || lowerText.includes('app')) {
        return ctx.reply('Here are our VPN client download links:', { reply_markup: { inline_keyboard: [[{ text: 'Download Links', callback_data: 'show_download' }]] } });
      } else if (lowerText.includes('support') || lowerText.includes('help')) {
        return ctx.reply('Here\'s how to contact our support team:', { reply_markup: { inline_keyboard: [[{ text: 'Contact Support', callback_data: 'show_support' }]] } });
      } else if (lowerText.includes('plan') || lowerText.includes('price') || lowerText.includes('config')) {
        return ctx.reply('Here are our available VPN plans:', { reply_markup: { inline_keyboard: [[{ text: 'View Plans', callback_data: 'show_plans' }]] } });
      }
      
      // Default response for messages that don't match keywords
      return ctx.reply('Thank you for your message. Our support team has been notified and will get back to you soon. Use /help to see all available commands.');
    }
  });

  // Handle errors
  bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    return ctx.reply('Sorry, something went wrong. Please try again later.');
  });
}

module.exports = {
  registerHandlers
};
