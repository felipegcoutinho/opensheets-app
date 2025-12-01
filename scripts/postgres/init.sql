-- Script de inicialização do PostgreSQL para Docker
-- Este script é executado automaticamente quando o banco é criado pela primeira vez

-- Habilitar extensão pgcrypto (necessária para gen_random_bytes usado pelo Drizzle)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Extensão pgcrypto habilitada com sucesso';
END $$;
