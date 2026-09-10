export const SHOW_PWA_INSTALL_HELP_EVENT = "escala-iasd:show-install-help";

export function isIosDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const isTouchMac = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || isTouchMac;
}

export function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}
