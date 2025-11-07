-- Create patient_documents table for storing patient document metadata
CREATE TABLE IF NOT EXISTS patient_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  document_type VARCHAR(50) DEFAULT 'other',
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  file_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id ON patient_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_created_at ON patient_documents(created_at DESC);

-- Add RLS policies
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view documents for their assigned patients
CREATE POLICY patient_documents_select ON patient_documents
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'doctor', 'nurse', 'receptionist')
    )
  );

-- Policy: Authenticated users can upload documents
CREATE POLICY patient_documents_insert ON patient_documents
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'doctor', 'nurse', 'receptionist')
    )
  );

-- Policy: Admin and doctors can delete documents
CREATE POLICY patient_documents_delete ON patient_documents
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'doctor')
    )
  );

-- Create storage bucket for patient documents (if not exists)
-- This needs to be run in Supabase dashboard or via Supabase client
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('patient-documents', 'patient-documents', true)
-- ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE patient_documents IS 'Stores metadata for patient documents uploaded to Supabase Storage';
COMMENT ON COLUMN patient_documents.document_type IS 'Type of document: lab_result, x_ray, prescription, other';
COMMENT ON COLUMN patient_documents.file_path IS 'Path in Supabase Storage';
COMMENT ON COLUMN patient_documents.file_url IS 'Public URL to access the document';
