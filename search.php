<?php
// search.php : test_csv.csv を読み込んで検索するだけの処理（画面は持たない）
//
//   一覧   : search.php?keyword=...&area=...
//            → {"records":[{"id":0,"title":"..","area":"..","detail":".."}, ...]}
//   詳細   : search.php?id=番号
//            → {"row":{"title":"..","area":"..","detail":".."}}
//   失敗時 : {"error":"メッセージ"}
header('Content-Type: application/json; charset=utf-8');

/** 部分一致（大文字小文字を区別しない）。mbstring が無効な環境でも動くようにする */
function contains($haystack, $needle) {
    if (function_exists('mb_stripos')) {
        return mb_stripos($haystack, $needle) !== false;
    }
    return stripos($haystack, $needle) !== false;
}

/** JSONを出力して終了 */
function respond($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** CSVを読み込んで [['title'=>..,'area'=>..,'detail'=>..], ...] を返す。読めなければ null */
function loadCsv($path) {
    $rows = [];
    if (!file_exists($path) || filesize($path) === 0) {
        return $rows;
    }
    $fp = fopen($path, 'r');
    if ($fp === false) {
        return null;
    }
    $first = true;
    while (($cols = fgetcsv($fp, 0, ',', '"', '')) !== false) {
        if ($cols === [null]) {
            continue; // 空行
        }
        if ($first) {
            $first = false;
            // 先頭のBOMを除去
            $cols[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string)$cols[0]);
            // ヘッダー行はスキップ
            if (($cols[0] ?? '') === 'title' && ($cols[1] ?? '') === 'area') {
                continue;
            }
        }
        $row = [
            'title'  => $cols[0] ?? '',
            'area'   => $cols[1] ?? '',
            'detail' => $cols[2] ?? '',
        ];
        // 3項目とも空のデータは読み飛ばす
        if ($row['title'] === '' && $row['area'] === '' && $row['detail'] === '') {
            continue;
        }
        $rows[] = $row;
    }
    fclose($fp);
    return $rows;
}

// ---- 入力の受け取り ----
$keyword = trim($_GET['keyword'] ?? '');
$area    = trim($_GET['area'] ?? '');

// ---- データの読み込み ----
$all = loadCsv(__DIR__ . DIRECTORY_SEPARATOR . 'test_csv.csv');
if ($all === null) {
    respond(['error' => 'CSVファイルを読み込めませんでした。'], 500);
}

// ---- 詳細（?id=番号 が付いているとき） ----
if (isset($_GET['id'])) {
    $id = filter_var($_GET['id'], FILTER_VALIDATE_INT);
    if ($id === false || !isset($all[$id])) {
        respond(['error' => '該当するデータが見つかりませんでした。'], 404);
    }
    respond(['row' => $all[$id]]);
}

// ---- 一覧：絞り込み ----
$records = [];
foreach ($all as $i => $row) {
    // 地域: 部分一致
    if ($area !== '' && !contains($row['area'], $area)) {
        continue;
    }
    // キーワード: タイトル・地域・詳細のどれかに部分一致
    if ($keyword !== '') {
        $hit = contains($row['title'], $keyword)
            || contains($row['area'], $keyword)
            || contains($row['detail'], $keyword);
        if (!$hit) {
            continue;
        }
    }
    $row['id'] = $i; // 読み込み順の番号（詳細画面用）
    $records[] = $row;
}

respond(['records' => $records]);
