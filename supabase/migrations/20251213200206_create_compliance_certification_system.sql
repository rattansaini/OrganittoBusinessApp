/*
  # Create Compliance & Certification Management System

  1. New Tables
    - `licenses`
      - `id` (uuid, primary key)
      - `license_type` (text) - FSSAI, Ayush, GMP, Trade, GST, Organic, Pollution Control, Fire Safety, Drug License, Other
      - `license_number` (text) - License/certificate number
      - `issued_to` (text) - Business name
      - `issuing_authority` (text) - Authority that issued license
      - `issue_date` (date) - When license was issued
      - `expiry_date` (date, nullable) - When license expires (null for no expiry)
      - `renewal_reminder_days` (integer) - Days before expiry to send reminder
      - `scope` (text) - What license covers
      - `status` (text) - active, pending, renewal_in_process, expired
      - `document_url` (text) - Main license document
      - `reminder_email` (boolean) - Send email reminders
      - `reminder_push` (boolean) - Send push notifications
      - `notes` (text)
      - `created_by` (uuid)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `license_documents`
      - `id` (uuid, primary key)
      - `license_id` (uuid, foreign key)
      - `file_name` (text)
      - `file_url` (text)
      - `category` (text) - original, renewal, application, receipt, correspondence, inspection, compliance
      - `uploaded_by` (uuid)
      - `uploaded_at` (timestamptz)

    - `license_renewals`
      - `id` (uuid, primary key)
      - `license_id` (uuid, foreign key)
      - `renewal_date` (date) - When renewal was processed
      - `previous_expiry` (date) - Old expiry date
      - `new_expiry` (date) - New expiry date
      - `cost` (numeric) - Renewal cost
      - `processed_by` (uuid)
      - `notes` (text)
      - `certificate_url` (text) - New certificate
      - `created_at` (timestamptz)

    - `inspections`
      - `id` (uuid, primary key)
      - `license_id` (uuid, foreign key, nullable) - Related license if applicable
      - `inspection_date` (date)
      - `inspection_type` (text) - routine, surprise, renewal, complaint_based
      - `inspector_name` (text)
      - `inspector_id` (text) - Inspector's ID number
      - `authority` (text) - FSSAI, Ayush, Pollution Control, etc.
      - `report_url` (text) - Inspection report document
      - `findings` (text) - Observations and findings
      - `compliance_status` (text) - pass, conditional, fail
      - `follow_up_date` (date, nullable) - If follow-up required
      - `resolution_status` (text) - open, in_progress, resolved
      - `recorded_by` (uuid)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `compliance_checklist`
      - `id` (uuid, primary key)
      - `license_id` (uuid, foreign key)
      - `checklist_item` (text) - Requirement description
      - `completed` (boolean) - Whether item is completed
      - `last_verified_date` (date, nullable)
      - `verified_by` (uuid, nullable)
      - `notes` (text)
      - `proof_url` (text) - Supporting document/photo
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `corrective_actions`
      - `id` (uuid, primary key)
      - `inspection_id` (uuid, foreign key)
      - `issue_description` (text)
      - `severity` (text) - low, medium, high, critical
      - `assigned_to` (uuid, nullable)
      - `due_date` (date)
      - `status` (text) - open, in_progress, resolved
      - `resolution_notes` (text)
      - `verified_date` (date, nullable)
      - `verified_by` (uuid, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all compliance tables
    - Add policies for authenticated users
*/

-- Create licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_type text NOT NULL,
  license_number text NOT NULL,
  issued_to text NOT NULL,
  issuing_authority text NOT NULL,
  issue_date date NOT NULL,
  expiry_date date,
  renewal_reminder_days integer DEFAULT 30,
  scope text,
  status text DEFAULT 'active',
  document_url text,
  reminder_email boolean DEFAULT true,
  reminder_push boolean DEFAULT true,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create license_documents table
CREATE TABLE IF NOT EXISTS license_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid REFERENCES licenses(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  category text NOT NULL,
  uploaded_by uuid,
  uploaded_at timestamptz DEFAULT now()
);

-- Create license_renewals table
CREATE TABLE IF NOT EXISTS license_renewals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid REFERENCES licenses(id) ON DELETE CASCADE NOT NULL,
  renewal_date date NOT NULL,
  previous_expiry date NOT NULL,
  new_expiry date NOT NULL,
  cost numeric,
  processed_by uuid,
  notes text,
  certificate_url text,
  created_at timestamptz DEFAULT now()
);

-- Create inspections table
CREATE TABLE IF NOT EXISTS inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid REFERENCES licenses(id) ON DELETE SET NULL,
  inspection_date date NOT NULL,
  inspection_type text NOT NULL,
  inspector_name text NOT NULL,
  inspector_id text,
  authority text NOT NULL,
  report_url text,
  findings text,
  compliance_status text NOT NULL,
  follow_up_date date,
  resolution_status text DEFAULT 'open',
  recorded_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create compliance_checklist table
CREATE TABLE IF NOT EXISTS compliance_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid REFERENCES licenses(id) ON DELETE CASCADE NOT NULL,
  checklist_item text NOT NULL,
  completed boolean DEFAULT false,
  last_verified_date date,
  verified_by uuid,
  notes text,
  proof_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create corrective_actions table
CREATE TABLE IF NOT EXISTS corrective_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid REFERENCES inspections(id) ON DELETE CASCADE NOT NULL,
  issue_description text NOT NULL,
  severity text NOT NULL,
  assigned_to uuid,
  due_date date NOT NULL,
  status text DEFAULT 'open',
  resolution_notes text,
  verified_date date,
  verified_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_actions ENABLE ROW LEVEL SECURITY;

-- Policies for licenses
CREATE POLICY "Users can view licenses"
  ON licenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create licenses"
  ON licenses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update licenses"
  ON licenses FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete licenses"
  ON licenses FOR DELETE
  TO authenticated
  USING (true);

-- Policies for license_documents
CREATE POLICY "Users can view license documents"
  ON license_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create license documents"
  ON license_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete license documents"
  ON license_documents FOR DELETE
  TO authenticated
  USING (true);

-- Policies for license_renewals
CREATE POLICY "Users can view license renewals"
  ON license_renewals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create license renewals"
  ON license_renewals FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for inspections
CREATE POLICY "Users can view inspections"
  ON inspections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create inspections"
  ON inspections FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update inspections"
  ON inspections FOR UPDATE
  TO authenticated
  USING (true);

-- Policies for compliance_checklist
CREATE POLICY "Users can view compliance checklist"
  ON compliance_checklist FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create compliance checklist"
  ON compliance_checklist FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update compliance checklist"
  ON compliance_checklist FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete compliance checklist"
  ON compliance_checklist FOR DELETE
  TO authenticated
  USING (true);

-- Policies for corrective_actions
CREATE POLICY "Users can view corrective actions"
  ON corrective_actions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create corrective actions"
  ON corrective_actions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update corrective actions"
  ON corrective_actions FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_licenses_type ON licenses(license_type);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expiry_date ON licenses(expiry_date);
CREATE INDEX IF NOT EXISTS idx_license_documents_license_id ON license_documents(license_id);
CREATE INDEX IF NOT EXISTS idx_license_renewals_license_id ON license_renewals(license_id);
CREATE INDEX IF NOT EXISTS idx_inspections_license_id ON inspections(license_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_compliance_checklist_license_id ON compliance_checklist(license_id);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_inspection_id ON corrective_actions(inspection_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_licenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_licenses_updated_at_trigger
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_licenses_updated_at();

CREATE TRIGGER update_inspections_updated_at_trigger
  BEFORE UPDATE ON inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_licenses_updated_at();

CREATE TRIGGER update_compliance_checklist_updated_at_trigger
  BEFORE UPDATE ON compliance_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_licenses_updated_at();

CREATE TRIGGER update_corrective_actions_updated_at_trigger
  BEFORE UPDATE ON corrective_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_licenses_updated_at();

-- Function to automatically update license status based on expiry
CREATE OR REPLACE FUNCTION update_license_status_on_expiry()
RETURNS void AS $$
BEGIN
  UPDATE licenses
  SET status = 'expired'
  WHERE expiry_date < CURRENT_DATE
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Create view for license summary with expiry calculations
CREATE OR REPLACE VIEW license_summary AS
SELECT 
  l.id,
  l.license_type,
  l.license_number,
  l.issued_to,
  l.issuing_authority,
  l.issue_date,
  l.expiry_date,
  l.renewal_reminder_days,
  l.status,
  l.document_url,
  CASE 
    WHEN l.expiry_date IS NULL THEN NULL
    ELSE l.expiry_date - CURRENT_DATE
  END as days_until_expiry,
  CASE 
    WHEN l.expiry_date IS NULL THEN 'no_expiry'
    WHEN l.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN l.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'critical'
    WHEN l.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    WHEN l.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'renewal_due'
    ELSE 'active'
  END as expiry_status,
  (SELECT COUNT(*) FROM compliance_checklist cc WHERE cc.license_id = l.id) as total_checklist_items,
  (SELECT COUNT(*) FROM compliance_checklist cc WHERE cc.license_id = l.id AND cc.completed = true) as completed_checklist_items,
  (SELECT COUNT(*) FROM inspections i WHERE i.license_id = l.id) as inspection_count,
  (SELECT MAX(i.inspection_date) FROM inspections i WHERE i.license_id = l.id) as last_inspection_date
FROM licenses l;
