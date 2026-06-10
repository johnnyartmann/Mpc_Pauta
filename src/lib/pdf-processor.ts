import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

interface EntradaDiario {
  numero_processo: string;
  unidade_gestora: string | null;
  interessados: string | null;
  assunto: string | null;
  relator: string | null;
  unidade_tecnica: string | null;
  tipo: string;
  numero_decisao: string | null;
  conteudo_html: string | null;
}

export interface ExtractResult {
  data_publicacao: string;
  numero_edicao: string | null;
  entradas: EntradaDiario[];
  error?: string;
}

export async function processarPDF(pdfPath: string): Promise<ExtractResult> {
  const scriptPath = path.join(process.cwd(), "scripts", "extract_diario.py");

  try {
    const { stdout } = await execFileAsync("python", [scriptPath, pdfPath], {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 60000,
      encoding: "utf8",
      env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" },
    });

    const result = JSON.parse(stdout);
    if (result.error) {
      return { error: result.error, data_publicacao: "", numero_edicao: null, entradas: [] };
    }
    return result;
  } catch (err: any) {
    if (err.killed) return { error: "Timeout ao processar PDF. O arquivo pode ser muito grande.", data_publicacao: "", numero_edicao: null, entradas: [] };
    return { error: `Erro ao processar PDF: ${err.message}`, data_publicacao: "", numero_edicao: null, entradas: [] };
  }
}
