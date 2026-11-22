function sanitizeAllData() {
  dataKeuangan = (dataKeuangan || []).map(k => ({
    ...k,
    tanggal: normalizeDateStr(k.tanggal),
    nominal: Number(k.nominal) || 0
  }));

  dataTugas = (dataTugas || []).map(t => ({
    ...t,
    deadline: normalizeDateStr(t.deadline)
  }));

  dataJadwal = (dataJadwal || []).map(j => ({
    ...j,
    jam_mulai: normalizeTimeStr(j.jam_mulai),
    jam_selesai: normalizeTimeStr(j.jam_selesai),
    hadir: Number(j.hadir) || 0,
    total_pertemuan: Number(j.total_pertemuan) || 16
  }));

  dataNilai = (dataNilai || []).map(n => ({
    ...n,
    sks: Number(n.sks) || 2,
    tugas: Number(n.tugas) || 0,
    uts: Number(n.uts) || 0,
    uas: Number(n.uas) || 0,
    bobot_tugas: n.bobot_tugas !== undefined && n.bobot_tugas !== '' ? Number(n.bobot_tugas) : 30,
    bobot_uts: n.bobot_uts !== undefined && n.bobot_uts !== '' ? Number(n.bobot_uts) : 35,
    bobot_uas: n.bobot_uas !== undefined && n.bobot_uas !== '' ? Number(n.bobot_uas) : 35
  }));

  dataRutinitas = (dataRutinitas || []).map(r => ({
    ...r,
    siklus_hari: Number(r.siklus_hari) || 7,
    streak: Number(r.streak) || 0,
    terakhir_selesai: r.terakhir_selesai && r.terakhir_selesai !== '-' ? normalizeDateStr(r.terakhir_selesai) : '-',
    jadwal_berikutnya: normalizeDateStr(r.jadwal_berikutnya)
  }));

  dataUjian = (dataUjian || []).map(u => ({
    ...u,
    tanggal: normalizeDateStr(u.tanggal),
    jam: normalizeTimeStr(u.jam)
  }));

  dataPiutang = (dataPiutang || []).map(p => ({
    ...p,
    tanggal: normalizeDateStr(p.tanggal),
    nominal: Number(p.nominal) || 0
  }));
}

sanitizeAllData();

function saveLocal(skipRender = false) {
  sanitizeAllData();
  localStorage.setItem('ezar_keuangan', JSON.stringify(dataKeuangan));
  localStorage.setItem('ezar_tugas', JSON.stringify(dataTugas));
  localStorage.setItem('ezar_jadwal', JSON.stringify(dataJadwal));
  localStorage.setItem('ezar_nilai', JSON.stringify(dataNilai));
  localStorage.setItem('ezar_rutinitas', JSON.stringify(dataRutinitas));
  localStorage.setItem('ezar_ujian', JSON.stringify(dataUjian));
  localStorage.setItem('ezar_piutang', JSON.stringify(dataPiutang));

  localStorage.setItem('ezar_del_keuangan', JSON.stringify(deletedKeuangan));
  localStorage.setItem('ezar_del_tugas', JSON.stringify(deletedTugas));
  localStorage.setItem('ezar_del_jadwal', JSON.stringify(deletedJadwal));
  localStorage.setItem('ezar_del_nilai', JSON.stringify(deletedNilai));
  localStorage.setItem('ezar_del_rutinitas', JSON.stringify(deletedRutinitas));
  localStorage.setItem('ezar_del_ujian', JSON.stringify(deletedUjian));
  localStorage.setItem('ezar_del_piutang', JSON.stringify(deletedPiutang));

  updateSyncBadge();
  if (!skipRender && typeof renderAll === 'function') renderAll();
}

function getUnsyncedCount() {
  return [
    ...dataKeuangan, ...dataTugas, ...dataJadwal,
    ...dataNilai, ...dataRutinitas, ...dataUjian, ...dataPiutang
  ].filter(item => item.isSynced === false).length +
    deletedKeuangan.length + deletedTugas.length + deletedJadwal.length +
    deletedNilai.length + deletedRutinitas.length + deletedUjian.length + deletedPiutang.length;
}

function updateSyncBadge() {
  const count = getUnsyncedCount();
  const badge = document.getElementById('syncCountBadge');
  if (badge) badge.textContent = count;
  const statusEl = document.getElementById('syncStatusText');
  if (statusEl) {
    statusEl.textContent = navigator.onLine
      ? (count > 0 ? `${count} Menunggu Sync` : 'Siap Sync')
      : 'Mode Offline';
  }
}

async function syncAllData() {
  if (!navigator.onLine) {
    showToast('Offline! Data tersimpan aman di perangkat.');
    return;
  }
  const btn = document.getElementById('btnSync');
  if (btn) btn.classList.add('animate-pulse');

  const payload = {
    keuangan: dataKeuangan.filter(i => i.isSynced === false),
    tugas: dataTugas.filter(i => i.isSynced === false),
    jadwal: dataJadwal.filter(i => i.isSynced === false),
    nilai: dataNilai.filter(i => i.isSynced === false),
    rutinitas: dataRutinitas.filter(i => i.isSynced === false),
    ujian: dataUjian.filter(i => i.isSynced === false),
    piutang: dataPiutang.filter(i => i.isSynced === false),
    deletedKeuangan, deletedTugas, deletedJadwal,
    deletedNilai, deletedRutinitas, deletedUjian, deletedPiutang
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.status === 'success') {
      [dataKeuangan, dataTugas, dataJadwal, dataNilai, dataRutinitas, dataUjian, dataPiutang].forEach(arr => {
        arr.forEach(item => item.isSynced = true);
      });
      deletedKeuangan = []; deletedTugas = []; deletedJadwal = [];
      deletedNilai = []; deletedRutinitas = []; deletedUjian = []; deletedPiutang = [];

      const { label } = getActiveTimezoneConfig();
      const nowStr = `${getCurrentTimeStr()} ${label}`;
      localStorage.setItem('ezar_last_sync', nowStr);
      const lastSyncEl = document.getElementById('lastSyncTime');
      if (lastSyncEl) lastSyncEl.textContent = `Sync: ${nowStr}`;

      saveLocal();
      showToast('Sinkronisasi Cloud Berhasil!');
    }
  } catch (err) {
    showToast('Gagal Sync! Cek koneksi atau URL Apps Script.');
  } finally {
    if (btn) btn.classList.remove('animate-pulse');
  }
}

async function pullFromCloud() {
  if (!navigator.onLine) {
    showToast('Butuh koneksi internet untuk Pull dari Cloud.');
    return;
  }
  showToast('Menarik data dari Google Sheets...');
  try {
    const res = await fetch(API_URL);
    const json = await res.json();
    if (json.status === 'success' && json.data) {
      const d = json.data;
      if (d.keuangan && d.keuangan.length) dataKeuangan = d.keuangan.map(x => ({ ...x, isSynced: true }));
      if (d.tugas && d.tugas.length) dataTugas = d.tugas.map(x => ({ ...x, isSynced: true }));
      if (d.jadwal && d.jadwal.length) dataJadwal = d.jadwal.map(x => ({ ...x, isSynced: true }));
      if (d.nilai && d.nilai.length) dataNilai = d.nilai.map(x => ({ ...x, isSynced: true }));
      if (d.rutinitas && d.rutinitas.length) dataRutinitas = d.rutinitas.map(x => ({ ...x, isSynced: true }));
      if (d.ujian && d.ujian.length) dataUjian = d.ujian.map(x => ({ ...x, isSynced: true }));
      if (d.piutang && d.piutang.length) dataPiutang = d.piutang.map(x => ({ ...x, isSynced: true }));

      saveLocal();
      showToast('Seluruh data berhasil dipulihkan & diformat!');
    }
  } catch (err) {
    showToast('Gagal menarik data dari Google Sheets.');
  }
}

function exportBackupJSON() {
  const backup = {
    version: '7.0',
    exportedAt: `${getTodayDateStr()} ${getCurrentTimeStr()} ${getActiveTimezoneConfig().label}`,
    profile: userProfile,
    keuangan: dataKeuangan,
    tugas: dataTugas,
    jadwal: dataJadwal,
    nilai: dataNilai,
    rutinitas: dataRutinitas,
    ujian: dataUjian,
    piutang: dataPiutang
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `EzarTracker_v7_Backup_${getTodayDateStr()}.json`;
  a.click();
  showToast('File Backup JSON berhasil diunduh!');
}

function importBackupJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (parsed.keuangan) dataKeuangan = parsed.keuangan;
      if (parsed.tugas) dataTugas = parsed.tugas;
      if (parsed.jadwal) dataJadwal = parsed.jadwal;
      if (parsed.nilai) dataNilai = parsed.nilai;
      if (parsed.rutinitas) dataRutinitas = parsed.rutinitas;
      if (parsed.ujian) dataUjian = parsed.ujian;
      if (parsed.piutang) dataPiutang = parsed.piutang;
      if (parsed.profile) {
        userProfile = { ...userProfile, ...parsed.profile };
        localStorage.setItem('ezar_profile_v7', JSON.stringify(userProfile));
      }
      saveLocal();
      if (typeof applyUserProfile === 'function') applyUserProfile();
      showToast('Restore JSON berhasil!');
    } catch {
      showToast('Format file JSON tidak valid.');
    }
  };
  reader.readAsText(file);
}