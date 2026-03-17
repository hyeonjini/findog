import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'FinDog',
    description: 'Save products and track prices',
    version: '0.1.0',
    permissions: ['storage', 'activeTab', 'scripting'],
    host_permissions: ['http://localhost:8001/*'],
    action: {
      default_popup: 'popup/index.html',
    },
  },
});
