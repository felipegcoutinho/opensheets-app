#!/bin/bash

# Script para testar a API de transações pendentes
# Uso: ./scripts/test-pending-transaction.sh

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Teste da API de Transações Pendentes ===${NC}\n"

# Verificar se o servidor está rodando
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}❌ Erro: Servidor não está rodando em localhost:3000${NC}"
    echo -e "Execute: ${YELLOW}npm run dev${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Servidor está rodando\n"

# Solicitar token de sessão
echo -e "${YELLOW}Para obter seu token de sessão:${NC}"
echo "1. Abra http://localhost:3000 no navegador"
echo "2. Faça login"
echo "3. Abra DevTools (F12) > Application > Cookies"
echo "4. Copie o valor de 'better-auth.session_token'"
echo ""
read -p "Cole seu token de sessão aqui: " SESSION_TOKEN

if [ -z "$SESSION_TOKEN" ]; then
    echo -e "${RED}❌ Token não pode estar vazio${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Enviando notificação de teste...${NC}\n"

# Exemplos de notificações para testar
declare -a NOTIFICATIONS=(
    '{"appPackageName":"com.nu.production","appName":"Nubank","notificationText":"Compra aprovada no débito: R$ 45,90 em Padaria do João","notificationTitle":"Compra Aprovada"}'
    '{"appPackageName":"br.com.intermedium","appName":"Inter","notificationText":"Pix enviado de R$ 100,00 para Maria Silva","notificationTitle":"Pix Realizado"}'
    '{"appPackageName":"com.itau","appName":"Itaú","notificationText":"Compra no crédito: R$ 250,00 em Magazine Luiza","notificationTitle":"Fatura"}'
)

# Enviar notificações
for i in "${!NOTIFICATIONS[@]}"; do
    echo -e "${YELLOW}Enviando notificação $((i+1))/${#NOTIFICATIONS[@]}...${NC}"

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/transacoes-pendentes \
      -H "Content-Type: application/json" \
      -H "Cookie: better-auth.session_token=$SESSION_TOKEN" \
      -d "${NOTIFICATIONS[$i]}")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" = "201" ]; then
        echo -e "${GREEN}✓${NC} Notificação criada com sucesso!"
        echo -e "Resposta: $BODY\n"
    else
        echo -e "${RED}❌${NC} Erro ao criar notificação (HTTP $HTTP_CODE)"
        echo -e "Resposta: $BODY\n"
    fi

    sleep 1
done

echo -e "\n${GREEN}=== Teste Concluído ===${NC}"
echo -e "\nAgora você pode:"
echo "1. Verificar o badge na sidebar (deve mostrar o número de pendentes)"
echo "2. Acessar /transacoes-pendentes para ver as notificações"
echo "3. Processar, ignorar ou excluir as transações"
