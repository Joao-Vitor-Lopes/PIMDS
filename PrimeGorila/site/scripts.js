// Basic SPA-like navigation between sections
document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('.menu a, .top-actions a, .topbar a, .topbar .brand, .topbar .hamburger');
  const sections = document.querySelectorAll('.page');
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const contrastToggle = document.getElementById('contrastToggle');

  // Helper: show section by hash or id
  function showSection(hash) {
    sections.forEach(s => s.hidden = true);
    let target = hash ? document.querySelector(hash) : document.querySelector('#home');
    if (!target) target = document.querySelector('#home');
    target.hidden = false;

    // mark active link
    document.querySelectorAll('.menu a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === (hash || '#home')));
  }

  // initial show (based on URL hash)
  showSection(location.hash);

  // handle menu clicks (prevent page reload)
  document.querySelectorAll('.menu a').forEach(a => {
    a.addEventListener('click', (e) => {
      // close sidebar on mobile
      sidebar.classList.remove('open');
      const href = a.getAttribute('href');
      history.pushState(null, '', href);
      showSection(href);
      e.preventDefault();
    });
  });

  // topbar login link and others
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      history.pushState(null, '', href);
      showSection(href);
      e.preventDefault();
    });
  });

  // hamburger
  menuToggle && menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // contrast toggle
  contrastToggle && contrastToggle.addEventListener('click', () => {
    const is = document.body.classList.toggle('high-contrast');
    contrastToggle.setAttribute('aria-pressed', is ? 'true' : 'false');
  });

  // Form: simple IA suggestion (fake)
  const descricao = document.getElementById('descricao');
  const iaSuggestion = document.getElementById('iaSuggestion');

  function sugerirPorTexto(text) {
    const t = (text || '').toLowerCase();
    if (!t) return 'Descreva o problema para receber sugestões automáticas.';
    if (t.includes('senha')) return 'Sugestão: Verifique "Esqueci minha senha" ou redefina no painel de usuários.';
    if (t.includes('wifi') || t.includes('wi-fi')) return 'Sugestão: Verifique o roteador e tente reconectar na rede PrimeGorila.';
    if (t.includes('catraca')) return 'Sugestão: Checar sensor e reiniciar o controlador da catraca.';
    return 'Sugestão: Chamado encaminhado ao time técnico para análise.';
  }

  if (descricao) {
    descricao.addEventListener('input', (e) => {
      iaSuggestion.textContent = sugerirPorTexto(e.target.value);
    });
  }

  // Handle submit (local only): add to local array and render in table
  const formChamado = document.getElementById('formChamado');
  const tabelaChamados = document.querySelector('#tabelaChamados tbody');
  let chamados = [];

  function renderChamados(filter='todos') {
    tabelaChamados.innerHTML = '';
    const list = chamados.filter(c => filter === 'todos' ? true : c.status === filter);
    if (list.length === 0) {
      tabelaChamados.innerHTML = '<tr><td colspan="5" style="opacity:.7">Nenhum chamado.</td></tr>';
      return;
    }
    list.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(c.titulo)}</td>
                      <td>${escapeHtml(c.prioridade)}</td>
                      <td>${escapeHtml(c.status)}</td>
                      <td>${escapeHtml(new Date(c.data).toLocaleString())}</td>
                      <td><button class="btn small" data-id="${c.id}" onclick="marcarResolvido(${c.id})">Marcar Resolvido</button></td>`;
      tabelaChamados.appendChild(tr);
    });
  }

  // simple escape
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]); }

  // add chamado
  if (formChamado) {
    formChamado.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        id: Date.now(),
        titulo: formChamado.titulo.value,
        categoria: formChamado.categoria.value,
        prioridade: formChamado.prioridade.value,
        descricao: formChamado.descricao.value,
        status: 'Aberto',
        data: new Date().toISOString()
      };
      chamados.unshift(data);
      formChamado.reset();
      iaSuggestion.textContent = 'Chamado criado e encaminhado. A IA sugeriu uma ação.';
      // go to meus chamados
      history.pushState(null,'','#meus-chamados');
      showSection('#meus-chamados');
      renderChamados(document.getElementById('filterStatus').value);
    });
  }

  // clear
  document.getElementById('limparForm')?.addEventListener('click', () => formChamado.reset());

  // filter
  document.getElementById('filterStatus')?.addEventListener('change', (e) => {
    renderChamados(e.target.value);
  });

  document.getElementById('btnRefresh')?.addEventListener('click', () => renderChamados(document.getElementById('filterStatus').value));

  // expose function to window to allow inline onclick in created rows
  window.marcarResolvido = function(id) {
    const idx = chamados.findIndex(c => c.id === id);
    if (idx !== -1) {
      chamados[idx].status = 'Resolvido';
      renderChamados(document.getElementById('filterStatus').value);
      alert('Chamado marcado como Resolvido (local demo).');
    }
  };

  // populate demo data
  chamados = [
    { id:1, titulo:'Falha no Wi-Fi da sala A', prioridade:'Alta', status:'Aberto', data: new Date().toISOString()},
    { id:2, titulo:'Catraca com erro E-12', prioridade:'Média', status:'Em Andamento', data: new Date().toISOString()},
    { id:3, titulo:'Aplicativo travando ao carregar treino', prioridade:'Baixa', status:'Resolvido', data: new Date().toISOString()},
  ];
  renderChamados();

  // Chart.js sample chart
  const ctx = document.getElementById('chartStatus');
if (ctx && window.Chart) {
  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Aberto', 'Em Andamento', 'Resolvido'],
      datasets: [{
        data: [1, 1, 1],
        backgroundColor: ['#ff6384', '#ffcd56', '#36a2eb']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // permite redimensionamento flexível
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#fff' } // ajusta cor da legenda para o fundo escuro
        }
      },
      layout: {
        padding: 10
      }
    }
})}});


