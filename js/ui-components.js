// UI component classes (fixed minimal implementation)
(function () {
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'className') node.className = v;
      else if (k === 'textContent') node.textContent = v;
      else if (k.startsWith('data-')) node.setAttribute(k, v);
      else node.setAttribute(k, v);
    }
    if (!Array.isArray(children)) children = [children];
    for (const child of children) {
      if (child == null) continue;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return node;
  }

  class SoundCard {
    constructor(soundData, audioManager) {
      this.soundData = soundData;
      this.audioManager = audioManager;
      this.element = null;
    }

    render() {
      const title = this.soundData.displayName || this.soundData.name || this.soundData.file || 'Unknown';
      const card = el('div', { className: 'audio-card' });

      const header = el('div', { className: 'audio-card-header' }, [
        el('div', { className: 'audio-title', textContent: title }),
      ]);

      const controls = el('div', { className: 'audio-controls' });
      const playBtn = el('button', { className: 'play-button' }, 'Play');
      const stopBtn = el('button', { className: 'stop-button' }, 'Stop');

      playBtn.addEventListener('click', () => {
        if (this.soundData && this.soundData.file && this.audioManager) {
          this.audioManager.playSound(this.soundData.file);
        }
      });
      stopBtn.addEventListener('click', () => {
        if (this.soundData && this.soundData.file && this.audioManager) {
          this.audioManager.stopSound(this.soundData.file);
        }
      });

      controls.appendChild(playBtn);
      controls.appendChild(stopBtn);

      // Toggle extra info on title click
      header.addEventListener('click', () => {
        extraInfo.style.display = extraInfo.style.display === 'none' ? 'block' : 'none';
      });


      const footer = el('div', { className: 'audio-card-footer' });
      // ----- Extra Info (Radar details, PRF, symbols, warnings) -----
      const extraInfo = el('div', { className: 'extra-info' });
      extraInfo.style.display = 'none';
      extraInfo.style.fontSize = '0.85em';
      extraInfo.style.marginTop = '5px';

      const fullPath = this.soundData.file;
      const radarInfo = (window.APP_STATE && window.APP_STATE.alr46Info) ? window.APP_STATE.alr46Info[fullPath] : null;

      function getBandDesignation(freqGHz) {
        if (freqGHz >= 0.003 && freqGHz < 0.03) return 'HF';
        if (freqGHz >= 0.03 && freqGHz < 0.3) return 'VHF';
        if (freqGHz >= 0.3 && freqGHz < 1) return 'UHF';
        if (freqGHz >= 1 && freqGHz < 2) return 'L';
        if (freqGHz >= 2 && freqGHz < 4) return 'S';
        if (freqGHz >= 4 && freqGHz < 8) return 'C';
        if (freqGHz >= 8 && freqGHz < 12) return 'X';
        if (freqGHz >= 12 && freqGHz < 18) return 'Ku';
        if (freqGHz >= 18 && freqGHz < 27) return 'K';
        if (freqGHz >= 27 && freqGHz < 40) return 'Ka';
        if (freqGHz >= 40 && freqGHz < 75) return 'V';
        if (freqGHz >= 75 && freqGHz < 110) return 'W';
        if (freqGHz >= 110 && freqGHz <= 300) return 'mm or G';
        return 'Unknown Band';
      }

      const parts = [];
      if (radarInfo) {
        if (radarInfo.band != null) {
          const freqGHz = Number(radarInfo.band);
          const band = getBandDesignation(freqGHz);
          parts.push(`Radar Frequency: ${freqGHz.toFixed(2)} GHz (${band} band)`);
        }

        // PRF logic adapted from original
        if (fullPath.includes('SEARCH') && radarInfo.type == 'SEARCH_ONLY') {
          parts.push(`PRF: ${Number(radarInfo.prf_search).toFixed(2)}`);
        } else if (fullPath.includes('SEARCH') && radarInfo.type == 'TRACK_ONLY' && radarInfo.prf_search != radarInfo.prf_track) {
          parts.push(`PRF (Acquisition): ${Number(radarInfo.prf_search).toFixed(2)}`);
          parts.push(`PRF (Track): ${Number(radarInfo.prf_track).toFixed(2)}`);
        } else if (fullPath.includes('TRACK') && radarInfo.type == 'TRACK_ONLY' && radarInfo.prf_search != radarInfo.prf_track) {
          parts.push(`PRF (Acquisition): ${Number(radarInfo.prf_search).toFixed(2)}`);
          parts.push(`PRF (Track): ${Number(radarInfo.prf_track).toFixed(2)}`);
        } else if (fullPath.includes('SEARCH') && radarInfo.type == 'SEARCH_ONLY' && radarInfo.prf_search == radarInfo.prf_track) {
          parts.push(`PRF: ${Number(radarInfo.prf_search).toFixed(2)}`);
        } else if (fullPath.includes('TRACK') && radarInfo.type == 'TRACK_ONLY' && radarInfo.prf_search == radarInfo.prf_track) {
          parts.push(`PRF: ${Number(radarInfo.prf_track).toFixed(2)}`);
        } else if ((fullPath.includes('SEARCH') || fullPath.includes('TRACK')) && radarInfo.type == 'SEARCH_AND_TRACK' && radarInfo.prf_search == radarInfo.prf_track) {
          parts.push(`PRF: ${Number(radarInfo.prf_track).toFixed(2)}`);
        } else if ((fullPath.includes('SEARCH') || fullPath.includes('TRACK')) && radarInfo.type == 'SEARCH_AND_TRACK' && radarInfo.prf_search != radarInfo.prf_track) {
          parts.push(`PRF (Search): ${Number(radarInfo.prf_search).toFixed(2)}`);
          parts.push(`PRF (Track): ${Number(radarInfo.prf_track).toFixed(2)}`);
        }

        // Launch warning
        parts.push(`Launch Warning: ${radarInfo.has_cd_command_guidance === true ? 'True' : 'False'}`);

        // Radar type
        if (radarInfo.type == 'SEARCH_ONLY') parts.push('Radar Type: Search');
        else if (radarInfo.type == 'TRACK_ONLY') parts.push('Radar Type: Track');
        else if (radarInfo.type == 'SEARCH_AND_TRACK') parts.push('Radar Type: Search and Track');
      }

      // Insert PRF and meta lines
      if (parts.length) {
        const infoBlock = el('div', { className: 'extra-info-lines' });
        infoBlock.innerHTML = parts.join('<br>');
        extraInfo.appendChild(infoBlock);
      } else {
        extraInfo.appendChild(el('div', { textContent: 'No extra info available.' }));
      }

      // ---- Symbol rendering (from emitter map) ----
      const symbolToImageMap = (window.APP_CONFIG && window.APP_CONFIG.SYMBOL_TO_IMAGE_MAP) ? window.APP_CONFIG.SYMBOL_TO_IMAGE_MAP : {};
      const sourceNameMap = { ai_file_entries: 'Air Intercept Table', new_land_file: 'Land-based Radar Table', new_sea_file: 'Sea-based Radar Table' };

      // Normalize options to find in radarSymbolMap
      const stripped = fullPath.replace(/^imported_wavs\\//i, '').replace(/_(SEARCH|TRACK)\\.wav$/i, '');
      const normalizedOptions = [
        window.Utils.normalizeRadarName(stripped + '.wav'),
        window.Utils.normalizeRadarName(stripped),
        window.Utils.normalizeRadarName(this.soundData.name || ''),
        window.Utils.normalizeRadarName(this.soundData.description || '')
      ];

      let radarEntry = null;
      let matchedKey = null;
      const map = (window.APP_STATE && window.APP_STATE.radarSymbolMap) ? window.APP_STATE.radarSymbolMap : null;

      if (map) {
        for (const n of normalizedOptions) {
          if (n && map[n]) { radarEntry = map[n]; matchedKey = n; break; }
        }
        if (!radarEntry) {
          for (const [key, entry] of Object.entries(map)) {
            if (normalizedOptions.some(opt => (opt && (key.includes(opt) || opt.includes(key))))) {
              radarEntry = entry; matchedKey = key; break;
            }
          }
        }
      }

      function createSymbolWithLabel(symbolValue, symbolNumber, isUnknown = false) {
        const imageFileName = symbolToImageMap[symbolValue];
        if (!imageFileName) return null;

        const symbolWrapper = el('div', { className: 'symbol-wrapper' });
        const label = el('div', { textContent: isUnknown ? 'Unknown' : (symbolNumber ? `Symbol ${symbolNumber}` : 'Symbol') });
        label.style.fontSize = '0.8em';
        label.style.fontWeight = 'bold';
        label.style.color = isUnknown ? '#ff6b35' : 'var(--highlight)';
        label.style.textAlign = 'center';

        const img = el('img', {
          src: `assets/rwr-symbols/${imageFileName}.jpg`,
          alt: isUnknown ? `Unknown RWR Symbol: ${symbolValue}` : `RWR Symbol ${symbolNumber}: ${symbolValue}`
        });
        img.style.maxHeight = '65px';
        img.style.border = isUnknown ? '2px solid #ff6b35' : '1px solid var(--highlight)';
        img.style.borderRadius = '1px';
        img.style.background = 'white';
        img.style.padding = '1px';
        img.onerror = () => { symbolWrapper.style.display = 'none'; };

        symbolWrapper.appendChild(label);
        symbolWrapper.appendChild(img);
        return symbolWrapper;
      }

      const warningsToDisplay = [];

      if (radarEntry) {
        const list = Array.isArray(radarEntry) ? radarEntry : [radarEntry];
        for (const ent of list) {
          const { symbol1, symbol2, source, warning, warning2 } = ent;
          const isManualUnknownSymbol = ['unknown_low','unknown_medium','unknown_high'].includes(symbol1) || ['unknown_low','unknown_medium','unknown_high'].includes(symbol2);

          const symbolContainer = el('div', { className: 'symbol-container' });
          const s1 = createSymbolWithLabel(symbol1, 1, ['unknown_low','unknown_medium','unknown_high'].includes(symbol1));
          if (s1) symbolContainer.appendChild(s1);
          if (symbol2 && symbol2 !== symbol1) {
            const s2 = createSymbolWithLabel(symbol2, 2, ['unknown_low','unknown_medium','unknown_high'].includes(symbol2));
            if (s2) symbolContainer.appendChild(s2);
          }
          if (symbolContainer.children.length > 0) extraInfo.appendChild(symbolContainer);

          if (isManualUnknownSymbol) {
            let frequencyBand = 'Unknown';
            if (radarInfo && radarInfo.band != null) {
              const freqGHz = Number(radarInfo.band);
              if (freqGHz >= 2 && freqGHz < 4) frequencyBand = 'Low band (2-4 GHz)';
              else if (freqGHz >= 4 && freqGHz < 8) frequencyBand = 'Medium band (4-8 GHz)';
              else if (freqGHz >= 8 && freqGHz <= 20) frequencyBand = 'High band (8-20 GHz)';
            }
            const bandText = el('div', { textContent: frequencyBand });
            bandText.style.fontSize = '0.75em';
            bandText.style.color = '#ff6b35';
            bandText.style.marginTop = '4px';
            bandText.style.textAlign = 'center';
            extraInfo.appendChild(bandText);
          } else {
            const friendly = sourceNameMap[source] || source;
            const srcText = el('div');
            srcText.innerHTML = `<b>Source Table:</b> ${friendly}`;
            srcText.style.fontSize = '0.85em';
            srcText.style.marginTop = '8px';
            srcText.style.color = 'var(--highlight)';
            srcText.style.textAlign = 'center';
            extraInfo.appendChild(srcText);
          }

          if (warning && String(warning).trim()) warningsToDisplay.append(String(warning).trim());
          if (warning2 && String(warning2).trim()) warningsToDisplay.append(String(warning2).trim());
        }
      } else {
        let unknownSymbol = null;
        let frequencyBand = 'Unknown';
        if (radarInfo && radarInfo.band != null) {
          const freqGHz = Number(radarInfo.band);
          unknownSymbol = window.Utils.getUnknownSymbolFromFrequency(freqGHz);
          if (freqGHz >= 2 && freqGHz < 4) frequencyBand = 'Low band (2-4 GHz)';
          else if (freqGHz >= 4 && freqGHz < 8) frequencyBand = 'Medium band (4-8 GHz)';
          else if (freqGHz >= 8 && freqGHz <= 20) frequencyBand = 'High band (8-20 GHz)';
        }

        if (unknownSymbol) {
          const container = el('div', { className: 'symbol-container' });
          const unknownEl = createSymbolWithLabel(unknownSymbol, null, true);
          if (unknownEl) container.appendChild(unknownEl);
          const bandText = el('div', { textContent: frequencyBand });
          bandText.style.fontSize = '0.75em';
          bandText.style.color = '#ff6b35';
          bandText.style.marginTop = '4px';
          bandText.style.textAlign = 'center';
          container.appendChild(bandText);
          extraInfo.appendChild(container);

          const warn = el('div');
          warn.innerHTML = `<b style="color: #ff6b35;">⚠️ WARNING:</b> This radar is not in the RWR symbol library.<br>Symbol assigned based on frequency band.`;
          warn.style.fontSize = '0.85em';
          warn.style.marginTop = '8px';
          warn.style.color = '#ff6b35';
          warn.style.textAlign = 'center';
          warn.style.backgroundColor = 'rgba(255, 107, 53, 0.1)';
          warn.style.padding = '8px';
          warn.style.borderRadius = '4px';
          warn.style.border = '1px solid rgba(255, 107, 53, 0.3)';
          extraInfo.appendChild(warn);
        }
      }

      if (warningsToDisplay.length) {
        const warningContainer = el('div');
        warningContainer.style.marginTop = '8px';
        warningsToDisplay.forEach((w, i) => {
          const t = el('div');
          t.innerHTML = `<b style="color: #ff6b35;"></b> ${w}`;
          t.style.fontSize = '0.85em';
          t.style.marginTop = i > 0 ? '4px' : '0px';
          t.style.color = '#ff6b35';
          t.style.textAlign = 'center';
          t.style.backgroundColor = 'rgba(255, 107, 53, 0.1)';
          t.style.padding = '8px';
          t.style.borderRadius = '4px';
          t.style.border = '1px solid rgba(255, 107, 53, 0.3)';
          warningContainer.appendChild(t);
        });
        extraInfo.appendChild(warningContainer);
      }

      card.appendChild(header);
      card.appendChild(controls);
      card.appendChild(extraInfo);
      card.appendChild(footer);

      this.element = card;
      return card;
    }

    destroy() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.element = null;
    }
  }

  class SoundGroup {
    constructor(groupName, sounds, audioManager) {
      this.groupName = groupName || 'Other';
      this.sounds = Array.isArray(sounds) ? sounds : [];
      this.audioManager = audioManager;
      this.element = null;
      this.isCollapsed = false;
      this.cards = [];
      this._handlers = [];
    }

    render() {
      const container = el('section', { className: 'audio-group', 'data-group': this.groupName });

      const header = el('div', { className: 'group-header' });
      const title = el('h2', { className: 'group-title' }, `${this.groupName} (${this.sounds.length})`);
      const actions = el('div', { className: 'group-actions' });

      const toggleBtn = el('button', { className: 'group-toggle' }, 'Collapse');
      const playAllBtn = el('button', { className: 'play-all-btn' }, 'Play All');
      const stopAllBtn = el('button', { className: 'stop-all-btn' }, 'Stop All');

      actions.appendChild(playAllBtn);
      actions.appendChild(stopAllBtn);
      actions.appendChild(toggleBtn);
      header.appendChild(title);
      header.appendChild(actions);

      const grid = el('div', { className: 'audio-grid' });
      this.sounds.forEach(s => {
        const card = new SoundCard(s, this.audioManager);
        this.cards.push(card);
        grid.appendChild(card.render());
      });

      // Wire up handlers
      const onToggle = () => {
        this.isCollapsed = !this.isCollapsed;
        grid.style.display = this.isCollapsed ? 'none' : '';
        toggleBtn.textContent = this.isCollapsed ? 'Expand' : 'Collapse';
        // persist collapsed groups if APP_STATE is available
        try {
          if (window.APP_STATE) {
            const key = window.APP_CONFIG?.STORAGE_KEYS?.COLLAPSED_GROUPS;
            if (key) {
              const current = new Set(window.StorageService.getJSON(key, []));
              if (this.isCollapsed) current.add(this.groupName);
              else current.delete(this.groupName);
              window.StorageService.setJSON(key, Array.from(current));
              window.APP_STATE.collapsedGroups = Array.from(current);
            }
          }
        } catch (e) { /* no-op */ }
      };
      toggleBtn.addEventListener('click', onToggle);
      this._handlers.push(['click', toggleBtn, onToggle]);

      const onPlayAll = () => {
        if (this.audioManager) {
          this.sounds.forEach(s => this.audioManager.playSound(s.file));
        }
      };
      playAllBtn.addEventListener('click', onPlayAll);
      this._handlers.push(['click', playAllBtn, onPlayAll]);

      const onStopAll = () => {
        if (this.audioManager) {
          this.audioManager.stopAllSounds();
        }
      };
      stopAllBtn.addEventListener('click', onStopAll);
      this._handlers.push(['click', stopAllBtn, onStopAll]);

      container.appendChild(header);
      container.appendChild(grid);

      // start collapsed if stored
      try {
        const key = window.APP_CONFIG?.STORAGE_KEYS?.COLLAPSED_GROUPS;
        if (key) {
          const collapsed = new Set(window.StorageService.getJSON(key, []));
          if (collapsed.has(this.groupName)) {
            this.isCollapsed = true;
            grid.style.display = 'none';
            toggleBtn.textContent = 'Expand';
          }
        }
      } catch (e) { /* no-op */ }

      this.element = container;
      return container;
    }

    expand() {
      if (!this.element) return Promise.resolve(false);
      const grid = this.element.querySelector('.audio-grid');
      if (grid && this.isCollapsed) {
        grid.style.display = '';
        this.isCollapsed = false;
        const btn = this.element.querySelector('.group-toggle');
        if (btn) btn.textContent = 'Collapse';
      }
      return Promise.resolve(true);
    }

    destroy() {
      // remove card elements
      this.cards.forEach(c => c.destroy());
      this.cards = [];
      // detach handlers
      for (const [type, node, fn] of this._handlers) {
        try { node.removeEventListener(type, fn); } catch (e) {}
      }
      this._handlers = [];
      // remove root
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.element = null;
    }
  }


  class ProgressIndicator {
    constructor() {
      this.container = document.getElementById('progress-container');
      this.bar = document.getElementById('progress-bar');
    }
    show() {
      if (this.container) this.container.style.display = 'block';
      if (this.bar) this.bar.style.width = '0%';
    }
    hide() {
      if (this.container) this.container.style.display = 'none';
    }
    setProgress(pct) {
      if (!this.bar) return;
      const clamped = Math.max(0, Math.min(100, pct));
      this.bar.style.width = clamped + '%';
    }
  }

  class VolumeControl {
    constructor(audioManager) {
      this.audioManager = audioManager;
      this.slider = document.getElementById('volume-slider');
      this._onInput = this._onInput.bind(this);
      this.init();
    }
    init() {
      if (!this.slider) return;
      // read stored volume or default
      const saved = window.StorageService.getItem(window.APP_CONFIG.STORAGE_KEYS.VOLUME);
      const vol = saved != null ? parseInt(saved, 10) : (window.APP_CONFIG.AUDIO.DEFAULT_VOLUME || 50);
      const safe = isFinite(vol) ? Math.max(0, Math.min(100, vol)) : 50;
      this.slider.value = String(safe);
      if (this.audioManager && typeof this.audioManager.setVolume === 'function') {
        this.audioManager.setVolume(safe);
      }
      this.slider.addEventListener('input', this._onInput);
    }
    _onInput(e) {
      const v = parseInt(e.target.value, 10);
      if (this.audioManager && typeof this.audioManager.setVolume === 'function') {
        this.audioManager.setVolume(isFinite(v) ? v : 50);
      }
    }
    destroy() {
      if (this.slider) this.slider.removeEventListener('input', this._onInput);
    }
  }

  window.UIComponents = {
    SoundCard,
    SoundGroup,
    ProgressIndicator,
    VolumeControl
  };
})();
