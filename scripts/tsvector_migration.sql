-- Drop existing trigger/function if exists
DROP TRIGGER IF EXISTS trg_documentos_search_vector ON documentos;
DROP FUNCTION IF EXISTS documentos_search_vector_update();

-- Create function to update tsvector
CREATE FUNCTION documentos_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.parecer_mpc, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.ementa_voto, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.proposta_voto, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.decisao, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trg_documentos_search_vector
  BEFORE INSERT OR UPDATE ON documentos
  FOR EACH ROW EXECUTE FUNCTION documentos_search_vector_update();

-- Create GIN index
CREATE INDEX IF NOT EXISTS idx_documentos_search ON documentos USING GIN(search_vector);

-- Update existing documents to populate tsvector
UPDATE documentos SET id = id;
