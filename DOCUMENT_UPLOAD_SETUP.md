# Patient Document Upload System

## Overview
This system allows doctors, nurses, and other authorized staff to upload and manage patient documents (lab results, X-rays, prescriptions, etc.) using Supabase Storage.

## Setup Instructions

### 1. Run Database Migration
Execute the migration file to create the `patient_documents` table:

```bash
cd backend
psql -h [YOUR_SUPABASE_HOST] -U postgres -d postgres -f database/migrations/004_create_patient_documents_table.sql
```

Or run it directly in Supabase SQL Editor.

### 2. Create Supabase Storage Bucket
In your Supabase Dashboard:
1. Go to **Storage**
2. Click **Create Bucket**
3. Name: `patient-documents`
4. Make it **Public** (for easier access) or configure proper policies
5. Click **Create**

### 3. Configure Storage Policies (Optional)
If you want more control over who can access documents, add custom storage policies in Supabase Dashboard:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patient-documents');

-- Allow authenticated users to read documents
CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'patient-documents');

-- Allow admins and doctors to delete
CREATE POLICY "Admins and doctors can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'patient-documents' 
  AND auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'doctor')
  )
);
```

### 4. Supported File Types
The system accepts the following file types:
- PDF (.pdf)
- Images (.jpg, .jpeg, .png)
- Documents (.doc, .docx)
- DICOM (.dicom)

### 5. File Size Limit
Maximum file size: **10MB** (configurable in `backend/src/config/app.config.js`)

## Usage

### Upload Documents (Doctor/Nurse View)
1. Navigate to Patient Medical Records
2. Select a patient
3. Go to "Files & Images" tab
4. Click the upload button
5. Select one or multiple files
6. Files will be uploaded and associated with the patient

### View Documents
Documents are displayed in the "Files & Images" tab with:
- File name
- File type
- File size
- Upload date
- Uploader name

### Delete Documents (Doctor/Admin only)
Click the delete button on any document card to remove it from the system.

## API Endpoints

### Upload Document
```
POST /api/documents/upload
Headers: Authorization: Bearer <token>
Body (multipart/form-data):
  - document: File
  - patient_id: UUID
  - document_type: string (optional)
  - file_name: string (optional)
```

### Get Patient Documents
```
GET /api/documents/patient/:patientId
Headers: Authorization: Bearer <token>
```

### Delete Document
```
DELETE /api/documents/:documentId
Headers: Authorization: Bearer <token>
Role: Admin or Doctor only
```

## Troubleshooting

### Upload Fails
- Check that the Supabase storage bucket exists
- Verify file type is supported
- Ensure file size is under 10MB
- Check backend logs for detailed error messages

### Documents Not Showing
- Verify the patient_documents table exists
- Check RLS policies are correctly set
- Ensure the user has proper permissions

### Storage Access Denied
- Check storage bucket policies in Supabase
- Verify bucket is public or has correct policies
- Check user authentication token

## Security Considerations
- Files are stored with UUID-based names to prevent conflicts
- Access is controlled through RLS policies
- Only authenticated users can upload/view documents
- Only admins and doctors can delete documents
- File type validation prevents malicious uploads
