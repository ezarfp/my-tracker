const API_URL = 'https://script.google.com/macros/s/AKfycbzHPqpNSjvohXDvxezNAHmKBJfFiwq-9_Qd3Cjw3feuZhtTDX4yKLXYB4D2XmdNlCKM/exec'; // PASTIKAN INI URL APPS SCRIPT-MU YANG LAMA!

// ==========================================
// TIMEZONE & DATE/TIME PRECISION ENGINE
// ==========================================
function getActiveTimezoneConfig() {
  const pref = localStorage.getItem('ezar_tz_pref') || 'auto';
  if (pref === 'WIB') return { iana: 'Asia/Jakarta', label: 'WIB' };
  if (pref === 'WITA') return { iana: 'Asia/Makassar', label: 'WITA' };
  if (pref === 'WIT') return { iana: 'Asia/Jayapura', label: 'WIT' };

  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';
  if (detected.includes('Makassar') || detected.includes('Ujung_Pandang')) return { iana: 'Asia/Makassar', label: 'WITA' };
  if (detected.includes('Jayapura')) return { iana: 'Asia/Jayapura', label: 'WIT' };
  return { iana: 'Asia/Jakarta', label: 'WIB' };
}

function getTodayDateStr() {
  const { iana } = getActiveTimezoneConfig();
  return new Intl.DateTimeFormat('en-CA', { timeZone: iana, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function getCurrentTimeStr() {
  const { iana } = getActiveTimezoneConfig();
  return new Intl.DateTimeFormat('en-GB', { timeZone: iana, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
}

function normalizeDateStr(raw) {
  if (!raw) return getTodayDateStr();
  const str = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const { iana } = getActiveTimezoneConfig();
    return new Intl.DateTimeFormat('en-CA', { timeZone: iana, year: 'numeric', month: '2-digit', day: '2-digit' }).format(parsed);
  }
  return str.split('T')[0];
}

function formatDisplayDate(raw) {
  const clean = normalizeDateStr(raw);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  const [y, m, d] = clean.split('-');
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${Number(d)} ${bulan[Number(m) - 1]} ${y}`;
}

function normalizeTimeStr(raw) {
  if (!raw) return '08:00';
  const str = String(raw).trim();
  if (/^\d{2}:\d{2}$/.test(str)) return str;
  if (/^\d{1}:\d{2}$/.test(str)) return '0' + str;
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const { iana } = getActiveTimezoneConfig();
    return new Intl.DateTimeFormat('en-GB', { timeZone: iana, hour: '2-digit', minute: '2-digit', hour12: false }).format(parsed);
  }
  return str;
}

// ==========================================
// GLOBAL STATE & DEFAULT PRESETS (V7.0)
// ==========================================
let dataKeuangan = JSON.parse(localStorage.getItem('ezar_keuangan')) || [];
let dataTugas = JSON.parse(localStorage.getItem('ezar_tugas')) || [];
let dataJadwal = JSON.parse(localStorage.getItem('ezar_jadwal')) || null;
let dataNilai = JSON.parse(localStorage.getItem('ezar_nilai')) || null;
let dataRutinitas = JSON.parse(localStorage.getItem('ezar_rutinitas')) || null;
let dataUjian = JSON.parse(localStorage.getItem('ezar_ujian')) || null;
let dataPiutang = JSON.parse(localStorage.getItem('ezar_piutang')) || [];

let deletedKeuangan = JSON.parse(localStorage.getItem('ezar_del_keuangan')) || [];
let deletedTugas = JSON.parse(localStorage.getItem('ezar_del_tugas')) || [];
let deletedJadwal = JSON.parse(localStorage.getItem('ezar_del_jadwal')) || [];
let deletedNilai = JSON.parse(localStorage.getItem('ezar_del_nilai')) || [];
let deletedRutinitas = JSON.parse(localStorage.getItem('ezar_del_rutinitas')) || [];
let deletedUjian = JSON.parse(localStorage.getItem('ezar_del_ujian')) || [];
let deletedPiutang = JSON.parse(localStorage.getItem('ezar_del_piutang')) || [];

let targetTabungan = Number(localStorage.getItem('ezar_goal_target')) || 2000000;
let namaTabungan = localStorage.getItem('ezar_goal_nama') || 'Dana Darurat & Upgrade Gear';
let budgetBulanan = Number(localStorage.getItem('ezar_budget_bulanan')) || 2000000;

let userProfile = JSON.parse(localStorage.getItem('ezar_profile_v7')) || {
  nama: localStorage.getItem('ezar_user_nama') || 'Ezar Faad Pratama',
  universitas: 'Telkom University Purwokerto',
  jurusan: 'S1 Teknik Informatika',
  kelas: 'PS1IF-14-REG-03',
  foto: localStorage.getItem('ezar_user_foto') || ''
};

let hideSaldo = localStorage.getItem('ezar_hide_saldo') === 'true';
let filterTipeKeu = 'ALL';
let filterAkunKeu = 'ALL';
let filterHariJadwal = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()];
if (filterHariJadwal === 'Minggu' || filterHariJadwal === 'Sabtu') filterHariJadwal = 'Senin';

if (!dataJadwal) {
  dataJadwal = [
    { id: 'jdw-1', hari: 'Senin', kode: 'CAK1AAB3', matkul: 'LOGIKA MATEMATIKA', dosen: 'HDA', ruangan: 'REK-305', jam_mulai: '08:30', jam_selesai: '11:30', hadir: 10, total_pertemuan: 16, isSynced: false },
    { id: 'jdw-2', hari: 'Senin', kode: 'CAK1BAB3', matkul: 'ALGORITMA & PEMROGRAMAN', dosen: 'RZA', ruangan: 'REK-402 LMM IoT', jam_mulai: '13:30', jam_selesai: '16:30', hadir: 10, total_pertemuan: 16, isSynced: false },
    { id: 'jdw-3', hari: 'Selasa', kode: 'CAK1EAB3', matkul: 'MATEMATIKA DISKRIT', dosen: 'AMS', ruangan: 'REK-306', jam_mulai: '10:30', jam_selesai: '13:30', hadir: 10, total_pertemuan: 16, isSynced: false },
    { id: 'jdw-4', hari: 'Selasa', kode: 'CAK1GDB2', matkul: 'PENDIDIKAN KARAKTER', dosen: 'GWS', ruangan: 'REK-306', jam_mulai: '13:30', jam_selesai: '15:30', hadir: 10, total_pertemuan: 16, isSynced: false },
    { id: 'jdw-5', hari: 'Rabu', kode: 'CAK1CAB3', matkul: 'KALKULUS', dosen: 'MNA', ruangan: 'REK-204', jam_mulai: '08:30', jam_selesai: '11:30', hadir: 10, total_pertemuan: 16, isSynced: false },
    { id: 'jdw-6', hari: 'Kamis', kode: 'CAK1DAB3', matkul: 'STATISTIKA', dosen: 'DWI', ruangan: 'REK-301', jam_mulai: '09:30', jam_selesai: '12:30', hadir: 10, total_pertemuan: 16, isSynced: false },
    { id: 'jdw-7', hari: 'Jumat', kode: 'UAK1AAB2', matkul: 'PANCASILA', dosen: 'SRW', ruangan: 'REK-102', jam_mulai: '08:30', jam_selesai: '10:30', hadir: 10, total_pertemuan: 16, isSynced: false }
  ];
}

if (!dataNilai) {
  dataNilai = [
    { id: 'nil-1', matkul: 'Logika Matematika', sks: 3, tugas: 85, uts: 80, uas: 85, bobot_tugas: 30, bobot_uts: 35, bobot_uas: 35, isSynced: false },
    { id: 'nil-2', matkul: 'Algoritma & Pemrograman', sks: 4, tugas: 90, uts: 85, uas: 88, bobot_tugas: 40, bobot_uts: 30, bobot_uas: 30, isSynced: false },
    { id: 'nil-3', matkul: 'Matematika Diskrit', sks: 3, tugas: 84, uts: 78, uas: 82, bobot_tugas: 30, bobot_uts: 35, bobot_uas: 35, isSynced: false },
    { id: 'nil-4', matkul: 'Kalkulus', sks: 3, tugas: 80, uts: 75, uas: 80, bobot_tugas: 30, bobot_uts: 35, bobot_uas: 35, isSynced: false },
    { id: 'nil-5', matkul: 'Statistika', sks: 3, tugas: 86, uts: 82, uas: 84, bobot_tugas: 30, bobot_uts: 35, bobot_uas: 35, isSynced: false },
    { id: 'nil-6', matkul: 'Pendidikan Karakter', sks: 2, tugas: 92, uts: 88, uas: 90, bobot_tugas: 40, bobot_uts: 30, bobot_uas: 30, isSynced: false },
    { id: 'nil-7', matkul: 'Pancasila', sks: 2, tugas: 90, uts: 86, uas: 88, bobot_tugas: 40, bobot_uts: 30, bobot_uas: 30, isSynced: false }
  ];
}

if (!dataRutinitas) {
  dataRutinitas = [
    { id: 'rut-1', nama: 'Potong Rambut Rutin (Jumat)', siklus_hari: 21, streak: 3, terakhir_selesai: '2026-11-20', jadwal_berikutnya: '2026-12-11', catatan: 'Siklus 3 minggu sekali setiap hari Jumat', isSynced: false },
    { id: 'rut-2', nama: 'Cek Alat IoT SMP & Maintenance', siklus_hari: 14, streak: 5, terakhir_selesai: '2026-11-14', jadwal_berikutnya: '2026-11-28', catatan: 'Cek ESP32, sensor IR, dan dashboard', isSynced: false }
  ];
}

if (!dataUjian) {
  dataUjian = [
    { id: 'ujn-1', matkul: 'UAS Semester 1 (Pertemuan 16)', jenis: 'UAS', tanggal: '2027-01-11', jam: '08:30', ruangan: 'Gedung REK', isSynced: false }
  ];
}