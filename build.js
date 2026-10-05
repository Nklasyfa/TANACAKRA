const fs = require('fs');
const { execSync } = require('child_process');

if (fs.existsSync('frontend')) {
  console.log('[Build Script] Executing build from project root...');
  execSync('npm --prefix frontend install && npm --prefix frontend run build', { stdio: 'inherit' });
} else {
  console.log('[Build Script] Executing build inside frontend folder...');
  execSync('npm install && npm run build', { stdio: 'inherit' });
}
