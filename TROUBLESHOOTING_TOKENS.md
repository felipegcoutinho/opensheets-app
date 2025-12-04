# 🔧 Troubleshooting - API Tokens

Guia de diagnóstico para problemas com tokens de API.

## ✅ Checklist Rápido

### 1. Backend está rodando?

```bash
curl http://localhost:3000/api/health
# Deve retornar 200 OK
```

### 2. Token foi criado no banco?

Acesse: http://localhost:3000/ajustes → Tab "Tokens API" → Criar Token

### 3. Token está no formato correto?

Deve começar com `os_` seguido de 64 caracteres hexadecimais:
```
os_a1b2c3d4e5f6... (total de 67 caracteres)
```

### 4. Testar token via curl

```bash
# Substitua SEU_TOKEN_AQUI pelo token gerado
./scripts/test-api-token.sh os_SEU_TOKEN_AQUI
```

Se retornar **201**, o backend está funcionando! ✅

---

## 🐛 Problemas Comuns

### Problema: App Android retorna "401 - Não autenticado"

**Causas possíveis**:

1. **Token não configurado no app**
   - Solução: Abra o app > Token de API > Cole o token

2. **Token revogado**
   - Solução: No web, verifique se o token está com status "Ativo"

3. **Token copiado incorretamente**
   - Solução: Gere um novo token e copie novamente (ctrl+C/cmd+C)

4. **Header não está sendo enviado**
   - Veja logs do app Android no Logcat

### Problema: "400 - Dados inválidos"

O token está funcionando, mas os dados estão errados.

**Verificar**:
- `appPackageName` está preenchido?
- `notificationText` não está vazio?
- JSON está bem formado?

### Problema: "500 - Erro interno"

Erro no servidor.

**Diagnóstico**:
```bash
# Ver logs do servidor
# (no terminal onde rodou npm run dev)
```

Procure por erros de SQL, TypeScript, etc.

---

## 🔍 Diagnóstico Avançado

### 1. Verificar se token existe no banco

```bash
cd /home/ubuntu/github/opensheets-app
npm run db:studio
```

- Abra tabela `api_tokens`
- Procure pelo seu token (você verá apenas o hash)
- Verifique:
  - `revoked_at` deve ser `null`
  - `expires_at` deve ser `null` ou data futura

### 2. Ver logs do app Android

No Android Studio:
- **View > Tool Windows > Logcat**
- Filtrar por: `opensheets`

Procure por:
```
NotificationListener: API token not configured
NotificationListener: Invalid server URL
NotificationListener: Failed to send notification
```

### 3. Testar API diretamente

```bash
# Com token
curl -X POST http://localhost:3000/api/transacoes-pendentes \
  -H "Authorization: Bearer os_SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appPackageName": "com.test",
    "appName": "Test",
    "notificationTitle": "Teste",
    "notificationText": "R$ 10,00"
  }'

# Deve retornar:
# {"success":true,"data":{...}}
```

---

## 📊 Verificar Estatísticas

No app Android, verifique os contadores:

- **Capturadas**: Quantas notificações o app viu
- **Enviadas**: Quantas foram enviadas com sucesso
- **Falhas**: Quantas falharam

Se **Falhas > 0**:
- Token pode estar incorreto
- URL do servidor pode estar errada
- Servidor pode estar offline

---

## 🔄 Reset Completo

Se nada funcionar, faça reset:

### Backend

```bash
cd /home/ubuntu/github/opensheets-app

# 1. Deletar todos os tokens
npm run db:studio
# Deletar linhas da tabela api_tokens

# 2. Rebuild
npm run build
npm run dev
```

### App Android

1. Desinstalar app do celular
2. No Android Studio: Clean Project
3. Rebuild Project
4. Run novamente

### Testar do zero

1. Gere novo token no web
2. Configure no app
3. Teste com `./scripts/test-api-token.sh`
4. Faça compra de teste

---

## 🆘 Ainda não funciona?

### Coletar informações de debug

1. **Logs do servidor**:
   ```bash
   # Terminal onde rodou npm run dev
   # Copie últimas 50 linhas
   ```

2. **Logs do Android** (Logcat):
   - Filtrar por `NotificationListener`
   - Copiar erros

3. **Token usado**:
   - Primeiros 10 caracteres: `os_abc...`
   - Status no web (ativo/revogado)

4. **Request do app**:
   - URL configurada
   - Se o log mostra "API token not configured" ou não

### Verificar conectividade

```bash
# No celular, abra navegador e acesse:
http://IP_DO_SERVIDOR:3000

# Deve abrir o OpenSheets
```

Se não abrir:
- Firewall bloqueando porta 3000?
- Celular e servidor na mesma rede?
- VPS precisa de túnel/VPN?

---

## ✅ Teste de Sanidade

Execute este checklist:

- [ ] Servidor rodando (`curl http://localhost:3000/api/health`)
- [ ] Token criado no web
- [ ] Token copiado corretamente (67 chars)
- [ ] Token configurado no app Android
- [ ] URL do servidor configurada no app
- [ ] Permissão de notificações concedida
- [ ] Toggle de captura ativado
- [ ] Teste via script funcionou (`./scripts/test-api-token.sh`)
- [ ] App instalado no celular (via Run no Android Studio)

Se TODOS estiverem ✅ e ainda não funcionar, o problema pode ser:
- Network (celular não alcança servidor)
- Parser de notificação (banco não suporta notificação específica)

---

## 📞 Informações Úteis

**Arquivos importantes**:
- Backend API: `/app/api/transacoes-pendentes/route.ts`
- Validação: `/lib/api-tokens/validate-token.ts`
- App Android: `/NotificationListener.kt`

**Versões**:
- Next.js: 16.0.6
- Kotlin: 1.9.20
- Android SDK: 34

**Portas**:
- Servidor: 3000
- Banco: 5432

