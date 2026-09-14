export const SHOW_PWA_INSTALL_HELP_EVENT = "escala-iasd:show-install-help";
export const PWA_INSTALL_VISIBILITY_EVENT = "escala-iasd:install-visibility";

export type PwaInstallEnvironment = {
  androidVersion: string | null;
  browser: "chrome" | "edge" | "firefox" | "safari" | "samsung-internet" | "other";
  browserName: string;
  deviceBrand: "motorola" | "samsung" | "other";
  deviceName: string | null;
  platform: "android" | "ios" | "desktop";
};

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

export function detectPwaInstallEnvironment(
  suppliedUserAgent?: string,
): PwaInstallEnvironment {
  const userAgent =
    suppliedUserAgent ??
    (typeof navigator === "undefined" ? "" : navigator.userAgent);
  const isIos =
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (suppliedUserAgent === undefined && isIosDevice());
  const androidMatch = userAgent.match(/Android\s+([\d.]+)/i);
  const isAndroid = Boolean(androidMatch);
  const browser = detectBrowser(userAgent);
  const deviceBrand = detectDeviceBrand(userAgent);

  return {
    androidVersion: androidMatch?.[1] ?? null,
    browser,
    browserName: getBrowserName(browser),
    deviceBrand,
    deviceName:
      deviceBrand === "samsung"
        ? "Samsung"
        : deviceBrand === "motorola"
          ? "Motorola"
          : null,
    platform: isAndroid ? "android" : isIos ? "ios" : "desktop",
  };
}

export function getPwaInstallEnvironmentLabel(
  environment: PwaInstallEnvironment,
) {
  const labels = [environment.deviceName];

  if (environment.platform === "android") {
    labels.push(
      environment.androidVersion
        ? `Android ${environment.androidVersion}`
        : "Android",
    );
  } else if (environment.platform === "ios") {
    labels.push("iPhone ou iPad");
  }

  labels.push(environment.browserName);

  return labels.filter(Boolean).join(" · ");
}

export function getPwaManualInstallSteps(
  environment: PwaInstallEnvironment,
) {
  if (environment.platform === "ios") {
    return [
      "Abra esta página no Safari.",
      "Toque em Compartilhar.",
      "Escolha Adicionar à Tela de Início, mantenha Abrir como App ativado e toque em Adicionar.",
    ];
  }

  if (environment.browser === "samsung-internet") {
    return [
      "Toque no ícone de instalação da barra ou abra o menu do Samsung Internet.",
      "Escolha Instalar aplicativo ou Adicionar página à Tela inicial.",
      "Confirme para adicionar o aplicativo à tela de aplicativos.",
    ];
  }

  if (
    environment.platform === "android" &&
    (environment.browser === "chrome" || environment.browser === "edge")
  ) {
    return [
      "Abra o menu de três pontos do navegador.",
      "Escolha Instalar app ou Adicionar à tela inicial.",
      "Confirme em Instalar.",
    ];
  }

  if (
    environment.platform === "android" &&
    environment.browser === "firefox"
  ) {
    return [
      "Abra o menu de três pontos do Firefox.",
      "Escolha Instalar ou Adicionar à tela inicial.",
      "Confirme a criação do ícone do aplicativo.",
    ];
  }

  return [
    "Abra o menu principal do navegador.",
    "Procure por Instalar aplicativo ou Adicionar à tela inicial.",
    "Confirme a instalação quando o navegador solicitar.",
  ];
}

function detectBrowser(userAgent: string): PwaInstallEnvironment["browser"] {
  if (/SamsungBrowser/i.test(userAgent)) {
    return "samsung-internet";
  }

  if (/EdgA|EdgiOS|Edg\//i.test(userAgent)) {
    return "edge";
  }

  if (/Firefox|FxiOS/i.test(userAgent)) {
    return "firefox";
  }

  if (/Chrome|CriOS/i.test(userAgent)) {
    return "chrome";
  }

  if (/Safari/i.test(userAgent)) {
    return "safari";
  }

  return "other";
}

function detectDeviceBrand(
  userAgent: string,
): PwaInstallEnvironment["deviceBrand"] {
  if (/Samsung|SAMSUNG|SM-[A-Z0-9]+/i.test(userAgent)) {
    return "samsung";
  }

  if (/Motorola|moto[\s_()-]|\bXT\d{3,}/i.test(userAgent)) {
    return "motorola";
  }

  return "other";
}

function getBrowserName(browser: PwaInstallEnvironment["browser"]) {
  const names: Record<PwaInstallEnvironment["browser"], string> = {
    chrome: "Google Chrome",
    edge: "Microsoft Edge",
    firefox: "Mozilla Firefox",
    other: "Navegador atual",
    safari: "Safari",
    "samsung-internet": "Samsung Internet",
  };

  return names[browser];
}
