import fs from "fs";
import path from "path";
// @ts-ignore
import pdf from "pdf-parse/lib/pdf-parse.js";

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
  responsavel?: string;
}

export interface ExtractResult {
  data_publicacao: string;
  numero_edicao: string | null;
  entradas: EntradaDiario[];
  error?: string;
}

// ── Patterns for page headers / noise ───────────────────────────────────────
const PAGE_HEADER_RE = /^Tribunal\s+de\s+Contas\s+de\s+Santa\s+Catarina\b.*P[aá]g\.\s*\d+/i;

const MASTHEAD_STARTS = [
  "Tribunal de Contas do Estado de Santa Catarina",
  "www.tce.sc.gov.br",
  "Conselheiros",
  "Minist",
  "Diário Oficial Eletrônico",
];

const DIGITAL_SIGN_RE = /Assinado de forma digital por|SIMONI DA\s*\n\s*ROSA:\d+/i;
const URL_RE = /www\.\w+\.\w+\.\w+/;

function isPageHeader(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  return PAGE_HEADER_RE.test(t);
}

function isMasthead(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  for (const start of MASTHEAD_STARTS) {
    if (t.startsWith(start) && t.length < 200) {
      return true;
    }
  }
  if (DIGITAL_SIGN_RE.test(t)) {
    return true;
  }
  if (URL_RE.test(t) && t.length < 100) {
    return true;
  }
  return false;
}

function cleanPageText(pageText: string, isFirstPage: boolean): string {
  const lines = pageText.split("\n");
  const cleanLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (isPageHeader(trimmed)) {
      continue;
    }
    if (isFirstPage && isMasthead(trimmed)) {
      continue;
    }
    cleanLines.push(line);
  }
  return cleanLines.join("\n");
}

// ── Metadata extraction ─────────────────────────────────────────────────────
function extractDate(filepath: string): string | null {
  const basename = path.basename(filepath);
  const m = basename.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return `${m[1]}-${m[2]}-${m[3]}`;
  }
  return null;
}

function extractEdition(text: string): string | null {
  const m = text.match(/Ano\s+\d+\s*-\s*n[.\u00ba\u00b0\u00aa\u00b0]?\s*(\d+)/i);
  if (m) {
    return m[1];
  }
  return null;
}

// ── Entry detection ─────────────────────────────────────────────────────────
interface EntryStart {
  pos: number;
  type: "processo" | "parecer_previo";
}

function findEntryStarts(text: string): EntryStart[] {
  const PROCESSO_RE = /PROCESSO\s+N[.\u00ba\u00b0\u00aa]?\s*:\s*(.*?)\s*\n/gi;
  const PCG_PROCESSO_RE = /Processo\s+n\.\s*:\s*(.*?)\s*\n/gi;

  const entries: EntryStart[] = [];

  for (const m of text.matchAll(PROCESSO_RE)) {
    if (m.index !== undefined) {
      entries.push({ pos: m.index, type: "processo" });
    }
  }

  for (const m of text.matchAll(PCG_PROCESSO_RE)) {
    if (m.index !== undefined) {
      entries.push({ pos: m.index, type: "parecer_previo" });
    }
  }

  entries.sort((a, b) => a.pos - b.pos);

  // Deduplicate entries too close together.
  const unique: EntryStart[] = [];
  for (const e of entries) {
    if (unique.length === 0 || e.pos - unique[unique.length - 1].pos > 200) {
      unique.push(e);
    } else if (e.type === "parecer_previo") {
      unique[unique.length - 1] = e;
    }
  }

  return unique;
}

// ── Field extraction ────────────────────────────────────────────────────────
const FIELD_LABELS = [
  [/UNIDADE\s+GESTORA\s*:/i, "unidade_gestora"],
  [/RESPONS[.\u00c1\u00c0\u00c2\u00c3]VEL\s*:/i, "responsavel"],
  [/INTERESSADOS?\s*:/i, "interessados"],
  [/ASSUNTO\s*:/i, "assunto"],
  [/RELATOR\s*:/i, "relator"],
  [/UNIDADE\s+T[.\u00c9\u00c8\u00ca\u00cb]CNICA\s*:/i, "unidade_tecnica"],
  [/UNIDADE\s+TECNICA\s*:/i, "unidade_tecnica"],
  [/DECIS[.\u00c3\u00c2]O\s+SINGULAR\s*:/i, "decisao_singular"],
] as const;

function extractHeaderFields(headerText: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let remaining = headerText;

  for (const [regex, key] of FIELD_LABELS) {
    const searchRegex = new RegExp(`(?:^|\\n)(${regex.source})\\s*(.*?)(?=\\n|$)`, "i");
    const m = remaining.match(searchRegex);
    if (!m) continue;

    const labelStart = remaining.indexOf(m[1]);
    if (labelStart === -1) continue;

    const valueStart = labelStart + m[1].length;

    let nextLabelPos: number | null = null;
    for (const [r2, _] of FIELD_LABELS) {
      if (r2.source === regex.source) continue;
      const nextRegex = new RegExp(`(?:^|\\n)(${r2.source})`, "i");
      const suffix = remaining.slice(valueStart);
      const nm = suffix.match(nextRegex);
      if (nm && nm[1]) {
        const indexInSuffix = suffix.indexOf(nm[1]);
        if (indexInSuffix !== -1) {
          const pos = valueStart + indexInSuffix;
          if (nextLabelPos === null || pos < nextLabelPos) {
            nextLabelPos = pos;
          }
        }
      }
    }

    let value = "";
    if (nextLabelPos !== null) {
      value = remaining.slice(valueStart, nextLabelPos).trim();
      remaining = remaining.slice(nextLabelPos);
    } else {
      value = remaining.slice(valueStart).trim();
      remaining = "";
    }

    value = value.replace(/\n{3,}/g, "\n\n");
    value = value.replace(/\s+/g, " ").trim();
    fields[key] = value;
  }

  return fields;
}

function extractParecerPrevioFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const pats = {
    unidade_gestora: /Unidade\s+Gestora\s*:\s*(.+?)(?:\n|$)/i,
    responsavel: /Respons[.\u00e1\u00e0]vel\s*:\s*(.+?)(?:\n|$)/i,
    assunto: /Assunto\s*:\s*(.+?)(?:\n|$)/i,
    unidade_tecnica: /Unidade\s+T[.\u00e9\u00e8]cnica\s*:\s*(.+?)(?:\n|$)/i,
  };

  for (const [key, regex] of Object.entries(pats)) {
    const m = text.match(regex);
    if (m) {
      fields[key] = m[1].replace(/\s+/g, " ").trim();
    }
  }

  return fields;
}

// ── Type determination ──────────────────────────────────────────────────────
function determineTipo(entryText: string): "decisao_singular" | "parecer_previo" | "deliberacao_plenario" {
  if (/DECIS[.\u00c3\u00c2]O\s+SINGULAR/i.test(entryText)) {
    return "decisao_singular";
  }
  if (/Parecer\s+Pr[.\u00e9\u00e8]vio\s*-\s*Presta[.\u00c7][.\u00e3\u00e2]o\s+de\s+Contas/i.test(entryText)) {
    return "parecer_previo";
  }
  return "deliberacao_plenario";
}

// ── Decision number extraction ──────────────────────────────────────────────
function extractDecisionNumber(entryText: string, tipo: string): string {
  if (tipo === "decisao_singular") {
    const m = entryText.match(/DECIS[.\u00c3\u00c2]O\s+SINGULAR\s*:\s*(\S[^\n]*)/i);
    if (m) return m[1].trim();
  } else if (tipo === "parecer_previo") {
    const m = entryText.match(/Parecer\s+Pr[.\u00e9\u00e8]vio.*?\bn\.\s*:\s*(\S[^\n]*)/i);
    if (m) return m[1].trim();
  }
  return "";
}

// ── Processo number extraction ──────────────────────────────────────────────
function extractProcessoNumber(entryText: string): string {
  let m = entryText.match(/PROCESSO\s+N[.\u00ba\u00b0\u00aa]?\s*:\s*(\S[^\n]*)/i);
  if (m) return m[1].trim();
  m = entryText.match(/Processo\s+n\.\s*:\s*(\S[^\n]*)/i);
  if (m) return m[1].trim();
  return "";
}

// ── Content boundaries ──────────────────────────────────────────────────────
function findContentMarkerPos(text: string, entryType: string): number {
  if (entryType === "decisao_singular") {
    const m = text.match(/DECIS[.\u00c3\u00c2]O\s+SINGULAR\s*:.*(?:\n|$)/i);
    if (m && m.index !== undefined) {
      return m.index + m[0].length;
    }
  } else if (entryType === "parecer_previo") {
    const m = text.match(/Parecer\s+Pr[.\u00e9\u00e8]vio.*?\bn\.\s*:\s*\S+.*(?:\n|$)/i);
    if (m && m.index !== undefined) {
      return m.index + m[0].length;
    }
  }

  for (const label of ["RELATOR", "UNIDADE T"]) {
    const regex = new RegExp(`(?:^|\\n)(${label}\\w*:.*)(?:\\n|$)`, "i");
    const m = text.match(regex);
    if (m && m.index !== undefined) {
      const lineEnd = m.index + m[0].length;
      const afterHeader = text.slice(lineEnd);
      const cm = afterHeader.match(/(?:^|\n)(I[\s-]*RELAT[.\u00d3\u00d2]RIO)/i);
      if (cm && cm.index !== undefined) {
        const textIndex = afterHeader.indexOf(cm[1]);
        if (textIndex !== -1) {
          return lineEnd + textIndex;
        }
      }
      return lineEnd;
    }
  }
  return 0;
}

const NOTIFICACAO_RE = /(?:^|\n)\s*NOTIFICA[.\u00c7][.\u00c3][\u00c2]?O\s+DE\s+ALERTA\s+N[.\u00ba\u00b0]?\s*\d+/i;

const IGNORE_SECTION_RE = /(?:^|\n)\s*(?:Atos\s+Administrativos|Licita[.\u00e7][.\u00f5]es.*Conv[.\u00ea]nios|Portaria\s+N\.\s*TC-)\s*(?:\n|$)/i;

function findContentEnd(fullText: string, startPos: number, nextEntryPos: number): number {
  const between = fullText.slice(startPos, nextEntryPos);

  const mNotif = between.match(NOTIFICACAO_RE);
  if (mNotif && mNotif.index !== undefined) {
    return startPos + mNotif.index;
  }

  const mIgnore = between.match(IGNORE_SECTION_RE);
  if (mIgnore && mIgnore.index !== undefined) {
    return startPos + mIgnore.index;
  }

  return nextEntryPos;
}

// ── HTML conversion ─────────────────────────────────────────────────────────
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Check if a line is a header
function isHeaderLine(text: string): boolean {
  const stripped = text.trim();
  if (!stripped) return false;
  if (stripped.length > 80) return false;

  const lettersOnly = stripped.replace(/[^A-Za-z\u00c0-\u00ff\u0100-\u024f]/g, "");
  if (lettersOnly.length < 4) return false;

  let upperCount = 0;
  for (let i = 0; i < lettersOnly.length; i++) {
    const char = lettersOnly[i];
    if (char === char.toUpperCase() && char !== char.toLowerCase()) {
      upperCount++;
    }
  }

  if (upperCount >= lettersOnly.length * 0.75) {
    return true;
  }

  if (/^[IVXivx]+[\s\-.]/i.test(stripped) && stripped.length < 80) {
    return true;
  }

  if (/^\d+\.\d+\s/.test(stripped) && stripped.length < 80) {
    return true;
  }

  return false;
}

function contentToHtml(content: string): string {
  if (!content.trim()) return "";

  const paragraphs = content.trim().split(/\n\s*\n/);
  const htmlParts: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) continue;

    const lines = para.split("\n");
    const processed: string[] = [];

    for (const line of lines) {
      const stripped = line.trim();
      if (!stripped) continue;

      if (isHeaderLine(stripped)) {
        processed.push(`<strong>${escapeHtml(stripped)}</strong><br/>`);
      } else {
        processed.push(escapeHtml(stripped));
      }
    }

    if (processed.length > 0) {
      const paraHtml = processed.join("<br/>");
      htmlParts.push(`<p>${paraHtml}</p>`);
    }
  }

  return htmlParts.join("\n");
}

function cleanContentText(text: string): string {
  const lines = text.split("\n");
  const cleanLines: string[] = [];
  for (const line of lines) {
    const stripped = line.trim();
    if (PAGE_HEADER_RE.test(stripped)) {
      continue;
    }
    if (isMasthead(stripped)) {
      continue;
    }
    cleanLines.push(stripped);
  }
  let cleaned = cleanLines.join("\n");
  cleaned = cleaned.replace(/\n{4,}/g, "\n\n\n");
  return cleaned.trim();
}

// ── Voto text helpers ────────────────────────────────────────────────────────
function stripPageNoise(text: string): string {
  const lines = text.split("\n");
  const cleaned: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      cleaned.push("");
      continue;
    }
    if (/^Tribunal\s+de\s+Contas\s+do\s+Estado/i.test(trimmed)) {
      continue;
    }
    if (/^Gabinete\s+do\s+Conselheiro/i.test(trimmed)) {
      continue;
    }
    if (/^Processo:\s*REC/i.test(trimmed)) {
      continue;
    }
    if (/^\d+$/.test(trimmed) && trimmed.length < 10) {
      continue;
    }
    if (trimmed.includes("Disponibilizado para")) {
      continue;
    }
    cleaned.push(trimmed);
  }
  return cleaned.join("\n");
}

function extractEmenta(text: string): string {
  let match = text.match(/PROPOSTA\s+DE\s+VOTO\s*:/i);
  if (!match) {
    match = text.match(/EMENTA\s*[:\-]?\s*(?:\r?\n|$)/i);
  }
  if (!match || match.index === undefined) {
    return "";
  }

  const start = match.index + match[0].length;
  let ementaText = text.slice(start);

  const endMatch = ementaText.match(/\bI[\.\s\-]+RELAT[ÓO]RIO\b/i);
  if (endMatch && endMatch.index !== undefined) {
    ementaText = ementaText.slice(0, endMatch.index);
  }

  ementaText = stripPageNoise(ementaText).trim();

  const joined = ementaText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[A-Z]{2,}(?:\/[A-Z]+)?\s*-\s*\d+\/\d{4}\s*/, "")
    .trim();

  const paragraphs = joined.split(/(?<=\.)\s+(?=[A-ZÁÀÃÂÉÊÍÓÔÕÚÇ])/);

  const result: string[] = [];
  for (let p of paragraphs) {
    p = p.trim();
    if (p) {
      result.push("<p>" + escapeHtml(p) + "</p>");
    }
  }

  return result.join("\n");
}

function extractProposta(text: string): string {
  const regex1 = /\bIII[\.\s\-]+VOTO\b/gi;
  const regex2 = /(?:^|\r?\n)VOTO\s*(?:\r?\n|$)/gi;

  const matches: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;

  while ((m = regex1.exec(text)) !== null) {
    matches.push(m);
  }

  if (matches.length === 0) {
    while ((m = regex2.exec(text)) !== null) {
      matches.push(m);
    }
  }

  if (matches.length === 0) {
    return "";
  }

  const lastMatch = matches[matches.length - 1];
  const start = lastMatch.index;
  let propostaText = text.slice(start);

  propostaText = propostaText.replace(/^.*?VOTO\s*(?:\r?\n|$)/i, "");

  propostaText = stripPageNoise(propostaText).trim();
  return textToHtml(propostaText);
}

function textToHtml(text: string): string {
  const lines = text.trim().split("\n");
  const result: string[] = [];
  let currentPara: string[] = [];

  for (const line of lines) {
    const stripped = line.trim();

    if (!stripped) {
      if (currentPara.length > 0) {
        result.push("<p>" + currentPara.map(escapeHtml).join("<br/>") + "</p>");
        currentPara = [];
      }
      continue;
    }

    let isHeader = false;
    if (stripped.length < 70 && (isUpper(stripped) || /^[IVX]+[\.\s\-]/.test(stripped))) {
      isHeader = true;
    }

    if (isHeader) {
      if (currentPara.length > 0) {
        result.push("<p>" + currentPara.map(escapeHtml).join("<br/>") + "</p>");
        currentPara = [];
      }
      result.push("<strong>" + escapeHtml(stripped) + "</strong><br/>");
    } else {
      currentPara.push(stripped);
    }
  }

  if (currentPara.length > 0) {
    result.push("<p>" + currentPara.map(escapeHtml).join("<br/>") + "</p>");
  }

  return result.join("\n");
}

function isUpper(str: string): boolean {
  return str === str.toUpperCase() && str !== str.toLowerCase();
}

// Custom page rendering function for pdf-parse v1.1.1
async function renderPage(pageData: any): Promise<string> {
  const textContent = await pageData.getTextContent({
    normalizeWhitespace: false,
    disableCombineTextItems: false,
  });

  let lastY: number | undefined;
  let text = "";
  for (const item of textContent.items) {
    if (lastY === item.transform[5] || !lastY) {
      text += item.str;
    } else {
      text += "\n" + item.str;
    }
    lastY = item.transform[5];
  }

  const pageNum = pageData.pageNumber; // 1-based index
  return cleanPageText(text, pageNum === 1);
}

// ── Exported API ─────────────────────────────────────────────────────────────

export async function processarPDF(pdfPath: string): Promise<ExtractResult> {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const result = await pdf(dataBuffer, {
      pagerender: renderPage,
    });

    const fullText = result.text || "";

    const data_publicacao = extractDate(pdfPath) || "";
    const numero_edicao = extractEdition(fullText);
    const entriesInfo = findEntryStarts(fullText);
    const entradas: EntradaDiario[] = [];

    for (let i = 0; i < entriesInfo.length; i++) {
      const info = entriesInfo[i];
      const startPos = info.pos;
      const nextPos = i + 1 < entriesInfo.length ? entriesInfo[i + 1].pos : fullText.length;

      const endPos = findContentEnd(fullText, startPos, nextPos);
      const entryText = fullText.slice(startPos, endPos);

      const tipo = determineTipo(entryText);
      const numero_processo = extractProcessoNumber(entryText);
      const numero_decisao = extractDecisionNumber(entryText, tipo);

      let headerFields: Record<string, string> = {};
      if (info.type === "parecer_previo") {
        headerFields = extractParecerPrevioFields(entryText);
      } else {
        headerFields = extractHeaderFields(entryText);
      }

      let contentStart = findContentMarkerPos(entryText, tipo);

      if (contentStart === 0 && tipo !== "parecer_previo") {
        let lastFieldPos = 0;
        for (const [regex] of FIELD_LABELS) {
          const regexGlobal = new RegExp(`(?:^|\\n)(${regex.source})\\s*.*`, "gi");
          for (const m of entryText.matchAll(regexGlobal)) {
            if (m.index !== undefined) {
              const matchEnd = m.index + m[0].length;
              if (matchEnd > lastFieldPos) {
                lastFieldPos = matchEnd;
              }
            }
          }
        }
        if (lastFieldPos > 0) {
          contentStart = lastFieldPos;
        }
      }

      const content = contentStart > 0 ? entryText.slice(contentStart).trim() : "";
      const cleanedContent = cleanContentText(content);
      const conteudo_html = contentToHtml(cleanedContent);

      const entrada: EntradaDiario = {
        numero_processo,
        unidade_gestora: headerFields["unidade_gestora"] || null,
        interessados: headerFields["interessados"] || null,
        assunto: headerFields["assunto"] || null,
        relator: headerFields["relator"] || null,
        unidade_tecnica: headerFields["unidade_tecnica"] || null,
        tipo,
        numero_decisao: numero_decisao || null,
        conteudo_html: conteudo_html || null,
      };

      if (headerFields["responsavel"]) {
        entrada.responsavel = headerFields["responsavel"];
      }

      entradas.push(entrada);
    }

    return {
      data_publicacao,
      numero_edicao,
      entradas,
    };
  } catch (err: any) {
    return {
      data_publicacao: "",
      numero_edicao: null,
      entradas: [],
      error: err.message,
    };
  }
}

export async function processarVotoPDF(pdfPath: string): Promise<{ ementa_html: string; proposta_html: string }> {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const result = await pdf(dataBuffer);
    const fullText = result.text || "";

    const ementaHtml = extractEmenta(fullText);
    const propostaHtml = extractProposta(fullText);

    return {
      ementa_html: ementaHtml,
      proposta_html: propostaHtml,
    };
  } catch (err: any) {
    throw new Error(`Erro ao processar PDF do Voto: ${err.message}`);
  }
}
