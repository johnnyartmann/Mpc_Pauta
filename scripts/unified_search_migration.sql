-- Search vector for processos table
ALTER TABLE processos ADD COLUMN IF NOT EXISTS search_vector tsvector;

DROP TRIGGER IF EXISTS trg_processos_search_vector ON processos;
DROP FUNCTION IF EXISTS processos_search_vector_update();

CREATE FUNCTION processos_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.numero_processo, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.assunto, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.interessados, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.relator, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.unidade_gestora, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_processos_search_vector
  BEFORE INSERT OR UPDATE ON processos
  FOR EACH ROW EXECUTE FUNCTION processos_search_vector_update();

CREATE INDEX IF NOT EXISTS idx_processos_search ON processos USING GIN(search_vector);
UPDATE processos SET id = id;

-- Search vector for diario_oficial table
ALTER TABLE diario_oficial ADD COLUMN IF NOT EXISTS search_vector tsvector;

DROP TRIGGER IF EXISTS trg_diario_oficial_search_vector ON diario_oficial;
DROP FUNCTION IF EXISTS diario_oficial_search_vector_update();

CREATE FUNCTION diario_oficial_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.numero_processo, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.parecer, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.assunto, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.interessados, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.conteudo_html, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.unidade_gestora, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.responsavel, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.relator, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.unidade_tecnica, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_diario_oficial_search_vector
  BEFORE INSERT OR UPDATE ON diario_oficial
  FOR EACH ROW EXECUTE FUNCTION diario_oficial_search_vector_update();

CREATE INDEX IF NOT EXISTS idx_diario_oficial_search ON diario_oficial USING GIN(search_vector);
UPDATE diario_oficial SET id = id;
