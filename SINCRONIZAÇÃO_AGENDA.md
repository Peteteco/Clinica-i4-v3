# 🔄 Sincronização Automática da Agenda

## 🎯 Objetivo

Manter a agenda **100% conciliada** com o banco de dados, enviando todos os eventos para o webhook de conferência.

## 📡 Webhook de Conferência

**Endpoint**: `https://webhook.u4digital.com.br/webhook/labz-conferir-agenda`

**Método**: POST

## 📤 Payload Enviado

```json
{
  "events": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "start_datetime": "2025-11-26T09:00:00-03:00",
      "end_datetime": "2025-11-26T10:00:00-03:00",
      "patient_name": "João Silva",
      "patient_email": "joao@email.com",
      "type": "Consulta",
      "status": "confirmed",
      "observations": "Paciente solicitou atendimento preferencial"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "start_datetime": "2025-11-26T14:00:00-03:00",
      "end_datetime": "2025-11-26T15:00:00-03:00",
      "patient_name": "Maria Santos",
      "patient_email": "maria@email.com",
      "type": "Retorno",
      "status": "pending",
      "observations": ""
    }
  ],
  "total": 2,
  "synced_at": "2025-11-25T23:30:00.000Z"
}
```

## 🔄 Quando Sincroniza

### 1️⃣ **Ao Carregar a Página Agenda**

Automaticamente 500ms após carregar todos os dados:

```
Usuário acessa /agenda
  ↓
Carrega compromissos do banco
  ↓
Carrega pacientes do banco
  ↓
Aguarda 500ms
  ↓
🔄 Sincroniza com webhook ✅
```

### 2️⃣ **Ao Clicar em "Atualizar"**

```
Usuário clica em "Atualizar"
  ↓
Recarrega dados do banco
  ↓
🔄 Sincroniza com webhook ✅
  ↓
Mostra "Agenda atualizada!"
```

## 📊 Campos Enviados por Evento

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `id` | UUID | ID único do evento | `550e8400...` |
| `start_datetime` | String | Data/hora início (ISO8601) | `2025-11-26T09:00:00-03:00` |
| `end_datetime` | String | Data/hora fim (ISO8601) | `2025-11-26T10:00:00-03:00` |
| `patient_name` | String | Nome do paciente | `João Silva` |
| `patient_email` | String | Email do paciente | `joao@email.com` |
| `type` | String | Tipo de atendimento | `Consulta` |
| `status` | String | Status do compromisso | `confirmed` / `pending` / `completed` |
| `observations` | String | Observações (opcional) | `Paciente com alergia...` |

## 🔍 Logs no Console

### Sincronização Bem-Sucedida:

```
🔄 Iniciando sincronização com webhook...
📤 Enviando 5 eventos para conferência...
✅ Sincronização concluída: { status: "ok", ... }
```

### Erro na Sincronização:

```
🔄 Iniciando sincronização com webhook...
📤 Enviando 5 eventos para conferência...
⚠️ Erro na sincronização: 500
```

### Erro de Conexão:

```
🔄 Iniciando sincronização com webhook...
❌ Erro ao sincronizar agenda: NetworkError...
```

## 🎯 Fluxo Completo

### Cenário 1: Carregar Página

```
1. Usuário acessa http://localhost:5173/agenda
2. Sistema carrega compromissos do Supabase
3. Sistema carrega pacientes do Supabase
4. Aguarda 500ms (garantir que tudo carregou)
5. Formata todos os eventos com dados completos
6. Envia para webhook de conferência
7. Webhook processa e retorna status
8. Sistema exibe agenda normalmente
```

### Cenário 2: Clicar em Atualizar

```
1. Usuário clica no botão "Atualizar"
2. Toast: "Atualizando agenda..."
3. Sistema recarrega dados do banco
4. Formata todos os eventos
5. Envia para webhook de conferência
6. Toast: "Agenda atualizada!" ✅
```

## 🛠️ Implementação Técnica

### Função syncAgendaWithWebhook

```typescript
const syncAgendaWithWebhook = async () => {
  // 1. Formatar eventos
  const eventsToSync = allAppointments.map(apt => {
    const patient = patients.find(p => p.id === apt.patient_id);
    
    return {
      id: apt.id,
      start_datetime: apt.start_datetime || `${apt.date}T${apt.time}:00-03:00`,
      end_datetime: apt.end_datetime || `${apt.date}T${apt.time}:00-03:00`,
      patient_name: apt.patient_name,
      patient_email: patient?.email || '',
      type: apt.type,
      status: apt.status,
      observations: apt.observations || apt.notes || ''
    };
  });

  // 2. Enviar para webhook
  const response = await fetch('https://webhook.u4digital.com.br/webhook/labz-conferir-agenda', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      events: eventsToSync,
      total: eventsToSync.length,
      synced_at: new Date().toISOString()
    })
  });

  // 3. Processar resposta
  if (response.ok) {
    const result = await response.json();
    console.log('✅ Sincronização concluída:', result);
    return result;
  }
};
```

### useEffect para Auto-Sync

```typescript
useEffect(() => {
  if (!isLoading && allAppointments.length > 0 && patients.length > 0) {
    const timer = setTimeout(() => {
      syncAgendaWithWebhook();
    }, 500);
    
    return () => clearTimeout(timer);
  }
}, [isLoading, allAppointments.length, patients.length]);
```

## 📋 Resposta Esperada do Webhook

O webhook deve retornar JSON com o status da conciliação:

```json
{
  "status": "ok",
  "message": "Agenda 100% conciliada",
  "events_received": 5,
  "events_synced": 5,
  "discrepancies": []
}
```

ou

```json
{
  "status": "warning",
  "message": "Divergências encontradas",
  "events_received": 5,
  "events_synced": 4,
  "discrepancies": [
    {
      "event_id": "...",
      "issue": "Evento não encontrado no sistema externo"
    }
  ]
}
```

## 🧪 Como Testar

### Teste 1: Carregar Página

1. Acesse http://localhost:5173/agenda
2. Abra o Console (F12)
3. Aguarde a página carregar
4. Veja os logs:

```
🔄 Iniciando sincronização com webhook...
📤 Enviando X eventos para conferência...
✅ Sincronização concluída
```

### Teste 2: Clicar em Atualizar

1. Na página Agenda
2. Clique no botão "Atualizar"
3. Veja no Console:

```
🔄 Iniciando sincronização com webhook...
📤 Enviando X eventos para conferência...
✅ Sincronização concluída
```

### Teste 3: Verificar Payload

1. Abra a aba **Network** no DevTools (F12)
2. Filtre por: `labz-conferir-agenda`
3. Clique em "Atualizar"
4. Veja o Request Payload completo

### Teste 4: Simular Resposta do Webhook

No N8N, configure o webhook para retornar:

```json
{
  "status": "ok",
  "message": "Recebido",
  "events_received": 5
}
```

## 🎯 Casos de Uso

### 1. Verificar Sincronização

**Problema**: Usuário criou evento mas não aparece em outro sistema

**Solução**: 
1. Usuário vai em Agenda
2. Clica em "Atualizar"
3. Sistema sincroniza tudo
4. Webhook confere e atualiza outros sistemas

### 2. Auditoria

**Problema**: Precisa saber quais eventos estão registrados

**Solução**:
- Webhook recebe todos os eventos
- Pode comparar com outro banco
- Pode gerar relatório de divergências

### 3. Backup Automático

**Problema**: Backup dos compromissos

**Solução**:
- A cada sincronização, webhook salva cópia
- Histórico completo mantido

## ⚙️ Configuração do N8N

### Webhook Node

```
URL: /labz-conferir-agenda
Method: POST
Response Code: 200
```

### Processar Payload

```javascript
// Receber eventos
const events = $input.item.json.events;
const total = $input.item.json.total;

// Processar cada evento
events.forEach(event => {
  console.log('Evento:', event.patient_name, event.start_datetime);
  
  // Aqui você pode:
  // - Salvar em outro banco
  // - Enviar para API externa
  // - Gerar relatório
  // - Etc
});

// Retornar resposta
return {
  status: 'ok',
  message: 'Agenda sincronizada',
  events_received: total,
  events_synced: events.length
};
```

## 📊 Métricas

### Performance

- **Tempo de sincronização**: ~500ms - 2s (depende da quantidade)
- **Delay ao carregar página**: 500ms
- **Não bloqueia UI**: Sim ✅
- **Retry em caso de falha**: Não (apenas log)

### Dados

- **Eventos enviados por sincronização**: Todos no banco
- **Frequência**: 
  - Ao carregar página: 1x
  - Ao clicar em atualizar: 1x
  - Ao criar evento: Não (apenas evento individual)

## 🔒 Segurança

### Validações Recomendadas no N8N

1. **Verificar origem**: Checar IP ou token
2. **Validar payload**: Estrutura correta
3. **Sanitizar dados**: Evitar injeção
4. **Rate limiting**: Limitar requisições

### Dados Sensíveis

- ✅ Email do paciente (necessário)
- ✅ Nome do paciente (necessário)
- ❌ Não envia: CPF, endereço, telefone

## 🐛 Troubleshooting

### Sincronização não dispara

**Causa**: Dados não carregaram

**Solução**: Verificar se `allAppointments` e `patients` não estão vazios

### Webhook não recebe dados

**Causa**: URL errada ou CORS

**Solução**: Verificar URL e configurar CORS no N8N

### Email vazio

**Causa**: Paciente sem email cadastrado

**Solução**: Cadastrar email no paciente

### Observações não aparecem

**Causa**: Migration não executada

**Solução**: Executar `003_add_observations.sql`

---

**Status**: ✅ **Implementado e Funcional**

Última atualização: 25/11/2024

## 🎉 Próximos Passos

1. Configurar resposta do webhook no N8N
2. Implementar tratamento da resposta (divergências)
3. Adicionar indicador visual de sincronização
4. Implementar retry automático em caso de falha
5. Dashboard de status de sincronização

---

**Teste agora acessando a Agenda e veja os logs de sincronização! 🚀**

