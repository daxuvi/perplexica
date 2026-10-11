import { Storage } from './storage.js';
import { GeminiService } from './gemini.js';
import { Markdown } from './markdown.js';

class App {
  constructor() {
    this.currentMode = 'web';
    this.currentAttachment = null;
    this.activeThread = null;
    this.isGenerating = false;

    this.initElements();
    this.bindEvents();
    this.loadState();
  }

  initElements() {
    // Layout
    this.sidebar = document.getElementById('sidebar');
    this.btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    this.brandHomeLink = document.getElementById('brand-home-link');
    this.btnNewThread = document.getElementById('btn-new-thread');
    this.historyList = document.getElementById('history-list');
    this.btnClearHistory = document.getElementById('btn-clear-history');
    this.statusDot = document.getElementById('status-dot');
    this.statusText = document.getElementById('status-text');
    this.currentModelName = document.getElementById('current-model-name');
    this.topModelChip = document.getElementById('top-model-chip');
    this.btnExportChat = document.getElementById('btn-export-chat');

    // Views
    this.contentContainer = document.getElementById('content-container');
    this.heroView = document.getElementById('hero-view');
    this.threadView = document.getElementById('thread-view');
    this.stickyBar = document.getElementById('sticky-bar');

    // Hero Inputs
    this.heroInput = document.getElementById('hero-input');
    this.btnHeroSubmit = document.getElementById('btn-hero-submit');
    this.heroFocusPills = document.querySelectorAll('#hero-focus-pills .focus-pill');
    this.btnHeroAttach = document.getElementById('btn-hero-attach');
    this.heroFileInput = document.getElementById('hero-file-input');
    this.heroAttachChip = document.getElementById('hero-attach-chip');
    this.heroAttachName = document.getElementById('hero-attach-name');
    this.btnHeroRemoveAttach = document.getElementById('btn-hero-remove-attach');

    // Sticky Inputs
    this.stickyInput = document.getElementById('sticky-input');
    this.btnStickySubmit = document.getElementById('btn-sticky-submit');
    this.btnStickyAttach = document.getElementById('btn-sticky-attach');
    this.stickyFileInput = document.getElementById('sticky-file-input');
    this.stickyAttachChip = document.getElementById('sticky-attach-chip');
    this.stickyAttachName = document.getElementById('sticky-attach-name');
    this.btnStickyRemoveAttach = document.getElementById('btn-sticky-remove-attach');
    this.stickyModeIndicator = document.getElementById('sticky-mode-indicator');

    // Settings Modal
    this.settingsModal = document.getElementById('settings-modal');
    this.btnOpenSettings = document.getElementById('btn-open-settings');
    this.btnCloseSettings = document.getElementById('btn-close-settings');
    this.btnCancelSettings = document.getElementById('btn-cancel-settings');
    this.btnSaveSettings = document.getElementById('btn-save-settings');
    this.settingApiKey = document.getElementById('setting-api-key');
    this.btnToggleKeyVis = document.getElementById('btn-toggle-key-visibility');
    this.btnTestKey = document.getElementById('btn-test-key');
    this.keyTestFeedback = document.getElementById('key-test-feedback');
    this.settingModel = document.getElementById('setting-model');
    this.settingGrounding = document.getElementById('setting-grounding');
    this.settingTemperature = document.getElementById('setting-temperature');
    this.tempVal = document.getElementById('temp-val');
  }

  bindEvents() {
    // Sidebar toggle
    this.btnToggleSidebar.addEventListener('click', () => {
      this.sidebar.classList.toggle('open');
    });

    this.brandHomeLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.showHero();
    });

    this.btnNewThread.addEventListener('click', () => {
      this.showHero();
    });

    // Clear all history
    if (this.btnClearHistory) {
      this.btnClearHistory.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện?')) {
          Storage.clearAllThreads();
          this.showHero();
        }
      });
    }

    // Model chip opens settings
    this.topModelChip.addEventListener('click', () => {
      this.openSettings();
    });

    // Auto-resize textareas & enter to send
    const setupTextarea = (textarea, submitFn) => {
      textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
      });
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submitFn();
        }
      });
    };

    setupTextarea(this.heroInput, () => this.handleSearch(this.heroInput.value));
    setupTextarea(this.stickyInput, () => this.handleSearch(this.stickyInput.value));

    this.btnHeroSubmit.addEventListener('click', () => this.handleSearch(this.heroInput.value));
    this.btnStickySubmit.addEventListener('click', () => this.handleSearch(this.stickyInput.value));

    // Focus pills
    this.heroFocusPills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.setMode(pill.dataset.mode);
      });
    });

    // Quick suggestions
    document.querySelectorAll('.suggestion-card').forEach(card => {
      card.addEventListener('click', () => {
        const prompt = card.dataset.prompt;
        this.heroInput.value = prompt;
        this.handleSearch(prompt);
      });
    });

    // File attachments (Hero)
    this.btnHeroAttach.addEventListener('click', () => this.heroFileInput.click());
    this.heroFileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    this.btnHeroRemoveAttach.addEventListener('click', () => this.clearAttachment());

    // File attachments (Sticky)
    if (this.btnStickyAttach && this.stickyFileInput) {
      this.btnStickyAttach.addEventListener('click', () => this.stickyFileInput.click());
      this.stickyFileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }
    if (this.btnStickyRemoveAttach) {
      this.btnStickyRemoveAttach.addEventListener('click', () => this.clearAttachment());
    }

    // Export Chat
    this.btnExportChat.addEventListener('click', () => this.exportCurrentChat());

    // Settings Modal
    this.btnOpenSettings.addEventListener('click', () => this.openSettings());
    this.btnCloseSettings.addEventListener('click', () => this.closeSettings());
    this.btnCancelSettings.addEventListener('click', () => this.closeSettings());
    this.btnSaveSettings.addEventListener('click', () => this.saveSettings());
    this.btnToggleKeyVis.addEventListener('click', () => {
      this.settingApiKey.type = this.settingApiKey.type === 'password' ? 'text' : 'password';
    });
    this.btnTestKey.addEventListener('click', () => this.testApiKey());
    this.settingTemperature.addEventListener('input', (e) => {
      this.tempVal.innerText = e.target.value;
    });

    // Close modal on click outside
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) this.closeSettings();
    });

    // Expose citation highlight to window for inline onclick
    window.highlightSourceCard = (num) => {
      document.querySelectorAll('.source-card').forEach(c => c.classList.remove('highlighted'));
      const target = document.querySelector(`.source-card[data-source-index="${num}"]`);
      if (target) {
        target.classList.add('highlighted');
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };
  }

  setMode(mode) {
    this.currentMode = mode;
    this.heroFocusPills.forEach(p => {
      p.classList.toggle('active', p.dataset.mode === mode);
    });
    const modeLabels = {
      web: '🌐 Tìm kiếm Web',
      pro: '🔬 Nghiên cứu sâu Pro',
      academic: '🎓 Học thuật',
      code: '💻 Code & Kỹ thuật',
      writing: '✍️ Sáng tạo & Viết'
    };
    if (this.stickyModeIndicator) {
      this.stickyModeIndicator.innerText = modeLabels[mode] || '🌐 Web';
    }
  }

  async loadState() {
    this.hasServerKey = await GeminiService.checkServerConfig();
    this.updateApiStatusUI();
    this.renderHistory();

    const settings = Storage.getSettings();
    this.currentModelName.innerText = this.formatModelName(settings.model);

    // If there's an active thread saved, display it
    const activeId = Storage.getActiveThreadId();
    if (activeId) {
      const thread = Storage.getThread(activeId);
      if (thread) {
        this.loadThread(thread);
        return;
      }
    }
    this.showHero();
  }

  formatModelName(model) {
    if (model === 'gemini-flash-latest') return 'Gemini Flash';
    if (model === 'gemini-pro-latest') return 'Gemini Pro';
    if (model === 'gemini-3.5-flash-lite') return 'Gemini Flash Lite';
    if (model === 'gemini-2.0-flash') return 'Gemini 2.0 Flash';
    if (model === 'gemini-1.5-pro') return 'Gemini 1.5 Pro';
    if (model === 'gemini-1.5-flash') return 'Gemini 1.5 Flash';
    return model || 'Gemini Flash';
  }

  updateApiStatusUI() {
    const key = Storage.getApiKey();
    if (key && key.length > 10) {
      this.statusDot.className = 'status-dot active';
      this.statusText.innerText = 'Đã kết nối';
    } else if (this.hasServerKey) {
      this.statusDot.className = 'status-dot active';
      this.statusText.innerText = 'Cloud Key';
    } else {
      this.statusDot.className = 'status-dot inactive';
      this.statusText.innerText = 'Chưa nhập key';
    }
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(',')[1];
      this.currentAttachment = {
        name: file.name,
        mimeType: file.type || 'text/plain',
        data: base64Data
      };

      if (this.heroAttachName) this.heroAttachName.innerText = file.name;
      if (this.heroAttachChip) this.heroAttachChip.classList.add('show');
      if (this.stickyAttachName) this.stickyAttachName.innerText = file.name;
      if (this.stickyAttachChip) this.stickyAttachChip.classList.add('show');
    };
    reader.readAsDataURL(file);
  }

  clearAttachment() {
    this.currentAttachment = null;
    if (this.heroFileInput) this.heroFileInput.value = '';
    if (this.heroAttachChip) this.heroAttachChip.classList.remove('show');
    if (this.stickyFileInput) this.stickyFileInput.value = '';
    if (this.stickyAttachChip) this.stickyAttachChip.classList.remove('show');
  }

  showHero() {
    Storage.setActiveThreadId(null);
    this.activeThread = null;
    this.heroView.style.display = 'flex';
    this.threadView.classList.remove('active');
    this.stickyBar.style.display = 'none';
    this.heroInput.value = '';
    this.heroInput.style.height = 'auto';
    this.clearAttachment();
    this.renderHistory();
  }

  loadThread(thread) {
    this.activeThread = thread;
    Storage.setActiveThreadId(thread.id);
    this.heroView.style.display = 'none';
    this.threadView.classList.add('active');
    this.stickyBar.style.display = 'flex';
    this.renderHistory();

    // Render thread messages
    this.threadView.innerHTML = '';
    thread.messages.forEach(msg => {
      if (msg.role === 'user') {
        this.renderUserMessage(msg.text, msg.attachment, msg.mode);
      } else {
        this.renderAssistantMessage(msg);
      }
    });

    this.scrollToBottom();
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  async handleSearch(text) {
    const query = text ? text.trim() : '';
    if (!query || this.isGenerating) return;

    const apiKey = Storage.getApiKey();
    if (!apiKey && !this.hasServerKey) {
      this.openSettings();
      alert('Vui lòng nhập Google Gemini API Key để bắt đầu tìm kiếm!');
      return;
    }

    this.isGenerating = true;
    this.btnHeroSubmit.disabled = true;
    this.btnStickySubmit.disabled = true;

    // Reset inputs
    this.heroInput.value = '';
    this.stickyInput.value = '';
    this.heroInput.style.height = 'auto';
    this.stickyInput.style.height = 'auto';

    // Switch to thread view
    if (!this.activeThread) {
      this.activeThread = {
        id: 'thread_' + Date.now(),
        title: query.length > 50 ? query.substring(0, 50) + '...' : query,
        createdAt: new Date().toISOString(),
        messages: []
      };
      this.heroView.style.display = 'none';
      this.threadView.classList.add('active');
      this.stickyBar.style.display = 'flex';
      this.threadView.innerHTML = '';
    }

    const attachmentCopy = this.currentAttachment ? { ...this.currentAttachment } : null;
    this.clearAttachment();

    // Render User Query Card
    this.renderUserMessage(query, attachmentCopy, this.currentMode);

    // Save to thread
    this.activeThread.messages.push({
      role: 'user',
      text: query,
      attachment: attachmentCopy,
      mode: this.currentMode
    });
    Storage.saveThread(this.activeThread);
    this.renderHistory();

    // Render Pipeline Card
    const pipelineId = `pipeline_${Date.now()}`;
    const pipelineHtml = `
      <div class="pipeline-card" id="${pipelineId}">
        <div class="pipeline-header">
          <div class="pipeline-spinner"></div>
          <span class="pipeline-status-text">Đang kết nối và tra cứu Google Search thời gian thực...</span>
        </div>
        <div class="pipeline-queries-list" style="display: none;"></div>
      </div>
    `;
    this.threadView.insertAdjacentHTML('beforeend', pipelineHtml);
    const pipelineEl = document.getElementById(pipelineId);
    const pipelineQueriesEl = pipelineEl.querySelector('.pipeline-queries-list');

    // Create Assistant Response Shell right away for streaming
    const settings = Storage.getSettings();
    const cardId = `answer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const assistantShellHtml = `
      <div class="answer-wrapper streaming" id="${cardId}" style="display: flex; flex-direction: column; gap: 20px;">
        <div class="sources-section" style="display: none;"></div>

        <div class="answer-card">
          <div class="answer-header">
            <div class="answer-model-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>${this.formatModelName(settings.model)}</span>
            </div>

            <div class="answer-actions" style="display: none;">
              <button type="button" class="btn-answer-action btn-copy-answer" title="Sao chép toàn bộ câu trả lời">
                📋 Sao chép
              </button>
              <button type="button" class="btn-answer-action btn-speak-answer" title="Đọc to bằng giọng nói">
                🔊 Đọc
              </button>
            </div>
          </div>

          <div class="markdown-body">
            <span class="typing-cursor">▊</span>
          </div>
        </div>

        <div class="related-section" style="display: none;"></div>
      </div>
    `;
    this.threadView.insertAdjacentHTML('beforeend', assistantShellHtml);
    const answerEl = document.getElementById(cardId);
    const sourcesEl = answerEl.querySelector('.sources-section');
    const markdownEl = answerEl.querySelector('.markdown-body');
    const answerActionsEl = answerEl.querySelector('.answer-actions');
    const relatedEl = answerEl.querySelector('.related-section');

    this.scrollToBottom();

    try {
      const result = await GeminiService.searchAndAnswer({
        apiKey,
        model: settings.model,
        prompt: query,
        mode: this.currentMode,
        attachment: attachmentCopy,
        history: this.activeThread.messages.slice(0, -1),
        enableGrounding: settings.enableGrounding,
        temperature: settings.temperature,
        onStepUpdate: (status) => {
          if (pipelineEl) {
            const statusText = pipelineEl.querySelector('.pipeline-status-text');
            if (statusText) statusText.innerText = status.message;
          }
        },
        onStreamChunk: ({ text, sources, searchQueries }) => {
          // Update search queries badges in pipeline
          if (searchQueries && searchQueries.length > 0 && pipelineQueriesEl) {
            pipelineQueriesEl.style.display = 'flex';
            pipelineQueriesEl.innerHTML = searchQueries.map(q => `<span class="search-term-badge">🔍 ${this.escapeHtml(q)}</span>`).join('');
          }

          // Update sources cards live
          if (sources && sources.length > 0 && sourcesEl) {
            sourcesEl.style.display = 'flex';
            const sourceCards = sources.map(src => `
              <a href="${src.url}" target="_blank" rel="noopener noreferrer" class="source-card" data-source-index="${src.index}" title="${src.title}">
                <div class="source-card-header">
                  <img src="${src.favicon}" alt="" class="source-favicon" onerror="this.style.display='none'">
                  <span class="source-domain">${src.domain}</span>
                  <span class="source-number">[${src.index}]</span>
                </div>
                <div class="source-title">${src.title}</div>
              </a>
            `).join('');

            sourcesEl.innerHTML = `
              <div class="section-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                Nguồn tham khảo (${sources.length})
              </div>
              <div class="sources-grid">${sourceCards}</div>
            `;
          }

          // Update markdown text live
          if (text) {
            markdownEl.innerHTML = Markdown.render(text) + `<span class="typing-cursor">▊</span>`;
            this.scrollToBottom();
          }
        }
      });

      // Finalize markdown text without cursor
      markdownEl.innerHTML = Markdown.render(result.text);

      // Finalize pipeline card
      if (pipelineEl) {
        const spinner = pipelineEl.querySelector('.pipeline-spinner');
        if (spinner) spinner.style.display = 'none';
        const statusText = pipelineEl.querySelector('.pipeline-status-text');
        if (statusText) {
          statusText.innerHTML = `✓ Đã nghiên cứu từ ${result.sources.length} nguồn thông tin`;
          statusText.style.color = 'var(--accent-emerald)';
        }
      }

      // Show answer action buttons (Copy & TTS)
      answerActionsEl.style.display = 'flex';
      this.bindAnswerActions(answerEl, result.text);

      // Render Related Questions
      if (result.relatedQuestions && result.relatedQuestions.length > 0) {
        relatedEl.style.display = 'flex';
        const relatedBtns = result.relatedQuestions.map(q => `
          <button type="button" class="related-btn" data-query="${encodeURIComponent(q)}">
            <span>${q}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        `).join('');

        relatedEl.innerHTML = `
          <div class="section-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Câu hỏi đào sâu tiếp theo
          </div>
          <div class="related-list">${relatedBtns}</div>
        `;

        relatedEl.querySelectorAll('.related-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const q = decodeURIComponent(btn.dataset.query);
            this.handleSearch(q);
          });
        });
      }

      // Save Assistant Response to Thread
      const assistantMsg = {
        role: 'assistant',
        text: result.text,
        sources: result.sources,
        searchQueries: result.searchQueries,
        relatedQuestions: result.relatedQuestions,
        model: settings.model
      };

      this.activeThread.messages.push(assistantMsg);
      Storage.saveThread(this.activeThread);
      this.renderHistory();

    } catch (err) {
      console.error(err);
      if (pipelineEl) pipelineEl.remove();
      if (answerEl) answerEl.remove();

      const errorHtml = `
        <div class="query-card" style="border-color: var(--accent-rose); background: rgba(244, 63, 94, 0.08);">
          <div class="query-badge" style="color: var(--accent-rose);">⚠️ Lỗi xảy ra</div>
          <div style="color: #fecdd3; font-size: 0.95rem;">${err.message}</div>
        </div>
      `;
      this.threadView.insertAdjacentHTML('beforeend', errorHtml);
    } finally {
      this.isGenerating = false;
      this.btnHeroSubmit.disabled = false;
      this.btnStickySubmit.disabled = false;
      this.scrollToBottom();
    }
  }

  renderUserMessage(text, attachment, mode) {
    const modeLabels = {
      web: '🌐 Web Search',
      pro: '🔬 Deep Research Pro',
      academic: '🎓 Academic',
      code: '💻 Code & Tech',
      writing: '✍️ Writing'
    };

    let attachmentHtml = '';
    if (attachment) {
      attachmentHtml = `
        <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.06); padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; margin-top: 6px;">
          📎 ${attachment.name}
        </div>
      `;
    }

    const html = `
      <div class="query-card">
        <div class="query-header">
          <div class="query-badge">${modeLabels[mode] || '🌐 Web Search'}</div>
        </div>
        <div class="query-text">${text}</div>
        ${attachmentHtml}
      </div>
    `;
    this.threadView.insertAdjacentHTML('beforeend', html);
  }

  renderAssistantMessage(msg) {
    const cardId = `answer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Render Sources Grid if any
    let sourcesHtml = '';
    if (msg.sources && msg.sources.length > 0) {
      const sourceCards = msg.sources.map(src => `
        <a href="${src.url}" target="_blank" rel="noopener noreferrer" class="source-card" data-source-index="${src.index}" title="${src.title}">
          <div class="source-card-header">
            <img src="${src.favicon}" alt="" class="source-favicon" onerror="this.style.display='none'">
            <span class="source-domain">${src.domain}</span>
            <span class="source-number">[${src.index}]</span>
          </div>
          <div class="source-title">${src.title}</div>
        </a>
      `).join('');

      sourcesHtml = `
        <div class="sources-section">
          <div class="section-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            Nguồn tham khảo (${msg.sources.length})
          </div>
          <div class="sources-grid">${sourceCards}</div>
        </div>
      `;
    }

    // Render Related Questions
    let relatedHtml = '';
    if (msg.relatedQuestions && msg.relatedQuestions.length > 0) {
      const relatedBtns = msg.relatedQuestions.map(q => `
        <button type="button" class="related-btn" data-query="${encodeURIComponent(q)}">
          <span>${q}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      `).join('');

      relatedHtml = `
        <div class="related-section">
          <div class="section-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Câu hỏi đào sâu tiếp theo
          </div>
          <div class="related-list">${relatedBtns}</div>
        </div>
      `;
    }

    const parsedMarkdown = Markdown.render(msg.text);

    const fullHtml = `
      <div class="answer-wrapper" id="${cardId}" style="display: flex; flex-direction: column; gap: 20px;">
        ${sourcesHtml}

        <div class="answer-card">
          <div class="answer-header">
            <div class="answer-model-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>${this.formatModelName(msg.model || 'gemini-1.5-pro')}</span>
            </div>

            <div class="answer-actions">
              <button type="button" class="btn-answer-action btn-copy-answer" title="Sao chép toàn bộ câu trả lời">
                📋 Sao chép
              </button>
              <button type="button" class="btn-answer-action btn-speak-answer" title="Đọc to bằng giọng nói">
                🔊 Đọc
              </button>
            </div>
          </div>

          <div class="markdown-body">
            ${parsedMarkdown}
          </div>
        </div>

        ${relatedHtml}
      </div>
    `;

    this.threadView.insertAdjacentHTML('beforeend', fullHtml);

    const wrapper = document.getElementById(cardId);
    if (wrapper) {
      this.bindAnswerActions(wrapper, msg.text);

      // Bind related question buttons
      wrapper.querySelectorAll('.related-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const q = decodeURIComponent(btn.dataset.query);
          this.handleSearch(q);
        });
      });
    }
  }

  bindAnswerActions(wrapper, text) {
    if (!wrapper) return;
    const copyBtn = wrapper.querySelector('.btn-copy-answer');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.innerText = '✓ Đã sao chép';
          setTimeout(() => { copyBtn.innerText = '📋 Sao chép'; }, 2000);
        });
      });
    }

    const speakBtn = wrapper.querySelector('.btn-speak-answer');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        if ('speechSynthesis' in window) {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            speakBtn.innerText = '🔊 Đọc';
            return;
          }
          const cleanText = text.replace(/\[\d+\]/g, '').replace(/[#\*`_]/g, '');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = 'vi-VN';
          utterance.onend = () => { speakBtn.innerText = '🔊 Đọc'; };
          window.speechSynthesis.speak(utterance);
          speakBtn.innerText = '⏹️ Dừng';
        } else {
          alert('Trình duyệt của bạn không hỗ trợ Text-to-Speech.');
        }
      });
    }
  }

  renderHistory() {
    const threads = Storage.getThreads();
    const activeId = Storage.getActiveThreadId();

    if (threads.length === 0) {
      this.historyList.innerHTML = `<li style="padding: 10px 8px; color: var(--text-muted); font-size: 0.8rem;">Chưa có lịch sử tìm kiếm</li>`;
      return;
    }

    this.historyList.innerHTML = threads.map(t => `
      <li class="history-item ${t.id === activeId ? 'active' : ''}" data-id="${t.id}">
        <span class="item-title">${t.title}</span>
        <button type="button" class="btn-delete-thread" data-id="${t.id}" title="Xóa">&times;</button>
      </li>
    `).join('');

    this.historyList.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete-thread')) return;
        const id = item.dataset.id;
        const thread = Storage.getThread(id);
        if (thread) this.loadThread(thread);
      });
    });

    this.historyList.querySelectorAll('.btn-delete-thread').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        Storage.deleteThread(id);
        if (this.activeThread && this.activeThread.id === id) {
          this.showHero();
        } else {
          this.renderHistory();
        }
      });
    });
  }

  exportCurrentChat() {
    if (!this.activeThread || this.activeThread.messages.length === 0) {
      alert('Không có nội dung cuộc trò chuyện để xuất.');
      return;
    }

    let md = `# ${this.activeThread.title}\n*Xuất từ Perplexica Pro vào ${new Date().toLocaleString()}*\n\n---\n\n`;
    this.activeThread.messages.forEach(msg => {
      if (msg.role === 'user') {
        md += `### 👤 Người dùng:\n${msg.text}\n\n`;
      } else {
        md += `### 🤖 Gemini Pro:\n${msg.text}\n\n`;
        if (msg.sources && msg.sources.length > 0) {
          md += `**Nguồn tham khảo:**\n`;
          msg.sources.forEach(src => {
            md += `- [${src.index}] [${src.title}](${src.url})\n`;
          });
          md += `\n`;
        }
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.activeThread.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  openSettings() {
    this.settingApiKey.value = Storage.getApiKey();
    const settings = Storage.getSettings();
    this.settingModel.value = settings.model;
    this.settingGrounding.value = String(settings.enableGrounding);
    this.settingTemperature.value = settings.temperature;
    this.tempVal.innerText = settings.temperature;
    this.keyTestFeedback.innerText = '';
    this.settingsModal.classList.add('open');
  }

  closeSettings() {
    this.settingsModal.classList.remove('open');
  }

  async testApiKey() {
    const key = this.settingApiKey.value.trim();
    if (!key) {
      this.keyTestFeedback.style.color = 'var(--accent-rose)';
      this.keyTestFeedback.innerText = 'Vui lòng nhập API key trước khi kiểm tra!';
      return;
    }

    this.btnTestKey.disabled = true;
    this.keyTestFeedback.style.color = 'var(--text-secondary)';
    this.keyTestFeedback.innerText = 'Đang kiểm tra kết nối với Google Gemini API...';

    const res = await GeminiService.testApiKey(key, this.settingModel.value);
    this.btnTestKey.disabled = false;

    if (res.success) {
      this.keyTestFeedback.style.color = 'var(--accent-emerald)';
      this.keyTestFeedback.innerText = '✓ Kết nối thành công! API Key hợp lệ và hoạt động tốt.';
    } else {
      this.keyTestFeedback.style.color = 'var(--accent-rose)';
      this.keyTestFeedback.innerText = `✗ Thất bại: ${res.error}`;
    }
  }

  saveSettings() {
    const key = this.settingApiKey.value.trim();
    Storage.setApiKey(key);

    const newSettings = Storage.saveSettings({
      model: this.settingModel.value,
      enableGrounding: this.settingGrounding.value === 'true',
      temperature: parseFloat(this.settingTemperature.value)
    });

    this.currentModelName.innerText = this.formatModelName(newSettings.model);
    this.updateApiStatusUI();
    this.closeSettings();
  }

  scrollToBottom() {
    setTimeout(() => {
      this.contentContainer.scrollTop = this.contentContainer.scrollHeight;
    }, 50);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
