// script-jemparingan.js (versi fix)
document.addEventListener("DOMContentLoaded", () => {
  const mode = localStorage.getItem('targetMode') || '321';
  const maxEnds = 20;
  const arrowsPerEndFixed = 4;

  const modeLabel = document.getElementById('modeLabel');
  const playersEl = document.getElementById('players');
  const leaderboardEl = document.getElementById('leaderboard');
  const numCompEl = document.getElementById('numComp');
  const currentEndEl = document.getElementById('currentEnd');
  const maxEndsLabel = document.getElementById('maxEndsLabel');
  const maxEndsEl = document.getElementById('maxEnds');
  const newName = document.getElementById('newName');
  const addFromInput = document.getElementById('addFromInput');
  const exportBtn = document.getElementById('exportBtn');
  const resetBtn = document.getElementById('resetBtn');
  const endBtn = document.getElementById('endBtn');
  const prevEndBtn = document.getElementById('prevEnd');
  const nextEndBtn = document.getElementById('nextEnd');
  const backToChoose = document.getElementById('backToChoose');

  modeLabel.textContent = mode === '321' ? 'Mode: 3 – 2 – 1' : 'Mode: 3 – 1';
  maxEndsLabel.textContent = maxEnds;
  maxEndsEl.textContent = maxEnds;

  const scoringButtonsByMode = {
    '321': ['3', '2', '1', 'M'],
    '13': ['3', '1', 'M']
  };

  const state = {
    competitors: [],
    selectedId: null,
    currentEnd: 1,
    arrowsPerEnd: arrowsPerEndFixed,
    matchEnded: false,
  };

  function recalculateStats(p) {
    let total = 0, missCount = 0;
    for (let i = 1; i <= maxEnds; i++) {
      if (p.scores[i]) {
        p.scores[i].forEach(arrow => {
          if (arrow) {
            total += arrow.score;
            if (arrow.isM) missCount++;
          }
        });
      }
    }
    p.total = total;
    p.missCount = missCount;
  }

  function render() {
    playersEl.innerHTML = '';
    state.competitors.forEach((p) => {
      const div = document.createElement('div');
      div.className = 'player' + (p.id === state.selectedId ? ' selected' : '');
      const currentEndArrows = p.scores[state.currentEnd] || [null, null, null, null];
      let currentArrowsHtml = '';

      for (let i = 0; i < arrowsPerEndFixed; i++) {
        const arrow = currentEndArrows[i];
        currentArrowsHtml += `<div class="arrow-box ${arrow ? 'filled' : 'empty'}" data-index="${i}">
          ${arrow ? (arrow.isM ? 'M' : arrow.score) : '&nbsp;'}</div>`;
      }

      div.innerHTML = `
        <button class="remove-btn" data-action="remove" title="Hapus ${p.name}">×</button> 
        <div class="name">${p.name}</div>
        <div class="meta">Total: ${p.total} • Miss: ${p.missCount}</div>
        <div class="meta-seri">Skor Seri ${state.currentEnd}:</div>
        <div class="current-arrows">${currentArrowsHtml}</div>
        ${!state.matchEnded && p.id === state.selectedId ? `
          <div class="pad" data-comp="${p.id}">
            ${scoringButtonsByMode[mode].map(s => `<button data-score="${s}">${s}</button>`).join('')}
          </div>` : ''}
      `;

      div.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="remove"]')) {
          if (state.matchEnded) return;
          removeCompetitor(p.id);
          return;
        }

        const arrowBox = e.target.closest('.arrow-box');
        if (arrowBox && arrowBox.classList.contains('filled')) {
          if (state.matchEnded) return;
          if (state.selectedId === p.id)
            removeSpecificArrow(p.id, state.currentEnd, parseInt(arrowBox.dataset.index, 10));
          else { state.selectedId = p.id; render(); }
          return;
        }

        const scoreBtn = e.target.closest('[data-score]');
        if (scoreBtn) { recordScore(scoreBtn.dataset.score); return; }

        if (state.selectedId !== p.id) { state.selectedId = p.id; render(); }
      });
      playersEl.appendChild(div);
    });

    const sorted = [...state.competitors].sort((a, b) => b.total - a.total || a.missCount - b.missCount);
    leaderboardEl.innerHTML = sorted.map((p, i) =>
      `<div class="leader"><div>${i + 1}. ${p.name}</div><div>${p.total} (M:${p.missCount})</div></div>`).join('');
    numCompEl.textContent = state.competitors.length;
    currentEndEl.textContent = state.currentEnd;
  }

  function addCompetitor(name = "Atlet") {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const newScores = {};
    for (let i = 1; i <= maxEnds; i++) newScores[i] = [null, null, null, null];
    state.competitors.push({ id, name, scores: newScores, total: 0, missCount: 0 });
    state.selectedId = id;
    render();
    newName.focus();
  }

  function removeCompetitor(id) {
    state.competitors = state.competitors.filter(p => p.id !== id);
    if (state.selectedId === id) state.selectedId = state.competitors[0]?.id || null;
    render();
  }

  function removeSpecificArrow(competitorId, end, indexOnCard) {
    const p = state.competitors.find(x => x.id === competitorId);
    if (!p) return;
    p.scores[end][indexOnCard] = null;
    recalculateStats(p);
    render();
  }

  function recordScore(value) {
  if (!state.selectedId || state.matchEnded) {
    alert('Pilih atlet terlebih dahulu sebelum memasukkan skor.');
    return;
  }

  const p = state.competitors.find(x => x.id === state.selectedId);
  if (!p) return;

  const sValue = String(value);
  const isM = sValue.toUpperCase() === 'M' || sValue === '0';
  const numeric = isM ? 0 : Number(value);
  if (!isM && (Number.isNaN(numeric) || numeric < 0)) return;

  const currentScores = p.scores[state.currentEnd];
  const emptySlotIndex = currentScores.findIndex(s => s === null);
  if (emptySlotIndex === -1) { 
    alert('Sudah mencapai 4 anak panah.'); 
    return; 
  }

  const arrow = { end: state.currentEnd, score: numeric, isM };
  currentScores[emptySlotIndex] = arrow;
  recalculateStats(p);

  // cek apakah semua atlet sudah isi seri ini
  const finished = state.competitors.filter(c =>
    c.scores[state.currentEnd].every(s => s !== null)
  ).length;

  if (finished === state.competitors.length && state.competitors.length > 0) {
    if (state.currentEnd >= maxEnds) {
      endRound();
    } else {
      // ✅ Keamanan: pindah seri tapi semua atlet harus diklik ulang
      state.currentEnd++;
      state.selectedId = null;
    }
  }

  render();
}



  function fillMissesForEnd(endNumber) {
    state.competitors.forEach(p => {
      const currentScores = p.scores[endNumber];
      for (let i = 0; i < arrowsPerEndFixed; i++) {
        if (currentScores[i] === null)
          currentScores[i] = { end: endNumber, score: 0, isM: true };
      }
      recalculateStats(p);
    });
  }

  function resetRound() {
    if (!confirm('Mulai sesi baru? Semua data akan dihapus.')) return;
    state.competitors.forEach(p => {
      p.total = 0; p.missCount = 0;
      const newScores = {};
      for (let i = 1; i <= maxEnds; i++) newScores[i] = [null, null, null, null];
      p.scores = newScores;
    });
    state.currentEnd = 1;
    state.matchEnded = false;
    state.selectedId = null;
    endBtn.textContent = 'Akhiri Sesi';
    endBtn.classList.remove('done');
    localStorage.removeItem('targetMode');
    render();
  }

  function endRound() {
    if (!state.matchEnded) {
      for (let i = state.currentEnd; i <= maxEnds; i++) fillMissesForEnd(i);
      state.matchEnded = true;
      state.selectedId = null;
      endBtn.textContent = 'Sesi Selesai';
      endBtn.classList.add('done');
      state.currentEnd = maxEnds;
      render();
      alert('Sesi selesai. Kamu bisa export hasil atau reset untuk sesi baru.');
    }
  }

  function nextEnd() {
    if (!state.matchEnded) {
      fillMissesForEnd(state.currentEnd);
      if (state.currentEnd >= maxEnds) { endRound(); return; }
      state.currentEnd++;
    } else if (state.currentEnd < maxEnds) state.currentEnd++;
    state.selectedId = null;
    render();
  }

  function prevEnd() {
    if (state.currentEnd <= 1) return;
    state.currentEnd--;
    state.selectedId = null;
    render();
  }

  addFromInput.addEventListener('click', () => {
    if (state.matchEnded) return;
    const name = (newName.value || '').trim();
    if (!name) { alert('Masukkan nama atlet.'); return; }
    addCompetitor(name);
    newName.value = '';
  });

  exportBtn.addEventListener('click', () => { exportCSV(); state.selectedId = null; render(); });
  resetBtn.addEventListener('click', resetRound);
  endBtn.addEventListener('click', () => {
    if (state.competitors.length === 0) return alert('Tambahkan atlet dulu.');
    if (!state.matchEnded && confirm('Akhiri sesi sekarang?')) endRound();
  });
  nextEndBtn.addEventListener('click', () => {
    if (state.competitors.length === 0) return alert('Nama atlet kosong.');
    if (state.currentEnd === maxEnds) return;
    nextEnd();
  });
  prevEndBtn.addEventListener('click', prevEnd);

  backToChoose.addEventListener('click', () => {
    if (!confirm('Kembali ke pemilihan mode? Pengaturan tidak tersimpan.')) return;
    localStorage.removeItem('targetMode');
    window.location.href = 'index.html';
  });

  window.addEventListener('keydown', (e) => {
    if (document.activeElement === newName) {
      if (e.key === 'Enter') { e.preventDefault(); addFromInput.click(); }
      return;
    }
    if (state.matchEnded) return;
    const key = e.key.toUpperCase();
    if (key === '0') return recordScore('0');
    if (scoringButtonsByMode[mode].includes(key)) recordScore(key);
  });

  function exportCSV() {
    const headers = ['Name','Total','Miss','Arrows'].join(',');
    const rows = state.competitors.map(p => {
      const arrowsList = [];
      for (let end = 1; end <= maxEnds; end++) {
        p.scores[end].forEach(a => { if (a) arrowsList.push(`E${end}:${a.isM ? 'M' : a.score}`); });
      }
      const arrowsStr = arrowsList.join('|');
      return [`"${p.name}"`, p.total, p.missCount, `"${arrowsStr}"`].join(',');
    });
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'jemparingan_round.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  render();
});
