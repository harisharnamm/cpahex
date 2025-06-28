/*
  # CPA Platform Database Schema

  1. New Tables
    - `clients` - Store client information and tax details
    - `documents` - Store uploaded documents with metadata
    - `vendors` - Track vendor information and W-9 status
    - `irs_notices` - Store IRS notices and AI analysis
    - `chat_messages` - Store deduction chat conversations
    - `tasks` - Track tasks and deadlines
    - `ai_insights` - Store AI-generated insights and recommendations

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Ensure proper data isolation between users

  3. Features
    - Full-text search capabilities
    - Automatic timestamp management
    - Foreign key relationships
    - Proper indexing for performance
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  tax_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  tax_id text,
  entity_type text DEFAULT 'individual' CHECK (entity_type IN ('individual', 'llc', 'corporation', 's_corp', 'partnership')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('w2', '1099', 'receipt', 'bank_statement', 'irs_notice', 'w9', 'invoice', 'other')),
  storage_path text NOT NULL,
  ocr_text text,
  ai_summary text,
  tags text[],
  is_processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  tax_id text,
  w9_status text DEFAULT 'missing' CHECK (w9_status IN ('missing', 'pending', 'completed', 'expired')),
  w9_document_id uuid REFERENCES documents(id),
  total_paid numeric(12,2) DEFAULT 0,
  requires_1099 boolean DEFAULT false,
  last_contact_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create IRS notices table
CREATE TABLE IF NOT EXISTS irs_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  notice_type text NOT NULL,
  notice_number text,
  tax_year integer,
  amount_owed numeric(12,2),
  deadline_date timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'appealed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  ai_summary text,
  ai_recommendations text,
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  context_documents uuid[],
  ai_model text,
  tokens_used integer,
  created_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  task_type text DEFAULT 'general' CHECK (task_type IN ('general', 'deadline', 'follow_up', 'review', 'filing')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date timestamptz,
  completed_at timestamptz,
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create AI insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  insight_type text NOT NULL CHECK (insight_type IN ('deduction', 'compliance', 'optimization', 'risk', 'opportunity')),
  title text NOT NULL,
  description text NOT NULL,
  confidence_score numeric(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  potential_savings numeric(12,2),
  status text DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'applied', 'dismissed')),
  source_documents uuid[],
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment transactions table for vendor tracking
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  payment_date date NOT NULL,
  description text,
  category text,
  is_deductible boolean DEFAULT true,
  document_id uuid REFERENCES documents(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE irs_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients
CREATE POLICY "Users can manage own clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for documents
CREATE POLICY "Users can manage own documents"
  ON documents
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for vendors
CREATE POLICY "Users can manage own vendors"
  ON vendors
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for IRS notices
CREATE POLICY "Users can manage own irs_notices"
  ON irs_notices
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for chat messages
CREATE POLICY "Users can manage own chat_messages"
  ON chat_messages
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for tasks
CREATE POLICY "Users can manage own tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for AI insights
CREATE POLICY "Users can manage own ai_insights"
  ON ai_insights
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for payment transactions
CREATE POLICY "Users can manage own payment_transactions"
  ON payment_transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_tax_year ON clients(tax_year);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_client_id ON vendors(client_id);
CREATE INDEX IF NOT EXISTS idx_vendors_w9_status ON vendors(w9_status);

CREATE INDEX IF NOT EXISTS idx_irs_notices_user_id ON irs_notices(user_id);
CREATE INDEX IF NOT EXISTS idx_irs_notices_client_id ON irs_notices(client_id);
CREATE INDEX IF NOT EXISTS idx_irs_notices_status ON irs_notices(status);
CREATE INDEX IF NOT EXISTS idx_irs_notices_deadline ON irs_notices(deadline_date);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_client_id ON chat_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_client_id ON ai_insights(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_status ON ai_insights(status);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_client_id ON payment_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_vendor_id ON payment_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions(payment_date);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_documents_ocr_text_fts ON documents USING gin(to_tsvector('english', ocr_text));
CREATE INDEX IF NOT EXISTS idx_clients_name_fts ON clients USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_vendors_name_fts ON vendors USING gin(to_tsvector('english', name));

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_irs_notices_updated_at
  BEFORE UPDATE ON irs_notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_insights_updated_at
  BEFORE UPDATE ON ai_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update vendor totals
CREATE OR REPLACE FUNCTION update_vendor_total()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE vendors 
    SET total_paid = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM payment_transactions 
      WHERE vendor_id = NEW.vendor_id
    ),
    requires_1099 = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM payment_transactions 
      WHERE vendor_id = NEW.vendor_id
    ) >= 600
    WHERE id = NEW.vendor_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE vendors 
    SET total_paid = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM payment_transactions 
      WHERE vendor_id = OLD.vendor_id
    ),
    requires_1099 = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM payment_transactions 
      WHERE vendor_id = OLD.vendor_id
    ) >= 600
    WHERE id = OLD.vendor_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vendor total updates
CREATE TRIGGER update_vendor_total_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_vendor_total();

-- Create function to generate AI insights based on data patterns
CREATE OR REPLACE FUNCTION generate_ai_insights()
RETURNS void AS $$
BEGIN
  -- Insert insights for vendors requiring 1099s
  INSERT INTO ai_insights (user_id, client_id, insight_type, title, description, confidence_score, source_documents)
  SELECT DISTINCT 
    v.user_id,
    v.client_id,
    'compliance',
    'Vendor requires 1099-NEC form',
    'Vendor ' || v.name || ' has received $' || v.total_paid || ' and requires a 1099-NEC form.',
    0.95,
    ARRAY[]::uuid[]
  FROM vendors v
  WHERE v.requires_1099 = true 
    AND v.w9_status != 'completed'
    AND NOT EXISTS (
      SELECT 1 FROM ai_insights ai 
      WHERE ai.client_id = v.client_id 
        AND ai.insight_type = 'compliance'
        AND ai.title LIKE '%1099-NEC%'
        AND ai.status != 'dismissed'
    );
END;
$$ LANGUAGE plpgsql;