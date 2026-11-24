/* ============================================================
   ESTADO GLOBAL
   ============================================================ */
let cenas = [];
let cenaAtualId = null;
let selecionadoId = null;
let contadorGlobal = 0;
let cenaSeq = 0;

const canvas = document.getElementById('canvas');

/* ============================================================
   UTILITÁRIOS
   ============================================================ */
function cenaAtual() {
  return cenas.find(c => c.id === cenaAtualId);
}
function elementosCena() {
  const c = cenaAtual();
  return c ? c.elementos : [];
}
function uid() { return ++contadorGlobal; }

/* ============================================================
   CENAS
   ============================================================ */
function criarCena(nome) {
  cenaSeq++;
  const c = {
    id: 'cena_' + Date.now() + '_' + cenaSeq,
    nome: nome || ('Cena ' + cenaSeq),
    elementos: []
  };
  cenas.push(c);
  return c;
}

function novaCena() {
  const c = criarCena();
  cenaAtualId = c.id;
  selecionadoId = null;
  render();
}

function trocarCena(id) {
  if (id === cenaAtualId) return;
  cenaAtualId = id;
  selecionadoId = null;
  render();
}

function renomearCena(id) {
  const c = cenas.find(x => x.id === id);
  if (!c) return;
  const novo = prompt('Nome da cena:', c.nome);
  if (novo && novo.trim()) {
    c.nome = novo.trim();
    render();
  }
}

function removerCena(id) {
  if (cenas.length <= 1) {
    alert('Não é possível remover a última cena. Use "Limpar cena".');
    return;
  }
  if (!confirm('Remover esta cena e todos os seus elementos?')) return;
  cenas = cenas.filter(c => c.id !== id);
  if (cenaAtualId === id) {
    cenaAtualId = cenas[0].id;
    selecionadoId = null;
  }
  render();
}

function renderCenasLista() {
  const box = document.getElementById('cenas-lista');
  box.innerHTML = '';
  cenas.forEach(c => {
    const div = document.createElement('div');
    div.className = 'cena-item' + (c.id === cenaAtualId ? ' ativa' : '');
    div.innerHTML = `
      <span class="nome" title="${c.nome}">${c.nome}</span>
      <button class="del" title="Remover cena">✕</button>
    `;
    div.querySelector('.nome').addEventListener('click', () => trocarCena(c.id));
    div.querySelector('.nome').addEventListener('dblclick', (e) => {
      e.stopPropagation();
      renomearCena(c.id);
    });
    div.querySelector('.del').addEventListener('click', (e) => {
      e.stopPropagation();
      removerCena(c.id);
    });
    box.appendChild(div);
  });
  document.getElementById('toolbar-cena').textContent =
    cenaAtual() ? '— ' + cenaAtual().nome : '';
}

/* ============================================================
   CRIAR / REMOVER ELEMENTOS
   ============================================================ */
function add(tipo) {
  if (!cenaAtual()) return;
  const id = uid();
  const el = {
    id,
    tipo,
    x: 40 + ((id % 8) * 30),
    y: 40 + ((id % 6) * 30),
    w: tipo === 'img' ? 120 : null,
    h: tipo === 'img' ? 80 : null,
    texto: ({
      button: 'Clique',
      text: 'Texto aqui',
      label: 'Label',
      input: 'Digite...',
      img: 'Imagem',
      div: 'Caixa'
    })[tipo] || '',
    corFundo: tipo === 'button' ? '#4a90d9' : 'transparent',
    corTexto: tipo === 'button' ? '#ffffff' : '#333333',
    codigo: '',
    src: 'https://via.placeholder.com/120x80?text=Img'
  };
  cenaAtual().elementos.push(el);
  selecionadoId = el.id;
  render();
}

function limparCena() {
  if (!cenaAtual()) return;
  if (!confirm('Apagar todos os elementos desta cena?')) return;
  cenaAtual().elementos = [];
  selecionadoId = null;
  render();
}

function limparTudo() {
  if (!confirm('Apagar TODAS as cenas e recomeçar do zero?')) return;
  cenas = [];
  cenaSeq = 0;
  contadorGlobal = 0;
  criarCena();
  cenaAtualId = cenas[0].id;
  selecionadoId = null;
  render();
}

function removerSel() {
  const arr = elementosCena();
  const i = arr.findIndex(e => e.id === selecionadoId);
  if (i >= 0) arr.splice(i, 1);
  selecionadoId = null;
  render();
}

/* ============================================================
   RENDER DO CANVAS
   ============================================================ */
function render() {
  renderCenasLista();

  canvas.innerHTML = '';
  elementosCena().forEach(el => {
    const d = document.createElement('div');
    d.className = 'item-canvas' + (el.id === selecionadoId ? ' selecionado' : '');
    d.dataset.id = el.id;
    d.style.left = el.x + 'px';
    d.style.top  = el.y + 'px';
    if (el.w) d.style.width  = el.w + 'px';
    if (el.h) d.style.height = el.h + 'px';

    if (el.tipo === 'img') {
      d.innerHTML = `<img src="${el.src}" style="width:100%;height:100%;object-fit:cover;pointer-events:none;">`;
    } else if (el.tipo === 'button') {
      d.innerHTML = `<span style="pointer-events:none;color:${el.corTexto};">${el.texto}</span>`;
      d.style.background = el.corFundo;
      d.style.color = el.corTexto;
    } else {
      d.innerHTML = `<span style="pointer-events:none;color:${el.corTexto};">${el.texto}</span>`;
    }

    d.addEventListener('mousedown', (e) => iniciarDrag(e, el, d));
    d.addEventListener('click', (e) => {
      e.stopPropagation();
      selecionadoId = el.id;
      render();
    });

    canvas.appendChild(d);
  });

  renderInspetor();
  renderCodigo();
}

/* ============================================================
   DRAG
   ============================================================ */
let dragState = null;

function iniciarDrag(e, el, domEl) {
  if (e.button !== 0) return;
  e.preventDefault();
  selecionadoId = el.id;
  const rect = canvas.getBoundingClientRect();
  dragState = {
    el,
    domEl,
    offsetX: e.clientX - rect.left - el.x,
    offsetY: e.clientY - rect.top  - el.y
  };
  domEl.classList.add('selecionado');
  document.addEventListener('mousemove', moverDrag);
  document.addEventListener('mouseup', soltarDrag);
}

function moverDrag(e) {
  if (!dragState) return;
  const rect = canvas.getBoundingClientRect();
  const { el, domEl } = dragState;

  const maxX = Math.max(0, canvas.clientWidth  - (el.w || domEl.offsetWidth));
  const maxY = Math.max(0, canvas.clientHeight - (el.h || domEl.offsetHeight));

  el.x = Math.min(maxX, Math.max(0, e.clientX - rect.left - dragState.offsetX));
  el.y = Math.min(maxY, Math.max(0, e.clientY - rect.top  - dragState.offsetY));

  domEl.style.left = el.x + 'px';
  domEl.style.top  = el.y + 'px';
}

function soltarDrag() {
  if (dragState) {
    renderCodigo();
  }
  dragState = null;
  document.removeEventListener('mousemove', moverDrag);
  document.removeEventListener('mouseup', soltarDrag);
}

/* ============================================================
   INSPETOR (com preservação de foco)
   ============================================================ */
function renderInspetor() {
  const box = document.getElementById('inspetor-conteudo');
  const el = elementosCena().find(e => e.id === selecionadoId);
  if (!el) {
    box.innerHTML = '<p style="font-size:12px;color:#888;">Selecione um elemento no canvas.</p>';
    return;
  }

  box.innerHTML = `
    <label>Texto
      <input data-campo="texto" value="${String(el.texto).replace(/"/g, '&quot;')}">
    </label>
    <label>Cor do texto
      <input data-campo="corTexto" type="color" value="${el.corTexto}">
    </label>
    ${el.tipo === 'button' ? `
      <label>Cor de fundo
        <input data-campo="corFundo" type="color" value="${el.corFundo}">
      </label>
    ` : ''}
    ${el.tipo === 'img' ? `
      <label>URL da imagem
        <input data-campo="src" value="${String(el.src).replace(/"/g, '&quot;')}">
      </label>
    ` : ''}
    <label>Largura (px) <small>(vazio = auto)</small>
      <input data-campo="w" type="number" value="${el.w ?? ''}">
    </label>
    <label>Altura (px)
      <input data-campo="h" type="number" value="${el.h ?? ''}">
    </label>

    <h3 style="margin-top:16px;">⚡ Código no clique</h3>
    <label style="font-size:11px;color:#666;">JS que roda quando o usuário clica neste elemento.</label>
    <textarea data-campo="codigo" placeholder="alert('Olá!');">${el.codigo || ''}</textarea>

    <button class="btn-danger" onclick="removerSel()">🗑️ Remover elemento</button>
  `;

  box.querySelectorAll('[data-campo]').forEach(inp => {
    const campo = inp.dataset.campo;
    inp.addEventListener('input', () => {
      const alvo = elementosCena().find(e => e.id === selecionadoId);
      if (!alvo) return;
      let valor = inp.value;
      if (campo === 'w' || campo === 'h') {
        valor = valor === '' ? null : +valor;
      }
      alvo[campo] = valor;
      atualizarItemNoCanvas(alvo);
      renderCodigo();
    });
  });
}

/* Atualiza só um item do canvas, sem recriar tudo */
function atualizarItemNoCanvas(el) {
  const d = canvas.querySelector(`.item-canvas[data-id="${el.id}"]`);
  if (!d) return;
  d.style.left = el.x + 'px';
  d.style.top  = el.y + 'px';
  d.style.width  = el.w ? el.w + 'px' : '';
  d.style.height = el.h ? el.h + 'px' : '';

  if (el.tipo === 'img') {
    d.innerHTML = `<img src="${el.src}" style="width:100%;height:100%;object-fit:cover;pointer-events:none;">`;
  } else if (el.tipo === 'button') {
    d.innerHTML = `<span style="pointer-events:none;color:${el.corTexto};">${el.texto}</span>`;
    d.style.background = el.corFundo;
    d.style.color = el.corTexto;
  } else {
    d.innerHTML = `<span style="pointer-events:none;color:${el.corTexto};">${el.texto}</span>`;
  }
}

/* ============================================================
   GERAR CÓDIGO
   ============================================================ */
function estiloInline(el) {
  let s = `position:absolute;left:${el.x}px;top:${el.y}px;`;
  if (el.w) s += `width:${el.w}px;`;
  if (el.h) s += `height:${el.h}px;`;
  if (el.tipo === 'button') {
    s += `background:${el.corFundo};color:${el.corTexto};border:none;padding:8px 14px;border-radius:6px;cursor:pointer;`;
  } else {
    s += `color:${el.corTexto};`;
  }
  return s;
}

function gerarHTMLitem(el) {
  const click = el.codigo
    ? ` onclick="${el.codigo.replace(/"/g, '&quot;')}"`
    : '';
  switch (el.tipo) {
    case 'button':
      return `<button style="${estiloInline(el)}"${click}>${el.texto}</button>`;
    case 'text':
      return `<p style="${estiloInline(el)}"${click}>${el.texto}</p>`;
    case 'label':
      return `<label style="${estiloInline(el)}"${click}>${el.texto}</label>`;
    case 'input':
      return `<input type="text" placeholder="${el.texto}" style="${estiloInline(el)}"${click}>`;
    case 'img':
      return `<img src="${el.src}" alt="${el.texto}" style="${estiloInline(el)}"${click}>`;
    case 'div':
      return `<div style="${estiloInline(el)}"${click}>${el.texto}</div>`;
  }
  return '';
}

function renderCodigo() {
  const html = elementosCena().map(gerarHTMLitem).join('\n  ');
  const doc = `<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <title>${cenaAtual() ? cenaAtual().nome : 'Minha página'}</title>
</head>
<body style="margin:0;position:relative;min-height:100vh;">
  ${html}
</body>
</html>`;
  document.getElementById('codigo').value = doc;
}

/* ============================================================
   EXPORTAR / IMPORTAR
   ============================================================ */
function baixarHTML() {
  const blob = new Blob([document.getElementById('codigo').value], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (cenaAtual() ? cenaAtual().nome : 'minha-pagina').replace(/\s+/g, '-') + '.html';
  a.click();
  URL.revokeObjectURL(a.href);
}

function baixarProjeto() {
  const dados = {
    versao: 1,
    cenas: cenas.map(c => ({
      id: c.id,
      nome: c.nome,
      elementos: c.elementos
    })),
    cenaAtualId,
    contadorGlobal,
    cenaSeq
  };
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'projeto-cenas.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importarProjeto(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const dados = JSON.parse(e.target.result);
      if (!dados.cenas || !Array.isArray(dados.cenas) || dados.cenas.length === 0) {
        throw new Error('Formato inválido');
      }
      cenas = dados.cenas.map(c => ({
        id: c.id || ('cena_' + Date.now() + '_' + Math.random()),
        nome: c.nome || 'Cena',
        elementos: Array.isArray(c.elementos) ? c.elementos : []
      }));
      cenaAtualId = dados.cenaAtualId && cenas.find(c => c.id === dados.cenaAtualId)
        ? dados.cenaAtualId
        : cenas[0].id;
      contadorGlobal = dados.contadorGlobal || cenas.reduce((m, c) =>
        Math.max(m, ...c.elementos.map(el => el.id || 0)), 0);
      cenaSeq = dados.cenaSeq || cenas.length;
      selecionadoId = null;
      render();
      alert('Projeto importado com sucesso!');
    } catch (err) {
      alert('Erro ao importar: ' + err.message);
    } finally {
      ev.target.value = '';
    }
  };
  reader.readAsText(file);
}

/* ============================================================
   CLIQUE FORA = DESMARCAR
   ============================================================ */
canvas.addEventListener('click', (e) => {
  if (e.target === canvas) {
    selecionadoId = null;
    render();
  }
});

/* ============================================================
   INIT
   ============================================================ */
(function init() {
  criarCena('Cena 1');
  cenaAtualId = cenas[0].id;
  render();
})();