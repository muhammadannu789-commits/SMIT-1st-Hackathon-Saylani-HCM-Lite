/**
 * HCM Lite - Core App Orchestrator
 * Initializes page layout, role protection, sidebar navigation,
 * theme management, and mounts the Smart Helper chat.
 */

const App = {
  currentUser: null,

  /**
   * Initialize page
   * @param {string|null} requiredRole 'Admin' | 'Employee' | null
   */
  init(requiredRole = null) {
    // Enforce role guard
    this.currentUser = Auth.protectPage(requiredRole);
    if (!this.currentUser && requiredRole !== null) {
      return; // Redirecting
    }

    // Set Theme
    this.initTheme();

    // Mobile Sidebar Setup
    this.initSidebar();

    // Smart Helper Assistant
    this.mountSmartHelper();

    // Live clock in topbar if element exists
    this.initClock();
  },

  /**
   * Theme Manager (Dark / Light)
   */
  initTheme() {
    const savedTheme = Storage.get(HCM_KEYS.THEME, 'light');
    document.documentElement.setAttribute('data-bs-theme', savedTheme);

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      this.updateThemeIcon(savedTheme);
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-bs-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-bs-theme', next);
        Storage.set(HCM_KEYS.THEME, next);
        this.updateThemeIcon(next);
      });
    }
  },

  updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggleBtn i');
    if (icon) {
      if (theme === 'dark') {
        icon.className = 'bi bi-sun-fill text-warning';
      } else {
        icon.className = 'bi bi-moon-stars-fill text-secondary';
      }
    }
  },

  /**
   * Mobile Sidebar Interactions
   */
  initSidebar() {
    const sidebar = document.querySelector('.app-sidebar');
    const toggleBtn = document.querySelector('.sidebar-toggle-btn');
    const backdrop = document.querySelector('.sidebar-backdrop');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('show-mobile');
        if (backdrop) backdrop.classList.toggle('show');
      });
    }

    if (backdrop && sidebar) {
      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('show-mobile');
        backdrop.classList.remove('show');
      });
    }

    // Highlight current page link in sidebar
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  },

  /**
   * Live Digital Clock for Dashboard
   */
  initClock() {
    const clockEl = document.getElementById('liveClockDisplay');
    const dateEl = document.getElementById('liveDateDisplay');

    function update() {
      const now = new Date();
      if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      }
    }

    if (clockEl || dateEl) {
      update();
      setInterval(update, 1000);
    }
  },

  /**
   * Mount the Smart Helper Assistant Widget
   */
  mountSmartHelper() {
    // Only mount if logged in
    if (!this.currentUser) return;

    let container = document.getElementById('smart-helper-root');
    if (!container) {
      container = document.createElement('div');
      container.id = 'smart-helper-root';
      document.body.appendChild(container);
    }

    const isAdmin = this.currentUser.role === 'Admin';
    const initialSuggestions = isAdmin ? [
      'How many employees do we have?',
      'Who is on leave today?',
      'Who was late today?',
      'How many employees are present today?',
      'How many leave requests are pending?'
    ] : [
      'How many leaves do I have left?',
      'Was I late today?',
      'How many hours did I work this week?',
      'What is my attendance today?'
    ];

    container.innerHTML = `
      <!-- Launcher Button -->
      <button class="smart-helper-trigger" id="smartHelperTrigger" title="Open Smart Helper" aria-label="Smart Helper">
        <i class="bi bi-robot"></i>
        <span class="pulse-badge"></span>
      </button>

      <!-- Chat Modal Window -->
      <div class="smart-helper-modal" id="smartHelperModal">
        <div class="helper-header">
          <div class="helper-header-title">
            <i class="bi bi-robot"></i>
            <div>
              <div style="line-height: 1.1;">Smart Helper</div>
              <small style="font-size: 0.68rem; color: #94a3b8;">Local Rule-Based Assistant</small>
            </div>
          </div>
          <div class="helper-header-actions">
            <button id="smartHelperCloseBtn" title="Close"><i class="bi bi-x-lg"></i></button>
          </div>
        </div>

        <div class="helper-body" id="smartHelperBody">
          <div class="chat-bubble bot">
            Hello, <strong>${this.currentUser.name}</strong>! I am your HCM Smart Helper. Ask me anything about your ${isAdmin ? 'company operations' : 'work and attendance'} data.
          </div>
          <div class="chat-suggestions" id="smartHelperSuggestions">
            ${initialSuggestions.map(s => `<button class="suggestion-chip" data-query="${s}">${s}</button>`).join('')}
          </div>
        </div>

        <div class="helper-footer">
          <form id="smartHelperForm" class="helper-input-group">
            <input type="text" id="smartHelperInput" placeholder="Ask a question..." autocomplete="off" />
            <button type="submit" class="helper-send-btn" title="Send message"><i class="bi bi-send-fill"></i></button>
          </form>
        </div>
      </div>
    `;

    // DOM References
    const trigger = document.getElementById('smartHelperTrigger');
    const modal = document.getElementById('smartHelperModal');
    const closeBtn = document.getElementById('smartHelperCloseBtn');
    const form = document.getElementById('smartHelperForm');
    const input = document.getElementById('smartHelperInput');
    const chatBody = document.getElementById('smartHelperBody');

    // Toggle Modal
    trigger.addEventListener('click', () => {
      modal.classList.toggle('open');
      if (modal.classList.contains('open')) {
        input.focus();
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    });

    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });

    // Send Query Handler
    const handleSend = (text) => {
      const query = text.trim();
      if (!query) return;

      // Append user bubble
      const userBubble = document.createElement('div');
      userBubble.className = 'chat-bubble user';
      userBubble.textContent = query;
      chatBody.appendChild(userBubble);

      // Compute Answer from real localStorage data
      const responseMarkdown = Helper.processSmartHelperQuery(query, this.currentUser);

      // Simple markdown parser for bold, bullets, and italic
      let htmlResponse = responseMarkdown
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n• /g, '<br>• ')
        .replace(/\n- /g, '<br>• ')
        .replace(/\n/g, '<br>');

      // Append bot bubble
      setTimeout(() => {
        const botBubble = document.createElement('div');
        botBubble.className = 'chat-bubble bot';
        botBubble.innerHTML = htmlResponse;
        chatBody.appendChild(botBubble);
        chatBody.scrollTop = chatBody.scrollHeight;
      }, 150);

      input.value = '';
      chatBody.scrollTop = chatBody.scrollHeight;
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSend(input.value);
    });

    // Suggestion chips click
    container.addEventListener('click', (e) => {
      if (e.target.classList.contains('suggestion-chip')) {
        const query = e.target.getAttribute('data-query');
        handleSend(query);
      }
    });
  }
};
