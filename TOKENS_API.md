# API Tokens - OpenSheets

Sistema de autenticação por tokens de API para apps externos (ex: app Android).

## 🔐 Visão Geral

Os tokens de API permitem que apps externos (como o app Android) enviem notificações para o OpenSheets de forma segura, sem precisar de login/senha.

### Características de Segurança

- ✅ **Tokens longos e aleatórios** (256 bits)
- ✅ **Armazenados como hash SHA-256** no banco (nunca em plaintext)
- ✅ **Prefixo identificável** (`os_`) para fácil reconhecimento
- ✅ **Expiração opcional** (configurável)
- ✅ **Revogação instantânea** (sem deletar do banco)
- ✅ **Tracking de último uso** (lastUsedAt)
- ✅ **Múltiplos tokens por usuário** (um por dispositivo)

## 📱 Como Usar

### 1. Gerar Token (Web)

1. Acesse: **OpenSheets > Ajustes > Tokens API**
2. Clique em **"Criar Token"**
3. Digite um nome (ex: "Meu Celular")
4. **Copie o token imediatamente** (você não verá novamente!)
5. Guarde em local seguro

### 2. Configurar no App Android

1. Abra o app **OpenSheets Connector**
2. Toque em **"Token de API"**
3. Cole o token copiado
4. Salve

### 3. Testar

Faça uma compra de teste e veja a notificação aparecer em **Transações Pendentes**!

## 🔧 Uso Técnico

### Autenticação via Token

Envie o token no header `Authorization` como Bearer token:

```http
POST /api/transacoes-pendentes
Authorization: Bearer os_abc123...
Content-Type: application/json

{
  "appPackageName": "com.nu.production",
  "appName": "Nubank",
  "notificationTitle": "Compra Aprovada",
  "notificationText": "Compra no débito: R$ 50,00 em Padaria"
}
```

### Resposta de Sucesso

```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "pendente",
    ...
  }
}
```

### Erros Possíveis

#### 401 - Não Autenticado

```json
{
  "success": false,
  "error": "Não autenticado"
}
```

**Causas**:
- Token não enviado no header
- Token inválido (formato errado)
- Token não encontrado no banco
- Token revogado
- Token expirado

#### 400 - Dados Inválidos

```json
{
  "success": false,
  "error": "Dados inválidos"
}
```

**Causas**:
- Body JSON malformado
- Campos obrigatórios faltando
- Tipos de dados incorretos

## 🛠️ Gerenciamento de Tokens

### Listar Tokens

Ver todos os tokens da sua conta (sem ver o token plaintext):

```typescript
import { listApiTokens } from "@/lib/api-tokens/actions";

const result = await listApiTokens();
if (result.success) {
  result.data.forEach(token => {
    console.log(token.name, token.createdAt, token.lastUsedAt);
  });
}
```

### Revogar Token

Desativar um token sem deletá-lo:

```typescript
import { revokeApiToken } from "@/lib/api-tokens/actions";

await revokeApiToken(tokenId);
```

**Quando revogar**:
- Dispositivo perdido/roubado
- Suspeita de comprometimento
- Teste finalizado

### Restaurar Token

Reativar um token revogado:

```typescript
import { restoreApiToken } from "@/lib/api-tokens/actions";

await restoreApiToken(tokenId);
```

### Deletar Token

Remover permanentemente do banco:

```typescript
import { deleteApiToken } from "@/lib/api-tokens/actions";

await deleteApiToken(tokenId);
```

⚠️ **Ação irreversível!**

## 🔍 Detalhes Técnicos

### Formato do Token

```
os_[64 caracteres hexadecimais]
```

**Exemplo**:
```
os_a1b2c3d4e5f6...
```

### Validação

O token passa por 5 checks:

1. ✅ **Formato válido** (`os_` + 64 hex chars)
2. ✅ **Existe no banco** (hash SHA-256)
3. ✅ **Não revogado** (`revokedAt` is null)
4. ✅ **Não expirado** (`expiresAt` > now ou null)
5. ✅ **Atualiza lastUsedAt** (tracking de uso)

### Schema do Banco

```sql
CREATE TABLE api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,  -- Hash SHA-256
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE
);
```

### Geração Segura

```typescript
import crypto from "crypto";

// Gera 32 bytes aleatórios (256 bits)
const randomBytes = crypto.randomBytes(32);
const token = "os_" + randomBytes.toString("hex");

// Hash para armazenar
const tokenHash = crypto
  .createHash("sha256")
  .update(token)
  .digest("hex");

// Armazena tokenHash no banco
// Retorna token plaintext UMA VEZ APENAS
```

## 📊 Monitoramento

### Verificar Tokens Ativos

```typescript
import { countActiveTokens } from "@/lib/api-tokens/actions";

const result = await countActiveTokens();
console.log(`Tokens ativos: ${result.data}`);
```

### Ver Último Uso

Todos os tokens mostram `lastUsedAt` na UI:

- **Nunca usado**: `null`
- **Usado recentemente**: Data/hora da última request

## 🔒 Boas Práticas

### Segurança

1. ✅ **Nunca compartilhe tokens** entre dispositivos
2. ✅ **Um token por dispositivo** (facilita revogação)
3. ✅ **Revogue tokens de dispositivos antigos**
4. ✅ **Use HTTPS em produção** (não HTTP!)
5. ✅ **Monitore uso suspeito** (lastUsedAt inesperado)

### Nomeação

Use nomes descritivos:

- ✅ "iPhone de João"
- ✅ "Samsung Galaxy - Casa"
- ✅ "Emulador - Testes"
- ❌ "Token1"
- ❌ "abc"

### Expiração

Para máxima segurança, configure expiração:

```typescript
await createApiToken({
  name: "Token de Teste",
  expiresInDays: 90  // Expira em 3 meses
});
```

**Quando NÃO expirar**:
- Dispositivo pessoal de confiança
- Uso contínuo esperado

**Quando expirar**:
- Tokens de teste
- Dispositivos compartilhados
- Ambientes de desenvolvimento

## 🐛 Troubleshooting

### Token não funciona

**Verificar**:
1. Formato correto (`os_` + 64 chars)?
2. Token copiado completamente?
3. Não foi revogado?
4. Não expirou?
5. Header `Authorization: Bearer TOKEN` correto?

### "Não autenticado"

**Soluções**:
```bash
# Testar manualmente
curl -X POST http://localhost:3000/api/transacoes-pendentes \
  -H "Authorization: Bearer os_seu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "appPackageName": "test",
    "appName": "Test",
    "notificationTitle": "Test",
    "notificationText": "Teste: R$ 10,00"
  }'
```

### Token comprometido?

**Ação imediata**:
1. Revogue o token suspeito
2. Crie um novo token
3. Atualize o dispositivo com o novo
4. Delete o token comprometido

## 📚 Referências

- **Schema**: `/db/schema.ts` → `apiTokens` table
- **Utils**: `/lib/api-tokens/token-utils.ts`
- **Validação**: `/lib/api-tokens/validate-token.ts`
- **Actions**: `/lib/api-tokens/actions.ts`
- **API**: `/app/api/transacoes-pendentes/route.ts`
- **UI**: `/components/ajustes/api-tokens-manager.tsx`

## 🆘 Suporte

Se tiver problemas:

1. Verifique os logs do servidor (`console.log`)
2. Verifique os logs do app Android (Logcat)
3. Teste a API manualmente (curl/Postman)
4. Crie uma issue no GitHub

---

**Implementado em**: 2025-12-03
**Versão**: 1.0.0
