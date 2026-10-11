<?php
// save.php : 入力内容を test_csv.csv に追記するだけの処理（画面は持たない）
//
//   POST: title, area, text1
//   成功 : {"message":"CSVファイルに書き込みました。"}
//   失敗 : {"error":"メッセージ"}
header('Content-Type: application/json; charset=utf-8');

/** JSONを出力して終了 */
function respond($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => '不正なアクセスです。入力画面（test_index.html）から送信してください。'], 405);
}

$title = trim($_POST['title'] ?? '');
$area  = trim($_POST['area'] ?? '');
$text1 = trim($_POST['text1'] ?? '');

if ($title === '' && $area === '' && $text1 === '') {
    respond(['error' => '何も入力されていません。'], 400);
}

$csvFile = __DIR__ . DIRECTORY_SEPARATOR . 'test_csv.csv';
$header  = "title,area,detail\r\n";

// 読み書き両用で開く（無ければ作成。既存内容は消さない）
$fp = fopen($csvFile, 'c+');
if ($fp === false) {
    respond(['error' => 'CSVファイルを開けませんでした。書き込み権限を確認してください。'], 500);
}
flock($fp, LOCK_EX);

// 既存の内容を整える:
//  - 先頭のBOMを一旦外す
//  - 先頭の空行を取り除く
//  - ヘッダー行が無ければ付ける
$content = (string)stream_get_contents($fp);
$content = preg_replace('/^\xEF\xBB\xBF/', '', $content);
$content = ltrim($content, "\r\n");
if ($content === '') {
    $content = $header;
} elseif (strncmp($content, 'title,area,detail', 17) !== 0) {
    $content = $header . $content;
}
if (substr($content, -1) !== "\n") {
    $content .= "\r\n";
}

// 新しい1行をCSV形式に変換
$tmp = fopen('php://temp', 'r+');
fputcsv($tmp, [$title, $area, $text1], ',', '"', '');
rewind($tmp);
$newLine = stream_get_contents($tmp);
fclose($tmp);

// Excelで文字化けしないよう、先頭にUTF-8のBOMを付けて全体を書き直す
ftruncate($fp, 0);
rewind($fp);
$written = fwrite($fp, "\xEF\xBB\xBF" . $content . $newLine);
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

if ($written === false) {
    respond(['error' => 'CSVファイルへの書き込みに失敗しました。'], 500);
}

respond(['message' => 'CSVファイルに書き込みました。']);
