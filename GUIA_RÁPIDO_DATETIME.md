# ⚡ Guia Rápido: Data/Hora Início e Fim

## 🚀 Passo a Passo

### 1️⃣ Executar Migration no Supabase

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Cole o SQL abaixo:

```sql
-- Adicionar campos de data/hora início e fim na tabela appointments

-- 1. Adicionar novas colunas
ALTER TABLE appointments 
ADD COLUMN start_datetime TIMESTAMP WITH TIME ZONE,
ADD COLUMN end_datetime TIMESTAMP WITH TIME ZONE;

-- 2. Migrar dados existentes (date + time -> start_datetime)
-- Assumindo que os compromissos duram 1 hora por padrão
UPDATE appointments 
SET 
  start_datetime = (date || ' ' || time)::timestamp AT TIME ZONE 'America/Sao_Paulo',
  end_datetime = (date || ' ' || time)::timestamp AT TIME ZONE 'America/Sao_Paulo' + interval '1 hour'
WHERE start_datetime IS NULL;

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_appointments_start_datetime ON appointments(start_datetime);
CREATE INDEX IF NOT EXISTS idx_appointments_end_datetime ON appointments(end_datetime);

-- 4. Comentários para documentação
COMMENT ON COLUMN appointments.start_datetime IS 'Data e hora de início do compromisso (timezone-aware)';
COMMENT ON COLUMN appointments.end_datetime IS 'Data e hora de fim do compromisso (timezone-aware)';
```

6. Clique em **Run**
7. Aguarde a confirmação ✅

---

### 2️⃣ Testar a Aplicação

1. Acesse http://localhost:5173/agenda
2. Clique em **"Novo Evento"**
3. Preencha o formulário:
   - **Data Início**: 25/11/2024
   - **Hora Início**: 14:30
   - **Data Fim**: 25/11/2024
   - **Hora Fim**: 15:30
   - **Paciente**: Selecione um paciente
   - **Tipo**: Consulta
   - **Status**: Pendente
4. Clique em **"Criar Compromisso"**
5. Veja a mensagem de sucesso ✅

---

### 3️⃣ Verificar Webhook no Console

1. Pressione **F12** (Abrir DevTools)
2. Vá na aba **Console**
3. Procure por:

```
✅ Webhook disparado com sucesso
📤 Payload: {
  "id": "...",
  "start_datetime": "2024-11-25T14:30:00-03:00",
  "end_datetime": "2024-11-25T15:30:00-03:00",
  "patient_name": "...",
  ...
}
```

---

### 4️⃣ Verificar no N8N

1. Acesse seu workflow no N8N
2. Vá em **Executions**
3. Veja a última execução
4. Verifique se recebeu o payload com:
   - ✅ `start_datetime` com timezone `-03:00`
   - ✅ `end_datetime` com timezone `-03:00`

---

## ✅ Checklist Rápido

- [ ] Migration executada no Supabase
- [ ] Servidor rodando (`npx vite`)
- [ ] Compromisso criado com sucesso
- [ ] Console mostra: `✅ Webhook disparado`
- [ ] N8N recebeu o payload
- [ ] Datas estão em formato ISO8601 com `-03:00`

---

## 🔍 Verificar Dados no Supabase

Execute no **SQL Editor**:

```sql
SELECT 
  id,
  patient_name,
  start_datetime,
  end_datetime,
  (end_datetime - start_datetime) as duracao
FROM appointments
ORDER BY start_datetime DESC
LIMIT 5;
```

Deve mostrar:

| patient_name | start_datetime | end_datetime | duracao |
|-------------|----------------|--------------|---------|
| João Silva | 2024-11-25 14:30:00-03 | 2024-11-25 15:30:00-03 | 01:00:00 |

---

## 🎯 Formato do Webhook

### Exemplo Real:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "start_datetime": "2024-11-25T14:30:00-03:00",
  "end_datetime": "2024-11-25T15:30:00-03:00",
  "patient_id": "550e8400-e29b-41d4-a716-446655440001",
  "patient_name": "João Silva",
  "patient_email": "joao@email.com",
  "patient_phone": "+351 912 345 678",
  "type": "Consulta",
  "status": "pending",
  "created_at": "2024-11-25T19:30:00.000Z"
}
```

### Campos Importantes:

- ✅ `start_datetime` → Data/hora início com timezone São Paulo
- ✅ `end_datetime` → Data/hora fim com timezone São Paulo
- ✅ Formato: `YYYY-MM-DDTHH:MM:SS-03:00`

---

## ⚠️ Troubleshooting

### Erro: "Preencha todos os campos obrigatórios"

**Solução**: Preencha todos os campos com * (obrigatórios)

### Erro: "Data/hora de fim deve ser posterior ao início"

**Solução**: 
- Verifique se hora fim > hora início
- Ou se data fim > data início

### Webhook não disparou

**Soluções**:
1. Abra o Console (F12) e veja os erros
2. Verifique se a URL do webhook está correta
3. Teste o webhook manualmente:

```bash
curl -X POST https://webhook.u4digital.com.br/webhook/labz-criar-agenda \
  -H "Content-Type: application/json" \
  -d '{
    "start_datetime": "2024-11-25T14:30:00-03:00",
    "end_datetime": "2024-11-25T15:30:00-03:00"
  }'
```

### Dados antigos sem start_datetime

**Solução**: A migration já migrou automaticamente. Se ainda houver problemas:

```sql
-- Migrar manualmente dados faltantes
UPDATE appointments 
SET 
  start_datetime = (date || ' ' || time)::timestamp AT TIME ZONE 'America/Sao_Paulo',
  end_datetime = (date || ' ' || time)::timestamp AT TIME ZONE 'America/Sao_Paulo' + interval '1 hour'
WHERE start_datetime IS NULL;
```

---

## 📚 Documentação Completa

Para mais detalhes, veja:
- 📄 `ATUALIZAÇÃO_DATETIME.md` - Documentação técnica completa
- 📄 `WEBHOOK_N8N.md` - Documentação do webhook

---

**Pronto! Agora você tem data/hora início e fim com timezone de São Paulo! 🎉**

Última atualização: 25/11/2024

