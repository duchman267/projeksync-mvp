-- Row Level Security (RLS) Policies for ProjekSync MVP
-- These policies ensure users can only access their own data

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view and update their own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- Clients policies
CREATE POLICY "Users can manage their own clients" ON clients
  FOR ALL USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Users can manage their own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Milestones policies (users can access milestones for their projects)
CREATE POLICY "Users can manage milestones for their projects" ON milestones
  FOR ALL USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = milestones.project_id AND projects.user_id = auth.uid()
  ));

-- Timesheets policies
CREATE POLICY "Users can manage their own timesheets" ON timesheets
  FOR ALL USING (auth.uid() = user_id);

-- Invoices policies
CREATE POLICY "Users can manage their own invoices" ON invoices
  FOR ALL USING (auth.uid() = user_id);

-- Invoice items policies (users can access items for their invoices)
CREATE POLICY "Users can manage invoice items for their invoices" ON invoice_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()
  ));

-- Contracts policies
CREATE POLICY "Users can manage their own contracts" ON contracts
  FOR ALL USING (auth.uid() = user_id);

-- Expenses policies
CREATE POLICY "Users can manage their own expenses" ON expenses
  FOR ALL USING (auth.uid() = user_id);

-- Project messages policies (users can access messages for their projects)
CREATE POLICY "Users can manage messages for their projects" ON project_messages
  FOR ALL USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_messages.project_id AND projects.user_id = auth.uid()
  ));

-- Project files policies (users can access files for their projects)
CREATE POLICY "Users can manage files for their projects" ON project_files
  FOR ALL USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_files.project_id AND projects.user_id = auth.uid()
  ));

-- Proposals policies
CREATE POLICY "Users can manage their own proposals" ON proposals
  FOR ALL USING (auth.uid() = user_id);

-- Proposal items policies (users can access items for their proposals)
CREATE POLICY "Users can manage proposal items for their proposals" ON proposal_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM proposals WHERE proposals.id = proposal_items.proposal_id AND proposals.user_id = auth.uid()
  ));

-- Documents policies
CREATE POLICY "Users can manage their own documents" ON documents
  FOR ALL USING (auth.uid() = user_id);

-- Calendar events policies
CREATE POLICY "Users can manage their own calendar events" ON calendar_events
  FOR ALL USING (auth.uid() = user_id);

-- Special policy for shared documents (allow access via share_token)
CREATE POLICY "Allow access to shared documents via token" ON documents
  FOR SELECT USING (
    share_token IS NOT NULL 
    AND share_expires_at > NOW()
    AND current_setting('request.jwt.claims', true)::json->>'share_token' = share_token
  );

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON timesheets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();