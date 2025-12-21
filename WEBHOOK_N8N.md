# 🔗 Integração com Webhook N8N

## 📍 Endpoint
```
POST https://webhook.u4digital.com.br/webhook/labz-criar-agenda
```

## 🎯 Quando é Disparado
O webhook é acionado automaticamente quando um novo compromisso é criado na **Agenda**.

## 📤 Dados Enviados (Payload)

```json
{
  "id": "uuid-do-compromisso",
  "date": "2024-11-25",
  "time": "14:30",
  "patient_id": "uuid-do-paciente",
  "patient_name": "João Silva",
  "patient_email": "joao@email.com",
  "patient_phone": "+351 912 345 678",
  "type": "Consulta",
  "status": "pending",
  "created_at": "2024-11-25T19:30:00.000Z"
}
```

## 📋 Campos do Payload

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `id` | UUID | ID único do compromisso no Supabase | `"550e8400-e29b-41d4-a716-446655440000"` |
| `date` | String | Data do compromisso (YYYY-MM-DD) | `"2024-11-25"` |
| `time` | String | Hora do compromisso (HH:MM) | `"14:30"` |
| `patient_id` | UUID | ID do paciente no Supabase | `"550e8400-e29b-41d4-a716-446655440001"` |
| `patient_name` | String | Nome completo do paciente | `"João Silva"` |
| `patient_email` | String | Email do paciente | `"joao@email.com"` |
| `patient_phone` | String | Telefone do paciente | `"+351 912 345 678"` |
| `type` | String | Tipo de atendimento | `"Consulta"` / `"Retorno"` / `"Tratamento"` / `"Avaliação"` / `"Exame"` |
| `status` | String | Status do compromisso | `"pending"` / `"confirmed"` / `"completed"` |
| `created_at` | String | Timestamp de criação (ISO 8601) | `"2024-11-25T19:30:00.000Z"` |

## 🔄 Fluxo de Execução

```mermaid
1. Usuário preenche formulário "Novo Evento"
2. Clica em "Criar Compromisso"
3. Sistema salva no Supabase
4. Sistema dispara webhook N8N
5. Usuário recebe notificação de sucesso
```

## ⚙️ Comportamento

### ✅ Sucesso
- Compromisso é criado no banco
- Webhook é disparado
- Mensagem: "Compromisso criado com sucesso!"
- Console: `✅ Webhook disparado com sucesso`

### ⚠️ Falha no Webhook (mas sucesso no banco)
- Compromisso É CRIADO no banco normalmente
- Webhook falha (timeout, erro de rede, etc)
- Usuário VÊ mensagem de sucesso (pois o compromisso foi criado)
- Console: `⚠️ Erro ao disparar webhook (compromisso foi criado)`

**Importante**: A falha do webhook NÃO impede a criação do compromisso.

### ❌ Falha no Banco
- Compromisso NÃO é criado
- Webhook NÃO é disparado
- Mensagem: "Erro ao criar compromisso"

## 🧪 Testar o Webhook

### 1. Via Interface do Sistema
1. Acesse http://localhost:5173/agenda
2. Clique em "Novo Evento"
3. Preencha o formulário
4. Clique em "Criar Compromisso"
5. Verifique no N8N se o webhook foi recebido

### 2. Via cURL (Teste Manual)
```bash
curl -X POST https://webhook.u4digital.com.br/webhook/labz-criar-agenda \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-123",
    "date": "2024-11-25",
    "time": "14:30",
    "patient_id": "patient-456",
    "patient_name": "João Silva",
    "patient_email": "joao@email.com",
    "patient_phone": "+351 912 345 678",
    "type": "Consulta",
    "status": "pending",
    "created_at": "2024-11-25T19:30:00.000Z"
  }'
```

### 3. Via JavaScript (Console do Browser)
```javascript
fetch('https://webhook.u4digital.com.br/webhook/labz-criar-agenda', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'test-123',
    date: '2024-11-25',
    time: '14:30',
    patient_id: 'patient-456',
    patient_name: 'João Silva',
    patient_email: 'joao@email.com',
    patient_phone: '+351 912 345 678',
    type: 'Consulta',
    status: 'pending',
    created_at: new Date().toISOString()
  })
})
.then(r => r.json())
.then(d => console.log('Resposta:', d))
.catch(e => console.error('Erro:', e));
```

## 🔍 Debug

### Verificar se o Webhook Foi Disparado

Abra o Console do Browser (F12) e procure por:

```
✅ Webhook disparado com sucesso
```

ou

```
⚠️ Erro ao disparar webhook (compromisso foi criado): [detalhes do erro]
```

### Verificar no N8N

1. Acesse seu workflow no N8N
2. Verifique os logs de execução
3. Veja se o payload está chegando corretamente

### Headers da Requisição

```
Content-Type: application/json
```

### Timeout
O sistema aguarda até 30 segundos pela resposta do webhook (padrão do fetch).

## 🛠️ Personalizar

### Adicionar Mais Campos

Edite `src/pages/Agenda.tsx` na função `handleCreateAppointment`:

```typescript
const webhookData = {
  // ... campos existentes ...
  custom_field: "seu valor",
  clinic_name: "LuxClinic",
  doctor_name: "Dr. Silva"
};
```

### Mudar URL do Webhook

Criar variável de ambiente (`.env`):

```env
VITE_WEBHOOK_URL=https://webhook.u4digital.com.br/webhook/labz-criar-agenda
```

E usar no código:

```typescript
const webhookUrl = import.meta.env.VITE_WEBHOOK_URL || 'https://webhook.u4digital.com.br/webhook/labz-criar-agenda';

await fetch(webhookUrl, {
  method: 'POST',
  // ...
});
```

### Adicionar Autenticação

```typescript
await fetch('https://webhook.u4digital.com.br/webhook/labz-criar-agenda', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer SEU_TOKEN_AQUI'
  },
  body: JSON.stringify(webhookData)
});
```

## 📊 Possíveis Usos no N8N

- ✅ Enviar email de confirmação para o paciente
- ✅ Enviar SMS/WhatsApp com lembrete
- ✅ Adicionar ao Google Calendar
- ✅ Notificar equipe médica
- ✅ Atualizar CRM externo
- ✅ Gerar relatórios
- ✅ Integrar com outros sistemas

## ⚡ Performance

- **Assíncrono**: Não bloqueia a criação do compromisso
- **Não crítico**: Falha do webhook não impede o funcionamento
- **Timeout**: 30 segundos (padrão)
- **Retry**: Não implementado (webhook é disparado uma vez)

## 🔐 Segurança

### Recomendações:

1. **HTTPS**: O webhook já usa HTTPS ✅
2. **Validação**: O N8N deve validar o payload
3. **Rate Limiting**: Implementar no N8N se necessário
4. **IP Whitelist**: Configurar no N8N para aceitar apenas do seu servidor

### Não Envie:
- ❌ Senhas
- ❌ Dados sensíveis de saúde não necessários
- ❌ Tokens de acesso

## 📝 Logs

Todos os disparos e erros são logados no console do browser para debug:

```javascript
console.log('✅ Webhook disparado com sucesso');
// ou
console.warn('⚠️ Erro ao disparar webhook...', error);
```

---

**Status**: ✅ **Implementado e Funcional**

Última atualização: 25/11/2024

