# Guia Passo a Passo: Configurar Webhook do Mercado Pago

## URL do seu webhook
```
https://nutri-ai-5qaa.vercel.app/api/payments/webhook
```

---

## Etapa 1: Acessar o Mercado Pago Developers

1. Abra o navegador
2. Vá para: **https://www.mercadopago.com.br/developers/panel**
3. Faça login com sua conta do Mercado Livre (a mesma que você usou para criar o app)

---

## Etapa 2: Encontrar seu app PersonalDiet

1. Na tela inicial do Developers, você verá uma lista de aplicações
2. Procure o app com nome **"PersonalDiet"** (ou o nome que você colocou)
3. Clique no nome dele para abrir

---

## Etapa 3: Acessar Webhooks

1. Dentro do app, olhe o menu lateral (esquerda)
2. Procure a opção **"Webhooks"** ou **"Notificações (Webhooks)"**
3. Clique nela

---

## Etapa 4: Adicionar novo webhook

1. Na tela de Webhooks, clique no botão **"Adicionar webhook"** ou **"Configurar webhook"**
2. Vai abrir um formulário

---

## Etapa 5: Preencher o formulário

### URL:
```
https://nutri-ai-5qaa.vercel.app/api/payments/webhook
```

### Eventos (selecione TODOS esses):
- ☑️ **payment** (pagamentos) — MARQUE ESTE
- ☑️ **subscription** (assinaturas) — MARQUE ESTE TAMBÉM

> Dica: Se tiver opção "Selecionar todos", pode clicar nela.

### Modo:
- Selecione **"Produção"** (não sandbox/teste)

---

## Etapa 6: Salvar e Testar

1. Clique em **"Salvar"** ou **"Criar"**
2. O Mercado Pago pode mostrar um botão **"Testar"** ou **"Enviar notificação de teste"**
3. Se tiver, clique em testar para verificar se a URL está respondendo

---

## ✅ O que deve aparecer se deu certo:

- Status: **"Ativo"** ou **"Pendente"** (o Vercel responde, então deve ficar Ativo em segundos)
- Última notificação: **"200 OK"** (quando você testar)

---

## ❌ Se der erro:

Se aparecer **"URL não responde"** ou **"404"**:
1. Verifique se copiou a URL exata: `https://nutri-ai-5qaa.vercel.app/api/payments/webhook`
2. Confirme que o app está no ar (acesse https://nutri-ai-5qaa.vercel.app)
3. Tente novamente em 1 minuto (pode ser delay do Vercel)

---

## Depois de configurar:

Me avise que eu testo se o webhook está recebendo as notificações! 💪
