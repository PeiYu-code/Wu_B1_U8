// script.js - PDF export version
let allWords = [];
let selectedWords = [];
let resultsForDownload = []; // { word, studentAns, correctChinese }

// Load words from JSON
async function loadWords() {
  const response = await fetch("word_bank.json");
  if (!response.ok) throw new Error("Failed to load word_bank.json");
  const data = await response.json();
  if (!Array.isArray(data.words)) throw new Error("Invalid word_bank.json format");
  allWords = data.words;
}

// Randomly pick up to 25 words
function pickRandom25(words) {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(25, shuffled.length));
}

// Start test
document.getElementById("startBtn").addEventListener("click", async () => {
  try {
    document.getElementById("startBtn").disabled = true;
    await loadWords();
  } catch (err) {
    alert("Failed to load word bank. Check filenames.");
    console.error(err);
    document.getElementById("startBtn").disabled = false;
    return;
  }

  selectedWords = pickRandom25(allWords);
  resultsForDownload = [];

  const testArea = document.getElementById("testArea");
  testArea.innerHTML = "";

  selectedWords.forEach((obj, i) => {
    const row = document.createElement("div");
    row.className = "word-row";
    row.innerHTML = `
      <b>${i + 1}. ${obj.word}</b>
      <input type="text" id="answer-${i}" placeholder="輸入中文意思">
    `;
    testArea.appendChild(row);
  });

  testArea.classList.remove("hidden");
  document.getElementById("submitBtn").classList.remove("hidden");
  document.getElementById("downloadBtn").classList.add("hidden");
  document.getElementById("resultTitle").classList.add("hidden");
  document.getElementById("results").innerHTML = "";
  document.getElementById("startBtn").disabled = false;
});

// Show correct answers
document.getElementById("submitBtn").addEventListener("click", async () => {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";
  document.getElementById("resultTitle").classList.remove("hidden");

  for (let i = 0; i < selectedWords.length; i++) {
    const word = selectedWords[i].word;
    const studentAns = document.getElementById(`answer-${i}`).value.trim();

    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-TW&dt=t&q=" +
      encodeURIComponent(word);

    let correctChinese = "（翻譯失敗）";
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      correctChinese = data?.[0]?.[0]?.[0] || "（無結果）";
    } catch (e) {
      console.error("Translation error:", word, e);
    }

    resultsForDownload.push({
      word,
      studentAns: studentAns || "（空白）",
      correctChinese
    });

    const row = document.createElement("div");
    row.innerHTML = `
      <p>
        <b>${word}</b><br>
        ➜ 你的答案：<span style="color:blue">${studentAns || "（空白）"}</span><br>
        ➜ 參考中文：<span style="color:green">${correctChinese}</span>
      </p>
      <hr>
    `;
    resultsDiv.appendChild(row);
  }

  document.getElementById("downloadBtn").classList.remove("hidden");
});

// Download results as PDF
document.getElementById("downloadBtn").addEventListener("click", () => {
  if (!resultsForDownload.length) {
    alert("No results to download.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 15;
  doc.setFontSize(14);
  doc.text("Vocabulary Test Results", 10, y);
  y += 8;

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 10, y);
  y += 10;

  resultsForDownload.forEach((r, i) => {
    if (y > 280) {
      doc.addPage();
      y = 15;
    }

    doc.text(`${i + 1}. ${r.word}`, 10, y);
    y += 6;
    doc.text(`Your answer: ${r.studentAns}`, 12, y);
    y += 6;
    doc.text(`Reference: ${r.correctChinese}`, 12, y);
    y += 10;
  });

  doc.save("vocab_results.pdf");
});
