// Roteamento por hash (#/...). Funciona sem configuracao de servidor,
// o que e ideal para GitHub Pages (nao precisa de reescrita de URL).
//
// Rotas:
//   #/                     -> home
//   #/radar/<nome>         -> tela do ouvinte (usar radar)
//   #/control/<nome>       -> tela do controlador

export function parseRoute() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const parts = hash.split('/').filter(Boolean);

  if (parts[0] === 'radar' && parts[1]) {
    return { page: 'radar', name: safeDecode(parts[1]) };
  }
  if (parts[0] === 'control' && parts[1]) {
    return { page: 'control', name: safeDecode(parts[1]) };
  }
  return { page: 'home' };
}

export function navigate(path) {
  window.location.hash = path;
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
