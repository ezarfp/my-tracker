// TEMPEL URL WEB APP GOOGLE APPS SCRIPT KAMU DI BAWAH INI:
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzHPqpNSjvohXDvxezNAHmKBJfFiwq-9_Qd3Cjw3feuZhtTDX4yKLXYB4D2XmdNlCKM/exec";

const TOTAL_PERTEMUAN = 16; // Pertemuan 8 = UTS, Pertemuan 16 = UAS

const DEFAULT_JADWAL = [
  { id: 'jdw-1', hari: 'Senin', kode_matkul: 'CAK1DAB3', nama_matkul: 'LOGIKA MATEMATIKA', jam_mulai: '10:30', jam_selesai: '13:30', ruangan: 'REK-402', dosen: 'MRZ', hadir: 0, isSynced: false },
  { id: 'jdw-2', hari: 'Selasa', kode_matkul: 'CAK1EAB3', nama_matkul: 'MATEMATIKA DISKRIT', jam_mulai: '10:30', jam_selesai: '13:30', ruangan: 'REK-306', dosen: 'AMS', hadir: 0, isSynced: false },
  { id: 'jdw-3', hari: 'Selasa', kode_matkul: 'CAK1GDB2', nama_matkul: 'PENDIDIKAN KARAKTER', jam_mulai: '13:30', jam_selesai: '15:30', ruangan: 'REK-306', dosen: 'GWS', hadir: 0, isSynced: false },
  { id: 'jdw-4', hari: 'Rabu', kode_matkul: 'CAK1BAB3', nama_matkul: 'ALGORITMA DAN PEMROGRAMAN 1', jam_mulai: '07:30', jam_selesai: '10:30', ruangan: 'L-MM', dosen: 'LIX', hadir: 0, isSynced: false },
  { id: 'jdw-5', hari: 'Rabu', kode_matkul: 'CAK1BAB3', nama_matkul: 'ALGORITMA DAN PEMROGRAMAN 1', jam_mulai: '10:30', jam_selesai: '12:30', ruangan: 'IOT-102', dosen: 'LIX', hadir: 0, isSynced: false },
  { id: 'jdw-6', hari: 'Kamis', kode_matkul: 'CAK1CAB3', nama_matkul: 'KALKULUS', jam_mulai: '07:30', jam_selesai: '10:30', ruangan: 'REK-402', dosen: 'RDN', hadir: 0, isSynced: false },
  { id: 'jdw-7', hari: 'Kamis', kode_matkul: 'UBKXBCB2', nama_matkul: 'PANCASILA', jam_mulai: '10:30', jam_selesai: '12:30', ruangan: 'REK-401', dosen: 'MCI', hadir: 0, isSynced: false },
  { id: 'jdw-8', hari: 'Jumat', kode_matkul: 'CAK1HDB2', nama_matkul: 'STATISTIKA', jam_mulai: '09:30', jam_selesai: '11:30', ruangan: 'REK-305', dosen: 'AMS', hadir: 0, isSynced: false },
  { id: 'jdw-9', hari: 'Jumat', kode_matkul: 'UAKXACB2', nama_matkul: 'AGAMA ISLAM', jam_mulai: '12:30', jam_selesai: '14:30', ruangan: 'REK-307', dosen: 'RON', hadir: 0, isSynced: false }
];

const DEFAULT_NILAI = [
  { id: 'nil-1', kode_matkul: 'CAK1DAB3', nama_matkul: 'Logika Matematika', sks: 3, tugas: 85, uts: 80, uas: 82, isSynced: false },
  { id: 'nil-2', kode_matkul: 'CAK1EAB3', nama_matkul: 'Matematika Diskrit', sks: 3, tugas: 85, uts: 80, uas: 80, isSynced: false },
  { id: 'nil-3', kode_matkul: 'CAK1GDB2', nama_matkul: 'Pendidikan Karakter', sks: 2, tugas: 90, uts: 85, uas: 88, isSynced: false },
  { id: 'nil-4', kode_matkul: 'CAK1BAB3', nama_matkul: 'Algoritma & Pemrograman 1', sks: 3, tugas: 88, uts: 82, uas: 85, isSynced: false },
  { id: 'nil-5', kode_matkul: 'CAK1CAB3', nama_matkul: 'Kalkulus', sks: 3, tugas: 80, uts: 78, uas: 80, isSynced: false },
  { id: 'nil-6', kode_matkul: 'UBKXBCB2', nama_matkul: 'Pancasila', sks: 2, tugas: 90, uts: 85, uas: 88, isSynced: false },
  { id: 'nil-7', kode_matkul: 'CAK1HDB2', nama_matkul: 'Statistika', sks: 2, tugas: 85, uts: 80, uas: 82, isSynced: false },
  { id: 'nil-8', kode_matkul: 'UAKXACB2', nama_matkul: 'Agama Islam', sks: 2, tugas: 92, uts: 88, uas: 90, isSynced: false }
];

const DEFAULT_RUTINITAS = [
  { id: 'rut-1', nama: 'Potong Rambut (3 Minggu Sekali)', siklus_hari: 21, streak: 1, terakhir_selesai: '2026-11-20', jadwal_berikutnya: '2026-12-11', catatan: 'Rutin hari Jumat setiap 3 minggu', isSynced: false }
];

const DEFAULT_UJIAN = [
  { id: 'ujn-1', kode_matkul: 'CAK1DAB3', nama_matkul: 'Logika Matematika', jenis: 'UAS (Pertemuan 16)', tanggal: '2027-01-11', ruangan: 'REK-402', siap: false, isSynced: false },
  { id: 'ujn-2', kode_matkul: 'CAK1BAB3', nama_matkul: 'Algoritma & Pemrograman 1', jenis: 'UAS (Pertemuan 16)', tanggal: '2027-01-13', ruangan: 'L-MM', siap: false, isSynced: false }
];