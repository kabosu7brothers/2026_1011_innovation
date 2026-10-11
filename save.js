// save.js : 入力画面（index.html）の処理
// GitHub Pages は静的ページで、サーバー側のファイルへ書き込めない。
// そのため、入力内容をいったんページ内にためておき、
// 「いまのCSV + 追加分」をダウンロードできるようにする。
(function () {
    const form        = document.getElementById('save-form');
    const message     = document.getElementById('message');
    const pendingArea = document.getElementById('pending-area');
    const pendingBody = document.getElementById('pending-table');
    const countEl     = document.getElementById('pending-count');
    const downloadBtn = document.getElementById('download');
    const downloadNote = document.getElementById('download-note');

    let existing = null; // いま公開されているCSVの内容
    const pending = [];  // このページで追加した内容

    function show(text, className) {
        message.className = className;
        message.textContent = text;
    }

    function renderPending() {
        // ヘッダー行を残して、追加分の行を作り直す
        while (pendingBody.rows.length > 1) pendingBody.deleteRow(1);
        pending.forEach(function (r) {
            const tr = pendingBody.insertRow();
            tr.insertCell().textContent = r.title;
            tr.insertCell().textContent = r.area;
            const d = tr.insertCell();
            d.className = 'detail';
            d.textContent = r.detail;
        });
        countEl.textContent = pending.length;
        pendingArea.hidden = pending.length === 0;
    }

    // いまのCSVを読み込んでおく（ダウンロード時に追加分と合わせるため）
    loadRows().then(function (rows) {
        existing = rows;
    }).catch(function () {
        existing = null;
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const row = {
            title:  form.title.value.trim(),
            area:   form.area.value.trim(),
            detail: form.text1.value.trim()
        };
        if (row.title === '' && row.area === '' && row.detail === '') {
            show('何も入力されていません。', 'error');
            return;
        }
        pending.push(row);
        renderPending();
        form.reset();
        show('追加しました。続けて入力するか、「CSVをダウンロード」を押してください。', 'ok');
    });

    downloadBtn.addEventListener('click', async function () {
        // 読み込みに失敗していたら、もう一度試す
        if (existing === null) {
            try {
                existing = await loadRows();
            } catch (err) {
                downloadNote.className = 'error';
                downloadNote.textContent = 'いまのCSVを読み込めませんでした。サーバー経由（GitHub Pagesの公開アドレスなど）で開いているか確認してください。';
                return;
            }
        }
        const csv  = toCsv(existing.concat(pending));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = 'test_csv.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        downloadNote.className = 'ok';
        downloadNote.textContent = '全' + (existing.length + pending.length) + '件のCSVをダウンロードしました。';
    });
})();
