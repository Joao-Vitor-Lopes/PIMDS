// =============================
// PRIME GORILA - SISTEMA DE CHAMADOS
// Backend: ASP.NET Core + SQL Server
// Frontend: HTML, CSS, JS puro
// =============================

document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('.menu a, .top-actions a');
  const sections = document.querySelectorAll('.page');
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const contrastToggle = document.getElementById('contrastToggle');
  const tabelaChamados = document.querySelector('#tabelaChamados tbody');
  const userWelcome = document.getElementById('userWelcome');
  const API_URL = "http://localhost:5000/api"; // endereço da sua API ASP.NET

  // =====================
  // FUNÇÕES GERAIS
  // =====================
  function showSection(hash) {
    sections.forEach(s => s.hidden = true);
    let target = hash ? document.querySelector(hash) : document.querySelector('#home');
    if (!target) target = document.querySelector('#home');
    target.hidden = false;
    document.querySelectorAll('.menu a').forEach(a =>
      a.classList.toggle('active', a.getAttribute('href') === (hash || '#home'))
    );
  }

  showSection(location.hash);
  window.addEventListener('popstate', () => showSection(location.hash));

  document.querySelectorAll('.menu a, .topbar a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const href = a.getAttribute('href');
      history.pushState(null, '', href);
      showSection(href);
      sidebar.classList.remove('open');
    });
  });

  menuToggle && menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  contrastToggle && contrastToggle.addEventListener('click', () => {
    const is = document.body.classList.toggle('high-contrast');
    contrastToggle.setAttribute('aria-pressed', is ? 'true' : 'false');
  });

  // =====================
  // LOGIN + CONTINUAR CONECTADO
  // =====================
  const loginForm = document.getElementById('loginForm');
  const lembrarCheck = document.getElementById('lembrarLogin');

  function getStorage() {
    return lembrarCheck?.checked ? localStorage : sessionStorage;
  }

  function getUser() {
    return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null");
  }

  // Se já estiver logado, vai direto para chamados
  const userAtual = getUser();
  if (userAtual) {
    if (userWelcome) userWelcome.textContent = `Olá, ${userAtual.nome}!`;
    location.hash = "#meus-chamados";
    showSection("#meus-chamados");
    carregarChamados();
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.email.value;
      const senha = loginForm.senha.value;

      try {
        const resp = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha })
        });

        if (!resp.ok) {
          alert("Usuário ou senha inválidos.");
          return;
        }

        const user = await resp.json();
        const storage = getStorage();
        storage.setItem("user", JSON.stringify(user));

        if (userWelcome) userWelcome.textContent = `Olá, ${user.nome}!`;
        alert(`Bem-vindo, ${user.nome}!`);

        location.hash = "#meus-chamados";
        showSection("#meus-chamados");
        carregarChamados();
      } catch (err) {
        alert("Erro de conexão com o servidor.");
        console.error(err);
      }
    });
  }

  // =====================
  // BLOQUEAR PÁGINAS SEM LOGIN
  // =====================
  const restrictedSections = ["#abrir-chamado", "#meus-chamados", "#relatorios"];
  const originalShowSection = showSection;
  showSection = function (hash) {
    const user = getUser();
    if (restrictedSections.includes(hash) && !user) {
      alert("Você precisa estar logado para acessar esta página.");
      hash = "#login";
    }
    originalShowSection(hash);
  };

  // =====================
  // LOGOUT
  // =====================
  window.logout = function () {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    if (userWelcome) userWelcome.textContent = "";
    alert("Sessão encerrada.");
    location.hash = "#login";
    showSection("#login");
  };

  // =====================
  // FORMULÁRIO DE CHAMADO
  // =====================
  const formChamado = document.getElementById('formChamado');
  if (formChamado) {
    formChamado.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = getUser();
      if (!user) {
        alert("Você precisa estar logado para abrir um chamado.");
        return;
      }

      const data = {
        titulo: formChamado.titulo.value,
        descricao: formChamado.descricao.value,
        prioridade: formChamado.prioridade.value,
        usuario_id: user.id_usuario
      };

      try {
        const resp = await fetch(`${API_URL}/chamados`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        if (!resp.ok) throw new Error("Erro ao criar chamado");

        alert("Chamado criado com sucesso!");
        formChamado.reset();
        location.hash = "#meus-chamados";
        showSection("#meus-chamados");
        carregarChamados();
      } catch (err) {
        console.error(err);
        alert("Erro ao enviar chamado.");
      }
    });
  }

  // =====================
  // CADASTRO DE NOVO USUÁRIO
  // =====================
  const cadastroForm = document.getElementById('cadastroForm');
  if (cadastroForm) {
    cadastroForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nome = cadastroForm.nome.value;
      const email = cadastroForm.emailCadastro.value;
      const senha = cadastroForm.senhaCadastro.value;

      try {
        const resp = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, email, senha })
        });

        if (resp.ok) {
          alert("Cadastro realizado com sucesso! Faça login para continuar.");
          location.hash = "#login";
          showSection("#login");
          cadastroForm.reset();
        } else if (resp.status === 409) {
          alert("E-mail já cadastrado. Faça login ou use outro endereço.");
        } else {
          alert("Erro ao criar conta. Tente novamente.");
        }
      } catch (err) {
        console.error(err);
        alert("Erro de conexão com o servidor.");
      }
    });
  }

  // =====================
  // CARREGAR CHAMADOS DO USUÁRIO
  // =====================
  async function carregarChamados() {
    const user = getUser();
    if (!user) return;

    try {
      const resp = await fetch(`${API_URL}/chamados/${user.id_usuario}`);
      const data = await resp.json();
      renderChamados(data);
    } catch (err) {
      console.error(err);
      tabelaChamados.innerHTML = `<tr><td colspan="5">Erro ao carregar chamados.</td></tr>`;
    }
  }

  // =====================
  // RENDERIZAÇÃO DA TABELA
  // =====================
  function renderChamados(lista) {
    tabelaChamados.innerHTML = '';
    if (!lista || lista.length === 0) {
      tabelaChamados.innerHTML = '<tr><td colspan="5" style="opacity:.7">Nenhum chamado.</td></tr>';
      return;
    }
    lista.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(c.titulo)}</td>
        <td>${escapeHtml(c.prioridade)}</td>
        <td>${escapeHtml(c.status)}</td>
        <td>${new Date(c.data_abertura).toLocaleDateString()}</td>
        <td>
          ${c.status !== "Resolvido" ? `<button class="btn small" onclick="resolverChamado(${c.id_chamado})">Marcar Resolvido</button>` : ""}
        </td>`;
      tabelaChamados.appendChild(tr);
    });
  }

  // =====================
  // RESOLVER CHAMADO (somente técnico)
  // =====================
  window.resolverChamado = async function (id) {
    const user = getUser();
    if (!user || user.tipo_usuario !== "técnico") {
      alert("Somente técnicos podem resolver chamados.");
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/chamados/${id}`, {
        method: "PUT"
      });
      if (resp.ok) {
        alert("Chamado resolvido!");
        carregarChamados();
      } else {
        alert("Erro ao resolver chamado.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // =====================
  // FILTRO E REFRESH
  // =====================
  document.getElementById('filterStatus')?.addEventListener('change', (e) => {
    const value = e.target.value;
    const rows = tabelaChamados.querySelectorAll('tr');
    rows.forEach(r => {
      const status = r.children[2]?.textContent || "";
      r.style.display = (value === 'todos' || value === status) ? '' : 'none';
    });
  });

  document.getElementById('btnRefresh')?.addEventListener('click', carregarChamados);

  // =====================
  // Função de escape HTML
  // =====================
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  // =====================
  // IA: Sugestões automáticas (OpenAI + fallback)
  // =====================
  const descricao = document.getElementById('descricao');
  const iaSuggestion = document.getElementById('iaSuggestion');

  function debounce(fn, delay = 400) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  async function pedirSugestao(text) {
    if (!text || !text.trim()) {
      iaSuggestion.textContent = 'Descreva o problema para receber sugestões automáticas.';
      return;
    }
    iaSuggestion.textContent = 'Buscando sugestão...';
    try {
      const resp = await fetch(`${API_URL}/ia/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!resp.ok) {
        iaSuggestion.textContent = sugerirPorTextoLocal(text);
        return;
      }
      const data = await resp.json();
      iaSuggestion.textContent = data.suggestion || sugerirPorTextoLocal(text);
    } catch (err) {
      console.error('Erro IA:', err);
      iaSuggestion.textContent = sugerirPorTextoLocal(text);
    }
  }

  function sugerirPorTextoLocal(text) {
    const t = (text || '').toLowerCase();
    if (!t) return 'Descreva o problema para receber sugestões automáticas.';
    if (t.includes('senha')) return 'Sugestão: Verifique "Esqueci minha senha".';
    if (t.includes('wifi') || t.includes('wi-fi')) return 'Sugestão: Reinicie o roteador.';
    if (t.includes('catraca')) return 'Sugestão: Reinicie o controlador da catraca.';
    return 'Sugestão: Chamado encaminhado ao time técnico.';
  }

  if (descricao) descricao.addEventListener('input', debounce(e => pedirSugestao(e.target.value), 450));
});
