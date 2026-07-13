import { defineConfig } from 'vite';

// O `base` precisa bater com o nome do repositorio para os assets
// resolverem corretamente no GitHub Pages (https://<user>.github.io/two-players-radar/).
// Em desenvolvimento (npm run dev) o Vite usa "/" normalmente.
export default defineConfig({
  base: '/two-players-radar/',
});
