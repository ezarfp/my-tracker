const namaHariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const todayHariName = namaHariList[new Date().getDay()];
let selectedJadwalHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].includes(todayHariName) ? todayHariName : 'Senin';

function openJadwalModal(editId = null) {
  document.getElementById('editJadwalId').value = editId || '';
  if (editId) {
    const j = dataJadwal.find(item => item.id === editId);
    document.getElementById('modalJadwalTitle').textContent = 'Edit Jadwal Kuliah';
    document.getElementById('jadwalHari').value = j.hari;
    document.getElementById('jadwalKode').value = j.kode_matkul;
    document.getElementById('jadwalMatkul').value = j.nama_matkul;
    document.getElementById('jadwalMulai').value = j.jam_mulai;
    document.getElementById('jadwalSelesai').value = j.jam_selesai;
    document.getElementById('jadwalRuang').value = j.ruangan;
    document.getElementById('jadwalDosen').value = j.dosen;
  } else {
    document.getElementById('modalJadwalTitle').textContent = 'Tambah Jadwal Kuliah';
    document.getElementById('jadwalHari').value = selectedJadwalHari;
    document.getElementById('jadwalKode').value = '';
    document.getElementById('jadwalMatkul').value = '';
    document.getElementById('jadwalMulai').value = '07:30';
    document.getElementById('jadwalSelesai').value = '10:30';
    document.getElementById('jadwalRuang').value = '';
    document.getElementById('jadwalDosen').value = '';
  }
  document.getElementById('modal-jadwal').classList.remove('hidden');
}

function simpanJadwal(e) {
  e.preventDefault();
  const editId = document.getElementById('editJadwalId').value;
  const hari = document.getElementById('jadwalHari').value;
  const kode_matkul = document.getElementById('jadwalKode').value.trim().toUpperCase();
  const nama_matkul = document.getElementById('jadwalMatkul').value.trim().toUpperCase();
  const jam_mulai = document.getElementById('jadwalMulai').value;
  const jam_selesai = document.getElementById('jadwalSelesai').value;
  const ruangan = document.getElementById('jadwalRuang').value.trim().toUpperCase();
  const dosen = document.getElementById('jadwalDosen').value.trim().toUpperCase();

  if (editId) {
    const idx = dataJadwal.findIndex(j => j.id === editId);
    if (idx > -1) dataJadwal[idx] = { ...dataJadwal[idx], hari, kode_matkul, nama_matkul, jam_mulai, jam_selesai, ruangan, dosen, isSynced: false };
    showToast('Jadwal diperbarui!');
  } else {
    dataJadwal.push({ id: 'jdw-' + Date.now(), hari, kode_matkul, nama_matkul, jam_mulai, jam_selesai, ruangan, dosen, hadir: 0, isSynced: false });
    showToast('Jadwal kuliah ditambahkan!');
  }
  selectedJadwalHari = hari;
  closeModal('modal-jadwal');
  saveLocal();
}

function catatHadir(id) {
  const j = dataJadwal.find(item => item.id === id);
  if (j) {
    j.hadir = Math.min(TOTAL_PERTEMUAN, (j.hadir || 0) + 1);
    j.isSynced = false;
    saveLocal();
    const milestone = j.hadir === 8 ? ' (Minggu UTS!)' : (j.hadir === 16 ? ' (Minggu UAS!)' : '');
    showToast(`✅ Presensi ${j.nama_matkul}: ${j.hadir}/${TOTAL_PERTEMUAN}${milestone}`);
  }
}

function resetHadir(id) {
  const j = dataJadwal.find(item => item.id === id);
  if (j && confirm(`Reset hitungan kehadiran ${j.nama_matkul} ke 0?`)) {
    j.hadir = 0; j.isSynced = false; saveLocal();
  }
}

function hapusJadwal(id) {
  if (!confirm('Hapus jadwal mata kuliah ini?')) return;
  dataJadwal = dataJadwal.filter(j => j.id !== id);
  deletedJadwal.push(id);
  saveLocal();
  showToast('Jadwal dihapus');
}

function renderJadwal() {
  const todayClasses = dataJadwal.filter(j => j.hari === todayHariName).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
  document.getElementById('dashJadwalTitle').textContent = `Jadwal Kuliah (${todayHariName})`;
  document.getElementById('dashJadwalList').innerHTML = todayClasses.length
    ? todayClasses.map(j => `
      <div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border-l-4 border-l-indigo-600 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-2">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
            <span>${j.jam_mulai} - ${j.jam_selesai}</span>
            <span>•</span>
            <span class="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">📍 ${j.ruangan}</span>
            <span class="text-slate-400">(${j.dosen})</span>
          </div>
          <p class="font-extrabold text-xs mt-1 truncate">${j.nama_matkul}</p>
          <p class="text-[10px] text-slate-400">${j.kode_matkul} • Kehadiran: ${j.hadir || 0}/${TOTAL_PERTEMUAN}</p>
        </div>
        <button onclick="catatHadir('${j.id}')" class="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-[10px] font-extrabold active:scale-90 transition shrink-0">
          + Hadir
        </button>
      </div>`).join('')
    : `<div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">Tidak ada jadwal perkuliahan hari ${todayHariName}.</div>`;

  const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  document.getElementById('hariFilterPills').innerHTML = hariList.map(h => `
    <button onclick="selectedJadwalHari='${h}'; renderJadwal();" class="px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${selectedJadwalHari === h ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'}">
      ${h}
    </button>`).join('');

  const filteredJ = dataJadwal.filter(j => j.hari === selectedJadwalHari).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
  document.getElementById('jadwalMingguanList').innerHTML = filteredJ.length
    ? filteredJ.map(j => {
      const pctHadir = Math.min(100, Math.round(((j.hadir || 0) / TOTAL_PERTEMUAN) * 100));
      return `
        <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5">
          <div class="flex justify-between items-start gap-2">
            <div>
              <span class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">${j.kode_matkul} • Dosen: ${j.dosen}</span>
              <h4 class="font-extrabold text-sm mt-0.5">${j.nama_matkul}</h4>
              <div class="flex items-center gap-2 mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span class="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">📍 ${j.ruangan}</span>
                <span>🕒 ${j.jam_mulai} – ${j.jam_selesai}</span>
              </div>
            </div>
            <div class="flex gap-1.5 text-slate-400">
              <button onclick="openJadwalModal('${j.id}')" class="p-1 hover:text-indigo-500"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button>
              <button onclick="hapusJadwal('${j.id}')" class="p-1 hover:text-rose-500"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </div>
          </div>
          <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div class="flex-1">
              <div class="flex justify-between text-[10px] font-bold mb-1">
                <span class="text-slate-500">Presensi: ${j.hadir || 0} / ${TOTAL_PERTEMUAN} (P.8 UTS • P.16 UAS)</span>
                <span class="${pctHadir >= 75 ? 'text-emerald-500' : 'text-amber-500'}">${pctHadir}%</span>
              </div>
              <div class="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-500 rounded-full" style="width:${pctHadir}%"></div>
              </div>
            </div>
            <div class="flex gap-1">
              <button onclick="catatHadir('${j.id}')" class="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-lg active:scale-90">+ Hadir</button>
              <button onclick="resetHadir('${j.id}')" class="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold rounded-lg">Reset</button>
            </div>
          </div>
        </div>`;
    }).join('')
    : `<div class="text-center py-8 text-xs text-slate-400">Tidak ada jadwal kuliah pada hari ${selectedJadwalHari}.</div>`;
}

// --- KALKULATOR IPK ---
function getGradeInfo(skor) {
  if (skor > 80) return { huruf: 'A', bobot: 4.0, color: 'text-emerald-500 bg-emerald-500/10' };
  if (skor > 70) return { huruf: 'AB', bobot: 3.5, color: 'text-teal-500 bg-teal-500/10' };
  if (skor > 65) return { huruf: 'B', bobot: 3.0, color: 'text-indigo-500 bg-indigo-500/10' };
  if (skor > 60) return { huruf: 'BC', bobot: 2.5, color: 'text-sky-500 bg-sky-500/10' };
  if (skor > 50) return { huruf: 'C', bobot: 2.0, color: 'text-amber-500 bg-amber-500/10' };
  if (skor > 40) return { huruf: 'D', bobot: 1.0, color: 'text-orange-500 bg-orange-500/10' };
  return { huruf: 'E', bobot: 0.0, color: 'text-rose-500 bg-rose-500/10' };
}

function updateNilaiItem(id, field, val) {
  const n = dataNilai.find(item => item.id === id);
  if (n) { n[field] = Math.min(100, Math.max(0, Number(val) || 0)); n.isSynced = false; saveLocal(); }
}

function renderIpkCalculator() {
  let totalSks = 0, totalMutu = 0;
  const html = dataNilai.map(n => {
    const akhir = (n.tugas * 0.3) + (n.uts * 0.35) + (n.uas * 0.35);
    const grade = getGradeInfo(akhir);
    totalSks += n.sks; totalMutu += (grade.bobot * n.sks);
    return `
      <div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
        <div class="flex justify-between items-center">
          <div>
            <span class="text-[10px] font-bold text-slate-400">${n.kode_matkul} • ${n.sks} SKS</span>
            <h4 class="font-extrabold text-xs">${n.nama_matkul}</h4>
          </div>
          <span class="px-2.5 py-1 rounded-lg text-xs font-black ${grade.color}">${grade.huruf} (${akhir.toFixed(1)})</span>
        </div>
        <div class="grid grid-cols-3 gap-2 pt-1 text-[10px]">
          <div><label class="text-slate-400 block">Tugas (30%)</label><input type="number" value="${n.tugas}" onchange="updateNilaiItem('${n.id}', 'tugas', this.value)" class="w-full mt-0.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs" /></div>
          <div><label class="text-slate-400 block">UTS (35%)</label><input type="number" value="${n.uts}" onchange="updateNilaiItem('${n.id}', 'uts', this.value)" class="w-full mt-0.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs" /></div>
          <div><label class="text-slate-400 block">UAS (35%)</label><input type="number" value="${n.uas}" onchange="updateNilaiItem('${n.id}', 'uas', this.value)" class="w-full mt-0.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs" /></div>
        </div>
      </div>`;
  }).join('');

  document.getElementById('ipkScoreDisplay').textContent = totalSks > 0 ? (totalMutu / totalSks).toFixed(2) : '0.00';
  document.getElementById('totalSksDisplay').textContent = `${totalSks} SKS`;
  document.getElementById('ipkCoursesList').innerHTML = html;
}

// --- EXAM COUNTDOWN (UTS / UAS) ---
function openUjianModal() { document.getElementById('modal-ujian').classList.remove('hidden'); }
function simpanUjian(e) {
  e.preventDefault();
  dataUjian.push({
    id: 'ujn-' + Date.now(),
    kode_matkul: document.getElementById('ujianKode').value.trim().toUpperCase(),
    nama_matkul: document.getElementById('ujianMatkul').value.trim(),
    jenis: document.getElementById('ujianJenis').value,
    tanggal: document.getElementById('ujianTanggal').value,
    ruangan: document.getElementById('ujianRuang').value.trim().toUpperCase(),
    siap: false,
    isSynced: false
  });
  e.target.reset();
  closeModal('modal-ujian');
  saveLocal();
  showToast('Jadwal ujian ditambahkan!');
}
function toggleUjianSiap(id) {
  const u = dataUjian.find(item => item.id === id);
  if (u) { u.siap = !u.siap; u.isSynced = false; saveLocal(); }
}
function hapusUjian(id) {
  if (!confirm('Hapus jadwal ujian ini?')) return;
  dataUjian = dataUjian.filter(u => u.id !== id);
  deletedUjian.push(id);
  saveLocal();
}

function renderUjian() {
  const sorted = [...dataUjian].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
  document.getElementById('ujianList').innerHTML = sorted.length
    ? sorted.map(u => {
      const diffDays = Math.ceil((new Date(u.tanggal) - new Date()) / 86400000);
      const badge = diffDays < 0 ? 'Selesai' : (diffDays === 0 ? 'Hari Ini!' : `H-${diffDays}`);
      return `
        <div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500">${badge}</span>
              <span class="text-[10px] font-bold text-indigo-500">${u.jenis}</span>
            </div>
            <h4 class="font-extrabold text-xs mt-1">${u.nama_matkul} (${u.kode_matkul})</h4>
            <p class="text-[10px] text-slate-400">📅 ${u.tanggal} • 📍 ${u.ruangan}</p>
          </div>
          <div class="flex items-center gap-2">
            <label class="flex items-center gap-1 text-[10px] font-bold cursor-pointer bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
              <input type="checkbox" ${u.siap ? 'checked' : ''} onchange="toggleUjianSiap('${u.id}')" class="rounded text-emerald-600" />
              <span>Cheat Sheet</span>
            </label>
            <button onclick="hapusUjian('${u.id}')" class="text-slate-400 hover:text-rose-500"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
          </div>
        </div>`;
    }).join('')
    : `<div class="text-center py-6 text-xs text-slate-400">Belum ada jadwal UTS / UAS.</div>`;
}