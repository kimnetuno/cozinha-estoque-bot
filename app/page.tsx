"use client";

import { useState, useRef, useEffect } from "react";

type Msg = { autor: "user" | "bot"; texto: string };

export default function Home() {
  const [mensagens, setMensagens] = useState<Msg[]>([
    {
      autor: "bot",
      texto:
        "Olá, chef! 👨‍🍳 Sou seu assistente de estoque. Pode me perguntar o que tem na despensa, avisar o que usou ou até pedir dicas de receitas. Como posso ajudar?",
    },
  ]);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [formatoExportacao, setFormatoExportacao] = useState<"csv" | "json" | "txt">("csv");
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, carregando]);

  async function exportarEstoqueArquivo() {
    try {
      const res = await fetch(`/api/export?formato=${formatoExportacao}`);
      if (!res.ok) {
        throw new Error("Falha ao exportar");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `estoque.${formatoExportacao}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setMensagens((m) => [
        ...m,
        { autor: "bot", texto: `Arquivo exportado em ${formatoExportacao.toUpperCase()}. 📁` },
      ]);
    } catch {
      setMensagens((m) => [
        ...m,
        { autor: "bot", texto: "Não foi possível exportar o estoque neste momento." },
      ]);
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const texto = input.trim();
    if (!texto || carregando) return;

    // Adiciona a mensagem do usuário na tela
    const novasMensagens = [...mensagens, { autor: "user" as const, texto }];
    setMensagens(novasMensagens);
    setInput("");
    setCarregando(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Enviamos o HISTÓRICO completo agora
        body: JSON.stringify({ historico: novasMensagens }),
      });
      const data = await res.json();
      const resposta =
        data.resposta || data.error || "Desculpe, não consegui responder agora.";
      setMensagens((m) => [...m, { autor: "bot", texto: resposta }]);
    } catch {
      setMensagens((m) => [
        ...m,
        { autor: "bot", texto: "Erro de conexão com o servidor." },
      ]);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col p-4">
      <header className="mb-4 border-b pb-3">
        <h1 className="text-xl font-bold">🍳 Chef Assistente — Cozinha Profissional</h1>
        <p className="text-sm text-gray-500">
          Converse naturalmente: consulte itens, registre consumo ou peça dicas.
        </p>
      </header>

      <div className="mb-4 flex items-center gap-2 rounded-lg border bg-white p-2 shadow-sm">
        <label className="text-sm text-gray-700">Formato:</label>
        <select
          value={formatoExportacao}
          onChange={(e) => setFormatoExportacao(e.target.value as "csv" | "json" | "txt")}
          className="rounded-lg border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
          <option value="txt">TXT</option>
        </select>
        <button
          type="button"
          onClick={exportarEstoqueArquivo}
          className="ml-auto rounded-lg border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
        >
          Exportar
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg bg-gray-50 p-4">
        {mensagens.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.autor === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                m.autor === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-800 shadow"
              }`}
            >
              {m.texto}
            </div>
          </div>
        ))}
        {carregando && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white px-4 py-2 text-sm text-gray-400 shadow">
              preparando resposta… 👨‍🍳
            </div>
          </div>
        )}
        <div ref={fimRef} />
      </div>

      <form onSubmit={enviar} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Ex: "tem cebola?" ou "me dê uma receita de sopa"'
          className="flex-1 rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={carregando}
        />
        <button
          type="submit"
          disabled={carregando || !input.trim()}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </main>
  );
}