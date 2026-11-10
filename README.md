# 🤖 Chef Assistente - Bot de Estoque

Um chatbot inteligente para gerenciar o estoque de uma cozinha profissional. O bot utiliza IA (via API do Groq) com suporte a *function calling* para consultar, dar baixa e listar itens do estoque em tempo real.

## 🛠️ Tecnologias
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Groq API** (Modelo `openai/gpt-oss-120b`)
- **SDK da OpenAI** (para compatibilidade com a API do Groq)

## 🚀 Como rodar o projeto localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/kimnetuno/cozinha-estoque-bot.git
   cd cozinha-estoque-bot
"Nota: É necessário gerar uma chave de API gratuita no Groq Console e adicioná-la ao arquivo .env.local para que o bot possa se comunicar com a IA."
