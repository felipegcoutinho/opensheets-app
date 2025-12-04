#!/bin/bash

# Script para testar API Token authentication
# Uso: ./scripts/test-api-token.sh <TOKEN>

TOKEN="${1:-}"

if [ -z "$TOKEN" ]; then
    echo "❌ Erro: Token não fornecido"
    echo "Uso: ./scripts/test-api-token.sh os_seu_token_aqui"
    exit 1
fi

echo "🔍 Testando API com token: ${TOKEN:0:10}..."
echo ""

# Testar endpoint de transações pendentes
echo "📤 Enviando notificação de teste..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/transacoes-pendentes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "appPackageName": "com.test",
    "appName": "Test App",
    "notificationTitle": "Teste",
    "notificationText": "Compra aprovada no débito: R$ 99,90 em Teste Store"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo ""
echo "📊 Resposta:"
echo "Status HTTP: $HTTP_CODE"
echo "Body: $BODY"
echo ""

if [ "$HTTP_CODE" = "201" ]; then
    echo "✅ SUCESSO! Token funcionando corretamente!"
    echo "Verifique em: http://localhost:3000/transacoes-pendentes"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "❌ ERRO: Não autenticado"
    echo "Possíveis causas:"
    echo "  - Token inválido"
    echo "  - Token revogado"
    echo "  - Token expirado"
    echo "  - Formato incorreto"
elif [ "$HTTP_CODE" = "400" ]; then
    echo "⚠️  ERRO: Dados inválidos"
    echo "O token funciona, mas os dados enviados estão incorretos"
else
    echo "❌ ERRO: Status HTTP inesperado: $HTTP_CODE"
fi
