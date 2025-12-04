# 🔍 Diagnóstico do Erro 401

## Passo a Passo para Identificar o Problema

### Passo 1: Verificar se o servidor está rodando

```bash
cd /home/ubuntu/github/opensheets-app
npm run dev
```

Aguarde até ver a mensagem: `✓ Ready in XXXms`

---

### Passo 2: Criar um token de teste

1. Abra seu navegador em: http://localhost:3000/ajustes
2. Clique na tab "Tokens API"
3. Clique em "Criar Token"
4. Digite um nome, ex: "Teste"
5. Clique em "Criar Token"
6. **COPIE O TOKEN COMPLETO** (começando com `os_`)
7. O token deve ter **exatamente 67 caracteres**

**Exemplo de token válido:**
```
os_a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef123456789
```

---

### Passo 3: Testar o token via script

Abra um **novo terminal** e execute:

```bash
cd /home/ubuntu/github/opensheets-app

# Substitua pelo seu token real
./scripts/test-api-token.sh os_SEU_TOKEN_AQUI
```

**Resultados possíveis:**

✅ **Status HTTP: 201** → Token funcionando! O problema não é o backend.

❌ **Status HTTP: 401** → Token inválido. Veja os logs no terminal do servidor.

❌ **Status HTTP: 400** → Token válido, mas dados incorretos.

❌ **Status HTTP: 500** → Erro no servidor. Veja os logs.

---

### Passo 4: Verificar os logs do servidor

No terminal onde você rodou `npm run dev`, procure por mensagens como:

```
[Token Validation] Validating token: os_a1b2c3d...
[Token Validation] ✓ Format valid
[Token Validation] ✓ Token found
[Token Validation] ✅ Token valid! User: abc123...
```

**Se você ver algum ❌, identifique qual:**

- `❌ Invalid format` → Token está malformado
- `❌ Token not found in database` → Token não existe ou hash não bate
- `❌ Token revoked` → Token foi revogado
- `❌ Token expired` → Token expirou

---

### Passo 5: Verificar token no banco de dados

```bash
npm run db:studio
```

1. Abra a tabela `api_tokens`
2. Verifique se existe um registro
3. Confira:
   - `revoked_at` deve ser `null`
   - `expires_at` deve ser `null`
   - `user_id` deve estar preenchido

---

### Passo 6: Testar no app Android

**Antes de testar no app, CERTIFIQUE-SE que o teste via script funcionou (Passo 3)!**

Se o script funcionou mas o app não:

1. **Verifique o token no app:**
   - Abra o app Android
   - Vá em "Token de API"
   - Verifique se o token está salvo
   - Se não estiver, cole o token e salve

2. **Verifique a URL do servidor:**
   - Deve ser o IP da máquina onde o servidor roda
   - Exemplo: `http://192.168.1.100:3000`
   - **NÃO** use `localhost` no app Android

3. **Verifique os logs do Android (Logcat):**
   - Filtrar por `NotificationListener`
   - Procurar por erros como:
     - `API token not configured`
     - `Failed to send notification`
     - `Response code: 401`

---

## 🎯 Checklist Final

Marque cada item conforme for testando:

- [ ] Servidor rodando em `npm run dev`
- [ ] Token criado na interface web
- [ ] Token tem exatamente 67 caracteres
- [ ] Token começa com `os_`
- [ ] Teste via script retornou **201**
- [ ] Logs do servidor mostram `✅ Token valid!`
- [ ] Token existe na tabela `api_tokens` (via db:studio)
- [ ] Token não está revogado (`revoked_at = null`)
- [ ] App Android tem token configurado
- [ ] URL do servidor no app é o IP correto (não localhost)
- [ ] App tem permissão de notificações
- [ ] Toggle de captura está ativado

---

## 🚨 Se ainda não funcionar

**Cole as seguintes informações:**

1. **Logs do servidor** (últimas 20 linhas do terminal `npm run dev`)
2. **Resultado do script de teste** (output completo)
3. **Primeiros 10 caracteres do token** (ex: `os_a1b2c3d...`)
4. **Status do token no web** (Ativo/Revogado/Expirado)
5. **Logs do Android Logcat** (filtrar por `NotificationListener`)

Isso ajudará a identificar exatamente onde está o problema.

---

## 💡 Dica Rápida

Se você quer um teste rápido de sanidade completo, execute:

```bash
# 1. Criar token no web
# 2. Copiar o token
# 3. Testar:
./scripts/test-api-token.sh os_SEU_TOKEN

# Se retornar 201, o backend está OK!
# O problema está no app Android (configuração ou network)
```
