import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.leaders.partner',
  appName: 'Leaders',
  webDir: 'dist',
  backgroundColor: '#ffffff',
  android: { allowMixedContent: false, adjustMarginsForEdgeToEdge: 'force' },
}

export default config
