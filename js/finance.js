let expenseChartInstance = null;
let trendChartInstance = null;

function toggleJenisForm() {
  const jenis = document.querySelector('input[name="jenis"]:checked').value;
  const isTransfer = jenis === 'Transfer';
  document.getElementById('labelDompetAsal').textContent = isTransfer ? 'Dari Dompet (Asal)' : 'Dompet / Akun';
  document.getElementById('boxDompetTujuan').classList.toggle('hidden', !isTransfer);
  document.getElementById('boxKategori').classList.toggle('hidden', isTransfer);
}

function openUangModal(editId = null, defaultJenis = 'Pengeluaran') {
  document.getElementById('editUangId').value = editId || '';
  if (editId) {
    const item = dataKeuangan.find(k => k.id === editId);
    document.getElementById('modalUangTitle').textContent = 'Edit Transaksi';
    document.querySelector(`input[name="jenis"][value="${item.jenis}"]`).checked = true;
    document.getElementById('uangNominal').value = item.nominal;
    document.getElementById('uangDompet').value = item.dompet || 'Tunai';
    document.getElementById('uangDompetTujuan').value = item.dompet_tujuan || 'Bank';
    document.getElementById('uangTanggal').value = item.tanggal;
    document.getElementById('uangKategori').value = item.kategori;
    document.getElementById('uangCatatan').value = item.catatan === '-' ? '' : item.catatan;
  } else {
    document.getElementById('modalUangTitle').textContent = defaultJenis === 'Transfer' ? 'Setor / Tarik Tunai' : 'Catat Transaksi';
    document.querySelector(`input[name="jenis"][value="${defaultJenis}"]`).checked = true;
    document.getElementById('uangNominal').value = '';
    document.getElementById('uangTanggal').value = new Date().toISOString().split('T')[0];
    document.getElementById('uangCatatan').value = '';
  }
  toggleJenisForm();
  document.getElementById('modal-uang').classList.remove('hidden');
}

function simpanKeuangan(e) {
  e.preventDefault();
  const editId = document.getElementById('editUangId').value;
  const jenis = document.querySelector('input[name="jenis"]:checked').value;
  const nominal = Number(document.getElementById('uangNominal').value);
  const dompet = document.getElementById('uangDompet').value;
  const dompet_tujuan = jenis === 'Transfer' ? document.getElementById('uangDompetTujuan').value : '';
  const tanggal = document.getElementById('uangTanggal').value;
  const kategori = jenis === 'Transfer' ? 'Mutasi Dompet' : document.getElementById('uangKategori').value;
  const catatan = document.getElementById('uangCatatan').value.trim() || (jenis === 'Transfer' ? `${dompet} ke ${dompet_tujuan}` : '-');

  if (jenis === 'Transfer' && dompet === dompet_tujuan) {
    showToast('Dompet asal dan tujuan tidak boleh sama!');
    return;
  }

  if (editId) {
    const idx = dataKeuangan.findIndex(k => k.id === editId);
    if (idx > -1) dataKeuangan[idx] = { ...dataKeuangan[idx], tanggal, jenis, kategori, nominal, catatan, dompet, dompet_tujuan, isSynced: false };
    showToast('Transaksi diperbarui!');
  } else {
    dataKeuangan.unshift({ id: 'trx-' + Date.now(), tanggal, jenis, kategori, nominal, catatan, dompet, dompet_tujuan, isSynced: false });
    showToast(jenis === 'Transfer' ? 'Mutasi dompet tercatat!' : 'Transaksi disimpan!');
  }
  closeModal('modal-uang');
  saveLocal();
}

function hapusKeuangan(id) {
  if (!confirm('Hapus transaksi ini?')) return;
  dataKeuangan = dataKeuangan.filter(k => k.id !== id);
  deletedKeuangan.push(id);
  saveLocal();
  showToast('Transaksi dihapus');
}

// --- SPLIT BILL / PIUTANG TEMAN ---
function openPiutangModal() { document.getElementById('modal-piutang').classList.remove('hidden'); }
function simpanPiutang(e) {
  e.preventDefault();
  dataPiutang.unshift({
    id: 'piu-' + Date.now(),
    nama: document.getElementById('piutangNama').value.trim(),
    keterangan: document.getElementById('piutangKet').value.trim(),
    nominal: Number(document.getElementById('piutangNominal').value),
    dompet: document.getElementById('piutangDompet').value,
    status: 'Belum Lunas',
    tanggal: new Date().toISOString().split('T')[0],
    isSynced: false
  });
  e.target.reset();
  closeModal('modal-piutang');
  saveLocal();
  showToast('Catatan piutang / split bill disimpan!');
}

function lunasiPiutang(id) {
  const p = dataPiutang.find(item => item.id === id);
  if (!p || p.status === 'Lunas') return;
  if (!confirm(`Tandai piutang ${p.nama} (${formatRupiah(p.nominal)}) sudah LUNAS dan masukkan ke saldo ${p.dompet}?`)) return;
  p.status = 'Lunas';
  p.isSynced = false;
  dataKeuangan.unshift({
    id: 'trx-' + Date.now(),
    tanggal: new Date().toISOString().split('T')[0],
    jenis: 'Pemasukan',
    kategori: 'Pelunasan Split Bill',
    nominal: p.nominal,
    catatan: `Pelunasan ${p.nama} (${p.keterangan})`,
    dompet: p.dompet || 'Tunai',
    dompet_tujuan: '',
    isSynced: false
  });
  saveLocal();
  showToast(`✅ Lunas! +${formatRupiah(p.nominal)} masuk ke ${p.dompet}`);
}

function hapusPiutang(id) {
  if (!confirm('Hapus catatan piutang ini?')) return;
  dataPiutang = dataPiutang.filter(p => p.id !== id);
  deletedPiutang.push(id);
  saveLocal();
}

function renderPiutang() {
  const activeList = dataPiutang.filter(p => p.status !== 'Lunas');
  const totalPiutang = activeList.reduce((s, p) => s + p.nominal, 0);
  document.getElementById('totalPiutangBadge').textContent = formatRupiah(totalPiutang);

  document.getElementById('piutangList').innerHTML = dataPiutang.length
    ? dataPiutang.map(p => `
      <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between gap-2">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-xs truncate">${p.nama}</span>
            <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${p.status === 'Lunas' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'}">${p.status}</span>
          </div>
          <p class="text-[10px] text-slate-500 truncate">${p.keterangan} • Masuk ke ${p.dompet}</p>
        </div>
        <div class="text-right shrink-0 flex items-center gap-1.5">
          <span class="font-extrabold text-xs sensitive-val">${formatRupiah(p.nominal)}</span>
          ${p.status !== 'Lunas' ? `<button onclick="lunasiPiutang('${p.id}')" class="px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg">Lunas</button>` : ''}
          <button onclick="hapusPiutang('${p.id}')" class="text-slate-400 hover:text-rose-500 p-1"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
        </div>
      </div>`).join('')
    : `<p class="text-[11px] text-slate-400 text-center py-2">Tidak ada catatan split bill / piutang.</p>`;
}

// --- GOALS ---
function openGoalModal() { document.getElementById('modal-goal').classList.remove('hidden'); }
function simpanGoal(e) {
  e.preventDefault();
  dataGoals.push({
    id: 'gol-' + Date.now(),
    nama_goal: document.getElementById('goalNama').value.trim(),
    target: Number(document.getElementById('goalTarget').value),
    terkumpul: Number(document.getElementById('goalAwal').value) || 0,
    isSynced: false
  });
  e.target.reset();
  closeModal('modal-goal');
  saveLocal();
  showToast('Target celengan dibuat!');
}
function tambahDanaGoal(id) {
  const nom = Number(prompt('Masukkan nominal tabungan (Rp):'));
  if (!nom || nom <= 0) return;
  const g = dataGoals.find(item => item.id === id);
  if (g) {
    g.terkumpul += nom; g.isSynced = false;
    if (g.terkumpul >= g.target && typeof confetti === 'function') {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      showToast('🎉 Selamat! Target celengan tercapai!');
    } else showToast(`+${formatRupiah(nom)} masuk ke ${g.nama_goal}!`);
    saveLocal();
  }
}
function hapusGoal(id) {
  if (!confirm('Hapus target celengan ini?')) return;
  dataGoals = dataGoals.filter(g => g.id !== id);
  deletedGoals.push(id);
  saveLocal();
}

function renderGoals() {
  document.getElementById('goalsList').innerHTML = dataGoals.length
    ? dataGoals.map(g => {
      const pct = Math.min(100, Math.round((g.terkumpul / g.target) * 100));
      return `
        <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5">
          <div class="flex justify-between items-center text-xs">
            <span class="font-bold">${g.nama_goal}</span>
            <div class="flex items-center gap-2">
              <button onclick="tambahDanaGoal('${g.id}')" class="px-2 py-0.5 bg-amber-500 text-slate-950 font-extrabold rounded-md text-[10px]">+ Nabung</button>
              <button onclick="hapusGoal('${g.id}')" class="text-slate-400 hover:text-rose-500"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
            </div>
          </div>
          <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full bg-amber-500 rounded-full transition-all duration-500" style="width:${pct}%"></div>
          </div>
          <div class="flex justify-between text-[10px] text-slate-500">
            <span class="sensitive-val">${formatRupiah(g.terkumpul)} / ${formatRupiah(g.target)}</span>
            <span class="font-bold text-amber-600 dark:text-amber-400">${pct}%</span>
          </div>
        </div>`;
    }).join('')
    : `<p class="text-[11px] text-slate-400 text-center py-2">Belum ada target tabungan.</p>`;
}

function renderCharts(bulanStr) {
  const filteredExp = dataKeuangan.filter(k => k.jenis === 'Pengeluaran' && k.kategori !== 'Tabungan' && k.tanggal.startsWith(bulanStr));
  const catTotals = {};
  filteredExp.forEach(k => { catTotals[k.kategori] = (catTotals[k.kategori] || 0) + k.nominal; });
  const labels = Object.keys(catTotals), values = Object.values(catTotals);
  const noDataEl = document.getElementById('noChartData');

  if (expenseChartInstance) expenseChartInstance.destroy();
  if (labels.length === 0) noDataEl.classList.remove('hidden');
  else {
    noDataEl.classList.add('hidden');
    expenseChartInstance = new Chart(document.getElementById('expenseChart').getContext('2d'), {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#64748b'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 }, color: '#94a3b8' } } } }
    });
  }

  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1).toISOString().slice(0, 7));
  }
  const masukSeries = months.map(m => dataKeuangan.filter(k => k.tanggal.startsWith(m) && k.jenis === 'Pemasukan').reduce((s, k) => s + k.nominal, 0));
  const keluarSeries = months.map(m => dataKeuangan.filter(k => k.tanggal.startsWith(m) && k.jenis === 'Pengeluaran' && k.kategori !== 'Tabungan').reduce((s, k) => s + k.nominal, 0));

  if (trendChartInstance) trendChartInstance.destroy();
  trendChartInstance = new Chart(document.getElementById('trendChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: months.map(m => m.slice(5)),
      datasets: [
        { label: 'Masuk', data: masukSeries, backgroundColor: '#10b981', borderRadius: 4 },
        { label: 'Keluar', data: keluarSeries, backgroundColor: '#f43f5e', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { boxWidth: 10, font: { size: 10 }, color: '#94a3b8' } } },
      scales: { x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } }, y: { display: false } }
    }
  });
}

function renderKeuanganList() {
  const bulanStr = document.getElementById('filterBulan').value;
  const query = document.getElementById('searchUang').value.toLowerCase();
  const filtered = dataKeuangan.filter(k =>
    (!bulanStr || k.tanggal.startsWith(bulanStr)) &&
    (k.kategori.toLowerCase().includes(query) || k.catatan.toLowerCase().includes(query) || (k.dompet || '').toLowerCase().includes(query))
  );

  document.getElementById('keuanganList').innerHTML = filtered.length
    ? filtered.map(k => {
      const isTransfer = k.jenis === 'Transfer';
      const badgeText = isTransfer ? `${k.dompet} → ${k.dompet_tujuan}` : (k.dompet || 'Tunai');
      const colorClass = isTransfer ? 'text-sky-500' : (k.kategori === 'Tabungan' ? 'text-amber-500' : (k.jenis === 'Pemasukan' ? 'text-emerald-500' : 'text-rose-500'));
      const prefix = isTransfer ? '⇄ ' : (k.jenis === 'Pemasukan' ? '+' : '-');
      return `
        <div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-extrabold truncate">${k.kategori}</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">${badgeText}</span>
              ${k.isSynced ? '<i data-lucide="cloud-check" class="w-3.5 h-3.5 text-emerald-500 shrink-0"></i>' : '<i data-lucide="clock" class="w-3.5 h-3.5 text-amber-500 shrink-0"></i>'}
            </div>
            <p class="text-[11px] text-slate-500 truncate mt-0.5">${k.catatan} • ${k.tanggal}</p>
          </div>
          <div class="text-right shrink-0">
            <span class="font-extrabold text-xs block sensitive-val ${colorClass}">${prefix}${formatRupiah(k.nominal)}</span>
            <div class="flex justify-end gap-2 mt-1 text-slate-400">
              <button onclick="openUangModal('${k.id}')" class="hover:text-indigo-500"><i data-lucide="pencil" class="w-3 h-3"></i></button>
              <button onclick="hapusKeuangan('${k.id}')" class="hover:text-rose-500"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
            </div>
          </div>
        </div>`;
    }).join('')
    : `<div class="text-center py-8 text-xs text-slate-400">Tidak ada transaksi pada periode ini.</div>`;
  applyPrivacyState();
  lucide.createIcons();
}