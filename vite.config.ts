import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 相対パスで出力する。GitHub Pages のように
  // https://<user>.github.io/<repo>/ のサブパスで配信されても、
  // リポジトリ名をビルドに埋め込まずに済む。
  base: './',
  // maplibre-gl は自前のワーカーを別ファイルとして持つため、
  // 依存の事前バンドルに任せるとワーカーが見つからなくなる
  optimizeDeps: { exclude: ['maplibre-gl'] },
  server: { open: true },
});
