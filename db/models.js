const supabase = require('./supabaseClient');

/**
 * Database operations for VPN plans
 */
const configsModel = {
  /**
   * Get all VPN plans
   * @returns {Promise} - Array of VPN plans
   */
  async getAllConfigs() {
    const { data, error } = await supabase
      .from('vpn_plans')
      .select('*')
      .order('price', { ascending: true });
      
    if (error) {
      console.error('Error fetching all configs:', error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Get VPN plan by ID
   * @param {string} configId - Plan ID
   * @returns {Promise} - VPN plan data
   */
  async getConfigById(configId) {
    const { data, error } = await supabase
      .from('vpn_plans')
      .select('*')
      .eq('id', configId)
      .single();
      
    if (error) {
      console.error('Error fetching config by ID:', error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Create a new VPN plan
   * @param {Object} configData - Plan data
   * @returns {Promise} - Created plan
   */
  async createConfig(configData) {
    const { data, error } = await supabase
      .from('vpn_plans')
      .insert([configData])
      .select();
      
    if (error) {
      console.error('Error creating config:', error);
      throw error;
    }
    
    return data[0];
  },
  
  /**
   * Update a VPN plan
   * @param {string} configId - Plan ID
   * @param {Object} configData - Updated plan data
   * @returns {Promise} - Updated plan
   */
  async updateConfig(configId, configData) {
    const { data, error } = await supabase
      .from('vpn_plans')
      .update(configData)
      .eq('id', configId)
      .select();
      
    if (error) {
      console.error('Error updating config:', error);
      throw error;
    }
    
    return data[0];
  }
};

/**
 * Database operations for orders
 */
const ordersModel = {
  /**
   * Create a new order in the database
   * @param {Object} orderData - Order data to insert
   * @returns {Promise} - Supabase response
   */
  async createOrder(orderData) {
    // Make sure orderData keys match the database column names
    const dbOrderData = {
      id: orderData.id,
      userid: orderData.user_id || orderData.userid,
      username: orderData.username,
      configid: orderData.config_id || orderData.configid,
      configname: orderData.config_name || orderData.configname,
      configdetails: orderData.config_details || orderData.configdetails,
      price: orderData.price,
      status: orderData.status || 'pending',
      createdat: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([dbOrderData])
      .select();
    
    if (error) {
      console.error('Error creating order:', error);
      throw error;
    }
    
    return data[0];
  },
  
  /**
   * Get orders by user ID
   * @param {string} userId - Telegram user ID
   * @returns {Promise} - Array of orders
   */
  async getOrdersByUser(userId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('userid', userId)
      .order('createdat', { ascending: false });
      
    if (error) {
      console.error('Error fetching orders by user:', error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise} - Order data
   */
  async getOrderById(orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
      
    if (error) {
      console.error('Error fetching order by ID:', error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Get order by reference ID
   * @param {string} referenceId - Order reference ID
   * @returns {Promise} - Order data
   */
  async getOrderByReferenceId(referenceId) {
    // Since we're using id itself as reference, we'll search by id
    return this.getOrderById(referenceId);
  },
  
  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   * @returns {Promise} - Updated order
   */
  async updateOrderStatus(orderId, status) {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        createdat: new Date().toISOString() // Using createdat as updated_at
      })
      .eq('id', orderId)
      .select();
      
    if (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
    
    return data[0];
  },
  
  /**
   * Update payment status
   * @param {string} orderId - Order ID
   * @param {string} paymentStatus - New payment status
   * @param {string} paymentId - Payment ID or reference
   * @returns {Promise} - Updated order
   */
  async updatePaymentStatus(orderId, paymentStatus, paymentId = null) {
    // Since we don't have payment_status column, we'll update the status column
    const updateData = { 
      status: `paid:${paymentStatus}`,
      createdat: new Date().toISOString() // Using createdat as updated_at
    };
    
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select();
      
    if (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
    
    return data[0];
  }
};

module.exports = {
  ordersModel,
  configsModel
};
