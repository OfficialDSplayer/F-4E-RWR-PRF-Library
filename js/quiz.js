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
    this.showDescriptionHints = false; // New property for description hints
    this.startTime = 0;
    this.endTime = 0;
    this.params = new URLSearchParams(window.location.search);
    this.lastSharedResultId = null;
    this.lastResultData = null;
    this.quizSubmitted = false; // Track if current quiz has been submitted

    if (this.params.has("result")) {
      const data = JSON.parse(localStorage.getItem("shared_result_" + this.params.get("result")));
      if (data) {
        this.showResultsFromSharedData(data);
      }
    }

    const shareSection = document.getElementById("share-section");
    if (shareSection) shareSection.remove();
  }

  async initialize() {
    try {
      await this.audioManager.initialize();
      await this.dataLoader.loadAllData();

      this.setupEventListeners();
      this.populateSetupOptions();
      this.initializeVolumeControl();
      this.setupDescriptionHintEvents(); // New method for description hint events

      this.loadLeaderboard();

      console.log("✅ Quiz initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing quiz:", error);
    }
  }

  startQuizTimer() {
    this.startTime = new Date();
  }

  endQuizTimer() {
    this.endTime = new Date();
    return Math.floor((this.endTime - this.startTime) / 1000); // seconds
  }

  setupDescriptionHintEvents() {
    const hintButton = document.getElementById("description-hint-button");
    const hintContainer = document.getElementById("description-hint-container");

    if (hintButton && hintContainer) {
      // Handle click for mobile devices
      hintButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        hintContainer.classList.toggle("active");
      });

      // Close tooltip when clicking elsewhere
      document.addEventListener("click", (e) => {
        if (!hintContainer.contains(e.target)) {
          hintContainer.classList.remove("active");
        }
      });
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

    // Fixed submit score button event listener
    // document.getElementById("submit-score-btn").addEventListener("click", () => {
    //   this.handleScoreSubmission();
    // });
  }

  handleScoreSubmission() {
    const button = document.getElementById("submit-score-btn");

    // Prevent multiple submissions for the same quiz
    if (this.quizSubmitted || button.disabled) {
      return;
    }

    const username = document.getElementById("username").value.trim();
    if (!username) {
      alert("Please enter your name before submitting.");
      return;
    }

    // Submit to leaderboard
    this.submitToLeaderboard(
      username,
      `${this.score}/${this.results.length}`,
      {
        questionCount: this.questions.length,
        showTableHints: this.showTableHints,
        showDescriptionHints: this.showDescriptionHints, // Include in settings
      },
      this.endQuizTimer(),
      this.results
    );

    // Mark as submitted and disable button
    this.quizSubmitted = true;
    button.disabled = true;
    button.classList.add("disabled");
    button.textContent = "Score Submitted ✓";

    // Show success message
    const successMsg = document.createElement("div");
    successMsg.style.color = "var(--success-color, #4CAF50)";
    successMsg.style.marginTop = "10px";
    successMsg.style.fontWeight = "bold";
    successMsg.textContent = "Score successfully submitted to leaderboard!";
    button.parentNode.appendChild(successMsg);

    // Update leaderboard display
    this.loadLeaderboard();
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

      item.appendChild(checkbox);
      item.appendChild(img);
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
    this.showDescriptionHints = document.getElementById("show-description-hint").checked;

    // Get full list of all symbols and groups
    const allSymbols = [
      ...document.querySelectorAll('#symbol-selection input[type="checkbox"]'),
    ].map((cb) => cb.value);
    const allGroups = [...document.querySelectorAll('#group-selection input[type="checkbox"]')].map(
      (cb) => cb.value
    );

    // const selectedSymbols = new Set();
    // const selectedGroups = new Set();

    document.querySelectorAll('#symbol-selection input[type="checkbox"]:checked').forEach((cb) => {
      selectedSymbols.add(cb.value);
    });
    document.querySelectorAll('#group-selection input[type="checkbox"]:checked').forEach((cb) => {
      selectedGroups.add(cb.value);
    });

    this.lastSelectedOptions = {
      selectedSymbols: [...selectedSymbols],
      unselectedSymbols: allSymbols.filter((s) => !selectedSymbols.has(s)),
      selectedGroups: [...selectedGroups],
      unselectedGroups: allGroups.filter((g) => !selectedGroups.has(g)),
    };

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

    // Reset quiz state
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.results = [];
    this.quizSubmitted = false; // Reset submission status for new quiz
    this.startQuizTimer(); // Start timing the quiz

    const setupEl = document.getElementById("quiz-setup");
    const gameEl = document.getElementById("quiz-game");

    gameEl.classList.remove("fade-out");

    setupEl.classList.add("fade-out");

    setTimeout(() => {
      setupEl.style.display = "none";
      gameEl.style.display = "block";
    }, 400);

    this.displayQuestion();

    if (window.history.replaceState) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
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

  // Get radar description from groups data
  getRadarDescription(sound) {
    const groupsData = this.dataLoader.getGroupsData();
    const soundMeta = groupsData[sound.file];

    if (soundMeta && soundMeta.description && soundMeta.description.trim()) {
      return soundMeta.description.trim();
    }

    // Fallback: try to get description from sound metadata
    if (sound.description && sound.description.trim()) {
      return sound.description.trim();
    }

    return null;
  }

  // Helper function to check if two radars have matching symbols and PRF
  radarsHaveMatchingSymbolAndPRF(sound1, sound2) {
    if (!sound1 || !sound2) return false;

    const alr46Info = this.dataLoader.getAlr46Info();
    const radarInfo1 = alr46Info[sound1.file];
    const radarInfo2 = alr46Info[sound2.file];

    if (!radarInfo1 || !radarInfo2) return false;

    // Get symbols for both sounds
    const symbols1 = this.getSoundSymbols(sound1);
    const symbols2 = this.getSoundSymbols(sound2);

    // Check if symbols match exactly (all symbols must be the same)
    if (symbols1.length !== symbols2.length) return false;

    // Sort both arrays and compare them element by element
    const sortedSymbols1 = [...symbols1].sort();
    const sortedSymbols2 = [...symbols2].sort();

    const symbolsMatch = sortedSymbols1.every((symbol, index) => symbol === sortedSymbols2[index]);
    if (!symbolsMatch) return false;

    // Compare PRF values using the same logic as sound-display.js
    const prf1 = this.extractRelevantPRF(sound1, radarInfo1);
    const prf2 = this.extractRelevantPRF(sound2, radarInfo2);

    if (prf1 === null || prf2 === null) return false;

    // Consider PRFs matching if they're within a small tolerance (0.01)
    // to account for floating point precision issues
    const prfMatches = Math.abs(prf1 - prf2) < 0.01;

    return prfMatches;
  }

  // Extract the relevant PRF value based on file type and radar capabilities
  // Uses the same logic as addPRFInfo in sound-display.js
  extractRelevantPRF(sound, radarInfo) {
    const fullPath = sound.file;

    if (fullPath.includes("SEARCH") && radarInfo.type == "SEARCH_ONLY") {
      return Number(radarInfo.prf_search);
    } else if (
      fullPath.includes("SEARCH") &&
      radarInfo.type == "TRACK_ONLY" &&
      radarInfo.prf_search != radarInfo.prf_track
    ) {
      return Number(radarInfo.prf_search);
    } else if (
      fullPath.includes("TRACK") &&
      radarInfo.type == "TRACK_ONLY" &&
      radarInfo.prf_search != radarInfo.prf_track
    ) {
      return Number(radarInfo.prf_track);
    } else if (
      fullPath.includes("SEARCH") &&
      radarInfo.type == "SEARCH_ONLY" &&
      radarInfo.prf_search == radarInfo.prf_track
    ) {
      return Number(radarInfo.prf_search);
    } else if (
      fullPath.includes("TRACK") &&
      radarInfo.type == "TRACK_ONLY" &&
      radarInfo.prf_search == radarInfo.prf_track
    ) {
      return Number(radarInfo.prf_track);
    } else if (
      (fullPath.includes("SEARCH") || fullPath.includes("TRACK")) &&
      radarInfo.type == "SEARCH_AND_TRACK" &&
      radarInfo.prf_search == radarInfo.prf_track
    ) {
      return Number(radarInfo.prf_track);
    } else if (
      fullPath.includes("SEARCH") &&
      radarInfo.type == "SEARCH_AND_TRACK" &&
      radarInfo.prf_search != radarInfo.prf_track
    ) {
      return Number(radarInfo.prf_search);
    } else if (
      fullPath.includes("TRACK") &&
      radarInfo.type == "SEARCH_AND_TRACK" &&
      radarInfo.prf_search != radarInfo.prf_track
    ) {
      return Number(radarInfo.prf_track);
    }

    // Fallback - return null if we can't determine the appropriate PRF
    return null;
  }

  // Find all radars that should be considered correct answers
  findAlternativeCorrectAnswers(primarySound, availableSounds) {
    const alternatives = [];

    for (const sound of availableSounds) {
      if (sound.name === primarySound.name) continue; // Skip the primary answer

      if (this.radarsHaveMatchingSymbolAndPRF(primarySound, sound)) {
        alternatives.push(sound.name);
      }
    }

    return alternatives;
  }

  generateQuestions(availableSounds, questionCount) {
    // Shuffle and select sounds for questions
    const shuffled = [...availableSounds].sort(() => Math.random() - 0.5);
    const selectedSounds = shuffled.slice(0, questionCount);

    this.questions = selectedSounds.map((sound) => {
      const primaryCorrectAnswer = sound.name;

      // Find alternative correct answers (radars with same symbol and PRF)
      const alternativeCorrectAnswers = this.findAlternativeCorrectAnswers(sound, availableSounds);

      // Generate wrong answers from other sounds (excluding all correct answers)
      const allCorrectAnswers = [primaryCorrectAnswer, ...alternativeCorrectAnswers];
      const wrongAnswers = availableSounds
        .filter((s) => !allCorrectAnswers.includes(s.name))
        .map((s) => s.name)
        .sort(() => Math.random() - 0.5)
        .slice(0, 4 - allCorrectAnswers.length); // Adjust number of wrong answers based on correct ones

      // Shuffle all answers
      const answers = [...allCorrectAnswers, ...wrongAnswers].sort(() => Math.random() - 0.5);

      return {
        sound,
        primaryCorrectAnswer,
        alternativeCorrectAnswers,
        allCorrectAnswers,
        answers,
        symbols: this.getSoundSymbols(sound),
        tableSources: this.getTableSources(sound),
        description: this.getRadarDescription(sound), // Add description to question data
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

    // Hide description hint from question area since we're showing it for answers
    const descriptionHintContainer = document.getElementById("description-hint-container");
    descriptionHintContainer.style.display = "none";

    // Display answer choices
    const choicesContainer = document.getElementById("answer-choices");
    choicesContainer.innerHTML = "";

    question.answers.forEach((answer) => {
      const button = document.createElement("button");
      button.className = "answer-choice";
      // button.dataset.answer = answer;
      button.textContent = answer;
      button.setAttribute("data-answer", answer);
      button.addEventListener("click", () => this.selectAnswer(answer, button));

      // Add description tooltip to answer button if enabled
      if (this.showDescriptionHints) {
        // Find the sound that matches this answer
        const answerSound = this.dataLoader.getSoundMeta().find((sound) => sound.name === answer);
        const answerDescription = answerSound ? this.getRadarDescription(answerSound) : null;

        if (answerDescription) {
          const tooltip = document.createElement("div");
          tooltip.className = "answer-choice-tooltip";
          tooltip.innerHTML = `${answerDescription}`;
          button.appendChild(tooltip);
        }
      }

      choicesContainer.appendChild(button);
    });

    // Hide next button
    document.getElementById("next-question-btn").classList.remove("visible");

    // Stop any playing audio
    this.audioManager.stopAll();
  }

  selectAnswer(selectedAnswer, buttonElement) {
    // Prevent multiple selections
    const choicesContainer = document.getElementById("answer-choices");
    const choices = choicesContainer.querySelectorAll(".answer-choice");
    if ([...choices].some((choice) => choice.dataset.answered === "true")) return;

    const question = this.questions[this.currentQuestionIndex];
    const isCorrect = question.allCorrectAnswers.includes(selectedAnswer);
    const isPrimary = selectedAnswer === question.primaryCorrectAnswer;

    if (isCorrect) {
      this.score++;
    }

    this.results.push({
      question: question,
      selectedAnswer: selectedAnswer,
      isCorrect: isCorrect,
      isPrimary: isPrimary,
    });

    choices.forEach((choice) => {
      // const choiceText = choice.textContent.trim();
      const choiceText = choice.getAttribute("data-answer");

      choice.classList.add("disabled");
      // Mark all as answered to lock them
      choice.dataset.answered = "true";

      if (choiceText === question.primaryCorrectAnswer) {
        choice.classList.add("correct", "primary-correct");
      } else if (question.alternativeCorrectAnswers.includes(choiceText)) {
        choice.classList.add("correct", "secondary-correct");
      } else if (choiceText === selectedAnswer && !isCorrect) {
        choice.classList.add("incorrect");
      }
    });

    const nextButton = document.getElementById("next-question-btn");
    nextButton.textContent =
      this.currentQuestionIndex === this.questions.length - 1 ? "Submit Quiz" : "Next Question";

    setTimeout(() => {
      nextButton.classList.add("visible");
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

      // Apply different classes based on answer type
      if (result.isCorrect) {
        if (result.isPrimary) {
          item.className = "result-item correct primary-correct";
        } else {
          item.className = "result-item correct secondary-correct";
        }
      } else {
        item.className = "result-item incorrect";
      }

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

      // Show all correct answers with different styling
      let correctAnswersDisplay = result.question.primaryCorrectAnswer;
      if (result.question.alternativeCorrectAnswers.length > 0) {
        correctAnswersDisplay += ` (or ${result.question.alternativeCorrectAnswers.join(", ")})`;
      }

      let answerStatus = "";
      let tooltipText = "";

      if (result.isCorrect) {
        if (result.isPrimary) {
          answerStatus = " ✓ (Primary)";
        } else {
          answerStatus = " ✓ (Alternative)";
          tooltipText =
            "Alternative answers are radar systems that have the same RWR symbols and PRF tone as the primary answer.";
        }
      } else {
        answerStatus = " ❌";
      }

      // Create the answer status span with tooltip if it's an alternative answer
      let answerStatusHTML = answerStatus;
      if (result.isCorrect && !result.isPrimary) {
        answerStatusHTML = `<span class="alternative-answer-tooltip" data-tooltip="${tooltipText}">${answerStatus}</span>`;
      }

      details.innerHTML = `
        <strong>${correctAnswersDisplay}</strong><br>
        Your answer: ${result.selectedAnswer}${answerStatusHTML}
      `;

      item.appendChild(questionNum);
      item.appendChild(symbolsDiv);
      item.appendChild(details);
      breakdown.appendChild(item);
    });

    const quizSettings = {
      questionCount: this.questions.length,
      showTableHints: this.showTableHints,
      showDescriptionHints: this.showDescriptionHints, // Include description hints in settings
    };

    const duration = this.endQuizTimer();

    const enteredUsername = document.getElementById("username")?.value?.trim();

    //  this.lastResultData = {
    //     username: enteredUsername || "Anonymous",
    //     score: `${this.score}/${this.results.length}`,
    //     settings: quizSettings,
    //     duration,
    //     results: this.results,
    //     earlyExit: earlyExit,
    //   };

    this.lastResultData = {
      username: enteredUsername || "Anonymous",
      score: `${this.score}/${this.results.length}`,
      settings: {
        ...quizSettings,
        ...this.lastSelectedOptions, // Add selected/unselected groups and symbols
      },
      duration,
      results: this.results,
      earlyExit: earlyExit,
    };

    if (this.results.length > 0) {
      const shareLink = this.generateShareableLink(this.lastResultData);

      const shareSection = document.createElement("div");
      shareSection.id = "share-section";
      shareSection.style.display = "flex";
      shareSection.style.flexDirection = "column";
      shareSection.style.alignItems = "center";
      shareSection.style.justifyContent = "center";
      shareSection.style.textAlign = "center";
      shareSection.style.marginTop = "24px"; // optional spacing

      const linkEl = document.createElement("p");
      linkEl.innerHTML = `Share your results: <a id="share-link" href="${shareLink}">Link</a>
    <button id="copy-share-link-btn" class="global-button" style="margin-left: 8px;">Copy Link
    </button>`;

      const usernameInput = document.createElement("input");
      usernameInput.type = "text";
      usernameInput.id = "username";
      usernameInput.placeholder = "Enter your name";
      usernameInput.className = "search-input";

      const nameUpdateBtn = document.createElement("button");
      nameUpdateBtn.textContent = "Save Name To Results";
      nameUpdateBtn.className = "global-button";
      nameUpdateBtn.style.marginTop = "8px";

      nameUpdateBtn.addEventListener("click", () => {
        const newName = document.getElementById("username")?.value?.trim();
        if (!newName || newName.toLowerCase() === "anonymous") {
          alert("Please enter a valid name.");
          return;
        }

        // Delete the old anonymous result
        if (this.lastSharedResultId) {
          localStorage.removeItem("shared_result_" + this.lastSharedResultId);
        }

        // Update and regenerate link
        this.lastResultData.username = newName;
        const newLink = this.generateShareableLink(this.lastResultData);
        const linkDisplay = document.getElementById("share-link");
        linkDisplay.href = newLink;
        // linkDisplay.textContent = newLink;

        alert("Name updated and new link generated!");

        // Disable further changes
        nameUpdateBtn.disabled = true;
        nameUpdateBtn.textContent = "Name Saved";
        nameUpdateBtn.classList.add("disabled");
      });

      // shareSection.appendChild(linkEl);
      // shareSection.appendChild(usernameInput);
      // shareSection.appendChild(nameUpdateBtn);
      const nameInputWrapper = document.createElement("div");
      nameInputWrapper.style.display = "flex";
      nameInputWrapper.style.alignItems = "center";
      nameInputWrapper.style.justifyContent = "center";
      nameInputWrapper.style.gap = "10px";
      nameInputWrapper.style.marginTop = "12px";
      nameInputWrapper.appendChild(usernameInput);
      nameInputWrapper.appendChild(nameUpdateBtn);

      shareSection.appendChild(linkEl);
      shareSection.appendChild(nameInputWrapper);

      document.getElementById("quiz-results").appendChild(shareSection);

      const copyBtn = document.getElementById("copy-share-link-btn");
      const shareLinkEl = document.getElementById("share-link");

      if (copyBtn && shareLinkEl) {
        copyBtn.addEventListener("click", () => {
          const url = shareLinkEl.href;

          navigator.clipboard.writeText(url).then(
            () => {
              copyBtn.textContent = "Copied!";
              setTimeout(() => {
                copyBtn.textContent = "Copy Link";
              }, 2000);
            },
            (err) => {
              console.error("Failed to copy link:", err);
              alert("Failed to copy link. Please copy manually.");
            }
          );
        });
      }
    }
    // Initialize submit button state
    const submitButton = document.getElementById("submit-score-btn");
    submitButton.disabled = false;
    submitButton.classList.remove("disabled");
    submitButton.textContent = "Submit Score";

    // Remove any existing success messages
    const existingSuccess = submitButton.parentNode.querySelector(
      '[style*="color: var(--success-color"]'
    );
    if (existingSuccess) {
      existingSuccess.remove();
    }
    this.loadLeaderboard();
  }

  restartQuiz() {
    this.audioManager.stopAll();
    const resultsEl = document.getElementById("quiz-results");
    const setupEl = document.getElementById("quiz-setup");

    // Remove previous share section if it exists
    const shareSection = document.getElementById("share-section");
    if (shareSection) {
      shareSection.remove();
    }

    resultsEl.classList.add("fade-out");

    setTimeout(() => {
      resultsEl.style.display = "none";
      setupEl.style.display = "block";
      setupEl.classList.remove("fade-out");
    }, 400);

    // Reset quiz state for new quiz
    this.quizSubmitted = false;
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.results = [];
    this.questions = [];

    if (window.history.replaceState) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }

  exitQuiz() {
    if (confirm("Are you sure you want to end the quiz now and see your results so far?")) {
      this.audioManager.stopAll();
      this.showResults(true); // Pass a flag to indicate early exit
    }
  }

  submitToLeaderboard(username, score, settings, duration, results) {
    try {
      const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");

      const entry = {
        username,
        score,
        settings,
        duration,
        results,
        timestamp: new Date().toISOString(),
      };

      leaderboard.push(entry);
      localStorage.setItem("leaderboard", JSON.stringify(leaderboard));

      console.log("Score submitted to leaderboard:", entry);
      return true;
    } catch (error) {
      console.error("Error submitting to leaderboard:", error);
      alert("Error submitting score to leaderboard. Please try again.");
      return false;
    }
  }

  loadLeaderboard() {
    const list = document.getElementById("leaderboard-list");
    if (!list) return; // Element might not exist on quiz page

    try {
      const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");

      // Sort by percentage (descending), then by duration (ascending) for ties
      leaderboard.sort((a, b) => {
        const [scoreA, totalA] = a.score.split("/").map(Number);
        const [scoreB, totalB] = b.score.split("/").map(Number);

        const percentA = scoreA / totalA;
        const percentB = scoreB / totalB;

        return percentB - percentA || a.duration - b.duration;
      });

      list.innerHTML = ""; // Clear existing entries

      leaderboard.slice(0, 10).forEach((entry, index) => {
        const li = document.createElement("li");
        li.style.marginBottom = "16px";
        li.style.padding = "12px";
        li.style.border = "1px solid #ccc";
        li.style.borderRadius = "8px";
        li.style.background = "var(--card-bg)";
        li.style.boxShadow = "var(--box-shadow)";

        const resultId = `local_result_${Date.now()}_${index}`;
        localStorage.setItem("shared_result_" + resultId, JSON.stringify(entry));

        const [score, total] = entry.score.split("/").map(Number);
        const percentage = Math.round((score / total) * 100);

        // Build settings display with description hints
        const settingsParts = [];
        if (entry.settings.questionCount) {
          settingsParts.push(`Questions: ${entry.settings.questionCount}`);
        }
        if (entry.settings.showTableHints !== undefined) {
          settingsParts.push(`Table hints: ${entry.settings.showTableHints ? "On" : "Off"}`);
        }
        if (entry.settings.showDescriptionHints !== undefined) {
          settingsParts.push(
            `Description hints: ${entry.settings.showDescriptionHints ? "On" : "Off"}`
          );
        }

        li.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
              <strong>${entry.username}</strong><br/>
              Score: ${entry.score} (${percentage}%)<br/>
              Time: ${this.formatDuration(entry.duration)}<br/>
              <small>${settingsParts.join(", ")}</small>
            </div>
            <a href="?result=${resultId}" class="global-button">View Details</a>
          </div>
        `;

        list.appendChild(li);
      });
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    }
  }

  generateShareableLink(resultsData) {
    const id = crypto.randomUUID();
    localStorage.setItem("shared_result_" + id, JSON.stringify(resultsData));
    this.lastSharedResultId = id;
    return `${window.location.href.split("?")[0]}?result=${id}`;
  }

  showResultsFromSharedData(data) {
    const resultsEl = document.getElementById("quiz-results");
    const breakdown = document.getElementById("results-breakdown");

    document.getElementById("quiz-setup").style.display = "none";
    document.getElementById("quiz-game").style.display = "none";
    resultsEl.style.display = "block";
    document.querySelector("#quiz-results h2").textContent = "Shared Quiz Results";

    const [scoreNum, totalNum] = data.score.split("/").map(Number);
    const percentage = Math.round((scoreNum / totalNum) * 100);
    const username = data.username || "Anonymous";

    document.getElementById(
      "score-display"
    ).innerHTML = `<strong>${username}</strong><br>${data.score} (${percentage}%)`;

    if (data.earlyExit) {
      const earlyMsg = document.createElement("div");
      earlyMsg.style.color = "orange";
      earlyMsg.style.marginTop = "10px";
      earlyMsg.textContent = "⚠️ This quiz was ended early.";
      document.getElementById("score-display").appendChild(earlyMsg);
    }

    if (data.duration) {
      const quizTime = document.createElement("div");
      quizTime.style.color = "green";
      quizTime.style.fontSize = "0.75em";
      quizTime.textContent = `Duration: ${this.formatDuration(data.duration)}`;
      document.getElementById("score-display").appendChild(quizTime);
    }

    // Show quiz settings including description hints
    const settingsDisplay = document.createElement("div");
    settingsDisplay.style.margin = "10px 0";

    const settings = data.settings || {};
    const settingLines = [];

    if (settings.questionCount) {
      settingLines.push(`Questions: ${settings.questionCount}`);
    }
    if (settings.showTableHints !== undefined) {
      settingLines.push(`Table hints: ${settings.showTableHints ? "On" : "Off"}`);
    }
    if (settings.showDescriptionHints !== undefined) {
      settingLines.push(`Description hints: ${settings.showDescriptionHints ? "On" : "Off"}`);
    }
    if (data.duration) {
      settingLines.push(`Duration: ${data.duration}s`);
    }

    if (settings.selectedSymbols || settings.unselectedSymbols) {
      const selected = settings.selectedSymbols?.join(", ") || "None";
      const unselected = settings.unselectedSymbols?.join(", ") || "None";
      settingLines.push(`Symbols: [✔️ ${selected}] [❌ ${unselected}]`);
    }

    if (settings.selectedGroups || settings.unselectedGroups) {
      const selected = settings.selectedGroups?.join(", ") || "None";
      const unselected = settings.unselectedGroups?.join(", ") || "None";
      settingLines.push(`Groups: [✔️ ${selected}] [❌ ${unselected}]`);
    }

    const selectedSymbolImgs =
      (settings.selectedSymbols || [])
        .map((s) => {
          const img = Config.SYMBOL_TO_IMAGE_MAP?.[s];
          return img
            ? `<img src="assets/rwr-symbols/${img}.jpg" alt="${s}" title="${s}" style="height: 32px; border: 1px solid white; border-radius: 4px;">`
            : `<span>${s}</span>`;
        })
        .join("") || "None";

    const groupText = settings.selectedGroups?.join(", ") || "None";

    settingsDisplay.innerHTML = `
      <div class="quiz-settings-dropdown" style="
        border: 1px solid #ccc;
        border-radius: 8px;
        background: var(--bg-color);
        box-shadow: var(--box-shadow, 0 2px 6px rgba(0, 0, 0, 0.1));
        margin-bottom: 20px;
        overflow: hidden;
        color: var(--text-color)
      ">
        <button id="toggle-quiz-settings" style="
          width: 100%;
          text-align: left;
          padding: 12px 16px;
          cursor: pointer;
          font-size: 1.1em;
          font-weight: bold;
          background-color: var(--card-bg);
          border: none;
          border-radius: 8px 8px 0 0;
          user-select: none;
          color: var(--text-color)
        ">
          Quiz Settings ▼
        </button>
        <div id="quiz-settings-content" style="
          padding: 0 16px;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease, padding 0.4s ease;
        ">
          <ul style="padding-left: 20px; margin: 16px 0;">
            <li><strong>Questions:</strong> ${settings.questionCount ?? "?"}</li>
            <li><strong>Table Hints:</strong> ${settings.showTableHints ? "On" : "Off"}</li>
            <li><strong>Description Hints:</strong> ${
              settings.showDescriptionHints ? "On" : "Off"
            }</li>
            <li>
              <strong>Symbols:</strong><br>
              <div style="margin-left: 10px;">
                <div style="margin-bottom: 6px;">
                  <span style="color: green;">Selected:</span><br>
                  <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-top: 4px;">
                    ${selectedSymbolImgs}
                  </div>
                </div>
              </div>
            </li>
            <li>
              <strong>Groups:</strong><br>
              <div style="margin-left: 10px;">
                <div style="margin-bottom: 6px;">
                  <span style="color: green;">Selected:</span> ${groupText}
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    `;

    setTimeout(() => {
      const btn = document.getElementById("toggle-quiz-settings");
      const content = document.getElementById("quiz-settings-content");

      if (btn && content) {
        btn.addEventListener("click", () => {
          const isOpen = content.style.maxHeight && content.style.maxHeight !== "0px";

          if (isOpen) {
            content.style.maxHeight = "0";
            content.style.paddingBottom = "0";
            btn.innerHTML = "Quiz Settings ▼";
          } else {
            content.style.maxHeight = content.scrollHeight + 40 + "px";
            content.style.paddingBottom = "16px";
            btn.innerHTML = "Quiz Settings ▲";
          }
        });
      }
    }, 0);

    breakdown.innerHTML = "";
    breakdown.appendChild(settingsDisplay);

    data.results.forEach((result, index) => {
      const isCorrect = result.isCorrect;
      const isPrimary = result.isPrimary;
      const q = result.question;

      const item = document.createElement("div");
      item.className = isCorrect
        ? isPrimary
          ? "result-item correct primary-correct"
          : "result-item correct secondary-correct"
        : "result-item incorrect";

      const questionNum = document.createElement("span");
      questionNum.textContent = `Q${index + 1}:`;
      questionNum.style.fontWeight = "bold";
      questionNum.style.minWidth = "35px";

      const symbolsDiv = document.createElement("div");
      symbolsDiv.style.display = "flex";
      symbolsDiv.style.gap = "5px";

      q.symbols?.forEach((symbol) => {
        const imageFile = Config.SYMBOL_TO_IMAGE_MAP[symbol];
        if (imageFile) {
          const img = document.createElement("img");
          img.src = `assets/rwr-symbols/${imageFile}.jpg`;
          img.alt = symbol;
          symbolsDiv.appendChild(img);
        }
      });

      const details = document.createElement("div");
      let correctAnswersDisplay = q.primaryCorrectAnswer;
      if (q.alternativeCorrectAnswers?.length > 0) {
        correctAnswersDisplay += ` (or ${q.alternativeCorrectAnswers.join(", ")})`;
      }

      let answerStatus = "";
      let tooltipText = "";

      if (isCorrect) {
        if (isPrimary) {
          answerStatus = " ✓ (Primary)";
        } else {
          answerStatus = " ✓ (Alternative)";
          tooltipText =
            "Alternative answers are radar systems that have the same RWR symbols and PRF tone as the primary answer.";
        }
      } else {
        answerStatus = " ❌";
      }

      let answerStatusHTML = answerStatus;
      if (isCorrect && !isPrimary) {
        answerStatusHTML = `<span class="alternative-answer-tooltip" data-tooltip="${tooltipText}">${answerStatus}</span>`;
      }

      details.innerHTML = `
        <strong>${correctAnswersDisplay}</strong><br>
        Your answer: ${result.selectedAnswer}${answerStatusHTML}
      `;

      item.appendChild(questionNum);
      item.appendChild(symbolsDiv);
      item.appendChild(details);
      breakdown.appendChild(item);
    });

    // Hide leaderboard submission section for shared results
    const leaderboardSubmit = document.querySelector(".leaderboard-submit");
    if (leaderboardSubmit) {
      leaderboardSubmit.style.display = "none";
    }

    // Hide leaderboard display for shared results
    const leaderboard = document.getElementById("leaderboard");
    if (leaderboard) {
      leaderboard.style.display = "none";
    }

    // Change restart button text
    const restartBtn = document.getElementById("restart-quiz-btn");
    if (restartBtn) {
      restartBtn.textContent = "Take a Quiz";
    }
  }

  formatDuration(seconds) {
    if (seconds < 60) {
      return `${seconds} seconds`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} mins ${secs} secs`;
  }
}

// Initialize the quiz when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const quiz = new Quiz();
  quiz.initialize();
});
