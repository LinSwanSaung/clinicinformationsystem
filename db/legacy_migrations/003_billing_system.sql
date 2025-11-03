-- ===============================================
-- PURCHASING/BILLING SYSTEM - New Tables
-- Run this SQL in your Supabase SQL Editor
-- ===============================================

-- ===============================================
-- SERVICES TABLE
-- Available services that can be billed (consultations, procedures, tests, etc.)
-- ===============================================
CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_code VARCHAR(20) UNIQUE NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- consultation, procedure, laboratory, imaging, other
    default_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_category CHECK (category IN ('consultation', 'procedure', 'laboratory', 'imaging', 'pharmacy', 'other'))
);

-- ===============================================
-- INVOICES TABLE
-- Main invoice/bill for each visit
-- ===============================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Financial details
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'pending', -- pending, partial, paid, cancelled
    payment_method VARCHAR(50), -- cash, card, insurance, mobile_payment
    payment_notes TEXT,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_by UUID REFERENCES users(id), -- cashier who completed
    completed_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMPTZ,
    cancelled_reason TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_invoice_status CHECK (status IN ('pending', 'partial', 'paid', 'cancelled')),
    CONSTRAINT valid_payment_method CHECK (payment_method IN ('cash', 'card', 'insurance', 'mobile_payment', 'mixed'))
);

-- ===============================================
-- INVOICE ITEMS TABLE
-- Individual line items on an invoice (services, medicines, etc.)
-- ===============================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Item details
    item_type VARCHAR(20) NOT NULL, -- service, medicine, other
    item_id UUID, -- Reference to service_id or prescription_id
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    
    -- Pricing
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Metadata
    added_by UUID REFERENCES users(id), -- doctor or cashier who added
    added_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    
    CONSTRAINT valid_item_type CHECK (item_type IN ('service', 'medicine', 'other'))
);

-- ===============================================
-- PAYMENT TRANSACTIONS TABLE
-- Track individual payments made against an invoice
-- ===============================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Payment details
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(100), -- receipt number, transaction ID, etc.
    payment_notes TEXT,
    
    -- Audit
    received_by UUID REFERENCES users(id), -- cashier
    received_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_payment_method_tx CHECK (payment_method IN ('cash', 'card', 'insurance', 'mobile_payment'))
);

-- ===============================================
-- NOTE: Medicine Inventory - NOT IMPLEMENTED
-- Medicine prices will be manually entered by cashier
-- No inventory tracking per user requirement
-- ===============================================

-- ===============================================
-- INDEXES for Performance
-- ===============================================
CREATE INDEX idx_invoices_visit_id ON invoices(visit_id);
CREATE INDEX idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_payment_transactions_invoice_id ON payment_transactions(invoice_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_is_active ON services(is_active);

-- ===============================================
-- TRIGGERS for updated_at
-- ===============================================
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- FUNCTION: Auto-generate Invoice Number
-- ===============================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR;
    sequence_num INTEGER;
BEGIN
    -- Get the next sequence number for today
    SELECT COUNT(*) + 1 INTO sequence_num
    FROM invoices
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Format: INV-YYYYMMDD-0001
    new_number := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- TRIGGER: Auto-generate invoice number on insert
-- ===============================================
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- ===============================================
-- ENABLE ROW LEVEL SECURITY
-- ===============================================
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- RLS POLICIES (Allow all for authenticated users during development)
-- ===============================================
DROP POLICY IF EXISTS "Healthcare staff can access all data" ON services;
CREATE POLICY "Healthcare staff can access all data" ON services FOR ALL USING (true);

DROP POLICY IF EXISTS "Healthcare staff can access all data" ON invoices;
CREATE POLICY "Healthcare staff can access all data" ON invoices FOR ALL USING (true);

DROP POLICY IF EXISTS "Healthcare staff can access all data" ON invoice_items;
CREATE POLICY "Healthcare staff can access all data" ON invoice_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Healthcare staff can access all data" ON payment_transactions;
CREATE POLICY "Healthcare staff can access all data" ON payment_transactions FOR ALL USING (true);

-- ===============================================
-- SAMPLE DATA - Common Services
-- ===============================================
INSERT INTO services (service_code, service_name, description, category, default_price) VALUES
('CONS-GEN', 'General Consultation', 'General medical consultation with doctor', 'consultation', 50.00),
('CONS-SPEC', 'Specialist Consultation', 'Consultation with specialist doctor', 'consultation', 100.00),
('CONS-FOLL', 'Follow-up Consultation', 'Follow-up visit', 'consultation', 30.00),
('LAB-CBC', 'Complete Blood Count', 'CBC laboratory test', 'laboratory', 25.00),
('LAB-URIN', 'Urinalysis', 'Complete urinalysis', 'laboratory', 15.00),
('LAB-GLUC', 'Blood Glucose Test', 'Fasting blood glucose', 'laboratory', 20.00),
('IMG-XRAY', 'X-Ray', 'Digital X-Ray imaging', 'imaging', 75.00),
('PROC-INJ', 'Injection/IV', 'Medication injection or IV administration', 'procedure', 10.00),
('PROC-DRESS', 'Wound Dressing', 'Wound cleaning and dressing', 'procedure', 20.00),
('PROC-SUTUR', 'Suturing', 'Minor wound suturing', 'procedure', 50.00);

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================
-- Run these to verify the tables were created successfully:

-- Check services
-- SELECT * FROM services ORDER BY category, service_name;

-- Check table structure
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('services', 'invoices', 'invoice_items', 'payment_transactions')
-- ORDER BY table_name;
