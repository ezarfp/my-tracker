let dataKeuangan = JSON.parse(localStorage.getItem('ez_keuangan')) || [];
let dataTugas = JSON.parse(localStorage.getItem('ez_tugas')) || [];
let dataGoals = JSON.parse(localStorage.getItem('ez_goals')) || [];
let dataJadwal = JSON.parse(localStorage.getItem('ez_jadwal')) || DEFAULT_JADWAL;
let dataNilai = JSON.parse(localStorage.getItem('ez_nilai')) || DEFAULT_NILAI;
let dataPiutang = JSON.parse(localStorage.getItem('ez_piutang')) || [];
let dataRutinitas = JSON.parse(localStorage.getItem('ez_rutinitas')) || DEFAULT_RUTINITAS;
let dataUjian = JSON.parse(localStorage.getItem('ez_ujian')) || DEFAULT_UJIAN;

let deletedKeuangan = JSON.parse(localStorage.getItem('ez_del_keuangan')) || [];
let deletedTugas = JSON.parse(localStorage.getItem('ez_del_tugas')) || [];
let deletedGoals = JSON.parse(localStorage.getItem('ez_del_goals')) || [];
let deletedJadwal = JSON.parse(localStorage.getItem('ez_del_jadwal')) || [];
let deletedPiutang = JSON.parse(localStorage.getItem('ez_del_piutang')) || [];
let deletedRutinitas = JSON.parse(localStorage.getItem('ez_del_rutinitas')) || [];
let deletedUjian = JSON.parse(localStorage.getItem('ez_del_ujian')) || [];

let budgetLimit = Number(localStorage.getItem('ez_budget_limit')) || 1000000;
let userProfile = JSON.parse(localStorage.getItem('ez_profile')) || {
  name: 'Ezar Faad Pratama',
  bio: 'S1 Teknik Informatika • PS1IF-14-REG-03',
  avatar: './logo.png'
};
let isPrivacyOn = localStorage.getItem('ez_privacy') === 'true';

function saveLocal() {
  localStorage.setItem('ez_keuangan', JSON.stringify(dataKeuangan));
  localStorage.setItem('ez_tugas', JSON.stringify(dataTugas));
  localStorage.setItem('ez_goals', JSON.stringify(dataGoals));
  localStorage.setItem('ez_jadwal', JSON.stringify(dataJadwal));
  localStorage.setItem('ez_nilai', JSON.stringify(dataNilai));
  localStorage.setItem('ez_piutang', JSON.stringify(dataPiutang));
  localStorage.setItem('ez_rutinitas', JSON.stringify(dataRutinitas));
  localStorage.setItem('ez_ujian', JSON.stringify(dataUjian));

  localStorage.setItem('ez_del_keuangan', JSON.stringify(deletedKeuangan));
  localStorage.setItem('ez_del_tugas', JSON.stringify(deletedTugas));
  localStorage.setItem('ez_del_goals', JSON.stringify(deletedGoals));
  localStorage.setItem('ez_del_jadwal', JSON.stringify(deletedJadwal));
  localStorage.setItem('ez_del_piutang', JSON.stringify(deletedPiutang));
  localStorage.setItem('ez_del_rutinitas', JSON.stringify(deletedRutinitas));
  localStorage.setItem('ez_del_ujian', JSON.stringify(deletedUjian));

  renderAll();
}

function getUnsyncedCount() {
  return dataKeuangan.filter(k => !k.isSynced).length +
         dataTugas.filter(t => !t.isSynced).length +
         dataGoals.filter(g => !g.isSynced).length +
         dataJadwal.filter(j => !j.isSynced).length +
         dataNilai.filter(n => !n.isSynced).length +
         dataPiutang.filter(p => !p.isSynced).length +
         dataRutinitas.filter(r => !r.isSynced).length +
         dataUjian.filter(u => !u.isSynced).length +
         deletedKeuangan.length + deletedTugas.length + deletedGoals.length +
         deletedJadwal.length + deletedPiutang.length + deletedRutinitas.length + deletedUjian.length;
}

async function syncToSheets(silent = false) {
  if (!navigator.onLine) { if (!silent) showToast('Sedang offline.'); return; }
  if (SCRIPT_URL.includes("TEMPEL_URL")) { if (!silent) showToast('URL Apps Script belum diisi di js/config.js!'); return; }
  if (getUnsyncedCount() === 0) { if (!silent) showToast('Semua data sudah sinkron!'); return; }

  const icon = document.getElementById('syncIcon');
  const text = document.getElementById('syncText');
  icon.classList.add('animate-spin');
  text.textContent = 'Syncing...';

  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        keuangan: dataKeuangan.filter(k => !k.isSynced),
        tugas: dataTugas.filter(t => !t.isSynced),
        goals: dataGoals.filter(g => !g.isSynced),
        jadwal: dataJadwal.filter(j => !j.isSynced),
        nilai: dataNilai.filter(n => !n.isSynced),
        piutang: dataPiutang.filter(p => !p.isSynced),
        rutinitas: dataRutinitas.filter(r => !r.isSynced),
        ujian: dataUjian.filter(u => !u.isSynced),
        deletedKeuangan, deletedTugas, deletedGoals, deletedJadwal, deletedPiutang, deletedRutinitas, deletedUjian
      })
    });
    const result = await res.json();
    if (result.status === 'success') {
      [dataKeuangan, dataTugas, dataGoals, dataJadwal, dataNilai, dataPiutang, dataRutinitas, dataUjian].forEach(arr => arr.forEach(x => x.isSynced = true));
      deletedKeuangan = []; deletedTugas = []; deletedGoals = []; deletedJadwal = []; deletedPiutang = []; deletedRutinitas = []; deletedUjian = [];
      localStorage.setItem('ez_last_sync', new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      saveLocal();
      if (!silent) showToast('✅ Berhasil Sync V6 ke Google Sheets!');
    } else if (!silent) showToast('Gagal: ' + result.message);
  } catch (e) { if (!silent) showToast('Gagal terhubung ke Sheets.'); }
  finally { icon.classList.remove('animate-spin'); updateSyncCounter(); }
}

async function pullFromSheets() {
  if (!navigator.onLine) { showToast('Butuh koneksi internet.'); return; }
  if (SCRIPT_URL.includes("TEMPEL_URL")) { showToast('URL Apps Script belum dipasang!'); return; }
  if (!confirm('Tarik seluruh data V6 dari Google Sheets ke HP ini?')) return;

  const btn = document.getElementById('pullBtn');
  btn.querySelector('span').textContent = 'Sedang menarik data...';
  try {
    const res = await fetch(SCRIPT_URL);
    const result = await res.json();
    if (result.status === 'success') {
      if (result.keuangan) dataKeuangan = result.keuangan;
      if (result.tugas) dataTugas = result.tugas;
      if (result.goals) dataGoals = result.goals;
      if (result.jadwal?.length) dataJadwal = result.jadwal;
      if (result.nilai?.length) dataNilai = result.nilai;
      if (result.piutang) dataPiutang = result.piutang;
      if (result.rutinitas?.length) dataRutinitas = result.rutinitas;
      if (result.ujian?.length) dataUjian = result.ujian;
      deletedKeuangan = []; deletedTugas = []; deletedGoals = []; deletedJadwal = []; deletedPiutang = []; deletedRutinitas = []; deletedUjian = [];
      saveLocal();
      showToast('✅ Seluruh data V6 dipulihkan!');
    } else showToast('Gagal: ' + result.message);
  } catch (err) { showToast('Gagal terhubung ke Google Sheets.'); }
  finally { btn.querySelector('span').textContent = 'Tarik Semua Data dari Google Sheets (Pull)'; }
}

function exportBackupJSON() {
  const backup = {
    version: 'v6.0',
    exportedAt: new Date().toISOString(),
    keuangan: dataKeuangan, tugas: dataTugas, goals: dataGoals,
    jadwal: dataJadwal, nilai: dataNilai, piutang: dataPiutang,
    rutinitas: dataRutinitas, ujian: dataUjian
  };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
  a.download = `EzarTracker-v6-Backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
}

function importBackupJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const p = JSON.parse(ev.target.result);
      if (p.keuangan) dataKeuangan = p.keuangan;
      if (p.tugas) dataTugas = p.tugas;
      if (p.goals) dataGoals = p.goals;
      if (p.jadwal) dataJadwal = p.jadwal;
      if (p.nilai) dataNilai = p.nilai;
      if (p.piutang) dataPiutang = p.piutang;
      if (p.rutinitas) dataRutinitas = p.rutinitas;
      if (p.ujian) dataUjian = p.ujian;
      saveLocal();
      showToast('✅ Seluruh data berhasil dipulihkan!');
    } catch (err) { showToast('File backup JSON tidak valid.'); }
  };
  reader.readAsText(file);
}