const { ordersModel } = require('../db/models');
const { getConfigById } = require('./configHandler');

/**
 * Handle VPN configuration order
 * @param {Object} ctx - Telegram context
 * @param {string} configId - VPN configuration ID
 * @returns {Promise} - Telegram response
 */
async function handleOrder(ctx, configId) {
  try {
    const plan = await getConfigById(configId);
    
    if (!plan) {
      return await ctx.reply('VPN plan not found.');
    }

    // Get details from plan
    const planDetails = plan.details || 'VPN Plan';
    const planPrice = Number(plan.price) / 100; // Converting from cents to dollars

    // Prepare order details message
    const orderDetails = `📦 Order Details:
    
Name: ${plan.name}
Details: ${planDetails}
Price: $${planPrice.toFixed(2)}

To complete your order, please send the payment to:
[Your Payment Details Here]

After payment, send a screenshot of the payment to confirm your order.`;

    // Create order in database
    // Generate a unique ID that we'll use as our reference ID too
    const orderId = `ORDER-${Date.now().toString().slice(-6)}`;
    const orderData = {
      id: orderId, // This will be our primary key and reference
      userid: ctx.from.id.toString(),
      username: ctx.from.username || ctx.from.first_name || 'Unknown',
      configid: plan.id,
      configname: plan.name,
      configdetails: planDetails,
      price: plan.price,
      status: 'pending'
      // createdat is handled in the model
    };

    await ordersModel.createOrder(orderData);

    // Notify admin
    const adminId = process.env.ADMIN_ID;
    if (adminId) {
      const adminMessage = `🔔 New Order:
Reference: ${orderId}
User: @${ctx.from.username || 'Unknown'} (${ctx.from.id})
Product: ${plan.name}
Price: $${planPrice.toFixed(2)}`;

      try {
        await ctx.telegram.sendMessage(adminId, adminMessage);
      } catch (error) {
        console.error('Failed to notify admin:', error);
      }
    }

    // Send order details to user
    return await ctx.reply(orderDetails);
  } catch (error) {
    console.error('Error handling order:', error);
    return ctx.reply('Sorry, there was an error processing your order. Please try again later.');
  }
}

/**
 * Get user orders
 * @param {Object} ctx - Telegram context
 * @returns {Promise} - Telegram response
 */
async function getUserOrders(ctx) {
  try {
    const userId = ctx.from.id.toString();
    const orders = await ordersModel.getOrdersByUser(userId);
    
    if (!orders || orders.length === 0) {
      return ctx.reply('You have no orders yet.');
    }

    // For each order, get the config details if needed
    const ordersMessage = await Promise.all(orders.map(async (order) => {
      let configName = order.configname || 'Unknown Plan';
      let price = order.price || 0;
      let configPrice = `$${(Number(price) / 100).toFixed(2)}`;
      
      // Try to get config details if we don't have them in the order
      if (!configName && order.configid) {
        try {
          const plan = await getConfigById(order.configid);
          if (plan) {
            configName = plan.name;
            configPrice = `$${(Number(plan.price) / 100).toFixed(2)}`;
          }
        } catch (err) {
          console.error('Error fetching plan details for order:', err);
        }
      }
      
      // Use the order ID as reference
      const status = order.status || 'pending';
      const date = new Date(order.createdat).toLocaleDateString();
      
      return `🔹 Order: ${order.id}
Product: ${configName}
Price: ${configPrice}
Status: ${status}
Date: ${date}`;
    }));
    
    return ctx.reply(`Your Orders:\n\n${ordersMessage.join('\n\n')}`);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return ctx.reply('Sorry, there was an error retrieving your orders. Please try again later.');
  }
}

module.exports = {
  handleOrder,
  getUserOrders
};
