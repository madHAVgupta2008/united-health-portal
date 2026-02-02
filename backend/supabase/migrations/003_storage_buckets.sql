-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('hospital-bills', 'hospital-bills', false),
    ('insurance-documents', 'insurance-documents', false);

-- Storage policies for hospital-bills bucket
CREATE POLICY "Users can upload their own hospital bills"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'hospital-bills' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own hospital bills"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'hospital-bills' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own hospital bills"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'hospital-bills' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own hospital bills"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'hospital-bills' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for insurance-documents bucket
CREATE POLICY "Users can upload their own insurance documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'insurance-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own insurance documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'insurance-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own insurance documents"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'insurance-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own insurance documents"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'insurance-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
