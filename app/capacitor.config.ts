import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // ATENÇÃO: o appId vira permanente no primeiro envio à Google Play. Confirmar antes de publicar.
  appId: 'com.kingrico.app',
  appName: 'King Rico',
  webDir: 'www',
  backgroundColor: '#1e0838',
  android: {
    // o jogo é todo local; nada de conteúdo http misto
    allowMixedContent: false,
  },
};

export default config;
