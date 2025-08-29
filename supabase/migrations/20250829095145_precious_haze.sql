-- CANNA Visit Report Application Database Schema
-- PostgreSQL Database Schema for Production Deployment

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and user management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'manager', 'admin')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    department VARCHAR(100),
    territory VARCHAR(100),
    phone VARCHAR(50),
    avatar_url TEXT,
    password_reset_required BOOLEAN DEFAULT false,
    last_password_reset TIMESTAMP,
    password_reset_by VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Customers table for shop/customer information
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_name VARCHAR(255) NOT NULL,
    shop_type VARCHAR(100) CHECK (shop_type IN ('growshop', 'garden_center', 'nursery', 'hydroponics_store', 'other')),
    shop_address TEXT,
    zipcode VARCHAR(20),
    city VARCHAR(100),
    county VARCHAR(100),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    job_title VARCHAR(100),
    region VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    gps_coordinates JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Shop visits table for visit reports
CREATE TABLE IF NOT EXISTS shop_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    shop_name VARCHAR(255) NOT NULL,
    shop_type VARCHAR(100),
    shop_address TEXT,
    zipcode VARCHAR(20),
    city VARCHAR(100),
    county VARCHAR(100),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    job_title VARCHAR(100),
    visit_date DATE NOT NULL,
    visit_duration INTEGER DEFAULT 60,
    visit_purpose VARCHAR(100) NOT NULL,
    product_visibility_score INTEGER DEFAULT 50 CHECK (product_visibility_score >= 0 AND product_visibility_score <= 100),
    products_discussed JSONB DEFAULT '[]',
    competitor_presence VARCHAR(100),
    training_provided BOOLEAN DEFAULT false,
    training_topics JSONB DEFAULT '[]',
    support_materials_required BOOLEAN DEFAULT false,
    support_materials_items JSONB DEFAULT '[]',
    support_materials_other_text TEXT,
    commercial_outcome VARCHAR(100),
    order_value DECIMAL(10,2) DEFAULT 0,
    overall_satisfaction INTEGER DEFAULT 5 CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 10),
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_notes TEXT,
    notes TEXT,
    visit_photos JSONB DEFAULT '[]',
    gps_coordinates JSONB,
    signature TEXT, -- Base64 signature data
    signature_signer_name VARCHAR(255),
    signature_date TIMESTAMP,
    calculated_score DECIMAL(5,2),
    priority_level VARCHAR(20) CHECK (priority_level IN ('low', 'medium', 'high')),
    is_draft BOOLEAN DEFAULT false,
    draft_saved_at TIMESTAMP,
    sales_data JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Configurations table for dropdown options and system settings
CREATE TABLE IF NOT EXISTS configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_type VARCHAR(100) NOT NULL,
    config_name VARCHAR(255) NOT NULL,
    config_value VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit logs table for tracking user actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES users(id),
    actor_email VARCHAR(255),
    target_user_id UUID,
    target_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_customers_shop_name ON customers(shop_name);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_shop_visits_customer_id ON shop_visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_shop_visits_visit_date ON shop_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_shop_visits_created_by ON shop_visits(created_by);
CREATE INDEX IF NOT EXISTS idx_shop_visits_is_draft ON shop_visits(is_draft);
CREATE INDEX IF NOT EXISTS idx_configurations_type ON configurations(config_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Insert default configurations
INSERT INTO configurations (config_type, config_name, config_value, display_order, is_active) VALUES
-- Visit purposes
('visit_purposes', 'Routine Check', 'routine_check', 1, true),
('visit_purposes', 'Training Session', 'training', 2, true),
('visit_purposes', 'Product Promotion', 'promotion', 3, true),
('visit_purposes', 'Complaint Resolution', 'complaint_resolution', 4, true),
('visit_purposes', 'New Products Introduction', 'new_products', 5, true),
('visit_purposes', 'Other', 'other', 6, true),

-- CANNA Products
('canna_products', 'CANNA Coco', 'canna_coco', 1, true),
('canna_products', 'CANNA Terra', 'canna_terra', 2, true),
('canna_products', 'CANNA Aqua', 'canna_aqua', 3, true),
('canna_products', 'CANNAZYM', 'cannazym', 4, true),
('canna_products', 'RHIZOTONIC', 'rhizotonic', 5, true),
('canna_products', 'PK 13/14', 'pk_13_14', 6, true),
('canna_products', 'BOOST Accelerator', 'boost_accelerator', 7, true),
('canna_products', 'CANNA Start', 'canna_start', 8, true),

-- Shop presentation options
('shop_presentation_options', 'Excellent', 'excellent', 1, true),
('shop_presentation_options', 'Good', 'good', 2, true),
('shop_presentation_options', 'Average', 'average', 3, true),
('shop_presentation_options', 'Poor', 'poor', 4, true),

-- Competitor presence levels
('competitor_presence', 'None - CANNA exclusive', 'none', 1, true),
('competitor_presence', 'Low - Minimal competition', 'low', 2, true),
('competitor_presence', 'Medium - Some competitors present', 'medium', 3, true),
('competitor_presence', 'High - Strong competition', 'high', 4, true)

ON CONFLICT DO NOTHING;

-- Create default admin user (password: admin123!)
INSERT INTO users (email, password_hash, full_name, role, status) VALUES
('admin@canna.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXwtGtrKxQ7u', 'System Administrator', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;