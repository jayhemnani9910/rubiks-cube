export const initPwa = () => {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  if (window.location.protocol === "file:") {
    return;
  }

  const banner = document.getElementById("install-banner");
  const installButton = document.getElementById("install-button");
  const dismissButton = document.getElementById("install-dismiss");
  const installNote = document.getElementById("install-note");
  const splash = document.getElementById("splash");

  let deferredPrompt = null;
  const dismissedKey = "rubiksCubeInstallDismissed";

  const hideBanner = () => {
    if (banner) {
      banner.classList.add("hide");
    }
  };

  const showBanner = () => {
    const dismissed = localStorage.getItem(dismissedKey);
    if (!banner || dismissed) {
      return;
    }
    banner.classList.remove("hide");
  };

  const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    showBanner();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    hideBanner();
  });

  if (installButton) {
    installButton.addEventListener("click", async () => {
      if (!deferredPrompt) {
        return;
      }
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      hideBanner();
    });
  }

  if (dismissButton) {
    dismissButton.addEventListener("click", () => {
      localStorage.setItem(dismissedKey, "true");
      hideBanner();
    });
  }

  if (installNote) {
    installNote.classList.toggle("hide", !(isIos() && !isStandalone));
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });

    if (splash) {
      setTimeout(() => splash.classList.add("hide"), 600);
    }
  });
};
