/**
 * Panel interactions - slide panels, tabs, overlay
 */

const settingsPanel = () => document.getElementById("settings-panel");
const statsPanel = () => document.getElementById("stats-panel");
const menuPanel = () => document.getElementById("menu-panel");
const overlay = () => document.getElementById("panel-overlay");

const panels = () => [settingsPanel(), statsPanel(), menuPanel()].filter(Boolean);

const closeAllPanels = () => {
  panels().forEach((panel) => panel.classList.add("hide"));
  const o = overlay();
  if (o) {
    o.classList.add("hide");
  }
};

const openPanel = (panel) => {
  if (!panel) {
    return;
  }
  closeAllPanels();
  panel.classList.remove("hide");
  const o = overlay();
  if (o) {
    o.classList.remove("hide");
  }
};

const togglePanel = (panel) => {
  if (!panel) {
    return;
  }
  const isOpen = !panel.classList.contains("hide");
  if (isOpen) {
    closeAllPanels();
  } else {
    openPanel(panel);
  }
};

const initTabs = () => {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.tab;
      const panel = btn.closest(".slide-panel");
      if (!panel || !tabId) {
        return;
      }

      // Update tab buttons
      panel.querySelectorAll(".tab-btn").forEach((b) => {
        b.classList.toggle("active", b === btn);
      });

      // Update tab content
      panel.querySelectorAll(".tab-content").forEach((content) => {
        const isTarget = content.id === `tab-${tabId}`;
        content.classList.toggle("active", isTarget);
        content.classList.toggle("hide", !isTarget);
      });
    });
  });
};

export const initPanels = () => {
  // Settings toggle
  const settingsToggle = document.getElementById("settings-toggle");
  if (settingsToggle) {
    settingsToggle.addEventListener("click", () => togglePanel(settingsPanel()));
  }

  // Stats toggles (header button and stats bar "More" button)
  const statsToggle = document.getElementById("stats-toggle");
  if (statsToggle) {
    statsToggle.addEventListener("click", () => togglePanel(statsPanel()));
  }

  const statsMore = document.getElementById("stats-more");
  if (statsMore) {
    statsMore.addEventListener("click", () => togglePanel(statsPanel()));
  }

  // Menu toggle (mobile)
  const menuToggle = document.getElementById("menu-toggle");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => togglePanel(menuPanel()));
  }

  // Close buttons
  document.querySelectorAll(".panel-close").forEach((btn) => {
    btn.addEventListener("click", () => closeAllPanels());
  });

  // Overlay click to close
  const o = overlay();
  if (o) {
    o.addEventListener("click", closeAllPanels);
  }

  // Menu items that open other panels
  const menuTutorial = document.getElementById("menu-tutorial");
  if (menuTutorial) {
    menuTutorial.addEventListener("click", () => {
      closeAllPanels();
      const tutorialModal = document.getElementById("tutorial-modal");
      if (tutorialModal) {
        tutorialModal.classList.remove("hide");
      }
    });
  }

  // Tutorial open from settings
  const tutorialOpen = document.getElementById("tutorial-open");
  if (tutorialOpen) {
    tutorialOpen.addEventListener("click", () => {
      closeAllPanels();
      const tutorialModal = document.getElementById("tutorial-modal");
      if (tutorialModal) {
        tutorialModal.classList.remove("hide");
      }
    });
  }

  // Escape key to close panels
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const anyOpen = panels().some((p) => !p.classList.contains("hide"));
      if (anyOpen) {
        closeAllPanels();
        e.preventDefault();
      }
    }
  });

  // Initialize tabs
  initTabs();
};
