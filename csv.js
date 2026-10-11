// csv.js : CSVファイルの読み込みと書き出し（全画面で共通して使う）
// サーバーを使わず、ブラウザの中だけで処理する。
const CSV_FILE = './test_csv.csv';

/** CSVの文字列を [[列, 列, ...], ...] に分解する（引用符・カンマ・改行入りの項目に対応） */
function parseCsv(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') { field += '"'; i++; }
                else { inQuotes = false; }
            } else {
                field += c;
            }
        } else if (c === '"') {
            inQuotes = true;
        } else if (c === ',') {
            row.push(field); field = '';
        } else if (c === '\r') {
            // 改行コードの CR は読み飛ばす
        } else if (c === '\n') {
            row.push(field); rows.push(row); row = []; field = '';
        } else {
            field += c;
        }
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
}

/** test_csv.csv を読み込み、[{title, area, detail}, ...] を返す */
async function loadRows() {
    const res = await fetch(CSV_FILE, { cache: 'no-store' });
    if (!res.ok) {
        throw new Error('CSVファイルを読み込めませんでした（' + res.status + '）。');
    }
    const text = (await res.text()).replace(/^﻿/, ''); // 先頭のBOMを除去

    const rows = [];
    let first = true;
    parseCsv(text).forEach(function (cols) {
        if (cols.length === 1 && cols[0] === '') return; // 空行
        if (first) {
            first = false;
            if (cols[0] === 'title' && cols[1] === 'area') return; // ヘッダー行
        }
        const row = { title: cols[0] || '', area: cols[1] || '', detail: cols[2] || '' };
        if (row.title === '' && row.area === '' && row.detail === '') return; // 3項目とも空
        rows.push(row);
    });
    return rows;
}

/** [{title, area, detail}, ...] をCSVの文字列にする（Excelで文字化けしないようBOM付き） */
function toCsv(rows) {
    function q(v) {
        v = String(v);
        return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }
    const lines = ['title,area,detail'].concat(rows.map(function (r) {
        return [r.title, r.area, r.detail].map(q).join(',');
    }));
    return '﻿' + lines.join('\r\n') + '\r\n';
}

/** 部分一致（大文字小文字を区別しない） */
function contains(haystack, needle) {
    return haystack.toLowerCase().indexOf(needle.toLowerCase()) !== -1;
}
