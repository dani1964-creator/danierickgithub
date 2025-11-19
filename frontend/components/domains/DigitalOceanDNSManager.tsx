import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DNSZone {
  id: string;
  domain: string;
  status: 'pending' | 'verifying' | 'active' | 'failed';
  nameservers: string[];
  activated_at: string | null;
}

interface DNSRecord {
  id: string;
  record_type: string;
  name: string;
  value: string;
  priority: number | null;
  ttl: number;
}

interface Props {
  brokerId: string;
}

export function DigitalOceanDNSManager({ brokerId }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState<'input' | 'configuring' | 'waiting' | 'active'>('input');
  const [domain, setDomain] = useState('');
  const [zone, setZone] = useState<DNSZone | null>(null);
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [deleting, setDeleting] = useState(false);
  
  // Estado para adicionar novo registro
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [newRecord, setNewRecord] = useState({
    recordType: 'MX',
    name: '',
    value: '',
    priority: 10
  });

  const loadExistingZone = async () => {
    setLoadingInitial(true);
    try {
      const response = await fetch(`/api/domains/do-list-records?brokerId=${brokerId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.zone) {
          setZone(data.zone);
          setRecords(data.records || []);
          setStep(data.zone.status === 'active' ? 'active' : 'waiting');
        } else {
          // Não há zona configurada ainda
          setStep('input');
        }
      }
    } catch (error) {
      console.error('Error loading zone:', error);
      toast({
        title: 'Erro ao carregar domínio',
        description: 'Não foi possível carregar as configurações do domínio.',
        variant: 'destructive'
      });
    } finally {
      setLoadingInitial(false);
    }
  };

  // Carregar zona existente
  useEffect(() => {
    loadExistingZone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brokerId]);

  // Verificação automática a cada 5 minutos
  useEffect(() => {
    if (zone && zone.status === 'verifying') {
      const interval = setInterval(() => {
        verifyNameservers();
      }, 300000); // 5 minutos

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone]);

  const handleCreateZone = async () => {
    setLoading(true);
    setStep('configuring');

    try {
      const response = await fetch('/api/domains/do-create-zone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brokerId, domain })
      });

      const data = await response.json();

      if (data.success) {
        setZone({
          id: data.zoneId,
          domain: data.domain,
          status: 'verifying',
          nameservers: data.nameservers,
          activated_at: null
        });
        setStep('waiting');
        
        toast({
          title: '✅ Zona DNS criada!',
          description: 'Configure os nameservers no seu registrador.',
        });
      } else {
        toast({
          title: 'Erro ao criar zona',
          description: data.error || 'Tente novamente',
          variant: 'destructive'
        });
        setStep('input');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar zona DNS',
        variant: 'destructive'
      });
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const verifyNameservers = async () => {
    if (!zone) return;

    setVerifying(true);
    try {
      const response = await fetch('/api/domains/do-verify-nameservers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: zone.domain })
      });

      const data = await response.json();

      if (data.isActive) {
        setZone({ ...zone, status: 'active', activated_at: new Date().toISOString() });
        setStep('active');
        
        toast({
          title: '🎉 Domínio ativo!',
          description: 'Seu domínio personalizado está funcionando!',
        });
      } else {
        toast({
          title: 'Ainda não propagado',
          description: 'Os nameservers ainda não foram configurados. Aguarde alguns minutos.',
          variant: 'default'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao verificar',
        description: 'Não foi possível verificar os nameservers. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleAddRecord = async () => {
    if (!zone) return;

    try {
      const response = await fetch('/api/domains/do-add-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId: zone.id,
          recordType: newRecord.recordType,
          name: newRecord.name,
          value: newRecord.value,
          priority: newRecord.recordType === 'MX' ? newRecord.priority : undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setRecords([...records, data.record]);
        setShowAddRecord(false);
        setNewRecord({ recordType: 'MX', name: '', value: '', priority: 10 });
        
        toast({
          title: '✅ Registro adicionado!',
          description: 'O registro DNS foi configurado com sucesso.',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar registro',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteZone = async () => {
    if (!confirm('Tem certeza que deseja remover o domínio personalizado? Esta ação não pode ser desfeita.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch('/api/domains/do-delete-zone', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brokerId })
      });

      const data = await response.json();

      if (data.success) {
        setZone(null);
        setRecords([]);
        setStep('input');
        setDomain('');
        
        toast({
          title: '✅ Domínio removido',
          description: 'Seu domínio personalizado foi removido com sucesso.',
        });
      } else {
        toast({
          title: 'Erro ao remover domínio',
          description: data.error || 'Tente novamente',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover domínio personalizado',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading inicial */}
      {loadingInitial && (
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando configurações do domínio...</p>
        </div>
      )}

      {/* PASSO 1: ADICIONAR DOMÍNIO */}
      {!loadingInitial && step === 'input' && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Domínio Personalizado</CardTitle>
            <CardDescription>
              Configure seu próprio domínio para usar no seu site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Seu Domínio</Label>
              <Input
                id="domain"
                type="text"
                placeholder="seudominio.com.br"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Exemplo: minhaempresa.com.br
              </p>
            </div>
            <Button onClick={handleCreateZone} disabled={loading || !domain}>
              {loading ? 'Configurando...' : 'Configurar Domínio'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* PASSO 2: AGUARDANDO NAMESERVERS */}
      {!loadingInitial && step === 'waiting' && zone && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />
              <CardTitle>Aguardando Configuração dos Nameservers</CardTitle>
            </div>
            <CardDescription>
              Configure os nameservers no seu registrador para ativar o domínio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-3">
              <p className="font-semibold text-sm">📋 Instruções:</p>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Acesse o painel do seu registrador (GoDaddy, Hostinger, Registro.br, etc)</li>
                <li>Vá em "Configurações de DNS" ou "Nameservers"</li>
                <li>Altere para "Nameservers Personalizados"</li>
                <li>Adicione os nameservers abaixo:</li>
              </ol>
              
              <div className="bg-white dark:bg-gray-900 p-3 rounded space-y-2">
                {zone.nameservers.map((ns, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm font-mono">{ns}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(ns);
                        toast({ title: 'Copiado!' });
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Verificando automaticamente a cada 5 minutos...</span>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={verifyNameservers} 
                variant="outline"
                disabled={verifying}
              >
                {verifying ? 'Verificando...' : 'Verificar Agora'}
              </Button>
              
              <Button 
                onClick={handleDeleteZone} 
                variant="destructive"
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Removendo...' : 'Remover Domínio'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PASSO 3: DOMÍNIO ATIVO + GERENCIAR DNS */}
      {!loadingInitial && step === 'active' && zone && (
        <div className="space-y-6">
          {/* Status do Domínio */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <CardTitle>✅ Domínio Ativo</CardTitle>
                </div>
                <Button 
                  onClick={handleDeleteZone} 
                  variant="destructive"
                  size="sm"
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? 'Removendo...' : 'Remover Domínio'}
                </Button>
              </div>
              <CardDescription>
                Seu domínio {zone.domain} está funcionando!
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Gerenciar Registros DNS */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Registros DNS</CardTitle>
                  <CardDescription>
                    Configure email (MX) e subdomínios
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddRecord(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum registro DNS customizado ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">
                            {record.record_type}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {record.name}
                          </span>
                        </div>
                        <p className="text-sm font-mono">{record.value}</p>
                        {record.priority && (
                          <p className="text-xs text-muted-foreground">
                            Prioridade: {record.priority}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formulário Adicionar Registro */}
          {showAddRecord && (
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Novo Registro DNS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Registro</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newRecord.recordType}
                    onChange={(e) => setNewRecord({ ...newRecord, recordType: e.target.value })}
                  >
                    <option value="MX">MX (Email)</option>
                    <option value="CNAME">CNAME (Subdomínio)</option>
                    <option value="A">A (IP)</option>
                    <option value="TXT">TXT (Verificação)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    placeholder="@ ou subdomínio"
                    value={newRecord.name}
                    onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use @ para raiz ou digite o subdomínio (ex: mail, blog)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    placeholder={newRecord.recordType === 'MX' ? 'mail.seuservidor.com' : 'valor'}
                    value={newRecord.value}
                    onChange={(e) => setNewRecord({ ...newRecord, value: e.target.value })}
                  />
                </div>

                {newRecord.recordType === 'MX' && (
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Input
                      type="number"
                      value={newRecord.priority}
                      onChange={(e) => setNewRecord({ ...newRecord, priority: parseInt(e.target.value) })}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleAddRecord}>Adicionar</Button>
                  <Button variant="outline" onClick={() => setShowAddRecord(false)}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
