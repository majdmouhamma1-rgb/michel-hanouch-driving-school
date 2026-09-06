// Private-car quiz: Arabic / English / French language selection + random 30 questions.

let QUESTIONS = [];
let currentLang = "ar";

let quiz = {
  list: [],
  index: 0,
  score: 0,
  selected: null,
  locked: false,
  answers: [],
  _lastNextAt: 0
};

const TAKE_COUNT = 30;

const UI = {
  ar: {
    dir: "rtl",
    htmlLang: "ar",
    title: "اختبار قيادة السيارات خصوصي",
    school: "مدرسة ميشال جوزيف حنوش",
    question: "السؤال",
    of: "من",
    confirm: "تأكيد الإجابة",
    next: "السؤال التالي",
    result: "النتيجة",
    score: "علامتك",
    status: "النتيجة",
    pass: "ناجح",
    fail: "راسب",
    retry: "إعادة اختبار (30 سؤال)",
    home: "الرجوع للرئيسية",
    changeLanguage: "تغيير اللغة",
    yourAnswer: "إجابتك:",
    correctAnswer: "الصحيح:",
    unanswered: "لم تُجب",
    unavailable: "غير متوفر",
    reviewQuestion: "سؤال",
    error: "تعذر تحميل أسئلة الاختبار"
  },
  en: {
    dir: "ltr",
    htmlLang: "en",
    title: "Private Car Driving Test",
    school: "Michel Joseph Hanouch Driving School",
    question: "Question",
    of: "of",
    confirm: "Confirm Answer",
    next: "Next Question",
    result: "Result",
    score: "Your Score",
    status: "Result",
    pass: "Passed",
    fail: "Failed",
    retry: "New Test (30 Questions)",
    home: "Back to Home",
    changeLanguage: "Change Language",
    yourAnswer: "Your answer:",
    correctAnswer: "Correct answer:",
    unanswered: "Not answered",
    unavailable: "Not available",
    reviewQuestion: "Question",
    error: "Could not load the test questions"
  },
  fr: {
    dir: "ltr",
    htmlLang: "fr",
    title: "Test de conduite - Voiture particulière",
    school: "Auto-école Michel Joseph Hanouch",
    question: "Question",
    of: "sur",
    confirm: "Confirmer la réponse",
    next: "Question suivante",
    result: "Résultat",
    score: "Votre note",
    status: "Résultat",
    pass: "Réussi",
    fail: "Échoué",
    retry: "Nouveau test (30 questions)",
    home: "Retour à l'accueil",
    changeLanguage: "Changer la langue",
    yourAnswer: "Votre réponse :",
    correctAnswer: "Bonne réponse :",
    unanswered: "Sans réponse",
    unavailable: "Non disponible",
    reviewQuestion: "Question",
    error: "Impossible de charger les questions du test"
  }
};

function t() {
  return UI[currentLang] || UI.ar;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function loadQuestions(lang) {
  const files = {
    ar: "car_questions.json",
    en: "car_questions_en.json",
    fr: "car_questions_fr.json"
  };

  const file = files[lang] || files.ar;
  const res = await fetch(file, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load ${file}`);
  return await res.json();
}

function setButtonEnabled(btn, enabled) {
  if (!btn) return;
  btn.disabled = !enabled;
  btn.setAttribute("aria-disabled", String(!enabled));
  btn.style.pointerEvents = enabled ? "auto" : "none";
}

function bindTap(el, handler) {
  if (!el) return;
  const wrapped = (e) => {
    if (el.disabled) return;
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    handler(e);
  };

  if (window.PointerEvent) {
    el.addEventListener("pointerup", wrapped, { passive: false });
  } else {
    el.addEventListener("touchend", wrapped, { passive: false });
    el.addEventListener("click", wrapped);
  }
}

function preloadImages(list) {
  (list || []).forEach((q) => {
    const src = q && q.image ? String(q.image) : "";
    if (src.trim() !== "") {
      const img = new Image();
      img.src = src;
    }
  });
}

function applyLanguageUI() {
  const ui = t();
  document.documentElement.lang = ui.htmlLang;
  document.documentElement.dir = ui.dir;
  document.body.dir = ui.dir;
  document.title = ui.title;

  document.getElementById("quizTitle").textContent = ui.title;
  document.getElementById("resultTitle").textContent = ui.result;
  document.getElementById("confirmBtn").textContent = ui.confirm;
  document.getElementById("nextBtn").textContent = ui.next;
  document.getElementById("retryBtn").textContent = ui.retry;
  document.getElementById("homeBtn").textContent = ui.home;
  document.getElementById("changeLangBtn").textContent = ui.changeLanguage;
  document.getElementById("userName").textContent = ui.school;
}

function setProgress() {
  const ui = t();
  const pct = quiz.list.length ? (quiz.index / quiz.list.length) * 100 : 0;
  const progressEl = document.getElementById("progress");
  if (progressEl) progressEl.style.setProperty("--p", `${pct}%`);

  const counterEl = document.getElementById("qCounterTop");
  if (counterEl) {
    counterEl.textContent = `${ui.question} ${quiz.index + 1} ${ui.of} ${quiz.list.length}`;
  }
}

function renderQuestion() {
  const q = quiz.list[quiz.index];
  const qTextEl = document.getElementById("qText");
  const qImgEl = document.getElementById("qImg");

  quiz.selected = null;
  quiz.locked = false;

  const confirmBtn = document.getElementById("confirmBtn");
  const nextBtn = document.getElementById("nextBtn");
  setButtonEnabled(confirmBtn, false);
  setButtonEnabled(nextBtn, false);

  const fb = document.getElementById("feedback");
  if (fb) {
    fb.className = "feedback hidden";
    fb.textContent = "";
  }

  const hasImg = q && q.image && String(q.image).trim() !== "";
  if (hasImg) {
    qImgEl.src = q.image;
    qImgEl.classList.remove("hidden");
  } else {
    qImgEl.removeAttribute("src");
    qImgEl.classList.add("hidden");
  }

  const questionText = q && q.question ? String(q.question).trim() : "";
  qTextEl.textContent = questionText;
  qTextEl.classList.toggle("hidden", questionText === "");

  const box = document.getElementById("choices");
  box.innerHTML = "";

  (q.choices || []).forEach((text, idx) => {
    if (String(text || "").trim() === "") return;

    const btn = document.createElement("button");
    btn.className = "choice";
    btn.type = "button";

    const span = document.createElement("span");
    span.textContent = text;
    btn.appendChild(span);
    btn.dataset.index = String(idx);

    bindTap(btn, () => {
      if (quiz.locked) return;
      [...box.querySelectorAll(".choice")].forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      quiz.selected = idx;
      setButtonEnabled(confirmBtn, true);
    });

    box.appendChild(btn);
  });

  setProgress();
}

function revealAnswer() {
  const q = quiz.list[quiz.index];
  const chosen = quiz.selected;
  if (chosen === null) return;

  quiz.locked = true;
  const box = document.getElementById("choices");
  const buttons = [...box.querySelectorAll(".choice")];
  const correct = q.correctIndex;

  quiz.answers[quiz.index] = { id: q.id, chosenIndex: chosen, correctIndex: correct };

  if (typeof correct !== "number") {
    setButtonEnabled(document.getElementById("nextBtn"), true);
    setButtonEnabled(document.getElementById("confirmBtn"), false);
    return;
  }

  buttons.forEach((btn) => {
    const idx = Number(btn.dataset.index);
    if (idx === correct) btn.classList.add("correct");
    if (idx === chosen && chosen !== correct) btn.classList.add("wrong");
    btn.style.pointerEvents = "none";
  });

  if (chosen === correct) quiz.score += 1;
  setButtonEnabled(document.getElementById("nextBtn"), true);
  setButtonEnabled(document.getElementById("confirmBtn"), false);
}

function nextQuestion() {
  if (!quiz.locked) return;

  const now = Date.now();
  if (now - quiz._lastNextAt < 250) return;
  quiz._lastNextAt = now;

  if (quiz.index < quiz.list.length - 1) {
    quiz.index += 1;
    renderQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  const ui = t();
  document.getElementById("quizView").classList.add("hidden");
  document.getElementById("resultsView").classList.remove("hidden");

  const phone = localStorage.getItem("quiz_phone") || "03 467 094";
  document.getElementById("resultUser").textContent = `${ui.school} - ${phone}`;

  const passed = quiz.score >= 24;
  document.getElementById("scoreBox").innerHTML = `
    <div class="score-title">${ui.score}</div>
    <div class="score-value">${quiz.score} / ${quiz.list.length}</div>
    <div class="result-status ${passed ? "pass" : "fail"}">
      ${ui.status}: ${passed ? ui.pass : ui.fail}
    </div>
  `;

  const review = document.getElementById("reviewList");
  review.innerHTML = "";

  quiz.list.forEach((q, i) => {
    const a = quiz.answers[i] || { chosenIndex: null, correctIndex: q.correctIndex };

    const chosenText =
      a.chosenIndex !== null && q.choices[a.chosenIndex] !== undefined
        ? q.choices[a.chosenIndex]
        : ui.unanswered;

    const correctText =
      typeof a.correctIndex === "number" && q.choices[a.correctIndex] !== undefined
        ? q.choices[a.correctIndex]
        : ui.unavailable;

    const isCorrect = typeof a.correctIndex === "number" && a.chosenIndex === a.correctIndex;
    const qText = String(q.question || "").trim();
    const hasImg = q.image && String(q.image).trim() !== "";

    const item = document.createElement("div");
    item.className = "review-item";
    item.innerHTML = `
      <div class="review-q">
        <div class="review-num">${ui.reviewQuestion} ${i + 1}</div>
        ${hasImg ? `<img class="qimg" src="${q.image}" alt="question image">` : ""}
        ${qText ? `<div class="review-text"></div>` : ""}
      </div>
      <div class="review-answers">
        <div class="ans-row ${isCorrect ? "ans-ok" : "ans-bad"}">
          <span class="ans-label">${ui.yourAnswer}</span>
          <span class="ans-value"></span>
        </div>
        <div class="ans-row ans-ok">
          <span class="ans-label">${ui.correctAnswer}</span>
          <span class="ans-value"></span>
        </div>
      </div>
    `;

    if (qText) item.querySelector(".review-text").textContent = qText;
    const values = item.querySelectorAll(".ans-value");
    values[0].textContent = chosenText;
    values[1].textContent = correctText;
    review.appendChild(item);
  });
}

function resetQuizState() {
  quiz.index = 0;
  quiz.score = 0;
  quiz.selected = null;
  quiz.locked = false;
  quiz.answers = [];
  quiz._lastNextAt = 0;
  quiz.list = shuffle(QUESTIONS).slice(0, Math.min(TAKE_COUNT, QUESTIONS.length));
  preloadImages(quiz.list);
}

function startNewExam() {
  resetQuizState();
  document.getElementById("languageView").classList.add("hidden");
  document.getElementById("resultsView").classList.add("hidden");
  document.getElementById("quizView").classList.remove("hidden");
  renderQuestion();
}

async function selectLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("car_quiz_language", lang);
  applyLanguageUI();

  try {
    QUESTIONS = await loadQuestions(lang);
    startNewExam();
  } catch (err) {
    alert(`${t().error}: ${err.message}`);
  }
}

function showLanguageSelection() {
  document.documentElement.lang = "ar";
  document.documentElement.dir = "rtl";
  document.body.dir = "rtl";
  document.getElementById("quizView").classList.add("hidden");
  document.getElementById("resultsView").classList.add("hidden");
  document.getElementById("languageView").classList.remove("hidden");
}

function init() {
  const phone = localStorage.getItem("quiz_phone") || "03 467 094";
  document.getElementById("userPhone").textContent = phone;

  document.querySelectorAll(".language-btn").forEach((btn) => {
    bindTap(btn, () => selectLanguage(btn.dataset.lang));
  });

  bindTap(document.getElementById("confirmBtn"), revealAnswer);
  bindTap(document.getElementById("nextBtn"), nextQuestion);
  bindTap(document.getElementById("retryBtn"), startNewExam);
  bindTap(document.getElementById("changeLangBtn"), showLanguageSelection);
  bindTap(document.getElementById("homeBtn"), () => { window.location.href = "index.html"; });
  bindTap(document.getElementById("languageHomeBtn"), () => { window.location.href = "index.html"; });

  showLanguageSelection();
}

init();
