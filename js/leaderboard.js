class LeaderboardManager {
  constructor() {
    this.leaderboardKey = "leaderboard";
    this.init();
  }

  init() {
    this.loadLeaderboard();
    this.setupAutoRefresh();
  }

  getLeaderboard() {
    try {
      return JSON.parse(localStorage.getItem(this.leaderboardKey) || "[]");
    } catch (e) {
      console.error("Error parsing leaderboard data:", e);
      return [];
    }
  }

  saveLeaderboard(data) {
    try {
      localStorage.setItem(this.leaderboardKey, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("Error saving leaderboard data:", e);
      return false;
    }
  }

  sortLeaderboard(leaderboard) {
    return leaderboard.sort((a, b) => {
      try {
        const [scoreA, totalA] = (a.score || "0/1").split("/").map(Number);
        const [scoreB, totalB] = (b.score || "0/1").split("/").map(Number);

        const percentA = totalA > 0 ? scoreA / totalA : 0;
        const percentB = totalB > 0 ? scoreB / totalB : 0;

        const percentDiff = percentB - percentA;
        if (Math.abs(percentDiff) > 0.001) {
          return percentDiff;
        }

        const timeA = parseInt(a.duration) || 999999;
        const timeB = parseInt(b.duration) || 999999;
        return timeA - timeB;
      } catch (e) {
        console.error("Error sorting leaderboard entry:", e);
        return 0;
      }
    });
  }

  calculateStats(leaderboard) {
    if (leaderboard.length === 0) return null;

    const scores = leaderboard.map((entry) => {
      const [score, total] = (entry.score || "0/1").split("/").map(Number);
      return total > 0 ? (score / total) * 100 : 0;
    });

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const totalQuizzes = leaderboard.length;
    const perfectScores = scores.filter((score) => score === 100).length;

    return {
      totalQuizzes,
      avgScore: Math.round(avgScore),
      maxScore: Math.round(maxScore),
      perfectScores,
    };
  }

  displayStats(stats) {
    const container = document.getElementById("stats-container");
    if (!stats) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = `
      <div class="stats-summary">
        <div class="stat-item">
          <div class="stat-number">${stats.totalQuizzes}</div>
          <div class="stat-label">Total Quizzes</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">${stats.avgScore}%</div>
          <div class="stat-label">Average Score</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">${stats.maxScore}%</div>
          <div class="stat-label">Best Score</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">${stats.perfectScores}</div>
          <div class="stat-label">Perfect Scores</div>
        </div>
      </div>
    `;
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  generateResultId(entry, index) {
    const id = `local_result_${Date.now()}_${index}`;
    try {
      localStorage.setItem(`shared_result_${id}`, JSON.stringify(entry));
    } catch (e) {
      console.warn("Could not store result details:", e);
    }
    return id;
  }

  loadLeaderboard() {
    const leaderboard = this.getLeaderboard();
    const list = document.getElementById("leaderboard-list");
    const stats = document.getElementById("leaderboard-stats");

    if (!leaderboard || leaderboard.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <h3>No Quiz Results Yet</h3>
          <p>Complete a quiz to see your results here!</p>
          <a href="quiz.html" class="global-button">Take Your First Quiz</a>
        </div>
      `;
      stats.textContent = "No entries yet";
      this.displayStats(null);
      return;
    }

    const sortedLeaderboard = this.sortLeaderboard([...leaderboard]);
    const leaderboardStats = this.calculateStats(sortedLeaderboard);

    stats.textContent = `${leaderboard.length} total entries`;
    this.displayStats(leaderboardStats);

    list.innerHTML = "";

    sortedLeaderboard.slice(0, 50).forEach((entry, index) => {
      const li = document.createElement("li");
      li.className = "leaderboard-entry";
      const [score, total] = (entry.score || "0/1").split("/").map(Number);
      const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
      const rank = index + 1;
      const resultId = this.generateResultId(entry, index);

      let rankDisplay = rank;
      if (rank === 1) rankDisplay = "🥇 1st";
      else if (rank === 2) rankDisplay = "🥈 2nd";
      else if (rank === 3) rankDisplay = "🥉 3rd";

      const duration = parseInt(entry.duration) || 0;
      const timeDisplay = this.formatTime(duration);
      const settings = entry.settings || {};
      const settingsDisplay = [];
      if (settings.questionCount)
        settingsDisplay.push(`${settings.questionCount} questions`);
      if (settings.showTableHints !== undefined) {
        settingsDisplay.push(
          settings.showTableHints ? "hints: on" : "hints: off",
        );
      }

      let percentageColor = "var(--muted)";
      if (percentage >= 90) percentageColor = "var(--success-color)";
      else if (percentage >= 75) percentageColor = "var(--success-color-2)";
      else if (percentage >= 50) percentageColor = "var(--warning-color)";
      else percentageColor = "var(--danger-color)";

      li.innerHTML = `
        <div>
          <strong style="color: var(--primary-color);">${rankDisplay}</strong>
          <span>${this.escapeHtml(entry.username || "Anonymous")}</span>
          <span> | Score: ${entry.score}</span>
          <span style="color: ${percentageColor}; font-weight: bold;">(${percentage}%)</span>
          <span> | Time: ${timeDisplay}</span>
          ${
            entry.earlyExit
              ? '<span style="color: var(--warning-color)">⚠️ Quiz ended early</span>'
              : ""
          }
          <div><a href="quiz.html?result=${resultId}" class="global-button">View Details</a></div>
        </div>
      `;
      list.appendChild(li);
    });
  }

  clearLeaderboard() {
    if (
      confirm(
        "Are you sure you want to clear all leaderboard entries? This cannot be undone!",
      )
    ) {
      localStorage.removeItem(this.leaderboardKey);

      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("shared_result_local_result_")) {
          localStorage.removeItem(key);
        }
      });

      this.loadLeaderboard();
      alert("Leaderboard cleared successfully!");
    }
  }

  exportLeaderboard() {
    const leaderboard = this.getLeaderboard();
    if (leaderboard.length === 0) {
      alert("No data to export!");
      return;
    }

    const dataStr = JSON.stringify(leaderboard, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = `quiz_leaderboard_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  refresh() {
    this.loadLeaderboard();
  }

  setupAutoRefresh() {
    let autoRefreshInterval;

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (autoRefreshInterval) {
          clearInterval(autoRefreshInterval);
        }
      } else {
        autoRefreshInterval = setInterval(() => {
          this.refresh();
        }, 30000);
      }
    });

    if (!document.hidden) {
      autoRefreshInterval = setInterval(() => {
        this.refresh();
      }, 30000);
    }
  }
}

// Button bindings
let leaderboardManager;

function refreshLeaderboard() {
  leaderboardManager.refresh();
}

function clearLeaderboard() {
  leaderboardManager.clearLeaderboard();
}

function exportLeaderboard() {
  leaderboardManager.exportLeaderboard();
}

document.addEventListener("DOMContentLoaded", () => {
  leaderboardManager = new LeaderboardManager();
});
