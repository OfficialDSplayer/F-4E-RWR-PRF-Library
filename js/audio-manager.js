// Auto-generated from inline <script> in index.html
function stopAll() {
        currentPlayAllSession++;

        playingSources.forEach((src) => {
          try {
            src.node.stop();
            src.node.disconnect();
          } 

async function playAll() {
        stopAll(); // Clear running sounds
        cancelledLoads.clear(); // ✅ Reset the cancellation list

        currentPlayAllSession++;
        const thisSession = currentPlayAllSession;

        const playAllBtn = document.querySelector('button[onclick="playAll()"]');
        if (playAllBtn) {
          playAllBtn.classList.add("loading");
          playAllBtn.disabled = true;
        }

        
window.stopAll = stopAll;
window.playAll = playAll;
