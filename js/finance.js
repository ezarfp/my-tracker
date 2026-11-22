let chartBulananInstance = null;
let chartKategoriInstance = null;

function formatRupiah(angka) {
  return 'Rp ' + Number(angka || 0).toLocaleString('id-ID');
}

function toggleHideSaldo() {
  hideSaldo = !hideSaldo;
  localStorage.setItem('ezar_hide_saldo', hideSaldo);
  renderKeuangan();
}

function setFilterKeu(tipe) {
  filterTipeKeu = tipe;
  document.querySelectorAll('.filter-keu-btn').forEach(btn => {
    const active = btn.dataset.filter === tipe;
    btn.className = active
      ? 'filter-keu-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm'
      : 'filter-keu-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
  });
  renderKeuangan();
}

function setFilterAkun(akun) {
  filterAkunKeu = akun;
  renderKeuangan();
}

function openTransaksiModal(jenis = 'Pengeluaran') {
  document.getElementById('formTransaksi').reset();
  document.getElementById('txEditId').value = '';
  document.getElementById('txTanggal').value = getTodayDateStr();
  setJenisTransaksi(jenis);
  document.getElementById('modal-transaksi').classList.remove('hidden');
}

function setJenisTransaksi(jenis) {
  document.getElementById('txJenis').value = jenis;
  const tabs = ['Pengeluaran', 'Pemasukan', 'Transfer'];
  tabs.forEach(t => {
    const btn = document.getElementById('tabTx' + t);
    if (!btn) return;
    if (t === jenis) {
      const color = t === 'Pengeluaran' ? 'border-rose-500 text-rose-500 bg-rose-500/10'
        : t === 'Pemasukan' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
        : 'border-indigo-500 text-indigo-500 bg-indigo-500/10';
      btn.className = `flex-1 py-2.5 rounded-xl border-2 text-xs font-extrabold transition ${color}`;
    } else {
      btn.className = 'flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 transition';
    }
  });

  const wrapNormal = document.getElementById('wrapAkunNormal');
  const wrapTransfer = document.getElementById('wrapAkunTransfer');
  const inputNominal = document.getElementById('txNominal');
  const inputCatatan = document.getElementById('txCatatan');

  if (jenis === 'Transfer') {
    wrapNormal.classList.add('hidden');
    wrapTransfer.classList.remove('hidden');
    inputNominal.placeholder = 'Contoh: 50000 (tanpa titik)';
    inputCatatan.placeholder = 'Contoh: Tarik tunai ATM / Setor ke Bank';
  } else if (jenis === 'Pemasukan') {
    wrapNormal.classList.remove('hidden');
    wrapTransfer.classList.add('hidden');
    document.getElementById('txKategori').value = 'Uang Saku / Pemasukan';
    inputNominal.placeholder = 'Contoh: 250000 (tanpa titik)';
    inputCatatan.placeholder = 'Contoh: Uang saku bulanan / Fee project';
  } else {
    wrapNormal.classList.remove('hidden');
    wrapTransfer.classList.add('hidden');
    document.getElementById('txKategori').value = 'Makan & Minum';
    inputNominal.placeholder = 'Contoh: 15000 (tanpa titik)';
    inputCatatan.placeholder = 'Contoh: Makan siang ayam geprek / Bensin';
  }
}

function simpanTransaksi(e) {
  e.preventDefault();
  const editId = document.getElementById('txEditId').value;
  const jenis = document.getElementById('txJenis').value;
  const nominal = Number(document.getElementById('txNominal').value);
  const tanggal = normalizeDateStr(document.getElementById('txTanggal').value || getTodayDateStr());
  const catatan = document.getElementById('txCatatan').value.trim();

  if (!nominal || nominal <= 0) {
    showToast('Masukkan nominal yang valid!');
    return;
  }

  if (editId) {
    const idx = dataKeuangan.findIndex(k => k.id === editId);
    if (idx !== -1) {
      dataKeuangan[idx] = {
        ...dataKeuangan[idx],
        jenis,
        nominal,
        tanggal,
        akun: document.getElementById('txAkun').value,
        kategori: document.getElementById('txKategori').value,
        catatan,
        updatedAt: new Date().toISOString(),
        isSynced: false
      };
    }
    showToast('Transaksi diperbarui!');
  } else if (jenis === 'Transfer') {
    const dari = document.getElementById('txDariAkun').value;
    const ke = document.getElementById('txKeAkun').value;
    if (dari === ke) {
      showToast('Akun asal dan tujuan tidak boleh sama!');
      return;
    }
    const baseId = Date.now();
    const note = catatan || `Transfer ${dari} ke ${ke}`;
    dataKeuangan.unshift(
      { id: `tx-${baseId}-out`, tanggal, jenis: 'Pengeluaran', kategori: 'Transfer Keluar', akun: dari, nominal, catatan: note, updatedAt: new Date().toISOString(), isSynced: false },
      { id: `tx-${baseId}-in`, tanggal, jenis: 'Pemasukan', kategori: 'Transfer Masuk', akun: ke, nominal, catatan: note, updatedAt: new Date().toISOString(), isSynced: false }
    );
    showToast(`Transfer ${formatRupiah(nominal)} (${dari} → ${ke}) berhasil!`);
  } else {
    dataKeuangan.unshift({
      id: 'tx-' + Date.now(),
      tanggal,
      jenis,
      kategori: document.getElementById('txKategori').value,
      akun: document.getElementById('txAkun').value,
      nominal,
      catatan,
      updatedAt: new Date().toISOString(),
      isSynced: false
    });
    showToast(`${jenis} ${formatRupiah(nominal)} dicatat!`);
  }

  closeModal('modal-transaksi');
  saveLocal();
}

function editTransaksi(id) {
  const tx = dataKeuangan.find(k => k.id === id);
  if (!tx) return;
  document.getElementById('txEditId').value = tx.id;
  setJenisTransaksi(tx.jenis);
  document.getElementById('txNominal').value = tx.nominal;
  document.getElementById('txTanggal').value = normalizeDateStr(tx.tanggal);
  document.getElementById('txAkun').value = tx.akun;
  document.getElementById('txKategori').value = tx.kategori;
  document.getElementById('txCatatan').value = tx.catatan || '';
  document.getElementById('modal-transaksi').classList.remove('hidden');
}

function hapusTransaksi(id) {
  if (!confirm('Hapus transaksi ini?')) return;
  dataKeuangan = dataKeuangan.filter(k => k.id !== id);
  deletedKeuangan.push(id);
  saveLocal();
  showToast('Transaksi dihapus.');
}

function jalankanQuickCommand(e) {
  e.preventDefault();
  const input = document.getElementById('quickCmdInput');
  const raw = input.value.trim();
  if (!raw) return;

  const lower = raw.toLowerCase();
  const numMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta)?/);
  if (!numMatch) {
    showToast('Format: "makan 15rb tunai" atau "uang saku 100rb bank"');
    return;
  }

  let nominal = parseFloat(numMatch[1].replace(',', '.'));
  const unit = numMatch[2] || '';
  if (unit === 'rb' || unit === 'ribu' || unit === 'k') nominal *= 1000;
  else if (unit === 'jt' || unit === 'juta') nominal *= 1000000;
  nominal = Math.round(nominal);

  const isIncome = /(masuk|gaji|saku|dapat|bonus|transfer masuk|fee)/.test(lower);
  const jenis = isIncome ? 'Pemasukan' : 'Pengeluaran';

  let akun = 'Tunai';
  if (/(bank|bca|bni|bri|mandiri|qris|tf|rekening)/.test(lower)) akun = 'Bank';
  else if (/(ewallet|e-wallet|dana|ovo|gopay|shopeepay|spay)/.test(lower)) akun = 'E-Wallet';

  let kategori = isIncome ? 'Uang Saku / Pemasukan' : 'Makan & Minum';
  if (!isIncome) {
    if (/(bensin|pertalite|pertamax|parkir|gojek|grab|ojek|kereta|bus|transport)/.test(lower)) kategori = 'Transport / Bensin';
    else if (/(print|fotokopi|buku|kuliah|kuota|internet|pulsa)/.test(lower)) kategori = 'Kuliah & Akademik';
    else if (/(kopi|jajan|batagor|rokok|nonton|game|hiburan)/.test(lower)) kategori = 'Jajan / Hiburan';
    else if (/(nabung|tabungan)/.test(lower)) kategori = 'Tabungan';
  }

  const cleanNote = raw.replace(numMatch[0], '').replace(/\b(tunai|cash|bank|ewallet|e-wallet|dana|ovo|gopay)\b/gi, '').trim() || raw;

  dataKeuangan.unshift({
    id: 'tx-' + Date.now(),
    tanggal: getTodayDateStr(),
    jenis,
    kategori,
    akun,
    nominal,
    catatan: cleanNote.charAt(0).toUpperCase() + cleanNote.slice(1),
    updatedAt: new Date().toISOString(),
    isSynced: false
  });

  input.value = '';
  saveLocal();
  showToast(`⚡ ${jenis}: ${formatRupiah(nominal)} (${akun})`);
}

// ==========================================
// GOAL TABUNGAN & PIUTANG / SPLIT BILL
// ==========================================
function openGoalModal() {
  document.getElementById('goalNamaInput').value = namaTabungan;
  document.getElementById('goalTargetInput').value = targetTabungan;
  document.getElementById('modal-goal').classList.remove('hidden');
}

function simpanGoal(e) {
  e.preventDefault();
  namaTabungan = document.getElementById('goalNamaInput').value.trim() || 'Tabungan Utama';
  targetTabungan = Number(document.getElementById('goalTargetInput').value) || 1000000;
  localStorage.setItem('ezar_goal_nama', namaTabungan);
  localStorage.setItem('ezar_goal_target', targetTabungan);
  closeModal('modal-goal');
  renderKeuangan();
  showToast('Target tabungan diperbarui!');
}

function simpanBudgetBulanan(e) {
  e.preventDefault();
  budgetBulanan = Number(document.getElementById('inputBudgetBulanan').value) || 1000000;
  localStorage.setItem('ezar_budget_bulanan', budgetBulanan);
  renderKeuangan();
  showToast('Target budget bulanan disimpan!');
}

function openPiutangModal() {
  document.getElementById('modal-piutang').classList.remove('hidden');
}

function simpanPiutang(e) {
  e.preventDefault();
  dataPiutang.unshift({
    id: 'ptg-' + Date.now(),
    nama: document.getElementById('ptgNama').value.trim(),
    keterangan: document.getElementById('ptgKet').value.trim() || 'Patungan / Talangan',
    nominal: Number(document.getElementById('ptgNominal').value) || 0,
    tipe: document.getElementById('ptgTipe').value,
    status: 'Belum Lunas',
    tanggal: getTodayDateStr(),
    isSynced: false
  });
  e.target.reset();
  closeModal('modal-piutang');
  saveLocal();
  showToast('Catatan Split Bill / Piutang disimpan!');
}

function lunasiPiutang(id) {
  const item = dataPiutang.find(p => p.id === id);
  if (!item) return;
  item.status = 'Lunas';
  item.isSynced = false;
  saveLocal();
  showToast(`Catatan dengan ${item.nama} ditandai Lunas!`);
}

function hapusPiutang(id) {
  if (!confirm('Hapus catatan piutang/hutang ini?')) return;
  dataPiutang = dataPiutang.filter(p => p.id !== id);
  deletedPiutang.push(id);
  saveLocal();
}

// ==========================================
// GRAFIK ANALITIK KEUANGAN (CHART.JS)
// ==========================================
function renderChartsKeuangan() {
  if (typeof Chart === 'undefined') return;
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#94a3b8' : '#64748b';

  // 1. Grafik Arus Kas Bulanan (6 Bulan Terakhir)
  const monthlyMap = {};
  dataKeuangan.forEach(tx => {
    if (tx.kategori === 'Transfer Keluar' || tx.kategori === 'Transfer Masuk') return;
    const ym = normalizeDateStr(tx.tanggal).slice(0, 7);
    if (!monthlyMap[ym]) monthlyMap[ym] = { in: 0, out: 0 };
    if (tx.jenis === 'Pemasukan') monthlyMap[ym].in += Number(tx.nominal) || 0;
    else monthlyMap[ym].out += Number(tx.nominal) || 0;
  });

  const sortedMonths = Object.keys(monthlyMap).sort().slice(-6);
  const ctxBulanan = document.getElementById('chartBulanan');
  if (ctxBulanan) {
    if (chartBulananInstance) chartBulananInstance.destroy();
    chartBulananInstance = new Chart(ctxBulanan, {
      type: 'bar',
      data: {
        labels: sortedMonths.length ? sortedMonths : [getTodayDateStr().slice(0, 7)],
        datasets: [
          { label: 'Pemasukan', data: sortedMonths.map(m => monthlyMap[m].in), backgroundColor: '#10b981', borderRadius: 6 },
          { label: 'Pengeluaran', data: sortedMonths.map(m => monthlyMap[m].out), backgroundColor: '#f43f5e', borderRadius: 6 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor, font: { size: 10, weight: 'bold' } } } },
        scales: {
          x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } },
          y: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: isDark ? '#1e293b' : '#f1f5f9' } }
        }
      }
    });
  }

  // 2. Grafik Donat Pengeluaran per Kategori
  const katMap = {};
  dataKeuangan.forEach(tx => {
    if (tx.jenis === 'Pengeluaran' && tx.kategori !== 'Transfer Keluar') {
      katMap[tx.kategori] = (katMap[tx.kategori] || 0) + (Number(tx.nominal) || 0);
    }
  });

  const katLabels = Object.keys(katMap);
  const ctxKategori = document.getElementById('chartKategori');
  if (ctxKategori) {
    if (chartKategoriInstance) chartKategoriInstance.destroy();
    chartKategoriInstance = new Chart(ctxKategori, {
      type: 'doughnut',
      data: {
        labels: katLabels.length ? katLabels : ['Belum ada pengeluaran'],
        datasets: [{
          data: katLabels.length ? katLabels.map(k => katMap[k]) : [1],
          backgroundColor: ['#4f46e5', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: { legend: { position: 'right', labels: { color: textColor, font: { size: 10, weight: 'bold' }, boxWidth: 10 } } }
      }
    });
  }
}

// ==========================================
// MASTER RENDER KEUANGAN
// ==========================================
function renderKeuangan() {
  let saldoTunai = 0, saldoBank = 0, saldoEwallet = 0, brankas = 0;
  const bulanIni = getTodayDateStr().slice(0, 7);
  let keluarBulanIni = 0;

  dataKeuangan.forEach(tx => {
    const nom = Number(tx.nominal) || 0;
    const isTabungan = tx.kategori === 'Tabungan';
    if (isTabungan) {
      brankas += tx.jenis === 'Pemasukan' ? nom : -nom;
    } else if (tx.jenis === 'Pemasukan') {
      if (tx.akun === 'Tunai') saldoTunai += nom;
      else if (tx.akun === 'Bank') saldoBank += nom;
      else saldoEwallet += nom;
    } else {
      if (tx.akun === 'Tunai') saldoTunai -= nom;
      else if (tx.akun === 'Bank') saldoBank -= nom;
      else saldoEwallet -= nom;

      if (normalizeDateStr(tx.tanggal).startsWith(bulanIni) && tx.kategori !== 'Transfer Keluar') {
        keluarBulanIni += nom;
      }
    }
  });

  const totalAktif = saldoTunai + saldoBank + saldoEwallet;
  const mask = (val) => hideSaldo ? 'Rp ••••••' : formatRupiah(val);

  document.getElementById('totalSaldoAktif').textContent = mask(totalAktif);
  document.getElementById('saldoBrankas').textContent = mask(brankas);
  document.getElementById('saldoTunai').textContent = mask(saldoTunai);
  document.getElementById('saldoBank').textContent = mask(saldoBank);
  document.getElementById('saldoEwallet').textContent = mask(saldoEwallet);

  // Budget Progress Home
  const pctBudget = Math.min(100, Math.round((keluarBulanIni / (budgetBulanan || 1)) * 100));
  document.getElementById('budgetSummaryText').textContent = `${formatRupiah(keluarBulanIni)} / ${formatRupiah(budgetBulanan)}`;
  const barBudget = document.getElementById('budgetProgressBar');
  if (barBudget) {
    barBudget.style.width = pctBudget + '%';
    barBudget.className = `h-2.5 rounded-full transition-all duration-500 ${pctBudget >= 85 ? 'bg-rose-500' : pctBudget >= 60 ? 'bg-amber-500' : 'bg-indigo-600'}`;
  }

  // Goal Progress
  const goalPct = Math.min(100, Math.round((brankas / (targetTabungan || 1)) * 100));
  const goalTitle = document.getElementById('goalTitleDisplay');
  if (goalTitle) {
    goalTitle.textContent = namaTabungan;
    document.getElementById('goalNominalDisplay').textContent = `${formatRupiah(brankas)} / ${formatRupiah(targetTabungan)} (${goalPct}%)`;
    document.getElementById('goalProgressBar').style.width = goalPct + '%';
  }

  // Split Bill / Piutang List
  const ptgContainer = document.getElementById('piutangList');
  if (ptgContainer) {
    ptgContainer.innerHTML = dataPiutang.length
      ? dataPiutang.map(p => {
        const isPiutang = p.tipe === 'Piutang';
        const lunas = p.status === 'Lunas';
        return `
          <div class="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 ${lunas ? 'opacity-60' : ''}">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${isPiutang ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-500'}">${isPiutang ? 'Piutang (Teman Hutang)' : 'Hutang Saya'}</span>
                <span class="text-[10px] text-slate-400">${formatDisplayDate(p.tanggal)}</span>
              </div>
              <p class="font-extrabold text-xs mt-1 truncate">${p.nama} • ${formatRupiah(p.nominal)}</p>
              <p class="text-[10px] text-slate-400 truncate">${p.keterangan}</p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              ${!lunas ? `<button onclick="lunasiPiutang('${p.id}')" class="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-xl">Lunasi</button>` : `<span class="text-[10px] font-bold text-emerald-500 px-2">✓ Lunas</span>`}
              <button onclick="hapusPiutang('${p.id}')" class="text-slate-400 hover:text-rose-500 p-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </div>
          </div>`;
      }).join('')
      : `<div class="text-center py-3 text-xs text-slate-400">Belum ada catatan patungan / hutang-piutang.</div>`;
  }

  // Transaction History List
  const filtered = dataKeuangan.filter(tx => {
    const matchTipe = filterTipeKeu === 'ALL' || tx.jenis === filterTipeKeu;
    const matchAkun = filterAkunKeu === 'ALL' || tx.akun === filterAkunKeu;
    return matchTipe && matchAkun;
  });

  const txContainer = document.getElementById('transaksiList');
  if (txContainer) {
    txContainer.innerHTML = filtered.length
      ? filtered.map(tx => {
        const isInc = tx.jenis === 'Pemasukan';
        const isTab = tx.kategori === 'Tabungan';
        const colorClass = isTab ? 'text-amber-500' : isInc ? 'text-emerald-500' : 'text-rose-500';
        const sign = isInc ? '+' : '-';
        const cleanDate = formatDisplayDate(tx.tanggal);
        return `
          <div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-2">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                <h4 class="font-extrabold text-xs truncate">${tx.kategori}</h4>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">${tx.akun}</span>
                <i data-lucide="${tx.isSynced ? 'cloud-check' : 'cloud-off'}" class="w-3.5 h-3.5 ${tx.isSynced ? 'text-emerald-500' : 'text-amber-500'}"></i>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5 truncate">${tx.catatan || '-'} • ${cleanDate}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="font-extrabold text-xs ${colorClass}">${sign}${formatRupiah(tx.nominal)}</p>
              <div class="flex items-center justify-end gap-1.5 mt-1">
                <button onclick="editTransaksi('${tx.id}')" class="text-slate-400 hover:text-indigo-500"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button>
                <button onclick="hapusTransaksi('${tx.id}')" class="text-slate-400 hover:text-rose-500"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
              </div>
            </div>
          </div>`;
      }).join('')
      : `<div class="text-center py-6 text-xs text-slate-400">Belum ada riwayat transaksi pada filter ini.</div>`;
  }

  renderChartsKeuangan();
}