const SUPABASE_URL = "https://sdorkxwgzdynyjnkmpzi.supabase.co";//SupabaseのURL
const SUPABASE_KEY = "sb_publishable_Mttjc-U-xVtUP9hYBblLdA_jQpHrUUN";//supabaseの公開鍵

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const animalList = document.getElementById("animalList");//出力用の変数。animallistはindex.html参照
const animalForm = document.getElementById("animalForm");//動物登録用。()の中身は上と同様から参照
const submitButton = document.getElementById("submitButton");
const message = document.getElementById("message");

// メッセージ表示(成功:緑 / 失敗:赤)、色や大きさはStyle.cssで変更可能
function showMessage(text, isError = false) {
    message.textContent = text;
    message.className = isError ? "error" : "success";//isError=trueの時、"error"が表示される仕組み
}

// 生物データを取得して表示(view.htmlでの処理)
async function loadAnimals() {
    const { data, error } = await supabaseClient//await=この処理が終わるまで待って！
        .from("animal")//どのデータベースから？→animal
        .select("*");//どれを選ぶの？→*(全部)

    if (error) {//エラーが出たら？
        console.error(error);
        alert("データ取得に失敗しました: " + error.message);
        return;
    }

    animalList.innerHTML = "";//html上のアイテムを取得

    if (data.length === 0) {
        animalList.textContent = "データが0件です(RLSの設定を確認してください)";
        return;
    }

    data.forEach(animal => {//animal要素にそれぞれ処理を行う
        const div = document.createElement("div");//タグ生成
        div.className = "animal";

        // textContentを使い、入力された文字がHTMLとして実行されないようにする
        const title = document.createElement("h3");//タグ生成
        title.textContent = animal.name;//<h3>動物の名前</h3>←こんな感じになる

        const area = document.createElement("p");//タグ生成
        area.textContent = "地域:" + animal.area;//<p>地域：地域の名前</p>←こんな感じになる

        const description = document.createElement("p");//タグ生成
        description.textContent = animal.description ?? "";//<p>詳細の文章</p>←こんな感じになる

        div.append(title, area, description);//以上の要素をview.htmlで表示するanimallistに追加
        animalList.appendChild(div);
    });
}

// 生物データを登録
async function addAnimal(event) {
    event.preventDefault(); // ページの再読み込みを防ぐ

    const name = document.getElementById("nameInput").value.trim();
    const area = document.getElementById("areaInput").value.trim();
    const description = document.getElementById("descriptionInput").value.trim();

    if (!name || !area) {
        showMessage("名前と地域を入力してください", true);
        return;
    }

    submitButton.disabled = true; // 二重送信を防ぐ
    showMessage("登録中...");

    const { error } = await supabaseClient
        .from("animal")
        .insert({
            name: name,
            area: area,
            description: description || null
        });

    submitButton.disabled = false;

    if (error) {
        console.error(error);
        showMessage("登録に失敗しました: " + error.message, true);
        return;
    }

    showMessage("登録しました!");
    animalForm.reset();
    loadAnimals(); // 登録後に一覧を更新
}

// イベント登録
//index.htmlでの処理
if (animalForm) {
    animalForm.addEventListener("submit", addAnimal);
}

// 読み込みボタンが存在する画面（view.html）の場合
if (loadButton) {
    loadButton.addEventListener("click", loadAnimals);
}
