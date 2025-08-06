class Quiz {
  constructor() {
    this.dataLoader = new DataLoader();
    this.audioManager = new AudioManager();
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.results = [];
    this.currentSound = null;
    this.showTableHints = true;
  }

  async initialize() {
    try {
      await this.audioManager.initialize();
      await this.dataLoader.loadAllData();

      this.setupEventListeners();
      this.populateSetupOptions();
      this.initializeVolumeControl();

      console.log("✅ Quiz initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing quiz:", error);
    }
  }

  setupEventListeners() {
    // Setup buttons
    document.getElementById("select-all-symbols").addEventListener("click", () => {
      this.toggleAllCheckboxes("#symbol-selection", true);
    });

    document.getElementById("deselect-all-symbols").addEventListener("click", () => {
      this.toggleAllCheckboxes("#symbol-selection", false);
    });

    document.getElementById("select-all-groups").addEventListener("click", () => {
      this.toggleAllCheckboxes("#group-selection", true);
    });

    document.getElementById("deselect-all-groups").addEventListener("click", () => {
      this.toggleAllCheckboxes("#group-selection", false);
    });

    document.getElementById("start-quiz-btn").addEventListener("click", () => {
      this.startQuiz();
    });

    // Quiz game buttons
    document.getElementById("quiz-play-btn").addEventListener("click", () => {
      if (this.currentSound) {
        this.audioManager.startLoop(this.currentSound.file);
      }
    });

    document.getElementById("quiz-stop-btn").addEventListener("click", () => {
      this.audioManager.stopAll();
    });

    document.getElementById("next-question-btn").addEventListener("click", () => {
      this.nextQuestion();
    });

    document.getElementById("restart-quiz-btn").addEventListener("click", () => {
      this.restartQuiz();
    });

    document.getElementById("exit-quiz-btn").addEventListener("click", () => {
      this.exitQuiz();
    });
  }

  initializeVolumeControl() {
    const volumeSlider = document.getElementById("quiz-volume-slider");
    const savedVolume = StorageService.getVolumeLevel();

    volumeSlider.value = savedVolume;
    this.audioManager.setVolume(savedVolume / 100);

    volumeSlider.addEventListener("input", () => {
      const volume = parseInt(volumeSlider.value) / 100;
      this.audioManager.setVolume(volume);
      StorageService.setVolumeLevel(volumeSlider.value);
    });
  }

  toggleAllCheckboxes(selector, checked) {
    document.querySelectorAll(`${selector} input[type="checkbox"]`).forEach((cb) => {
      cb.checked = checked;
    });
  }

  populateSetupOptions() {
    this.populateSymbolSelection();
    this.populateGroupSelection();
  }

  populateSymbolSelection() {
    const container = document.getElementById("symbol-selection");
    const sounds = this.dataLoader.getSoundMeta();
    const alr46Info = this.dataLoader.getAlr46Info();
    const usedSymbols = new Set();

    // Collect all used symbols
    for (const sound of sounds) {
      const radarInfo = alr46Info[sound.file];
      if (!radarInfo) continue;

      const normalized = Utils.normalizeRadarName(
        sound.file.replace(/^imported_wavs\//i, "").replace(/_(SEARCH|TRACK)\.wav$/i, "")
      );
      const radarEntry = window.radarSymbolMap?.[normalized];
      const radarEntries = Array.isArray(radarEntry) ? radarEntry : radarEntry ? [radarEntry] : [];

      for (const entry of radarEntries) {
        if (entry.symbol1) usedSymbols.add(entry.symbol1);
        if (entry.symbol2) usedSymbols.add(entry.symbol2);
      }

      // Add unknown symbols based on frequency
      if (!radarEntry && radarInfo.band != null) {
        const freq = Number(radarInfo.band);
        const fallback = Utils.getUnknownSymbolFromFrequency(freq);
        if (fallback) usedSymbols.add(fallback);
      }
    }

    // Create checkboxes for each symbol
    Object.keys(Config.SYMBOL_TO_IMAGE_MAP).forEach((symbol) => {
      if (!usedSymbols.has(symbol)) return;

      const imageFile = Config.SYMBOL_TO_IMAGE_MAP[symbol];
      if (!imageFile) return;

      const item = document.createElement("div");
      item.className = "checkbox-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = symbol;
      checkbox.checked = true;

      const img = document.createElement("img");
      img.src = `assets/rwr-symbols/${imageFile}.jpg`;
      img.alt = symbol;
      img.addEventListener("click", () => (checkbox.checked = !checkbox.checked));

      // const label = document.createElement("label");
      // label.textContent = symbol;
      // label.style.cursor = "pointer";
      // label.addEventListener("click", () => (checkbox.checked = !checkbox.checked));

      item.appendChild(checkbox);
      item.appendChild(img);
      // item.appendChild(label);
      container.appendChild(item);
    });
  }

  populateGroupSelection() {
    const container = document.getElementById("group-selection");
    const sounds = this.dataLoader.getSoundMeta();
    const groups = new Set();

    sounds.forEach((sound) => groups.add(sound.group));

    Array.from(groups)
      .sort()
      .forEach((groupName) => {
        const item = document.createElement("div");
        item.className = "checkbox-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = groupName;
        checkbox.checked = true;

        const label = document.createElement("label");
        label.textContent = groupName;
        label.style.cursor = "pointer";
        label.addEventListener("click", () => (checkbox.checked = !checkbox.checked));

        item.appendChild(checkbox);
        item.appendChild(label);
        container.appendChild(item);
      });
  }

  startQuiz() {
    const selectedSymbols = new Set();
    const selectedGroups = new Set();

    // Get selected symbols
    document.querySelectorAll('#symbol-selection input[type="checkbox"]:checked').forEach((cb) => {
      selectedSymbols.add(cb.value);
    });

    // Get selected groups
    document.querySelectorAll('#group-selection input[type="checkbox"]:checked').forEach((cb) => {
      selectedGroups.add(cb.value);
    });

    const questionCount = parseInt(document.getElementById("question-count").value);
    this.showTableHints = document.getElementById("show-table-hint").checked;

    if (selectedSymbols.size === 0 || selectedGroups.size === 0) {
      alert("Please select at least one symbol and one group.");
      return;
    }

    // Filter sounds based on selections
    const availableSounds = this.filterSounds(selectedSymbols, selectedGroups);

    if (availableSounds.length === 0) {
      alert("No sounds match your selection criteria.");
      return;
    }

    if (availableSounds.length < questionCount) {
      if (
        !confirm(
          `Only ${availableSounds.length} sounds match your criteria. Continue with ${availableSounds.length} questions?`
        )
      ) {
        return;
      }
    }

    // Generate questions
    this.generateQuestions(availableSounds, Math.min(questionCount, availableSounds.length));

    // Start the quiz
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.results = [];

    // document.getElementById("quiz-setup").style.display = "none";
    // document.getElementById("quiz-game").style.display = "block";
    const setupEl = document.getElementById("quiz-setup");
    const gameEl = document.getElementById("quiz-game");

    gameEl.classList.remove("fade-out");

    setupEl.classList.add("fade-out");

    setTimeout(() => {
      setupEl.style.display = "none";
      gameEl.style.display = "block";
    }, 400);

    this.displayQuestion();
  }

  filterSounds(selectedSymbols, selectedGroups) {
    const sounds = this.dataLoader.getSoundMeta();
    const alr46Info = this.dataLoader.getAlr46Info();

    return sounds.filter((sound) => {
      // Check group
      if (!selectedGroups.has(sound.group)) return false;

      // Check symbol
      const radarInfo = alr46Info[sound.file];
      if (!radarInfo) return false;

      const normalized = Utils.normalizeRadarName(
        sound.file.replace(/^imported_wavs\//i, "").replace(/_(SEARCH|TRACK)\.wav$/i, "")
      );
      const radarEntry = window.radarSymbolMap?.[normalized];
      const radarEntries = Array.isArray(radarEntry) ? radarEntry : radarEntry ? [radarEntry] : [];

      let hasSelectedSymbol = radarEntries.some(
        (entry) => selectedSymbols.has(entry.symbol1) || selectedSymbols.has(entry.symbol2)
      );

      // Check unknown symbols
      if (!hasSelectedSymbol && radarEntries.length === 0 && radarInfo.band != null) {
        const freq = Number(radarInfo.band);
        const fallback = Utils.getUnknownSymbolFromFrequency(freq);
        hasSelectedSymbol = fallback && selectedSymbols.has(fallback);
      }

      return hasSelectedSymbol;
    });
  }

  generateQuestions(availableSounds, questionCount) {
    // Shuffle and select sounds for questions
    const shuffled = [...availableSounds].sort(() => Math.random() - 0.5);
    const selectedSounds = shuffled.slice(0, questionCount);

    this.questions = selectedSounds.map((sound) => {
      const correctAnswer = sound.name;

      // Generate wrong answers from other sounds
      const wrongAnswers = availableSounds
        .filter((s) => s.name !== correctAnswer)
        .map((s) => s.name)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      // Shuffle all answers
      const answers = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);

      return {
        sound,
        correctAnswer,
        answers,
        symbols: this.getSoundSymbols(sound),
        tableSources: this.getTableSources(sound),
      };
    });
  }

  getSoundSymbols(sound) {
    const alr46Info = this.dataLoader.getAlr46Info();
    const radarInfo = alr46Info[sound.file];
    const symbols = [];

    if (radarInfo) {
      const normalized = Utils.normalizeRadarName(
        sound.file.replace(/^imported_wavs\//i, "").replace(/_(SEARCH|TRACK)\.wav$/i, "")
      );
      const radarEntry = window.radarSymbolMap?.[normalized];
      const radarEntries = Array.isArray(radarEntry) ? radarEntry : radarEntry ? [radarEntry] : [];

      for (const entry of radarEntries) {
        if (entry.symbol1 && Config.SYMBOL_TO_IMAGE_MAP[entry.symbol1]) {
          symbols.push(entry.symbol1);
        }
        if (
          entry.symbol2 &&
          entry.symbol2 !== entry.symbol1 &&
          Config.SYMBOL_TO_IMAGE_MAP[entry.symbol2]
        ) {
          symbols.push(entry.symbol2);
        }
      }

      // Add unknown symbol if no known symbols
      if (symbols.length === 0 && radarInfo.band != null) {
        const freq = Number(radarInfo.band);
        const fallback = Utils.getUnknownSymbolFromFrequency(freq);
        if (fallback && Config.SYMBOL_TO_IMAGE_MAP[fallback]) {
          symbols.push(fallback);
        }
      }
    }

    return symbols;
  }

  getTableSources(sound) {
    const alr46Info = this.dataLoader.getAlr46Info();
    const radarInfo = alr46Info[sound.file];
    const sources = new Set();

    if (radarInfo) {
      const normalized = Utils.normalizeRadarName(
        sound.file.replace(/^imported_wavs\//i, "").replace(/_(SEARCH|TRACK)\.wav$/i, "")
      );
      const radarEntry = window.radarSymbolMap?.[normalized];
      const radarEntries = Array.isArray(radarEntry) ? radarEntry : radarEntry ? [radarEntry] : [];

      for (const entry of radarEntries) {
        if (entry.source) {
          const friendlyName = Config.SOURCE_NAME_MAP[entry.source] || entry.source;
          sources.add(friendlyName);
        }
      }
    }

    return Array.from(sources);
  }

  displayQuestion() {
    const question = this.questions[this.currentQuestionIndex];
    this.currentSound = question.sound;

    // Update question counter
    document.getElementById("question-counter").textContent = `Question ${
      this.currentQuestionIndex + 1
    } of ${this.questions.length}`;

    // Display symbols
    const symbolDisplay = document.getElementById("symbol-display");
    symbolDisplay.innerHTML = "";

    question.symbols.forEach((symbol) => {
      const imageFile = Config.SYMBOL_TO_IMAGE_MAP[symbol];
      if (imageFile) {
        const img = document.createElement("img");
        img.src = `assets/rwr-symbols/${imageFile}.jpg`;
        img.alt = symbol;
        symbolDisplay.appendChild(img);
      }
    });

    // Display table hint if enabled
    const tableHint = document.getElementById("table-hint");
    if (this.showTableHints && question.tableSources.length > 0) {
      tableHint.style.display = "block";
      tableHint.innerHTML = `<strong>Hint - </strong> This symbol appears in: ${question.tableSources.join(
        ", "
      )}`;
    } else {
      tableHint.style.display = "none";
    }

    // Display answer choices
    const choicesContainer = document.getElementById("answer-choices");
    choicesContainer.innerHTML = "";

    question.answers.forEach((answer) => {
      const button = document.createElement("button");
      button.className = "answer-choice";
      button.textContent = answer;
      button.addEventListener("click", () => this.selectAnswer(answer, button));
      choicesContainer.appendChild(button);
    });

    // Hide next button
    document.getElementById("next-question-btn").classList.remove("visible");

    // Stop any playing audio
    this.audioManager.stopAll();
  }

  selectAnswer(selectedAnswer, buttonElement) {
    const question = this.questions[this.currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correctAnswer;

    // Update score
    if (isCorrect) {
      this.score++;
    }

    // Record result
    this.results.push({
      question: question,
      selectedAnswer: selectedAnswer,
      isCorrect: isCorrect,
    });

    // Update UI
    const choicesContainer = document.getElementById("answer-choices");
    const choices = choicesContainer.querySelectorAll(".answer-choice");

    choices.forEach((choice) => {
      choice.classList.add("disabled");
      if (choice.textContent === question.correctAnswer) {
        choice.classList.add("correct");
      } else if (choice === buttonElement && !isCorrect) {
        choice.classList.add("incorrect");
      }
    });

    // Show next button
    setTimeout(() => {
      document.getElementById("next-question-btn").classList.add("visible");
    }, 500);
  }

  nextQuestion() {
    this.audioManager.stopAll();
    this.currentQuestionIndex++;

    if (this.currentQuestionIndex < this.questions.length) {
      this.displayQuestion();
    } else {
      this.showResults();
    }
  }

  showResults(earlyExit = false) {
    // document.getElementById("quiz-game").style.display = "none";
    // document.getElementById("quiz-results").style.display = "block";
    const gameEl = document.getElementById("quiz-game");
    const resultsEl = document.getElementById("quiz-results");

    resultsEl.classList.remove("fade-out");
    gameEl.classList.add("fade-out");

    setTimeout(() => {
      gameEl.style.display = "none";
      resultsEl.style.display = "block";
    }, 400);

    const percentage =
      this.results.length > 0 ? Math.round((this.score / this.results.length) * 100) : 0;

    const message = earlyExit ? "Quiz Ended Early" : "Quiz Complete!";
    document.querySelector("#quiz-results h2").textContent = message;

    document.getElementById(
      "score-display"
    ).textContent = `${this.score}/${this.results.length} (${percentage}%)`;

    const breakdown = document.getElementById("results-breakdown");
    breakdown.innerHTML = "";

    this.results.forEach((result, index) => {
      const item = document.createElement("div");
      item.className = `result-item ${result.isCorrect ? "correct" : "incorrect"}`;

      const questionNum = document.createElement("span");
      questionNum.textContent = `Q${index + 1}:`;
      questionNum.style.fontWeight = "bold";
      questionNum.style.minWidth = "35px";

      const symbolsDiv = document.createElement("div");
      symbolsDiv.style.display = "flex";
      symbolsDiv.style.gap = "5px";

      result.question.symbols.forEach((symbol) => {
        const imageFile = Config.SYMBOL_TO_IMAGE_MAP[symbol];
        if (imageFile) {
          const img = document.createElement("img");
          img.src = `assets/rwr-symbols/${imageFile}.jpg`;
          img.alt = symbol;
          symbolsDiv.appendChild(img);
        }
      });

      const details = document.createElement("div");
      details.innerHTML = `
      <strong>${result.question.correctAnswer}</strong><br>
      Your answer: ${result.selectedAnswer}
      ${result.isCorrect ? "" : " ❌"}
    `;

      item.appendChild(questionNum);
      item.appendChild(symbolsDiv);
      item.appendChild(details);
      breakdown.appendChild(item);
    });
  }

  restartQuiz() {
    this.audioManager.stopAll();
    // document.getElementById("quiz-results").style.display = "none";
    // document.getElementById("quiz-setup").style.display = "block";
    const resultsEl = document.getElementById("quiz-results");
    const setupEl = document.getElementById("quiz-setup");

    resultsEl.classList.add("fade-out");

    setTimeout(() => {
      resultsEl.style.display = "none";
      setupEl.style.display = "block";
      setupEl.classList.remove("fade-out");
    }, 400);
  }

  exitQuiz() {
    if (confirm("Are you sure you want to end the quiz now and see your results so far?")) {
      this.audioManager.stopAll();
      this.showResults(true); // Pass a flag to indicate early exit
    }
  }
}

// Initialize the quiz when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const quiz = new Quiz();
  quiz.initialize();
});
