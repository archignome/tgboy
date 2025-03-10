const { Markup } = require('telegraf');
const { configsModel } = require('../db/models');

/**
 * Get VPN configuration by ID
 * @param {string} configId - Configuration ID
 * @returns {Promise<Object|null>} - VPN configuration object or null if not found
 */
async function getConfigById(configId) {
  try {
    return await configsModel.getConfigById(configId);
  } catch (error) {
    console.error('Error in getConfigById:', error);
    return null;
  }
}

/**
 * Get all VPN configurations
 * @returns {Promise<Array>} - Array of VPN configuration objects
 */
async function getAllConfigs() {
  try {
    return await configsModel.getAllConfigs();
  } catch (error) {
    console.error('Error in getAllConfigs:', error);
    return [];
  }
}

/**
 * Generate keyboard for VPN configs
 * @returns {Promise<Object>} - Telegram inline keyboard
 */
async function getConfigKeyboard() {
  try {
    const configs = await getAllConfigs();
    
    if (!configs || configs.length === 0) {
      // Fallback if no configs are found
      return Markup.inlineKeyboard([
        [Markup.button.callback('No VPN plans available', 'no_plans')]
      ]);
    }
    
    const buttons = [];
    
    // For each config, create a row with plan name and two buttons: View Details and Buy
    configs.forEach(config => {
      // Convert price from cents to dollars
      const priceInDollars = (Number(config.price) / 100).toFixed(2);
      
      // Add plan name and price as a full-width button that shows details
      buttons.push([
        Markup.button.callback(
          `${config.name} - $${priceInDollars}`,
          `view_${config.id}`
        )
      ]);
      
      // Add two buttons side by side - View Details and Buy
      buttons.push([
        Markup.button.callback('ℹ️ View Details', `view_${config.id}`),
        Markup.button.callback('💳 Buy Now', `buy_${config.id}`)
      ]);
    });
    
    return Markup.inlineKeyboard(buttons);
  } catch (error) {
    console.error('Error generating config keyboard:', error);
    return Markup.inlineKeyboard([
      [Markup.button.callback('Error loading plans', 'error_plans')]
    ]);
  }
}

/**
 * Get detailed plan message with pricing info
 * @param {string} configId - Plan ID to get details for
 * @returns {Promise<{text: string, keyboard: Object}>} - Message text and keyboard
 */
async function getPlanDetails(configId) {
  try {
    const plan = await getConfigById(configId);
    
    if (!plan) {
      return {
        text: 'Plan not found. Please try another option.',
        keyboard: await getConfigKeyboard()
      };
    }
    
    // Convert price from cents to dollars
    const priceInDollars = (Number(plan.price) / 100).toFixed(2);
    
    // Create details message
    const detailsText = `📋 VPN Plan Details

🔒 Name: ${plan.name}
💰 Price: $${priceInDollars}
📝 Description: ${plan.details || 'No additional details available.'}
${plan.locations && plan.locations.length > 0 ? `📍 Locations: ${plan.locations.join(', ')}` : ''}

To purchase this plan, click the button below:`;

    // Create keyboard with purchase button and back button
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('💳 Purchase This Plan', `buy_${plan.id}`)],
      [Markup.button.callback('« Back to All Plans', 'show_plans')]
    ]);
    
    return { text: detailsText, keyboard };
  } catch (error) {
    console.error('Error getting plan details:', error);
    return {
      text: 'Sorry, there was an error loading the plan details. Please try again.',
      keyboard: Markup.inlineKeyboard([
        [Markup.button.callback('« Back to All Plans', 'show_plans')]
      ])
    };
  }
}

module.exports = {
  getConfigById,
  getConfigKeyboard,
  getAllConfigs,
  getPlanDetails
};
