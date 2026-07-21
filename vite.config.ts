import path from 'path';
import { execSync } from 'child_process';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// Get git commit hash at build time
function getGitCommitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

const commitHash = getGitCommitHash();

// Emit dist/version.json so a running client can detect that a newer build has
// been deployed. It carries the same commit hash embedded in the bundle
// (__GIT_COMMIT_HASH__); the client polls it and compares. See useAppUpdate.
function emitVersionManifest(commit: string): Plugin {
  return {
    name: 'emit-version-manifest',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ commit }),
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), emitVersionManifest(commitHash)],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/',
  build: {
    outDir: 'dist',
  },
  define: {
    __GIT_COMMIT_HASH__: JSON.stringify(commitHash),
  },
});
