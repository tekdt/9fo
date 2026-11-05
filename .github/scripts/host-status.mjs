#!/usr/bin/env node
// host-status.mjs — cập nhật cột "Status" của bảng "Live endpoints" trong README.
//
// Vì sao chỉ sửa MỘT cột: bảng host do người viết tay, worker chạy mỗi giờ nên chỉ
// được phép ghi đè đúng ô Status, giữ nguyên mọi ô khác (Host, Base URL, Provider,
// Region, Notes). Nếu không, mọi thay đổi định dạng của người viết sẽ bị ghi đè.
//
// Phân loại:
//   Live      → GET <base>/v1/models trả 2xx và body là JSON
//   Degraded  → host có phản hồi HTTP nhưng 429/4xx/5xx, hoặc 2xx không phải JSON,
//               hoặc /v1/models lỗi mạng nhưng base URL vẫn phản hồi
//   Dead      → cả /v1/models và base URL đều lỗi mạng (timeout/DNS/refused)
//   Unknown   → ô Base URL không phải http(s) (vd "Not available")
//
// Cờ:
//   --file=<path>   README cần xử lý (mặc định README.md)
//   --parse-only    chỉ in các dòng parse được, KHÔNG gọi mạng, KHÔNG ghi file
//   --dry-run       gọi mạng nhưng KHÔNG ghi file, chỉ in kết quả
//
// Không phụ thuộc package ngoài. Cần Node >= 18 (fetch + AbortController).

import fs from 'node:fs';
import path from 'node:path';

const TIMEOUT_MS = 12000;
const UA = '9fo-host-status/1.0 (+https://github.com/tekdt/9fo)';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => {
  const hit = args.find((a) => a.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : dflt;
};

const FILE = path.resolve(process.cwd(), opt('--file', 'README.md'));
const PARSE_ONLY = flag('--parse-only');
const DRY_RUN = flag('--dry-run');

/** Tách một dòng bảng markdown thành mảng ô, GIỮ nguyên khoảng trắng bao quanh. */
function splitRow(line) {
  return line.split('|');
}

function isSeparator(line) {
  return /^\s*\|[\s:|-]+\|\s*$/.test(line);
}

/** Lấy text thật trong ô: bỏ backtick, mở link markdown nếu có. */
function cellText(cell) {
  let t = String(cell || '').trim();
  const link = t.match(/^\[[^\]]*\]\(([^)]+)\)$/);
  if (link) t = link[1];
  t = t.replace(/`/g, '').trim();
  return t;
}

/**
 * Tìm bảng "Live endpoints": dòng header chứa Host + Base URL + Status.
 * Trả { headerIdx, baseIdx, statusIdx, endIdx } hoặc null.
 */
function findTable(lines) {
  const headerIdx = lines.findIndex((l) => /^\s*\|/.test(l)
    && /\bhost\b/i.test(l) && /base url/i.test(l) && /\bstatus\b/i.test(l));
  if (headerIdx === -1) return null;

  const header = splitRow(lines[headerIdx]);
  const baseIdx = header.findIndex((c) => /base url/i.test(c));
  const statusIdx = header.findIndex((c) => /^\s*status\s*$/i.test(c));
  if (baseIdx === -1 || statusIdx === -1) return null;

  let endIdx = headerIdx + 1;
  while (endIdx < lines.length && /^\s*\|/.test(lines[endIdx])) endIdx++;
  return { headerIdx, baseIdx, statusIdx, endIdx };
}

async function fetchOnce(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        accept: 'application/json, text/html;q=0.9, */*;q=0.8',
        'user-agent': UA,
      },
    });
    return { reachable: true, status: res.status, res };
  } catch (e) {
    return { reachable: false, error: e && e.name === 'AbortError' ? 'timeout' : String(e && e.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

async function classify(base) {
  if (!/^https?:\/\//i.test(base)) return 'Unknown';
  const root = base.replace(/\/+$/, '');

  const models = await fetchOnce(`${root}/v1/models`);
  if (models.reachable && models.status >= 200 && models.status < 300) {
    let body = '';
    try { body = await models.res.text(); } catch { /* ignore */ }
    try { JSON.parse(body); return 'Live'; } catch { return 'Degraded'; }
  }
  if (models.reachable) return 'Degraded'; // 429 / 4xx / 5xx nhưng host có phản hồi

  // /v1/models lỗi mạng → thử base URL để phân biệt "host chết" và "endpoint sai".
  const home = await fetchOnce(`${root}/`);
  return home.reachable ? 'Degraded' : 'Dead';
}

function parseRows(lines, table) {
  const rows = [];
  for (let i = table.headerIdx + 1; i < table.endIdx; i++) {
    const line = lines[i];
    if (isSeparator(line)) continue;
    const cells = splitRow(line);
    if (cells.length <= Math.max(table.baseIdx, table.statusIdx)) continue;
    rows.push({
      lineIdx: i,
      cells,
      host: cellText(cells[1]),
      base: cellText(cells[table.baseIdx]),
      currentStatus: cellText(cells[table.statusIdx]),
    });
  }
  return rows;
}

async function main() {
  if (!fs.existsSync(FILE)) {
    console.error(`Không thấy file: ${FILE}`);
    process.exit(1);
  }
  const original = fs.readFileSync(FILE, 'utf8');
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  const lines = original.split(/\r?\n/);

  const table = findTable(lines);
  if (!table) {
    console.error('Không tìm thấy bảng "Live endpoints" (cần header có Host + Base URL + Status).');
    process.exit(1);
  }

  const rows = parseRows(lines, table);
  if (!rows.length) {
    console.error('Bảng tìm thấy nhưng không có dòng dữ liệu.');
    process.exit(1);
  }

  if (PARSE_ONLY) {
    console.log(`Bảng tại dòng ${table.headerIdx + 1}, cột Base URL=${table.baseIdx}, Status=${table.statusIdx}`);
    for (const r of rows) {
      console.log(`  • ${r.host || '(không tên)'} | base="${r.base}" | status hiện tại="${r.currentStatus}"`);
    }
    return;
  }

  let changed = 0;
  for (const r of rows) {
    const status = await classify(r.base);
    const mark = status === r.currentStatus ? '=' : '→';
    console.log(`  ${status.padEnd(8)} ${mark} ${r.host || r.base} (${r.base})`);
    if (status !== r.currentStatus) {
      r.cells[table.statusIdx] = ` ${status} `;
      lines[r.lineIdx] = r.cells.join('|');
      changed++;
    }
  }

  if (!changed) {
    console.log('Không có thay đổi trạng thái.');
    return;
  }
  if (DRY_RUN) {
    console.log(`[dry-run] Sẽ cập nhật ${changed} dòng, không ghi file.`);
    return;
  }

  const next = lines.join(eol);
  if (next === original) {
    console.log('Nội dung không đổi sau khi ghép lại.');
    return;
  }
  fs.writeFileSync(FILE, next, 'utf8');
  console.log(`Đã cập nhật ${changed} dòng trong ${FILE}`);
}

main().catch((e) => {
  console.error(`Lỗi không xử lý: ${e && e.stack || e}`);
  process.exit(1);
});
