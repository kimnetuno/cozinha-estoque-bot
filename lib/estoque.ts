import fs from "fs";
import path from "path";

export type ItemEstoque = {
  nome: string;
  quantidade: number;
  unidade: string;
  minimo: number;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "estoque.json");

const ESTOQUE_INICIAL: ItemEstoque[] = [
  { nome: "cebola", quantidade: 5, unidade: "kg", minimo: 2 },
  { nome: "tomate", quantidade: 8, unidade: "kg", minimo: 3 },
  { nome: "farinha", quantidade: 10, unidade: "kg", minimo: 4 },
  { nome: "arroz", quantidade: 15, unidade: "kg", minimo: 5 },
  { nome: "azeite", quantidade: 3, unidade: "L", minimo: 1 },
  { nome: "alho", quantidade: 1, unidade: "kg", minimo: 0.5 },
  { nome: "frango", quantidade: 12, unidade: "kg", minimo: 4 },
  { nome: "sal", quantidade: 2, unidade: "kg", minimo: 1 },
];

function garantirArquivo() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(ESTOQUE_INICIAL, null, 2), "utf-8");
  }
}

export function lerEstoque(): ItemEstoque[] {
  garantirArquivo();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function salvarEstoque(itens: ItemEstoque[]) {
  garantirArquivo();
  fs.writeFileSync(DATA_FILE, JSON.stringify(itens, null, 2), "utf-8");
}

function normalizar(s: string) {
  return s.trim().toLowerCase();
}

export function consultarEstoque(nomeItem: string) {
  const itens = lerEstoque();
  const alvo = normalizar(nomeItem);
  const item = itens.find((i) => normalizar(i.nome) === alvo);
  if (!item) {
    return {
      encontrado: false,
      itens_disponiveis: itens.map((i) => i.nome),
      mensagem: `Item "${nomeItem}" não consta no estoque.`,
    };
  }
  return {
    encontrado: true,
    item: item.nome,
    quantidade: item.quantidade,
    unidade: item.unidade,
    minimo: item.minimo,
    abaixo_do_minimo: item.quantidade <= item.minimo,
  };
}

export function darBaixa(nomeItem: string, quantidade: number) {
  const itens = lerEstoque();
  const alvo = normalizar(nomeItem);
  const idx = itens.findIndex((i) => normalizar(i.nome) === alvo);

  if (idx === -1) {
    return {
      sucesso: false,
      motivo: "item_inexistente",
      itens_disponiveis: itens.map((i) => i.nome),
      mensagem: `Item "${nomeItem}" não consta no estoque, baixa não realizada.`,
    };
  }

  const item = itens[idx];

  if (quantidade <= 0) {
    return {
      sucesso: false,
      motivo: "quantidade_invalida",
      mensagem: "A quantidade precisa ser maior que zero.",
    };
  }

  if (quantidade > item.quantidade) {
    return {
      sucesso: false,
      motivo: "quantidade_insuficiente",
      quantidade_atual: item.quantidade,
      unidade: item.unidade,
      mensagem: `Estoque insuficiente: há apenas ${item.quantidade} ${item.unidade} de ${item.nome}.`,
    };
  }

  const novoValor = +(item.quantidade - quantidade).toFixed(3);
  itens[idx] = { ...item, quantidade: novoValor };
  salvarEstoque(itens);

  const atingiuMinimo = novoValor <= item.minimo;

  return {
    sucesso: true,
    item: item.nome,
    quantidade_anterior: item.quantidade,
    quantidade_atual: novoValor,
    unidade: item.unidade,
    minimo: item.minimo,
    atingiu_minimo: atingiuMinimo,
    mensagem: atingiuMinimo
      ? `Baixa registrada. ${item.nome} agora tem ${novoValor} ${item.unidade}. ATENÇÃO: estoque no limite mínimo (${item.minimo} ${item.unidade}).`
      : `Baixa registrada. ${item.nome} agora tem ${novoValor} ${item.unidade}.`,
  };
}

export function listarAbaixoDoMinimo() {
  const itens = lerEstoque();
  const criticos = itens
    .filter((i) => i.quantidade <= i.minimo)
    .map((i) => ({
      item: i.nome,
      quantidade: i.quantidade,
      unidade: i.unidade,
      minimo: i.minimo,
    }));
  return {
    total: criticos.length,
    itens: criticos,
    mensagem:
      criticos.length === 0
        ? "Nenhum item no limite mínimo."
        : `${criticos.length} item(ns) no ou abaixo do mínimo.`,
  };
}
// Tool: listar_todo_estoque
export function listarTodoEstoque() {
  const itens = lerEstoque();
  return {
    total_itens: itens.length,
    itens: itens.map((i) => ({
      item: i.nome,
      quantidade: i.quantidade,
      unidade: i.unidade,
    })),
    mensagem: `O estoque possui ${itens.length} itens no total.`,
  };
}

export type FormatoExportacao = "json" | "csv" | "txt";

export function exportarEstoque(formato: string = "csv") {
  const itens = lerEstoque();
  const tipo = formato.trim().toLowerCase() as FormatoExportacao;

  if (tipo === "json") {
    return {
      formato: "json",
      extensao: "json",
      mime_type: "application/json; charset=utf-8",
      conteudo: JSON.stringify(itens, null, 2),
    };
  }

  if (tipo === "txt") {
    const linhas = itens.map(
      (i) => `${i.nome}: ${i.quantidade} ${i.unidade} (mínimo: ${i.minimo} ${i.unidade})`
    );

    return {
      formato: "txt",
      extensao: "txt",
      mime_type: "text/plain; charset=utf-8",
      conteudo: linhas.length > 0 ? linhas.join("\n") : "Estoque vazio.",
    };
  }

  const linhas = [
    "nome,quantidade,unidade,minimo",
    ...itens.map(
      (i) => `${i.nome},${i.quantidade},${i.unidade},${i.minimo}`
    ),
  ];

  return {
    formato: "csv",
    extensao: "csv",
    mime_type: "text/csv; charset=utf-8",
    conteudo: linhas.join("\n"),
  };
}