import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  consultarEstoque,
  darBaixa,
  exportarEstoque,
  listarAbaixoDoMinimo,
  listarTodoEstoque,
} from "@/lib/estoque";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Você é o Chef Assistente, um bot amigável e inteligente que gerencia o estoque de uma cozinha profissional.
Personalidade:
- Seja simpático e educado. Use emojis com moderação (👨‍🍳, 🥕).
- PODE conversar sobre culinária e receitas.
- Se o usuário disser "oi", "olá", "bom dia", responda calorosamente e pergunte como pode ajudar.

Regras de Estoque:
- Use SOMENTE as ferramentas fornecidas para obter dados. NUNCA invente quantidades.
- Se a ferramenta disser que o item não existe, diga que não consta e liste os disponíveis.`;

// Definição das ferramentas no formato OpenAI (que o Groq usa)
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "consultar_estoque",
      description: "Consulta a quantidade atual de um item.",
      parameters: {
        type: "object",
        properties: { item: { type: "string" } },
        required: ["item"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "dar_baixa",
      description: "Registra o consumo de um item.",
      parameters: {
        type: "object",
        properties: {
          item: { type: "string" },
          quantidade: { type: "number" },
        },
        required: ["item", "quantidade"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_abaixo_do_minimo",
      description: "Lista itens no estoque mínimo.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "exportar_estoque",
      description: "Exporta o estoque.",
      parameters: {
        type: "object",
        properties: { formato: { type: "string" } },
        required: ["formato"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_todo_estoque",
      description: "Lista todo o estoque.",
      parameters: { type: "object", properties: {} },
    },
  },
];

function executarFerramenta(nome: string, args: any) {
  switch (nome) {
    case "consultar_estoque": return consultarEstoque(args.item);
    case "dar_baixa": return darBaixa(args.item, Number(args.quantidade));
    case "listar_abaixo_do_minimo": return listarAbaixoDoMinimo();
    case "exportar_estoque": return exportarEstoque(args.formato || "csv");
    case "listar_todo_estoque": return listarTodoEstoque();
    default: return { erro: "Ferramenta desconhecida" };
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Falta a GROQ_API_KEY" }, { status: 500 });

    const { historico } = await req.json();

    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    // Monta o histórico no formato OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    for (const msg of historico) {
      if (messages.length === 1 && msg.autor === "bot") continue; // Pula primeiro bot
      messages.push({
        role: msg.autor === "user" ? "user" : "assistant",
        content: msg.texto,
      });
    }

    if (messages.length === 1) {
      return NextResponse.json({ resposta: "Olá! Como posso ajudar?" });
    }

    // Loop de ferramentas (máximo 3 iterações)
    for (let i = 0; i < 3; i++) {
      const response = await client.chat.completions.create({
        model: "openai/gpt-oss-120b", // Modelo gratuito com bom suporte a ferramentas
        messages: messages,
        tools: tools,
        tool_choice: "auto",
      });

      const message = response.choices[0].message;

      // Se não houver chamadas de ferramentas, retorna a resposta final
      if (!message.tool_calls || message.tool_calls.length === 0) {
        return NextResponse.json({ resposta: message.content });
      }

      // Adiciona a mensagem do assistente com as tool_calls
      messages.push(message);

            // Executa cada ferramenta e adiciona o resultado
      for (const toolCall of message.tool_calls) {
        // O "as any" resolve o erro de tipagem do TypeScript
        const call = toolCall as any; 
        
        const functionName = call.function.name;
        const functionArgs = JSON.parse(call.function.arguments);
        const resultado = executarFerramenta(functionName, functionArgs);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(resultado),
        });
      }
    }

    // Se chegar aqui após 3 iterações, retorna a última mensagem do assistente
    const lastMessage = messages.filter(m => m.role === "assistant").pop();
    const lastContent = lastMessage && "content" in lastMessage ? lastMessage.content : null;
    return NextResponse.json({ resposta: lastContent || "Não consegui processar sua solicitação." });

  } catch (err: any) {
    console.error("======== ERRO NA API DO GROQ ========");
    console.error(err);
    console.error("========================================");
    return NextResponse.json(
      { error: "Erro interno", detalhe: err?.message || "Erro desconhecido" },
      { status: 500 }
    );
  }
}