-- Create VPN Configurations Table
CREATE TABLE IF NOT EXISTS public.vpn_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  bandwidth_gb INTEGER,
  duration_days INTEGER NOT NULL,
  locations TEXT[],
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  config_id UUID REFERENCES public.vpn_configs(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
  payment_id VARCHAR(255),
  order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expiry_date TIMESTAMP WITH TIME ZONE,
  reference_id VARCHAR(100),
  user_username VARCHAR(255),
  user_first_name VARCHAR(255),
  user_last_name VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_vpn_configs_active ON public.vpn_configs(active);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_reference_id ON public.orders(reference_id);
CREATE INDEX IF NOT EXISTS idx_orders_config_id ON public.orders(config_id);

-- Sample Data for VPN Configurations
INSERT INTO public.vpn_configs (name, description, price, bandwidth_gb, duration_days, locations)
VALUES 
  ('Basic Plan', 'Basic VPN access with limited bandwidth', 5.99, 50, 30, ARRAY['US', 'UK']),
  ('Premium Plan', 'Premium VPN with higher bandwidth and more locations', 9.99, 200, 30, ARRAY['US', 'UK', 'Canada', 'Germany']),
  ('Ultimate Plan', 'Unlimited bandwidth with all available server locations', 19.99, NULL, 30, ARRAY['US', 'UK', 'Canada', 'Germany', 'Japan', 'Australia']);