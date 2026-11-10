import { NextRequest, NextResponse } from "next/server";
import { exportarEstoque } from "@/lib/estoque";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const formato = (searchParams.get("formato") ?? "csv").trim().toLowerCase();
  const exportacao = exportarEstoque(formato);

  return new NextResponse(exportacao.conteudo, {
    headers: {
      "Content-Type": exportacao.mime_type,
      "Content-Disposition": `attachment; filename="estoque.${exportacao.extensao}"`,
    },
  });
}
