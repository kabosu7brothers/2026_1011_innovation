const SUPABASE_URL = "https://ksqauuhkeeavhavkhzch.supabase.co";
const SUPABASE_KEY = "sb_publishable_TWsX9lEaok49Kwcrt_vOhg_LICb91sU";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const animalList = document.getElementById("animalList");
const animalForm = document.getElementById("animalForm");
const submitButton = document.getElementById("submitButton");
const message = document.getElementById("message");

// メッセージ表示(成功:緑 / 失敗:赤)
function showMessage(text, isError = false) {
    message.textContent = text;
    message.className = isError ? "error" : "success";
}

// 生物データを取得して表示
async function loadAnimals() {
    const { data, error } = await supabaseClient
        .from("animal")
        .select("*");

    if (error) {
        console.error(error);
        alert("データ取得に失敗しました: " + error.message);
        return;
    }

    animalList.innerHTML = "";

    if (data.length === 0) {
        animalList.textContent = "データが0件です(RLSの設定を確認してください)";
        return;
    }

    data.forEach(animal => {
        const div = document.createElement("div");
        div.className = "animal";

        // textContentを使い、入力された文字がHTMLとして実行されないようにする
        const title = document.createElement("h3");
        title.textContent = animal.name;

        const area = document.createElement("p");
        area.textContent = "地域:" + animal.area;

        const description = document.createElement("p");
        description.textContent = animal.description ?? "";

        div.append(title, area, description);
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

if (animalForm) {
    animalForm.addEventListener("submit", addAnimal);
}

// 読み込みボタンが存在する画面（view.html）の場合
if (loadButton) {
    loadButton.addEventListener("click", loadAnimals);
}

// 閲覧画面（view.html）を開いたときに自動でデータを取得・表示する
if (animalList && !animalForm) {
    document.addEventListener("DOMContentLoaded", loadAnimals);
}
