-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create components table
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  version TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_components_product_id ON components(product_id);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;

-- Create policies (allow authenticated users to read/write)
CREATE POLICY "Allow authenticated users to read products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read components"
  ON components FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert components"
  ON components FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update components"
  ON components FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete components"
  ON components FOR DELETE
  TO authenticated
  USING (true);

