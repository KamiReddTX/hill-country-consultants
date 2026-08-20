import type { ReactNode } from "react";

/** Inline formatting: **bold** and *italic*. */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  // Split on **bold** first, then *italic* within plain runs.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  parts.forEach((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) {
      out.push(<strong key={`${keyBase}-b${i}`} className="font-semibold text-charcoal">{p.slice(2, -2)}</strong>);
    } else {
      const its = p.split(/(\*[^*]+\*)/g);
      its.forEach((q, j) => {
        if (/^\*[^*]+\*$/.test(q)) out.push(<em key={`${keyBase}-i${i}-${j}`}>{q.slice(1, -1)}</em>);
        else if (q) out.push(<span key={`${keyBase}-t${i}-${j}`}>{q}</span>);
      });
    }
  });
  return out;
}

const cells = (line: string) => line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

/** Minimal markdown → styled JSX. Supports #/##/### headings, --- rules,
 *  GFM tables, - bullet lists, blockquotes, **bold**/*italic*, and paragraphs.
 *  Enough for job postings without pulling in a markdown dependency. */
export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;
  const nextKey = () => `md-${k++}`;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (!line.trim()) { i++; continue; }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) { blocks.push(<span key={nextKey()} className="rule-gold my-6 block" />); i++; continue; }

    // Headings
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const txt = h[2];
      if (level === 1) blocks.push(<h1 key={nextKey()} className="mt-2 font-fraunces text-[34px] leading-tight text-forest">{inline(txt, nextKey())}</h1>);
      else if (level === 2) blocks.push(<h2 key={nextKey()} className="mt-8 font-fraunces text-[24px] text-forest">{inline(txt, nextKey())}</h2>);
      else if (level === 3) blocks.push(<h3 key={nextKey()} className="mt-6 font-fraunces text-[19px] text-forest">{inline(txt, nextKey())}</h3>);
      else blocks.push(<h4 key={nextKey()} className="mt-4 text-[15px] font-semibold text-charcoal">{inline(txt, nextKey())}</h4>);
      i++; continue;
    }

    // Table (a | line followed by a |---| separator)
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:-]+\|[\s:|-]*$/.test(lines[i + 1])) {
      const head = cells(line);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) { rows.push(cells(lines[i])); i++; }
      blocks.push(
        <div key={nextKey()} className="my-4 overflow-x-auto border border-line-warm">
          <table className="w-full min-w-[520px] border-collapse bg-white text-left text-[14px]">
            <thead><tr className="border-b border-line-soft text-ink-faint">{head.map((c, ci) => <th key={ci} className="p-3 font-medium">{inline(c, `${nextKey()}-th${ci}`)}</th>)}</tr></thead>
            <tbody>{rows.map((r, ri) => <tr key={ri} className="border-b border-line-soft/60 align-top">{r.map((c, ci) => <td key={ci} className="p-3 prose-soft">{inline(c, `${nextKey()}-td${ri}-${ci}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }

    // Bullet list
    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*-\s+/, "")); i++; }
      blocks.push(<ul key={nextKey()} className="my-3 flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed prose-soft">{items.map((it, ii) => <li key={ii}>{inline(it, `${nextKey()}-li${ii}`)}</li>)}</ul>);
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      blocks.push(<p key={nextKey()} className="my-3 border-l-2 border-gold pl-3 text-[15px] italic prose-muted">{inline(line.replace(/^>\s?/, ""), nextKey())}</p>);
      i++; continue;
    }

    // Paragraph (gather consecutive non-empty, non-structural lines)
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|---+$|\s*-\s|>\s?)/.test(lines[i]) && !(lines[i].includes("|") && i + 1 < lines.length && /^\s*\|?[\s:-]+\|/.test(lines[i + 1]))) {
      para.push(lines[i]); i++;
    }
    blocks.push(<p key={nextKey()} className="my-3 text-[15px] leading-relaxed prose-soft">{inline(para.join(" "), nextKey())}</p>);
  }

  return <div className="max-w-[52em]">{blocks}</div>;
}
