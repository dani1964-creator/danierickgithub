-- Tabela para gerenciar zonas DNS no Digital Ocean
CREATE TABLE IF NOT EXISTS dns_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, verifying, active, failed
  nameservers TEXT[], -- Nameservers do Digital Ocean
  verification_attempts INT DEFAULT 0,
  last_verification_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para registros DNS gerenciados pelo cliente
CREATE TABLE IF NOT EXISTS dns_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES dns_zones(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL, -- A, CNAME, MX, TXT, etc
  name TEXT NOT NULL, -- @ ou subdomínio
  value TEXT NOT NULL,
  priority INT, -- Para MX records
  ttl INT DEFAULT 3600,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dns_zones_broker ON dns_zones(broker_id);
CREATE INDEX IF NOT EXISTS idx_dns_zones_domain ON dns_zones(domain);
CREATE INDEX IF NOT EXISTS idx_dns_zones_status ON dns_zones(status);
CREATE INDEX IF NOT EXISTS idx_dns_records_zone ON dns_records(zone_id);
CREATE INDEX IF NOT EXISTS idx_dns_records_type ON dns_records(record_type);

-- RLS Policies
ALTER TABLE dns_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE dns_records ENABLE ROW LEVEL SECURITY;

-- Brokers podem ver suas próprias zonas
CREATE POLICY "Brokers podem ver suas zonas" ON dns_zones
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM brokers WHERE id = dns_zones.broker_id)
  );

-- Brokers podem criar zonas
CREATE POLICY "Brokers podem criar zonas" ON dns_zones
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM brokers WHERE id = dns_zones.broker_id)
  );

-- Brokers podem ver seus registros DNS
CREATE POLICY "Brokers podem ver seus registros" ON dns_records
  FOR SELECT USING (
    zone_id IN (
      SELECT id FROM dns_zones WHERE broker_id IN (
        SELECT id FROM brokers WHERE user_id = auth.uid()
      )
    )
  );

-- Brokers podem criar registros DNS
CREATE POLICY "Brokers podem criar registros" ON dns_records
  FOR INSERT WITH CHECK (
    zone_id IN (
      SELECT id FROM dns_zones WHERE broker_id IN (
        SELECT id FROM brokers WHERE user_id = auth.uid()
      )
    )
  );

-- Brokers podem deletar seus registros
CREATE POLICY "Brokers podem deletar registros" ON dns_records
  FOR DELETE USING (
    zone_id IN (
      SELECT id FROM dns_zones WHERE broker_id IN (
        SELECT id FROM brokers WHERE user_id = auth.uid()
      )
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_dns_zones_updated_at
  BEFORE UPDATE ON dns_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dns_records_updated_at
  BEFORE UPDATE ON dns_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE dns_zones IS 'Zonas DNS gerenciadas no Digital Ocean';
COMMENT ON TABLE dns_records IS 'Registros DNS customizados pelos clientes (MX, subdomínios, etc)';
COMMENT ON COLUMN dns_zones.status IS 'pending: aguardando nameservers, verifying: verificando, active: ativo, failed: falhou';
COMMENT ON COLUMN dns_zones.nameservers IS 'Nameservers do Digital Ocean que o cliente deve configurar';
