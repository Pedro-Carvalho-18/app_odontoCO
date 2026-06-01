import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeString(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function rtfToHtml(rtf: string): string {
  if (!rtf || typeof rtf !== 'string') return rtf || "";
  if (!rtf.includes('{\\rtf')) return rtf; // Não é RTF ou não contém marcador RTF

  let html = rtf;

  // 1. Remover blocos de cabeçalho complexos de forma segura (lidando com chaves aninhadas)
  const removeBlock = (prefix: string, text: string) => {
    let startIndex = text.indexOf(prefix);
    while (startIndex !== -1) {
      let blockStart = text.lastIndexOf('{', startIndex);
      if (blockStart === -1) blockStart = startIndex;

      let braceCount = 0;
      let i = blockStart;
      let foundEnd = false;
      for (; i < text.length; i++) {
        if (text[i] === '{') braceCount++;
        if (text[i] === '}') braceCount--;
        if (braceCount === 0) {
          foundEnd = true;
          break;
        }
      }
      
      if (foundEnd) {
        text = text.substring(0, blockStart) + text.substring(i + 1);
      } else {
        break; // Proteção contra loop infinito em RTF malformado
      }
      startIndex = text.indexOf(prefix);
    }
    return text;
  };

  html = removeBlock('\\fonttbl', html);
  html = removeBlock('\\colortbl', html);
  html = removeBlock('\\stylesheet', html);
  html = removeBlock('\\info', html);
  html = removeBlock('\\*\\generator', html);
  html = removeBlock('\\pict', html);

  // 2. Decodificar caracteres Unicode \uN?
  html = html.replace(/\\u(-?\d+)\??/g, (match, dec) => {
    const code = parseInt(dec);
    return String.fromCharCode(code < 0 ? code + 65536 : code);
  });

  // 3. Decodificar caracteres hexadecimais \'hh
  html = html.replace(/\\'([0-9a-fA-F]{2})/gi, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  // 4. Converter marcações conhecidas para HTML
  html = html.replace(/\\b0(?![a-z0-9])/gi, "</strong>");
  html = html.replace(/\\b(?![a-z0-9])/gi, "<strong>");
  
  html = html.replace(/\\i0(?![a-z0-9])/gi, "</em>");
  html = html.replace(/\\i(?![a-z0-9])/gi, "<em>");
  
  html = html.replace(/\\ul0(?![a-z0-9])/gi, "</u>");
  html = html.replace(/\\ul(?![a-z0-9])/gi, "<u>");

  // Quebras de linha - Usar lookahead negativo para não dar match parcial em \pard
  html = html.replace(/\\par(?![a-z0-9])/gi, "<br>");
  html = html.replace(/\\line(?![a-z0-9])/gi, "<br>");
  html = html.replace(/\\tab(?![a-z0-9])/gi, "&nbsp;&nbsp;&nbsp;&nbsp;");

  // Alinhamento
  html = html.replace(/\\qc(?![a-z0-9])/gi, '<div style="text-align: center;">');
  html = html.replace(/\\ql(?![a-z0-9])/gi, '<div style="text-align: left;">');
  html = html.replace(/\\qr(?![a-z0-9])/gi, '<div style="text-align: right;">');
  html = html.replace(/\\qj(?![a-z0-9])/gi, '<div style="text-align: justify;">');
  html = html.replace(/\\pard(?![a-z0-9])/gi, '</div>');

  // 5. Limpar todos os outros comandos RTF (iniciam com \ seguido de letras e possivelmente números)
  html = html.replace(/\\[*a-zA-Z]+[-0-9]*\s?/g, "");

  // 6. Remover chaves restantes e limpar espaços extras
  html = html.replace(/[{}]/g, "");
  html = html.replace(/\r?\n/g, " ");
  html = html.replace(/\s+/g, " ").trim();
  
  // Limpar fechamentos de div vazios ou no início
  html = html.replace(/^(<\/div>\s*)+/g, "");

  return html;
}
