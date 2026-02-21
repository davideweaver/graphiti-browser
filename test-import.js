// Quick test to see if modules can be imported
import('./src/App.tsx')
  .then(() => console.log('✅ App.tsx imports successfully'))
  .catch(err => console.error('❌ App.tsx import failed:', err));
