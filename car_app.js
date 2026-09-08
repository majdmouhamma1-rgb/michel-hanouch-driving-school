// =====================================================
// MICHEL HANOUCH DRIVING SCHOOL
// PRIVATE CAR QUIZ
// Arabic / English / French
// 30 Random Questions
// 15 Minute Timer
// Test History
// =====================================================


// =====================================================
// QUESTIONS + QUIZ STATE
// =====================================================

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


// =====================================================
// 15 MINUTE TIMER
// =====================================================

const QUIZ_DURATION_SECONDS = 15 * 60;

let quizTimerInterval = null;

let quizEndTime = null;

let timerFinished = false;


// =====================================================
// LANGUAGE TEXT
// =====================================================

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


// =====================================================
// GET CURRENT LANGUAGE
// =====================================================

function t() {

  return UI[currentLang] || UI.ar;

}


// =====================================================
// RANDOMIZE ARRAY
// =====================================================

function shuffle(arr) {

  const a = [...arr];


  for (let i = a.length - 1; i > 0; i--) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );


    [a[i], a[j]] =
      [a[j], a[i]];

  }


  return a;

}


// =====================================================
// LOAD QUESTIONS
// =====================================================

async function loadQuestions(lang) {

  const files = {

    ar: "car_questions.json",

    en: "car_questions_en.json",

    fr: "car_questions_fr.json"

  };


  const file =
    files[lang] || files.ar;


  const res =
    await fetch(
      file,
      {
        cache: "no-store"
      }
    );


  if (!res.ok) {

    throw new Error(
      `Could not load ${file}`
    );

  }


  return await res.json();

}


// =====================================================
// ENABLE / DISABLE BUTTON
// =====================================================

function setButtonEnabled(btn, enabled) {

  if (!btn) return;


  btn.disabled = !enabled;


  btn.setAttribute(
    "aria-disabled",
    String(!enabled)
  );


  btn.style.pointerEvents =
    enabled
      ? "auto"
      : "none";

}


// =====================================================
// TAP / CLICK SUPPORT
// =====================================================

function bindTap(el, handler) {

  if (!el) return;


  const wrapped = (e) => {

    if (el.disabled) return;


    if (
      e &&
      typeof e.preventDefault === "function"
    ) {

      e.preventDefault();

    }


    handler(e);

  };


  if (window.PointerEvent) {

    el.addEventListener(
      "pointerup",
      wrapped,
      {
        passive: false
      }
    );

  }

  else {

    el.addEventListener(
      "touchend",
      wrapped,
      {
        passive: false
      }
    );


    el.addEventListener(
      "click",
      wrapped
    );

  }

}


// =====================================================
// PRELOAD QUESTION IMAGES
// =====================================================

function preloadImages(list) {

  (list || []).forEach((q) => {

    const src =
      q && q.image
        ? String(q.image)
        : "";


    if (
      src.trim() !== ""
    ) {

      const img =
        new Image();


      img.src =
        src;

    }

  });

}


// =====================================================
// TIMER - RESET DISPLAY
// =====================================================

function resetTimerDisplay() {

  const timerEl =
    document.getElementById(
      "quizTimer"
    );


  const timerBox =
    document.getElementById(
      "quizTimerBox"
    );


  if (timerEl) {

    timerEl.textContent =
      "15:00";

  }


  if (timerBox) {

    timerBox.classList.remove(
      "warning",
      "danger"
    );

  }

}


// =====================================================
// TIMER - STOP
// =====================================================

function stopQuizTimer() {

  if (quizTimerInterval) {

    clearInterval(
      quizTimerInterval
    );


    quizTimerInterval =
      null;

  }

}


// =====================================================
// TIMER - UPDATE
// =====================================================

function updateQuizTimer() {

  const timerEl =
    document.getElementById(
      "quizTimer"
    );


  const timerBox =
    document.getElementById(
      "quizTimerBox"
    );


  if (
    !timerEl ||
    !quizEndTime
  ) {

    return;

  }


  const remainingMs =
    quizEndTime -
    Date.now();


  const timeLeft =
    Math.max(
      0,
      Math.ceil(
        remainingMs / 1000
      )
    );


  const minutes =
    Math.floor(
      timeLeft / 60
    );


  const seconds =
    timeLeft % 60;


  timerEl.textContent =

    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;


  // TIMER COLORS

  if (timerBox) {

    timerBox.classList.remove(
      "warning",
      "danger"
    );


    // LAST MINUTE

    if (
      timeLeft <= 60
    ) {

      timerBox.classList.add(
        "danger"
      );

    }


    // LAST 2 MINUTES

    else if (
      timeLeft <= 120
    ) {

      timerBox.classList.add(
        "warning"
      );

    }

  }


  // TIME FINISHED

  if (
    timeLeft <= 0 &&
    !timerFinished
  ) {

    timerFinished =
      true;


    stopQuizTimer();


    timerEl.textContent =
      "00:00";


    // AUTOMATICALLY SHOW RESULT

    showResults();

  }

}


// =====================================================
// TIMER - START
// =====================================================

function startQuizTimer() {

  stopQuizTimer();


  timerFinished =
    false;


  quizEndTime =

    Date.now() +

    (
      QUIZ_DURATION_SECONDS *
      1000
    );


  resetTimerDisplay();


  updateQuizTimer();


  quizTimerInterval =

    setInterval(
      updateQuizTimer,
      1000
    );

}


// =====================================================
// APPLY LANGUAGE
// =====================================================

function applyLanguageUI() {

  const ui =
    t();


  document.documentElement.lang =
    ui.htmlLang;


  document.documentElement.dir =
    ui.dir;


  document.body.dir =
    ui.dir;


  document.title =
    ui.title;


  document.getElementById(
    "quizTitle"
  ).textContent =
    ui.title;


  document.getElementById(
    "resultTitle"
  ).textContent =
    ui.result;


  document.getElementById(
    "confirmBtn"
  ).textContent =
    ui.confirm;


  document.getElementById(
    "nextBtn"
  ).textContent =
    ui.next;


  document.getElementById(
    "retryBtn"
  ).textContent =
    ui.retry;


  document.getElementById(
    "homeBtn"
  ).textContent =
    ui.home;


  document.getElementById(
    "changeLangBtn"
  ).textContent =
    ui.changeLanguage;


  document.getElementById(
    "userName"
  ).textContent =
    ui.school;

}


// =====================================================
// PROGRESS
// =====================================================

function setProgress() {

  const ui =
    t();


  const pct =

    quiz.list.length

      ? (
          quiz.index /
          quiz.list.length
        ) * 100

      : 0;


  const progressEl =
    document.getElementById(
      "progress"
    );


  if (progressEl) {

    progressEl.style.setProperty(
      "--p",
      `${pct}%`
    );

  }


  const counterEl =
    document.getElementById(
      "qCounterTop"
    );


  if (counterEl) {

    counterEl.textContent =

      `${ui.question} ${quiz.index + 1} ${ui.of} ${quiz.list.length}`;

  }

}


// =====================================================
// RENDER QUESTION
// =====================================================

function renderQuestion() {

  const q =
    quiz.list[
      quiz.index
    ];


  const qTextEl =
    document.getElementById(
      "qText"
    );


  const qImgEl =
    document.getElementById(
      "qImg"
    );


  quiz.selected =
    null;


  quiz.locked =
    false;


  const confirmBtn =
    document.getElementById(
      "confirmBtn"
    );


  const nextBtn =
    document.getElementById(
      "nextBtn"
    );


  setButtonEnabled(
    confirmBtn,
    false
  );


  setButtonEnabled(
    nextBtn,
    false
  );


  const fb =
    document.getElementById(
      "feedback"
    );


  if (fb) {

    fb.className =
      "feedback hidden";


    fb.textContent =
      "";

  }


  // ===================================================
  // QUESTION IMAGE
  // ===================================================

  const hasImg =

    q &&

    q.image &&

    String(
      q.image
    ).trim() !== "";


  if (hasImg) {

    qImgEl.src =
      q.image;


    qImgEl.classList.remove(
      "hidden"
    );

  }

  else {

    qImgEl.removeAttribute(
      "src"
    );


    qImgEl.classList.add(
      "hidden"
    );

  }


  // ===================================================
  // QUESTION TEXT
  // ===================================================

  const questionText =

    q &&
    q.question

      ? String(
          q.question
        ).trim()

      : "";


  qTextEl.textContent =
    questionText;


  qTextEl.classList.toggle(
    "hidden",
    questionText === ""
  );


  // ===================================================
  // ANSWER CHOICES
  // ===================================================

  const box =
    document.getElementById(
      "choices"
    );


  box.innerHTML =
    "";


  (q.choices || []).forEach(

    (text, idx) => {


      if (
        String(
          text || ""
        ).trim() === ""
      ) {

        return;

      }


      const btn =
        document.createElement(
          "button"
        );


      btn.className =
        "choice";


      btn.type =
        "button";


      const span =
        document.createElement(
          "span"
        );


      span.textContent =
        text;


      btn.appendChild(
        span
      );


      btn.dataset.index =
        String(idx);


      bindTap(
        btn,
        () => {


          if (
            quiz.locked
          ) {

            return;

          }


          [
            ...box.querySelectorAll(
              ".choice"
            )

          ].forEach((b) => {

            b.classList.remove(
              "selected"
            );

          });


          btn.classList.add(
            "selected"
          );


          quiz.selected =
            idx;


          setButtonEnabled(
            confirmBtn,
            true
          );

        }
      );


      box.appendChild(
        btn
      );

    }

  );


  setProgress();

}


// =====================================================
// CONFIRM ANSWER
// =====================================================

function revealAnswer() {

  const q =
    quiz.list[
      quiz.index
    ];


  const chosen =
    quiz.selected;


  if (
    chosen === null
  ) {

    return;

  }


  quiz.locked =
    true;


  const box =
    document.getElementById(
      "choices"
    );


  const buttons = [

    ...box.querySelectorAll(
      ".choice"
    )

  ];


  const correct =
    q.correctIndex;


  quiz.answers[
    quiz.index
  ] = {

    id:
      q.id,

    chosenIndex:
      chosen,

    correctIndex:
      correct

  };


  if (
    typeof correct !==
    "number"
  ) {

    setButtonEnabled(
      document.getElementById(
        "nextBtn"
      ),
      true
    );


    setButtonEnabled(
      document.getElementById(
        "confirmBtn"
      ),
      false
    );


    return;

  }


  buttons.forEach(
    (btn) => {


      const idx =
        Number(
          btn.dataset.index
        );


      if (
        idx === correct
      ) {

        btn.classList.add(
          "correct"
        );

      }


      if (
        idx === chosen &&
        chosen !== correct
      ) {

        btn.classList.add(
          "wrong"
        );

      }


      btn.style.pointerEvents =
        "none";

    }

  );


  if (
    chosen === correct
  ) {

    quiz.score +=
      1;

  }


  setButtonEnabled(
    document.getElementById(
      "nextBtn"
    ),
    true
  );


  setButtonEnabled(
    document.getElementById(
      "confirmBtn"
    ),
    false
  );

}


// =====================================================
// NEXT QUESTION
// =====================================================

function nextQuestion() {

  if (
    !quiz.locked
  ) {

    return;

  }


  const now =
    Date.now();


  if (
    now -
    quiz._lastNextAt <
    250
  ) {

    return;

  }


  quiz._lastNextAt =
    now;


  if (
    quiz.index <
    quiz.list.length - 1
  ) {

    quiz.index +=
      1;


    renderQuestion();

  }

  else {

    showResults();

  }

}


// =====================================================
// SAVE RESULT TO TEST HISTORY
// =====================================================

function saveTestHistory() {

  let history = [];


  try {

    history =
      JSON.parse(
        localStorage.getItem(
          "car_test_history"
        ) || "[]"
      );


    if (
      !Array.isArray(
        history
      )
    ) {

      history = [];

    }

  }

  catch (error) {

    history = [];

  }


  const passed =
    quiz.score >= 24;


  const result = {

    id:
      Date.now(),

    date:
      new Date().toLocaleString(),

    timestamp:
      Date.now(),

    testType:
      "car",

    language:
      currentLang,

    score:
      quiz.score,

    total:
      quiz.list.length,

    passed:
      passed

  };


  // NEWEST RESULT FIRST

  history.unshift(
    result
  );


  localStorage.setItem(
    "car_test_history",
    JSON.stringify(
      history
    )
  );

}


// =====================================================
// SHOW RESULTS
// =====================================================

function showResults() {

  // Prevent the result from being generated twice
  // if the timer and last question finish together.

  if (
    document
      .getElementById(
        "resultsView"
      )
      .classList
      .contains("hidden") === false
  ) {

    return;

  }


  // STOP TIMER

  stopQuizTimer();


  // SAVE RESULT TO HISTORY

  saveTestHistory();


  const ui =
    t();


  document.getElementById(
    "quizView"
  ).classList.add(
    "hidden"
  );


  document.getElementById(
    "resultsView"
  ).classList.remove(
    "hidden"
  );


  const phone =

    localStorage.getItem(
      "quiz_phone"
    ) ||

    "03 467 094";


  document.getElementById(
    "resultUser"
  ).textContent =

    `${ui.school} - ${phone}`;


  // ===================================================
  // PASS / FAIL
  // 24 / 30 IS PASS
  // ===================================================

  const passed =
    quiz.score >= 24;


  document.getElementById(
    "scoreBox"
  ).innerHTML = `

    <div class="score-title">

      ${ui.score}

    </div>


    <div class="score-value">

      ${quiz.score}
      /
      ${quiz.list.length}

    </div>


    <div class="result-status ${
      passed
        ? "pass"
        : "fail"
    }">

      ${ui.status}:

      ${
        passed
          ? ui.pass
          : ui.fail
      }

    </div>

  `;


  // ===================================================
  // ANSWER REVIEW
  // ===================================================

  const review =
    document.getElementById(
      "reviewList"
    );


  review.innerHTML =
    "";


  quiz.list.forEach(

    (q, i) => {


      const a =

        quiz.answers[i] ||

        {

          chosenIndex:
            null,

          correctIndex:
            q.correctIndex

        };


      const chosenText =

        a.chosenIndex !== null &&

        q.choices[
          a.chosenIndex
        ] !== undefined

          ? q.choices[
              a.chosenIndex
            ]

          : ui.unanswered;


      const correctText =

        typeof a.correctIndex ===
          "number" &&

        q.choices[
          a.correctIndex
        ] !== undefined

          ? q.choices[
              a.correctIndex
            ]

          : ui.unavailable;


      const isCorrect =

        typeof a.correctIndex ===
          "number" &&

        a.chosenIndex ===
          a.correctIndex;


      const qText =

        String(
          q.question || ""
        ).trim();


      const hasImg =

        q.image &&

        String(
          q.image
        ).trim() !== "";


      const item =

        document.createElement(
          "div"
        );


      item.className =
        "review-item";


      item.innerHTML = `

        <div class="review-q">


          <div class="review-num">

            ${ui.reviewQuestion}
            ${i + 1}

          </div>


          ${
            hasImg

              ? `<img
                   class="qimg"
                   src="${q.image}"
                   alt="question image"
                 >`

              : ""
          }


          ${
            qText

              ? `<div class="review-text"></div>`

              : ""
          }


        </div>


        <div class="review-answers">


          <div class="ans-row ${
            isCorrect
              ? "ans-ok"
              : "ans-bad"
          }">


            <span class="ans-label">

              ${ui.yourAnswer}

            </span>


            <span class="ans-value"></span>


          </div>


          <div class="ans-row ans-ok">


            <span class="ans-label">

              ${ui.correctAnswer}

            </span>


            <span class="ans-value"></span>


          </div>


        </div>

      `;


      if (qText) {

        item.querySelector(
          ".review-text"
        ).textContent =
          qText;

      }


      const values =

        item.querySelectorAll(
          ".ans-value"
        );


      values[0].textContent =
        chosenText;


      values[1].textContent =
        correctText;


      review.appendChild(
        item
      );

    }

  );

}


// =====================================================
// RESET QUIZ
// =====================================================

function resetQuizState() {

  quiz.index =
    0;


  quiz.score =
    0;


  quiz.selected =
    null;


  quiz.locked =
    false;


  quiz.answers =
    [];


  quiz._lastNextAt =
    0;


  quiz.list =

    shuffle(
      QUESTIONS
    ).slice(

      0,

      Math.min(
        TAKE_COUNT,
        QUESTIONS.length
      )

    );


  preloadImages(
    quiz.list
  );

}


// =====================================================
// START NEW EXAM
// =====================================================

function startNewExam() {

  // STOP OLD TIMER FIRST

  stopQuizTimer();


  // RESET QUESTIONS + SCORE

  resetQuizState();


  // HIDE LANGUAGE PAGE

  document.getElementById(
    "languageView"
  ).classList.add(
    "hidden"
  );


  // HIDE OLD RESULT

  document.getElementById(
    "resultsView"
  ).classList.add(
    "hidden"
  );


  // SHOW QUIZ

  document.getElementById(
    "quizView"
  ).classList.remove(
    "hidden"
  );


  // SHOW FIRST QUESTION

  renderQuestion();


  // START FRESH 15 MINUTE TIMER

  startQuizTimer();

}


// =====================================================
// SELECT LANGUAGE
// =====================================================

async function selectLanguage(lang) {

  currentLang =
    lang;


  localStorage.setItem(
    "car_quiz_language",
    lang
  );


  applyLanguageUI();


  try {

    QUESTIONS =

      await loadQuestions(
        lang
      );


    startNewExam();

  }

  catch (err) {

    alert(

      `${t().error}: ${err.message}`

    );

  }

}


// =====================================================
// SHOW LANGUAGE SELECTION
// =====================================================

function showLanguageSelection() {

  // STOP TIMER

  stopQuizTimer();


  quizEndTime =
    null;


  timerFinished =
    false;


  resetTimerDisplay();


  document.documentElement.lang =
    "ar";


  document.documentElement.dir =
    "rtl";


  document.body.dir =
    "rtl";


  // HIDE QUIZ

  document.getElementById(
    "quizView"
  ).classList.add(
    "hidden"
  );


  // HIDE RESULTS

  document.getElementById(
    "resultsView"
  ).classList.add(
    "hidden"
  );


  // SHOW LANGUAGES

  document.getElementById(
    "languageView"
  ).classList.remove(
    "hidden"
  );

}


// =====================================================
// INITIALIZE
// =====================================================

function init() {

  const phone =

    localStorage.getItem(
      "quiz_phone"
    ) ||

    "03 467 094";


  document.getElementById(
    "userPhone"
  ).textContent =
    phone;


  // ===================================================
  // LANGUAGE BUTTONS
  // ===================================================

  document.querySelectorAll(
    ".language-btn"
  ).forEach(
    (btn) => {


      bindTap(
        btn,
        () => {

          selectLanguage(
            btn.dataset.lang
          );

        }
      );

    }

  );


  // ===================================================
  // CONFIRM ANSWER
  // ===================================================

  bindTap(

    document.getElementById(
      "confirmBtn"
    ),

    revealAnswer

  );


  // ===================================================
  // NEXT QUESTION
  // ===================================================

  bindTap(

    document.getElementById(
      "nextBtn"
    ),

    nextQuestion

  );


  // ===================================================
  // RETRY
  // ===================================================

  bindTap(

    document.getElementById(
      "retryBtn"
    ),

    startNewExam

  );


  // ===================================================
  // CHANGE LANGUAGE
  // ===================================================

  bindTap(

    document.getElementById(
      "changeLangBtn"
    ),

    showLanguageSelection

  );


  // ===================================================
  // HOME BUTTON
  // ===================================================

  bindTap(

    document.getElementById(
      "homeBtn"
    ),

    () => {

      stopQuizTimer();

      window.location.href =
        "index.html";

    }

  );


  // ===================================================
  // LANGUAGE PAGE HOME BUTTON
  // ===================================================

  bindTap(

    document.getElementById(
      "languageHomeBtn"
    ),

    () => {

      stopQuizTimer();

      window.location.href =
        "index.html";

    }

  );


  // START WITH LANGUAGE SELECTION

  showLanguageSelection();

}


// =====================================================
// START WEBSITE
// =====================================================

init();