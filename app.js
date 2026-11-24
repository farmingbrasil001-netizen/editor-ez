/* ============================================================
   ESTADO GLOBAL
   ============================================================ */
let cenas = [];
let cenaAtualId = null;
let cenaInicialId = null;
let selecionadoId = null;
let contadorGlobal = 0;
let cenaSeq = 0;

const canvas = document.getElementById('canvas');

/* ============================================================
   UTILITÁRIOS
   ============================================================ */
function cenaAtual() { return cenas.find(c => c.id === cenaAtualId); }
function elementosCena() { const c = cenaAtual(); return c ? c.elementos : []; }
function uid() { return ++contadorGlobal; }
function cenaPorId(id) { return cenas.find(c => c.id === id); }

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
  if (!cenaInicialId) cenaInicialId = c.id;
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
  const c = cenaPorId(id);
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
  cenas.forEach(c => c.elementos.forEach(el => {
    if (el.irParaCena === id) el.irParaCena = '';
  }));
  cenas = cenas.filter(c => c.id !== id);
  if (cenaInicialId === id) cenaInicialId = cenas[0].id;
  if (cenaAtualId === id) { cenaAtualId = cenas[0].id; selecionadoId = null; }
  render();
}

function definirCenaInicial(id) {
  cenaInicialId = id;
  render();
  const c = cenaPorId(id);
  if (c) alert('Cena inicial definida: ' + c.nome);
}

function renderCenasLista() {
  const box = document.getElementById('cenas-lista');
  box.innerHTML = '';
  cenas.forEach(c => {
    const div = document.createElement('div');
    div.className = 'cena-item' + (c.id === cenaAtualId ? ' ativa' : '');
    const estrela = (c.id === cenaInicialId) ? '⭐ ' : '';
    div.innerHTML = `
      <span class="nome" title="${c.nome} (duplo-clique renomeia)">${estrela}${c.nome}</span>
      <button class="del" title="Definir como cena inicial">⭐</button>
      <button class="del" title="Remover cena">✕</button>
    `;
    const btns = div.querySelectorAll('.del');
    div.querySelector('.nome').addEventListener('click', () => trocarCena(c.id));
    div.querySelector('.nome').addEventListener('dblclick', (e) => {
      e.stopPropagation(); renomearCena(c.id);
    });
    btns[0].addEventListener('click', (e) => { e.stopPropagation(); definirCenaInicial(c.id); });
    btns[1].addEventListener('click', (e) => { e.stopPropagation(); removerCena(c.id); });
    box.appendChild(div);
  });
  const tc = document.getElementById('toolbar-cena');
  if (tc) tc.textContent = cenaAtual() ? '— ' + cenaAtual().nome : '';
}

/* ============================================================
   CRIAR / REMOVER ELEMENTOS
   ============================================================ */
function add(tipo) {
  if (!cenaAtual()) return;
  const id = uid();
  const el = {
    id, tipo,
    x: 40 + ((id % 8) * 30),
    y: 40 + ((id % 6) * 30),
    w: tipo === 'img' ? 120 : null,
    h: tipo === 'img' ? 80 : null,
    texto: ({ button:'Clique', text:'Texto aqui', label:'Label', input:'Digite...', img:'Imagem', div:'Caixa' })[tipo] || '',
    corFundo: tipo === 'button' ? '#4a90d9' : 'transparent',
    corTexto: tipo === 'button' ? '#ffffff' : '#333333',
    codigo: '',
    src: 'https://via.placeholder.com/120x80?text=Img',
    irParaCena: ''
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
  cenas = []; cenaSeq = 0; contadorGlobal = 0; cenaInicialId = null;
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
    if (el.irParaCena) d.style.outline = '2px dashed #e67e22';

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
      if (el.irParaCena) {
        const alvo = cenaPorId(el.irParaCena);
        if (alvo) { trocarCena(alvo.id); return; }
      }
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
  dragState = { el, domEl,
    offsetX: e.clientX - rect.left - el.x,
    offsetY: e.clientY - rect.top  - el.y };
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
  if (dragState) renderCodigo();
  dragState = null;
  document.removeEventListener('mousemove', moverDrag);
  document.removeEventListener('mouseup', soltarDrag);
}

/* ============================================================
   INSPETOR (com preservação de foco + select de cena)
   ============================================================ */
function renderInspetor() {
  const box = document.getElementById('inspetor-conteudo');
  const el = elementosCena().find(e => e.id === selecionadoId);
  if (!el) {
    box.innerHTML = '<p style="font-size:12px;color:#888;">Selecione um elemento no canvas.</p>';
    return;
  }

  const opcoesCena = cenas
    .filter(c => c.id !== cenaAtualId)
    .map(c => `<option value="${c.id}" ${el.irParaCena === c.id ? 'selected' : ''}>${c.nome}</option>`)
    .join('');

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
      </label>` : ''}
    ${el.tipo === 'img' ? `
      <label>URL da imagem
        <input data-campo="src" value="${String(el.src).replace(/"/g, '&quot;')}">
      </label>` : ''}
    <label>Largura (px) <small>(vazio = auto)</small>
      <input data-campo="w" type="number" value="${el.w ?? ''}">
    </label>
    <label>Altura (px)
      <input data-campo="h" type="number" value="${el.h ?? ''}">
    </label>

    <h3 style="margin-top:16px;">🔀 Teletransportar para</h3>
    <label style="font-size:11px;color:#666;">Ao clicar neste elemento, vai para a cena escolhida.</label>
    <select data-campo="irParaCena">
      <option value="">— Nenhuma —</option>
      ${opcoesCena}
    </select>

    <h3 style="margin-top:16px;">⚡ Código no clique (opcional)</h3>
    <label style="font-size:11px;color:#666;">JS extra que roda junto (ex: alert).</label>
    <textarea data-campo="codigo" placeholder="alert('Olá!');">${el.codigo || ''}</textarea>

    <button class="btn-danger" onclick="removerSel()">🗑️ Remover elemento</button>
  `;

  box.querySelectorAll('[data-campo]').forEach(inp => {
    const campo = inp.dataset.campo;
    const evento = (inp.tagName === 'SELECT') ? 'change' : 'input';
    inp.addEventListener(evento, () => {
      const alvo = elementosCena().find(e => e.id === selecionadoId);
      if (!alvo) return;
      let valor = inp.value;
      if (campo === 'w' || campo === 'h') valor = valor === '' ? null : +valor;
      alvo[campo] = valor;
      atualizarItemNoCanvas(alvo);
      renderCodigo();
    });
  });
}

function atualizarItemNoCanvas(el) {
  const d = canvas.querySelector(`.item-canvas[data-id="${el.id}"]`);
  if (!d) return;
  d.style.left = el.x + 'px';
  d.style.top  = el.y + 'px';
  d.style.width  = el.w ? el.w + 'px' : '';
  d.style.height = el.h ? el.h + 'px' : '';
  d.style.outline = el.irParaCena ? '2px dashed #e67e22' : '';

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
  const partes = [];
  if (el.irParaCena) {
    const alvo = cenaPorId(el.irParaCena);
    if (alvo) partes.push(`irPara('${alvo.id.replace(/'/g, "\\'")}')`);
  }
  if (el.codigo && el.codigo.trim()) partes.push(el.codigo.trim());
  const click = partes.length
    ? ` onclick="${partes.join('; ').replace(/"/g, '&quot;')}"`
    : '';

  switch (el.tipo) {
    case 'button': return `<button style="${estiloInline(el)}"${click}>${el.texto}</button>`;
    case 'text':   return `<p style="${estiloInline(el)}"${click}>${el.texto}</p>`;
    case 'label':  return `<label style="${estiloInline(el)}"${click}>${el.texto}</label>`;
    case 'input':  return `<input type="text" placeholder="${el.texto}" style="${estiloInline(el)}"${click}>`;
    case 'img':    return `<img src="${el.src}" alt="${el.texto}" style="${estiloInline(el)}"${click}>`;
    case 'div':    return `<div style="${estiloInline(el)}"${click}>${el.texto}</div>`;
  }
  return '';
}

function renderCodigo() {
  const blocos = cenas.map(c => {
    const htmlItens = c.elementos.map(gerarHTMLitem).join('\n      ');
    return `  <div class="cena" data-id="${c.id}" data-nome="${c.nome.replace(/"/g, '&quot;')}" style="display:none; position:relative; width:100%; min-height:100vh;">
      ${htmlItens}
    </div>`;
  }).join('\n');

  const idInicial = cenaInicialId || (cenas[0] && cenas[0].id);

  const doc = `<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <title>${cenaPorId(idInicial) ? cenaPorId(idInicial).nome : 'Minha página'}</title>
  <style>
    html, body { margin:0; padding:0; }
    .cena { position:relative; width:100%; min-height:100vh; }
  </style>
</head>
<body>
${blocos}

<script>
  function irPara(id) {
    document.querySelectorAll('.cena').forEach(d => {
      d.style.display = (d.dataset.id === id) ? 'block' : 'none';
    });
    history.replaceState(null, '', '#' + id);
  }
  (function () {
    const hash = location.hash.replace('#', '');
    const inicial = ${JSON.stringify(idInicial)};
    const alvo = (hash && document.querySelector('.cena[data-id="' + hash + '"]')) ? hash : inicial;
    irPara(alvo);
  })();
</script>
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
    versao: 2,
    cenas: cenas.map(c => ({ id: c.id, nome: c.nome, elementos: c.elementos })),
    cenaAtualId, cenaInicialId, contadorGlobal, cenaSeq
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
      if (!dados.cenas || !Array.isArray(dados.cenas) || dados.cenas.length === 0)
        throw new Error('Formato inválido');
      cenas = dados.cenas.map(c => ({
        id: c.id || ('cena_' + Date.now() + '_' + Math.random()),
        nome: c.nome || 'Cena',
        elementos: (c.elementos || []).map(el => ({ irParaCena: '', ...el }))
      }));
      cenaAtualId = dados.cenaAtualId && cenaPorId(dados.cenaAtualId) ? dados.cenaAtualId : cenas[0].id;
      cenaInicialId = dados.cenaInicialId && cenaPorId(dados.cenaInicialId) ? dados.cenaInicialId : cenas[0].id;
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
  if (e.target === canvas) { selecionadoId = null; render(); }
});

/* ============================================================
   INIT
   ============================================================ */
(function init() {
  criarCena('Cena 1');
  cenaAtualId = cenas[0].id;
  cenaInicialId = cenas[0].id;
  render();
})();