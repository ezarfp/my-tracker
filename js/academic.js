function setHariJadwal(hari) {
  filterHariJadwal = hari;
  document.querySelectorAll('.hari-btn').forEach(btn => {
    const active = btn.dataset.hari === hari;
    btn.className = active
      ? 'hari-btn px-3.5 py-2 rounded-2xl text-xs font-extrabold bg-indigo-600 text-white shadow-sm shrink-0 transition'
      : 'hari-btn px-3.5 py-2 rounded-2xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shrink-0 transition';
  });
  renderJadwal();
}

function openJadwalModal() {
  document.getElementById('modal-jadwal').classList.remove('hidden');
}

function simpanJadwal(e) {
  e.preventDefault();
  dataJadwal.push({
    id: 'jdw-' + Date.now(),
    hari: document.getElementById('jdwHari').value,
    kode: document.getElementById('jdwKode').value.trim().toUpperCase(),
    matkul: document.getElementById('jdwMatkul').value.trim().toUpperCase(),
    dosen: document.getElementById('jdwDosen').value.trim().toUpperCase(),
    ruangan: document.getElementById('jdwRuangan').value.trim(),
    jam_mulai: normalizeTimeStr(document.getElementById('jdwMulai').value),
    jam_selesai: normalizeTimeStr(document.getElementById('jdwSelesai').value),
    hadir: 0,
    total_pertemuan: Number(document.getElementById('jdwTotal').value) || 16,
    isSynced: false
  });
  e.target.reset();
  closeModal('modal-jadwal');
  saveLocal();
  showToast('Jadwal kuliah baru ditambahkan!');
}

function tambahPresensi(id) {
  const j = dataJadwal.find(item => item.id === id);
  if (!j) return;
  const maxP = Number(j.total_pertemuan) || 16;
  if (j.hadir >= maxP) {
    showToast(`Pertemuan ${j.matkul} sudah maksimal (${maxP}/${maxP})!`);
    return;
  }
  j.hadir = Number(j.hadir) + 1;
  j.isSynced = false;
  saveLocal();
  const milestone = j.hadir === 8 ? ' (Pekan UTS!)' : j.hadir === maxP ? ' (Pekan UAS!)' : '';
  showToast(`Presensi ${j.matkul}: ${j.hadir}/${maxP}${milestone}`);
}

function resetPresensi(id) {
  const j = dataJadwal.find(item => item.id === id);
  if (!j || !confirm(`Reset hitungan pertemuan ${j.matkul} ke 0?`)) return;
  j.hadir = 0;
  j.isSynced = false;
  saveLocal();
}

function hapusJadwal(id) {
  if (!confirm('Hapus mata kuliah ini dari jadwal?')) return;
  dataJadwal = dataJadwal.filter(j => j.id !== id);
  deletedJadwal.push(id);
  saveLocal();
}

function renderJadwal() {
  const { label: tzLabel } = getActiveTimezoneConfig();
  const hariList = dataJadwal.filter(j => j.hari === filterHariJadwal);
  const container = document.getElementById('jadwalList');
  if (container) {
    container.innerHTML = hariList.length
      ? hariList.map(j => {
        const totalP = Number(j.total_pertemuan) || 16;
        const pct = Math.min(100, Math.round((j.hadir / totalP) * 100));
        const jamMulai = normalizeTimeStr(j.jam_mulai);
        const jamSelesai = normalizeTimeStr(j.jam_selesai);
        return `
          <div class="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wide">${j.kode} • Dosen: ${j.dosen}</p>
                <h4 class="font-extrabold text-sm mt-0.5 leading-snug">${j.matkul}</h4>
              </div>
              <button onclick="hapusJadwal('${j.id}')" class="text-slate-400 hover:text-rose-500 p-1 shrink-0"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
            <div class="flex items-center gap-2.5 mt-3">
              <span class="px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-extrabold shrink-0 flex items-center gap-1">
                <i data-lucide="map-pin" class="w-3.5 h-3.5"></i> ${j.ruangan}
              </span>
              <span class="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i> ${jamMulai} – ${jamSelesai} ${tzLabel}
              </span>
            </div>
            <div class="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div class="flex-1 min-w-0">
                <div class="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                  <span>Presensi: ${j.hadir} / ${totalP} (P.8 UTS • P.${totalP} UAS)</span>
                  <span class="text-indigo-600 font-extrabold">${pct}%</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-2 rounded-full transition-all" style="width:${pct}%"></div>
                </div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button onclick="tambahPresensi('${j.id}')" class="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-[11px] font-extrabold active:scale-95 transition">+ Hadir</button>
                <button onclick="resetPresensi('${j.id}')" class="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-bold">Reset</button>
              </div>
            </div>
          </div>`;
      }).join('')
      : `<div class="text-center py-8 text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">Tidak ada jadwal kuliah pada hari ${filterHariJadwal}.</div>`;
  }

  // Home Today Schedule Preview
  const namaHariIni = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()];
  const homeTitle = document.getElementById('homeJadwalTitle');
  if (homeTitle) homeTitle.textContent = `Jadwal Kuliah (${namaHariIni})`;
  const todayCourses = dataJadwal.filter(j => j.hari === namaHariIni);
  const homeList = document.getElementById('homeJadwalList');
  if (homeList) {
    homeList.innerHTML = todayCourses.length
      ? todayCourses.map(j => `
        <div class="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
          <div class="min-w-0">
            <h4 class="font-extrabold text-xs truncate">${j.matkul}</h4>
            <p class="text-[11px] text-slate-400">${normalizeTimeStr(j.jam_mulai)} – ${normalizeTimeStr(j.jam_selesai)} ${tzLabel} • Dosen ${j.dosen}</p>
          </div>
          <span class="px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-extrabold shrink-0">${j.ruangan}</span>
        </div>`).join('')
      : `<div class="text-center py-4 text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">Tidak ada jadwal perkuliahan hari ${namaHariIni}.</div>`;
  }
}

// ==========================================
// TUGAS & EXAM COUNTDOWN
// ==========================================
function openTugasModal() { document.getElementById('modal-tugas').classList.remove('hidden'); }

function simpanTugas(e) {
  e.preventDefault();
  dataTugas.unshift({
    id: 'tgs-' + Date.now(),
    matkul: document.getElementById('tgsMatkul').value.trim(),
    judul: document.getElementById('tgsJudul').value.trim(),
    deadline: normalizeDateStr(document.getElementById('tgsDeadline').value || getTodayDateStr()),
    prioritas: document.getElementById('tgsPrioritas').value,
    status: 'Belum',
    updatedAt: new Date().toISOString(),
    isSynced: false
  });
  e.target.reset();
  closeModal('modal-tugas');
  saveLocal();
  showToast('Tugas baru ditambahkan!');
}

function toggleTugas(id) {
  const t = dataTugas.find(item => item.id === id);
  if (!t) return;
  t.status = t.status === 'Selesai' ? 'Belum' : 'Selesai';
  t.updatedAt = new Date().toISOString();
  t.isSynced = false;
  saveLocal();
}

function hapusTugas(id) {
  if (!confirm('Hapus tugas ini?')) return;
  dataTugas = dataTugas.filter(t => t.id !== id);
  deletedTugas.push(id);
  saveLocal();
}

function renderTugas() {
  const aktif = dataTugas.filter(t => t.status !== 'Selesai');
  const selesai = dataTugas.filter(t => t.status === 'Selesai');
  const badge = document.getElementById('badgeTugasAktif');
  if (badge) badge.textContent = `${aktif.length} Aktif`;

  const renderCard = (t) => {
    const done = t.status === 'Selesai';
    const prioColor = t.prioritas === 'Tinggi' ? 'bg-rose-500/15 text-rose-500' : t.prioritas === 'Sedang' ? 'bg-amber-500/15 text-amber-500' : 'bg-emerald-500/15 text-emerald-500';
    return `
      <div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-2.5 ${done ? 'opacity-60' : ''}">
        <button onclick="toggleTugas('${t.id}')" class="w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'}">
          ${done ? '<i data-lucide="check" class="w-3.5 h-3.5"></i>' : ''}
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${prioColor}">${t.prioritas}</span>
            <span class="text-[10px] font-bold text-indigo-500 truncate">${t.matkul}</span>
          </div>
          <h4 class="font-extrabold text-xs mt-1 ${done ? 'line-through' : ''}">${t.judul}</h4>
          <p class="text-[10px] text-slate-400">Deadline: ${formatDisplayDate(t.deadline)}</p>
        </div>
        <button onclick="hapusTugas('${t.id}')" class="text-slate-400 hover:text-rose-500 p-1 shrink-0"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
      </div>`;
  };

  const listEl = document.getElementById('tugasList');
  if (listEl) {
    listEl.innerHTML = [...aktif, ...selesai].length
      ? [...aktif, ...selesai].map(renderCard).join('')
      : `<div class="text-center py-8 text-xs text-slate-400">Tidak ada tugas saat ini.</div>`;
  }

  const homeTugas = document.getElementById('homeTugasList');
  if (homeTugas) {
    homeTugas.innerHTML = aktif.slice(0, 3).length
      ? aktif.slice(0, 3).map(renderCard).join('')
      : `<div class="text-center py-4 text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">Semua tugas aman terkendali!</div>`;
  }
}

function openUjianModal() { document.getElementById('modal-ujian').classList.remove('hidden'); }

function simpanUjian(e) {
  e.preventDefault();
  dataUjian.push({
    id: 'ujn-' + Date.now(),
    matkul: document.getElementById('ujnMatkul').value.trim(),
    jenis: document.getElementById('ujnJenis').value,
    tanggal: normalizeDateStr(document.getElementById('ujnTanggal').value),
    jam: normalizeTimeStr(document.getElementById('ujnJam').value || '08:00'),
    ruangan: document.getElementById('ujnRuangan').value.trim() || 'Ruang Ujian',
    isSynced: false
  });
  e.target.reset();
  closeModal('modal-ujian');
  saveLocal();
  showToast('Jadwal ujian ditambahkan!');
}

function hapusUjian(id) {
  if (!confirm('Hapus jadwal ujian ini?')) return;
  dataUjian = dataUjian.filter(u => u.id !== id);
  deletedUjian.push(id);
  saveLocal();
}

function renderUjian() {
  const { label: tzLabel } = getActiveTimezoneConfig();
  const today = new Date(getTodayDateStr());
  const container = document.getElementById('ujianList');
  if (!container) return;

  container.innerHTML = dataUjian.length
    ? dataUjian.map(u => {
      const cleanDate = normalizeDateStr(u.tanggal);
      const diff = Math.ceil((new Date(cleanDate) - today) / 86400000);
      const badge = diff < 0 ? 'Selesai' : diff === 0 ? 'HARI INI!' : `H-${diff}`;
      const badgeColor = diff <= 3 && diff >= 0 ? 'bg-rose-500 text-white' : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400';
      return `
        <div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-black px-2 py-0.5 rounded-full ${badgeColor}">${badge}</span>
              <span class="text-[10px] font-bold text-slate-400">${u.jenis} • ${u.ruangan}</span>
            </div>
            <h4 class="font-extrabold text-xs mt-1 truncate">${u.matkul}</h4>
            <p class="text-[10px] text-slate-400">${formatDisplayDate(cleanDate)} • Pukul ${normalizeTimeStr(u.jam)} ${tzLabel}</p>
          </div>
          <button onclick="hapusUjian('${u.id}')" class="text-slate-400 hover:text-rose-500 p-1 shrink-0"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>`;
    }).join('')
    : `<div class="text-center py-6 text-xs text-slate-400">Belum ada jadwal ujian yang dicatat.</div>`;
}

// ==========================================
// KALKULATOR IPK CUSTOM BOBOT & GRADE RESCUE
// ==========================================
function konversiIndeks(akhir) {
  if (akhir >= 80) return { huruf: 'A', mutu: 4.0 };
  if (akhir >= 70) return { huruf: 'AB', mutu: 3.5 };
  if (akhir >= 65) return { huruf: 'B', mutu: 3.0 };
  if (akhir >= 60) return { huruf: 'BC', mutu: 2.5 };
  if (akhir >= 50) return { huruf: 'C', mutu: 2.0 };
  if (akhir >= 40) return { huruf: 'D', mutu: 1.0 };
  return { huruf: 'E', mutu: 0.0 };
}

function updateNilai(id, field, val) {
  const n = dataNilai.find(item => item.id === id);
  if (!n) return;
  n[field] = Number(val) || 0;
  n.isSynced = false;
  saveLocal();
}

function tambahMatkulNilai(e) {
  e.preventDefault();
  const bt = Number(document.getElementById('nilBobotTugas').value) || 30;
  const bu = Number(document.getElementById('nilBobotUts').value) || 35;
  const ba = Number(document.getElementById('nilBobotUas').value) || 35;
  if (bt + bu + ba !== 100) {
    showToast(`Total bobot harus 100%! Saat ini: ${bt + bu + ba}%`);
    return;
  }
  dataNilai.push({
    id: 'nil-' + Date.now(),
    matkul: document.getElementById('nilMatkul').value.trim(),
    sks: Number(document.getElementById('nilSks').value) || 3,
    tugas: 0, uts: 0, uas: 0,
    bobot_tugas: bt, bobot_uts: bu, bobot_uas: ba,
    isSynced: false
  });
  e.target.reset();
  document.getElementById('nilBobotTugas').value = 30;
  document.getElementById('nilBobotUts').value = 35;
  document.getElementById('nilBobotUas').value = 35;
  closeModal('modal-nilai');
  saveLocal();
  showToast('Mata kuliah ditambahkan ke simulasi IPK!');
}

function hapusMatkulNilai(id) {
  if (!confirm('Hapus mata kuliah ini dari kalkulator IPK?')) return;
  dataNilai = dataNilai.filter(n => n.id !== id);
  deletedNilai.push(id);
  saveLocal();
}

function renderNilai() {
  let totalSks = 0, totalMutu = 0;
  const container = document.getElementById('nilaiList');
  if (!container) return;

  container.innerHTML = dataNilai.map(n => {
    const bt = Number(n.bobot_tugas) || 30;
    const bu = Number(n.bobot_uts) || 35;
    const ba = Number(n.bobot_uas) || 35;
    const totalBobot = bt + bu + ba;
    const bobotValid = totalBobot === 100;

    const akhir = ((Number(n.tugas) * bt) + (Number(n.uts) * bu) + (Number(n.uas) * ba)) / 100;
    const { huruf, mutu } = konversiIndeks(akhir);
    totalSks += Number(n.sks);
    totalMutu += mutu * Number(n.sks);

    // Grade Rescue Simulator: Butuh nilai UAS berapa untuk kunci A (80) & AB (70)?
    const kontribusiSaatIni = ((Number(n.tugas) * bt) + (Number(n.uts) * bu)) / 100;
    const butuhA = ba > 0 ? Math.ceil(((80 - kontribusiSaatIni) * 100) / ba) : 999;
    const butuhAB = ba > 0 ? Math.ceil(((70 - kontribusiSaatIni) * 100) / ba) : 999;
    const rescueText = butuhA <= 0 ? '🎯 Nilai A sudah terkunci!'
      : butuhA <= 100 ? `🎯 Kejar UAS ≥ ${butuhA} untuk A (≥ ${Math.max(0, butuhAB)} untuk AB)`
      : butuhAB <= 100 ? `⚡ Maksimal AB (Butuh UAS ≥ ${Math.max(0, butuhAB)})`
      : '⚠️ Fokus maksimalkan UAS & remedial';

    return `
      <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div class="flex items-start justify-between gap-2 mb-2.5">
          <div>
            <h4 class="font-extrabold text-xs">${n.matkul} <span class="text-slate-400 font-semibold">(${n.sks} SKS)</span></h4>
            <p class="text-[10px] font-bold mt-0.5 ${bobotValid ? 'text-emerald-500' : 'text-rose-500'}">
              Total Bobot: ${totalBobot}% ${bobotValid ? '✓' : '(Wajib 100%!)'}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-xl bg-indigo-600 text-white text-xs font-black">${akhir.toFixed(1)} (${huruf})</span>
            <button onclick="hapusMatkulNilai('${n.id}')" class="text-slate-400 hover:text-rose-500"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
          </div>
        </div>

        <!-- Baris Input Nilai -->
        <div class="grid grid-cols-3 gap-2 text-center mb-2">
          <div class="bg-slate-50 dark:bg-slate-800/70 p-2 rounded-xl">
            <label class="block text-[10px] font-bold text-slate-400 mb-1">Nilai Tugas</label>
            <input type="number" min="0" max="100" value="${n.tugas}" onchange="updateNilai('${n.id}', 'tugas', this.value)" class="w-full text-center font-extrabold text-xs bg-white dark:bg-slate-900 rounded-lg py-1 border border-slate-200 dark:border-slate-700">
          </div>
          <div class="bg-slate-50 dark:bg-slate-800/70 p-2 rounded-xl">
            <label class="block text-[10px] font-bold text-slate-400 mb-1">Nilai UTS</label>
            <input type="number" min="0" max="100" value="${n.uts}" onchange="updateNilai('${n.id}', 'uts', this.value)" class="w-full text-center font-extrabold text-xs bg-white dark:bg-slate-900 rounded-lg py-1 border border-slate-200 dark:border-slate-700">
          </div>
          <div class="bg-slate-50 dark:bg-slate-800/70 p-2 rounded-xl">
            <label class="block text-[10px] font-bold text-slate-400 mb-1">Nilai UAS</label>
            <input type="number" min="0" max="100" value="${n.uas}" onchange="updateNilai('${n.id}', 'uas', this.value)" class="w-full text-center font-extrabold text-xs bg-white dark:bg-slate-900 rounded-lg py-1 border border-slate-200 dark:border-slate-700">
          </div>
        </div>

        <!-- Baris Input Custom Bobot (%) -->
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="bg-indigo-500/5 p-1.5 rounded-xl border border-indigo-500/15">
            <label class="block text-[9px] font-bold text-indigo-500">Bobot Tugas %</label>
            <input type="number" min="0" max="100" value="${bt}" onchange="updateNilai('${n.id}', 'bobot_tugas', this.value)" class="w-full text-center font-bold text-[11px] bg-transparent mt-0.5">
          </div>
          <div class="bg-indigo-500/5 p-1.5 rounded-xl border border-indigo-500/15">
            <label class="block text-[9px] font-bold text-indigo-500">Bobot UTS %</label>
            <input type="number" min="0" max="100" value="${bu}" onchange="updateNilai('${n.id}', 'bobot_uts', this.value)" class="w-full text-center font-bold text-[11px] bg-transparent mt-0.5">
          </div>
          <div class="bg-indigo-500/5 p-1.5 rounded-xl border border-indigo-500/15">
            <label class="block text-[9px] font-bold text-indigo-500">Bobot UAS %</label>
            <input type="number" min="0" max="100" value="${ba}" onchange="updateNilai('${n.id}', 'bobot_uas', this.value)" class="w-full text-center font-bold text-[11px] bg-transparent mt-0.5">
          </div>
        </div>

        <p class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2.5 bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl">
          ${rescueText}
        </p>
      </div>`;
  }).join('');

  const ips = totalSks > 0 ? (totalMutu / totalSks).toFixed(2) : '0.00';
  document.getElementById('ipsDisplay').textContent = ips;
  document.getElementById('totalSksDisplay').textContent = `${totalSks} SKS`;
}