// Normalize spectator input before the existing form handler subscribes to a game.
// The subscription and scoreboard implementation stay in the copied original page.
(() => {
  const form = document.getElementById('follow-form');
  const input = document.getElementById('follow-code');
  const error = document.getElementById('follow-error');
  const spanish = () => document.documentElement.lang === 'es';
  function updateCopy() {
    input.placeholder = spanish() ? 'Código o enlace de partida' : 'Code or game link';
    document.getElementById('follow-code-label').textContent = input.placeholder;
    document.getElementById('follow-description').textContent = spanish()
      ? 'Introduce el código o pega el enlace que te compartieron para seguir el marcador.'
      : 'Enter the code or paste a shared game link to follow the scoreboard.';
  }
  new MutationObserver(updateCopy).observe(document.documentElement, {attributes:true,attributeFilter:['lang']});
  updateCopy();
  form.addEventListener('submit', event => {
    let code = input.value.trim();
    if (/^https?:\/\//i.test(code)) {
      try {
        const link = new URL(code);
        if (link.hostname !== 'dominoparty.com' && link.hostname !== location.hostname) throw new Error('Unsupported host');
        code = link.searchParams.get('watch') || (/^#watch-/i.test(link.hash) ? link.hash.slice(7) : '');
      } catch { code = ''; }
    }
    code = code.toUpperCase();
    if (!/^[A-Z0-9]{4,6}$/.test(code)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      error.textContent = spanish()
        ? 'Introduce un código de 4 a 6 letras o números, o un enlace de seguimiento válido.'
        : 'Enter a 4–6 character game code or a valid watch link.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    input.value = code;
  }, true);
})();
