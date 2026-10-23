/* Browser chrome controls only. No wallet, identity or game state is stored here. */
(() => {
  const listeners = new Set();
  const standalone = matchMedia('(display-mode: standalone)');
  let installPrompt = null;
  const isInstalled = () => standalone.matches || navigator.standalone === true;
  const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  const snapshot = () => ({
    installed: isInstalled(),
    fullscreen: !!fullscreenElement(),
    canFullscreen: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled)
  });
  const emit = () => listeners.forEach(listener => listener(snapshot()));
  addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); installPrompt = event; emit();
  });
  addEventListener('appinstalled', () => { installPrompt = null; emit(); });
  document.addEventListener('fullscreenchange', emit);
  document.addEventListener('webkitfullscreenchange', emit);
  standalone.addEventListener('change', emit);
  function instructions() {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return ios
      ? 'No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início. Se aparecer, deixe Abrir como App ligado.'
      : 'No menu do navegador (⋮), escolha Instalar app ou Adicionar à tela inicial. O atalho terá o nome Fortune Circus.';
  }
  window.KingRicoApp = {
    snapshot,
    watch(listener) { listeners.add(listener); listener(snapshot()); return () => listeners.delete(listener); },
    async toggleFullscreen() {
      if (!snapshot().canFullscreen) return instructions();
      try {
        if (fullscreenElement()) await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        else await (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen).call(document.documentElement);
        return '';
      } catch { return 'Não foi possível abrir em tela cheia. ' + instructions(); }
    },
    async install() {
      if (isInstalled()) return 'Fortune Circus já está aberto como aplicativo.';
      if (!installPrompt) return instructions();
      const prompt = installPrompt; installPrompt = null;
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        return choice.outcome === 'accepted' ? 'Depois de instalar, abra Fortune Circus pelo ícone do celular.' : instructions();
      } catch { return instructions(); }
    }
  };
  // Network-only worker: never cache balances, game pages or Google login.
  if ('serviceWorker' in navigator) {
    addEventListener('load', () => navigator.serviceWorker.register('/sw.js', {updateViaCache:'none'}).catch(() => {}), {once:true});
  }
})();
