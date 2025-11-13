// =============================
// PRIME GORILA - SISTEMA DE CHAMADOS
// Backend: ASP.NET Core + SQL Server
// Frontend: HTML, CSS, JS puro
// =============================

document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.page');
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const contrastToggle = document.getElementById('contrastToggle');
  const tabelaChamados = document.querySelector('#tabelaChamados tbody');
  const userWelcome = document.getElementById('userWelcome');
  const API_URL = "http://localhost:5000/api";

  // =====================
  // Helpers de navegação
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

  function navegar(hash) {
    const user = getUser();
    const restritas = ["#abrir-chamado", "#meus-chamados", "#relatorios", "#chamados"];
    if (restritas.includes(hash) && !user) {
      alert("Você precisa estar logado para acessar esta página.");
      hash = "#login";
    }
    showSection(hash);
  }

  navegar(location.hash);
  window.addEventListener('popstate', () => navegar(location.hash));

  document.querySelectorAll('.menu a, .topbar a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const href = a.getAttribute('href');
      history.pushState(null, '', href);
      navegar(href);
      sidebar.classList.remove('open');
    });
  });

  menuToggle?.addEventListener('click', () => sidebar.classList.toggle('open'));
  contrastToggle?.addEventListener('click', () => {
    const is = document.body.classList.toggle('high-contrast');
    contrastToggle.setAttribute('aria-pressed', is ? 'true' : 'false');
  });

  // =====================
  // Sessão / login
  // =====================
  const loginForm = document.getElementById('loginForm');
  const lembrarCheck = document.getElementById('lembrarLogin');

  function getStorage() {
    return lembrarCheck?.checked ? localStorage : sessionStorage;
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }

  function setUser(user, persist) {
    if (persist) localStorage.setItem("user", JSON.stringify(user));
    else sessionStorage.setItem("user", JSON.stringify(user));
    if (userWelcome) userWelcome.textContent = `Olá, ${user.nome}!`;
  }

  const userAtual = getUser();
  if (userAtual) {
    if (userWelcome) userWelcome.textContent = `Olá, ${userAtual.nome}!`;
    configurarInterfacePorTipo(userAtual);
    if (userAtual.tipo_usuario === "técnico") {
      history.replaceState(null, '', '#chamados');
      navegar('#chamados');
      carregarChamadosTecnico();
    } else {
      history.replaceState(null, '', '#meus-chamados');
      navegar('#meus-chamados');
      carregarChamados();
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (loginForm.email?.value || '').trim();
      const senha = (loginForm.senha?.value || '').trim();
      if (!email || !senha) return alert("Preencha e-mail e senha.");

      try {
        const resp = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha })
        });
        if (!resp.ok) {
          const t = await resp.text();
          return alert(t || "Usuário ou senha inválidos.");
        }
        const user = await resp.json();
        const persist = lembrarCheck?.checked;
        setUser(user, persist);
        configurarInterfacePorTipo(user);

        if (user.tipo_usuario === "técnico") {
          history.pushState(null, '', '#chamados');
          navegar('#chamados');
          carregarChamadosTecnico();
        } else {
          history.pushState(null, '', '#meus-chamados');
          navegar('#meus-chamados');
          carregarChamados();
        }
      } catch (err) {
        console.error(err);
        alert("Erro de conexão com o servidor.");
      }
    });
  }

  // =====================
  // Logout
  // =====================
  window.logout = function () {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    if (userWelcome) userWelcome.textContent = "";
    alert("Sessão encerrada.");
    history.pushState(null, '', '#login');
    navegar('#login');
  };

  // =====================
  // Cadastro
  // =====================
  const cadastroForm = document.getElementById('cadastroForm');
  if (cadastroForm) {
    cadastroForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = (cadastroForm.nome?.value || '').trim();
      const email = (cadastroForm.emailCadastro?.value || '').trim();
      const senha = (cadastroForm.senhaCadastro?.value || '').trim();
      if (!nome || !email || !senha) return alert("Preencha todos os campos.");

      try {
        const resp = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, email, senha })
        });
        if (resp.ok) {
          alert("Cadastro realizado com sucesso! Faça login.");
          history.pushState(null, '', '#login');
          navegar('#login');
          cadastroForm.reset();
        } else if (resp.status === 409) {
          alert("E-mail já cadastrado.");
        } else {
          alert(await resp.text() || "Erro ao cadastrar.");
        }
      } catch (err) {
        console.error(err);
        alert("Erro de conexão com o servidor.");
      }
    });
  }

  // =====================
  // Configurações por tipo de usuário (adiciona/oculta menu "Chamados")
  // =====================
  function configurarInterfacePorTipo(user) {
    const menu = document.querySelector(".menu ul");
    if (!menu) return;
    const menuChamados = menu.querySelector('a[href="#chamados"]');
    if (user.tipo_usuario === "técnico") {
      if (!menuChamados) {
        const li = document.createElement("li");
        li.innerHTML = '<a href="#chamados">Chamados</a>';
        menu.appendChild(li);
      }
    } else {
      if (menuChamados) menuChamados.parentElement.remove();
    }
  }

  // =====================
  // Enviar chamado (form)
  // =====================
  const formChamado = document.getElementById('formChamado');
  if (formChamado) {
    formChamado.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = getUser();
      if (!user) return alert("Você precisa estar logado.");
      const data = {
        titulo: formChamado.titulo.value.trim(),
        descricao: formChamado.descricao.value.trim(),
        prioridade: formChamado.prioridade.value,
        usuario_id: user.id_usuario
      };
      try {
        const resp = await fetch(`${API_URL}/chamados`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (!resp.ok) throw new Error(await resp.text());
        alert("Chamado criado com sucesso!");
        formChamado.reset();
        carregarChamados();
        carregarChamadosTecnico();
      } catch (err) {
        console.error(err);
        alert("Erro ao enviar chamado: " + (err.message || err));
      }
    });
  }

  // =====================
  // Render meus chamados (usuário) - cria botões com listeners
  // =====================
  function renderChamados(lista) {
    if (!tabelaChamados) return;
    tabelaChamados.innerHTML = '';
    if (!lista || lista.length === 0) {
      tabelaChamados.innerHTML = '<tr><td colspan="5" style="opacity:.7;text-align:center;">Nenhum chamado encontrado.</td></tr>';
      return;
    }

    lista.forEach(c => {
      const tr = document.createElement('tr');

      const tdTitulo = document.createElement('td'); tdTitulo.textContent = c.titulo;
      const tdPrior = document.createElement('td'); tdPrior.textContent = c.prioridade;
      const tdStatus = document.createElement('td'); tdStatus.textContent = c.status;
      const tdData = document.createElement('td'); tdData.textContent = new Date(c.data_abertura).toLocaleDateString();
      const tdAcoes = document.createElement('td');

      // Botão ver descrição
      const btnVer = document.createElement('button');
      btnVer.className = 'btn small';
      btnVer.textContent = 'Ver Descrição';
      btnVer.addEventListener('click', () => abrirDescricao(c));

      // Botão reabrir (se resolvido)
      let btnReabrir = null;
      if (c.status === "Resolvido") {
        btnReabrir = document.createElement('button');
        btnReabrir.className = 'btn small';
        btnReabrir.textContent = 'Reabrir';
        btnReabrir.addEventListener('click', () => reabrirChamado(c.id_chamado));
      }

      // Botão excluir
      const btnExcluir = document.createElement('button');
      btnExcluir.className = 'btn small';
      btnExcluir.textContent = 'Excluir';
      btnExcluir.addEventListener('click', () => {
        if (confirm('Deseja realmente excluir este chamado?')) excluirChamado(c.id_chamado);
      });

      tdAcoes.appendChild(btnVer);
      if (btnReabrir) tdAcoes.appendChild(btnReabrir);
      tdAcoes.appendChild(btnExcluir);

      tr.appendChild(tdTitulo);
      tr.appendChild(tdPrior);
      tr.appendChild(tdStatus);
      tr.appendChild(tdData);
      tr.appendChild(tdAcoes);

      tabelaChamados.appendChild(tr);
    });
  }

  // =====================
  // Abrir descrição (modal)
  // =====================
  function abrirDescricao(c) {
    // remove modal antiga se existir
    const existente = document.querySelector('.descricao-box');
    if (existente) existente.remove();

    const modal = document.createElement('div');
    modal.className = 'descricao-box';
    modal.innerHTML = `
      <div class="descricao-conteudo" role="dialog" aria-modal="true">
        <h3>${escapeHtml(c.titulo)}</h3>
        <p><strong>Prioridade:</strong> ${escapeHtml(c.prioridade)}</p>
        <p><strong>Status:</strong> ${escapeHtml(c.status)}</p>
        <p><strong>Data:</strong> ${new Date(c.data_abertura).toLocaleString()}</p>
        <hr>
        <p>${escapeHtml(c.descricao)}</p>
        <div class="descricao-acoes">
          <button class="btn primary" id="btnFecharModal">Fechar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('btnFecharModal').addEventListener('click', () => modal.remove());
    // fechar com ESC
    modal.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') modal.remove(); });
    // foco
    document.getElementById('btnFecharModal').focus();
  }

  // =====================
  // Carregar chamados do usuário
  // =====================
  async function carregarChamados() {
    const user = getUser();
    if (!user) return;
    try {
      const resp = await fetch(`${API_URL}/chamados/${user.id_usuario}`);
      if (!resp.ok) throw new Error('Erro ao buscar chamados.');
      const data = await resp.json();
      renderChamados(data);
    } catch (err) {
      console.error(err);
      if (tabelaChamados) tabelaChamados.innerHTML = `<tr><td colspan="5">Erro ao carregar chamados.</td></tr>`;
    }
  }

  // =====================
  // Carregar chamados (técnico)
  // =====================
  async function carregarChamadosTecnico() {
    const tabela = document.querySelector("#tabelaChamadosTecnico tbody");
    const aviso = document.getElementById("chamadosAviso");
    const user = getUser();
    if (!user) return;

    if (user.tipo_usuario !== "técnico") {
      if (aviso) aviso.textContent = "Apenas usuário técnico pode acessar esta sessão.";
      if (tabela) tabela.innerHTML = "";
      return;
    }
    if (aviso) aviso.textContent = "";

    try {
      const resp = await fetch(`${API_URL}/chamados/todos`);
      if (!resp.ok) throw new Error('Erro buscar todos');
      const data = await resp.json();
      tabela.innerHTML = '';
      if (!data.length) {
        tabela.innerHTML = '<tr><td colspan="6">Nenhum chamado encontrado.</td></tr>';
        return;
      }

      data.forEach(c => {
        const tr = document.createElement('tr');
        const tdUser = document.createElement('td'); tdUser.textContent = c.usuario || '—';
        const tdTitulo = document.createElement('td'); tdTitulo.textContent = c.titulo;
        const tdPrior = document.createElement('td'); tdPrior.textContent = c.prioridade;
        const tdStatus = document.createElement('td'); tdStatus.textContent = c.status;
        const tdData = document.createElement('td'); tdData.textContent = new Date(c.data_abertura).toLocaleDateString();
        const tdAcoes = document.createElement('td');

        const btnVer = document.createElement('button');
        btnVer.className = 'btn small';
        btnVer.textContent = 'Ver Descrição';
        btnVer.addEventListener('click', () => abrirDescricao(c));

        const acaoBtn = document.createElement('button');
        acaoBtn.className = 'btn small';
        if (c.status === 'Resolvido') {
          acaoBtn.textContent = 'Reabrir';
          acaoBtn.addEventListener('click', () => reabrirChamado(c.id_chamado));
        } else {
          acaoBtn.textContent = 'Resolver';
          acaoBtn.addEventListener('click', () => resolverChamado(c.id_chamado));
        }

        const btnExcluir = document.createElement('button');
        btnExcluir.className = 'btn small';
        btnExcluir.textContent = 'Excluir';
        btnExcluir.addEventListener('click', () => {
          if (confirm('Deseja realmente excluir este chamado?')) excluirChamado(c.id_chamado);
        });

        tdAcoes.appendChild(btnVer);
        tdAcoes.appendChild(acaoBtn);
        tdAcoes.appendChild(btnExcluir);

        tr.appendChild(tdUser);
        tr.appendChild(tdTitulo);
        tr.appendChild(tdPrior);
        tr.appendChild(tdStatus);
        tr.appendChild(tdData);
        tr.appendChild(tdAcoes);

        tabela.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
      const tabelaEl = document.querySelector("#tabelaChamadosTecnico tbody");
      if (tabelaEl) tabelaEl.innerHTML = '<tr><td colspan="6">Erro ao carregar chamados.</td></tr>';
    }
  }

  // =====================
  // Resolver / Reabrir
  // =====================
  window.resolverChamado = async function (id) {
    try {
      const resp = await fetch(`${API_URL}/chamados/${id}`, { method: "PUT" });
      if (resp.ok) {
        alert("Chamado resolvido!");
        carregarChamadosTecnico();
        carregarChamados();
      } else {
        alert("Erro ao resolver chamado.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao resolver chamado.");
    }
  };

  window.reabrirChamado = async function (id) {
    try {
      const resp = await fetch(`${API_URL}/chamados/reabrir/${id}`, { method: "PUT" });
      if (resp.ok) {
        alert("Chamado reaberto com sucesso!");
        carregarChamados();
        carregarChamadosTecnico();
      } else {
        alert("Erro ao reabrir chamado.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao reabrir chamado.");
    }
  };

  // =====================
  // Excluir
  // =====================
  async function excluirChamado(id) {
    try {
      const resp = await fetch(`${API_URL}/chamados/${id}`, { method: "DELETE" });
      if (resp.ok) {
        alert("Chamado excluído com sucesso!");
        carregarChamados();
        carregarChamadosTecnico();
      } else {
        const text = await resp.text();
        alert("Erro ao excluir chamado: " + (text || resp.status));
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir chamado.");
    }
  }

  // =====================
  // Utilitários
  // =====================
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  // carregar filtros/refresh
  document.getElementById('btnRefresh')?.addEventListener('click', () => {
    const user = getUser();
    if (!user) return;
    if (user.tipo_usuario === 'técnico') {
      carregarChamadosTecnico();
    } else {
      carregarChamados();
    }
  });

  // IA suggestion (mantive simples — seu endpoint /ia/suggest pode ser usado)
  const descricao = document.getElementById('descricao');
  const iaSuggestion = document.getElementById('iaSuggestion');
  function debounce(fn, delay = 400) {
    let t;
    return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); };
  }
  async function pedirSugestao(text) {
    if (!iaSuggestion) return;
    if (!text?.trim()) { iaSuggestion.textContent = 'Descreva o problema para receber sugestões automáticas.'; return; }
    iaSuggestion.textContent = 'Buscando sugestão...';
    try {
      const resp = await fetch(`${API_URL}/ia/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!resp.ok) { iaSuggestion.textContent = 'Sugestão local: ' + (text.includes('wifi') ? 'Reinicie o roteador.' : 'Encaminhado ao técnico.'); return; }
      const data = await resp.json();
      iaSuggestion.textContent = data.suggestion || 'Sugestão: Encaminhado ao técnico.';
    } catch {
      iaSuggestion.textContent = 'Sugestão local: Encaminhado ao técnico.';
    }
  }


// ================================
// RELATÓRIO LOCAL (SEM API)
// ================================

let chartStatusInstance = null;

function gerarGraficoLocal() {
  const user = getUser();
  const aviso = document.getElementById("relAviso");
  const canvas = document.getElementById("chartStatus");
  if (!canvas) return;

  // Somente técnicos
  if (!user || user.tipo_usuario !== "técnico") {
    aviso.style.display = "block";
    canvas.style.display = "none";
    return;
  } else {
    aviso.style.display = "none";
    canvas.style.display = "block";
  }

  const tabela = document.querySelector("#tabelaChamadosTecnico tbody");
  if (!tabela) return;

  // Contagem de status (SEM "Em Andamento")
  const counts = { Aberto: 0, Resolvido: 0 };
  const rows = Array.from(tabela.querySelectorAll("tr"));

  if (rows.length === 0) {
    setTimeout(gerarGraficoLocal, 800); // tenta novamente se tabela ainda não carregou
    return;
  }

  rows.forEach(row => {
    const statusCell = row.children[3]; // 4ª coluna
    if (!statusCell) return;
    const status = (statusCell.textContent || "").trim().toLowerCase();
    if (status.includes("aberto")) counts.Aberto++;
    else if (status.includes("resol")) counts.Resolvido++;
  });

  // Se já existir gráfico, destrói e recria
  if (chartStatusInstance) {
    chartStatusInstance.destroy();
  }

  const ctx = canvas.getContext("2d");
  chartStatusInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Aberto", "Resolvido"],
      datasets: [{
        data: [counts.Aberto, counts.Resolvido],
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",  // Aberto
          "rgba(75, 192, 192, 0.8)"   // Resolvido
        ],
        borderColor: "#111",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#ddd" } },
        title: {
          display: true,
          text: "Chamados Abertos x Resolvidos",
          color: "#fff",
          font: { size: 18 }
        }
      }
    }
  });
}

// Executa ao entrar na aba de relatórios
window.addEventListener("hashchange", () => {
  if (location.hash === "#relatorios") {
    setTimeout(gerarGraficoLocal, 500);
  }
});

// Atualiza gráfico também após carregar chamados do técnico
window.atualizarRelatorioChamados = gerarGraficoLocal;

if (typeof atualizarRelatorioChamados === "function") {
  atualizarRelatorioChamados();
}


  if (descricao) descricao.addEventListener('input', debounce(e => pedirSugestao(e.target.value), 450));
});
