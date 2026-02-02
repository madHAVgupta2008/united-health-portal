-- Create enum types
CREATE TYPE bill_status AS ENUM ('pending', 'paid', 'processing', 'denied');
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE message_sender AS ENUM ('user', 'bot');

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    address TEXT,
    date_of_birth DATE,
    member_id TEXT UNIQUE NOT NULL,
    plan_type TEXT DEFAULT 'Standard',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hospital_bills table
CREATE TABLE hospital_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    hospital_name TEXT NOT NULL,
    bill_date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status bill_status DEFAULT 'pending',
    description TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create insurance_documents table
CREATE TABLE insurance_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    status document_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sender message_sender NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_hospital_bills_user_id ON hospital_bills(user_id);
CREATE INDEX idx_hospital_bills_status ON hospital_bills(status);
CREATE INDEX idx_insurance_documents_user_id ON insurance_documents(user_id);
CREATE INDEX idx_insurance_documents_status ON insurance_documents(status);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospital_bills_updated_at
    BEFORE UPDATE ON hospital_bills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_documents_updated_at
    BEFORE UPDATE ON insurance_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
