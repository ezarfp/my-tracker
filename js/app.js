let currentTugasFilter = 'Pending';
const now = new Date();
document.getElementById('filterBulan').value = now.toISOString().slice(0, 7);
document.getElementById('inputBudgetLimit').value = budgetLimit;
document.getElementById('todayDateLabel').textContent = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
document.getElementById('quickNotesArea').value = localStorage.getItem('ez_quick_notes') || '';

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2800);
}
function formatRupiah(angka) { return 'Rp ' + Number(angka).toLocaleString('id-ID'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function applyUserProfile() {
  document.getElementById('greetingName').textContent = `Halo, ${userProfile.name.split(' ')[0]} 👋`;
  document.getElementById('profileDisplayName').textContent = userProfile.name;
  document.getElementById('profileDisplayBio').textContent = userProfile.bio;
  document.getElementById('inputUserName').value = userProfile.name;
  document.getElementById('inputUserBio').value = userProfile.bio;
  document.getElementById('headerAvatar').src = userProfile.avatar;
  document.getElementById('profileAvatarPreview').src = userProfile.avatar;
}
function saveUserProfile() {
  userProfile.name = document.getElementById('inputUserName').value.trim() || 'Ezar Faad Pratama';
  userProfile.bio = document.getElementById('inputUserBio').value.trim() || 'S1 Teknik Informatika';
  localStorage.setItem('ez_profile', JSON.stringify(userProfile));
  applyUserProfile();
  showToast('Profil diperbarui!');
}
function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = 200; canvas.height = 200;
      canvas.getContext('2d').drawImage(img, 0, 0, 200, 200);
      userProfile.avatar = canvas.toDataURL('image/jpeg', 0.85);
      localStorage.setItem('ez_profile', JSON.stringify(userProfile));
      applyUserProfile();
      showToast('Foto profil berhasil diganti!');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function applyPrivacyState() {
  document.querySelectorAll('.sensitive-val').forEach(el => el.classList.toggle('privacy-mask', isPrivacyOn));
  document.getElementById('privacyIcon').setAttribute('data-lucide', isPrivacyOn ? 'eye-off' : 'eye');
  lucide.createIcons();
}
function togglePrivacy() { isPrivacyOn = !isPrivacyOn; localStorage.setItem('ez_privacy', isPrivacyOn); applyPrivacyState(); }

if (localStorage.getItem('ez_dark') === 'true') {
  document.documentElement.classList.add('dark');
  document.getElementById('themeIcon').setAttribute('data-lucide', 'sun');
}
function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('ez_dark', isDark);
  document.getElementById('themeIcon').setAttribute('data-lucide', isDark ? 'sun' : 'moon');
  lucide.createIcons();
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});

function updateOnlineStatus() {
  const el = document.getElementById('netStatus');
  if (navigator.onLine) {
    el.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span>Online • Siap Sync</span>`;
    el.className = "flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold";
    if (getUnsyncedCount() > 0 && !SCRIPT_URL.includes("TEMPEL_URL")) syncToSheets(true);
  } else {
    el.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span><span>Mode Offline</span>`;
    el.className = "flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold";
  }
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// --- TUGAS ---
function openTugasModal(editId = null) {
  document.getElementById('editTugasId').value = editId || '';
  if (editId) {
    const t = dataTugas.find(item => item.id === editId);
    document.getElementById('modalTugasTitle').textContent = 'Edit Tugas Kuliah';
    document.getElementById('tugasMatkul').value = t.matkul;
    document.getElementById('tugasPrioritas').value = t.prioritas || 'Sedang';
    document.getElementById('tugasJudul').value = t.judul_tugas;
    document.getElementById('tugasDeadline').value = t.deadline.replace(' ', 'T');
    document.getElementById('tugasLink').value = t.link || '';
    document.getElementById('tugasSubtasks').value = (t.subtasks || []).map(s => s.text).join(', ');
  } else {
    document.getElementById('modalTugasTitle').textContent = 'Tugas Kuliah Baru';
    ['tugasMatkul', 'tugasJudul', 'tugasDeadline', 'tugasLink', 'tugasSubtasks'].forEach(id => document.getElementById(id).value = '');
  }
  document.getElementById('modal-tugas').classList.remove('hidden');
}

function simpanTugas(e) {
  e.preventDefault();
  const editId = document.getElementById('editTugasId').value;
  const matkul = document.getElementById('tugasMatkul').value.trim();
  const prioritas = document.getElementById('tugasPrioritas').value;
  const judul_tugas = document.getElementById('tugasJudul').value.trim();
  const deadline = document.getElementById('tugasDeadline').value.replace('T', ' ');
  const link = document.getElementById('tugasLink').value.trim();
  const rawSubs = document.getElementById('tugasSubtasks').value.split(',').map(s => s.trim()).filter(Boolean);

  if (editId) {
    const idx = dataTugas.findIndex(t => t.id === editId);
    if (idx > -1) {
      const oldSubs = dataTugas[idx].subtasks || [];
      dataTugas[idx] = { ...dataTugas[idx], matkul, prioritas, judul_tugas, deadline, link, subtasks: rawSubs.map(txt => oldSubs.find(o => o.text === txt) || { text: txt, done: false }), isSynced: false };
    }
    showToast('Tugas diperbarui!');
  } else {
    dataTugas.push({ id: 'tgs-' + Date.now(), matkul, judul_tugas, deadline, status: 'Pending', prioritas, link, subtasks: rawSubs.map(txt => ({ text: txt, done: false })), isSynced: false });
    showToast('Tugas disimpan!');
  }
  closeModal('modal-tugas');
  saveLocal();
}

function toggleTugasStatus(id) {
  const idx = dataTugas.findIndex(t => t.id === id);
  if (idx > -1) {
    const becomingDone = dataTugas[idx].status === 'Pending';
    dataTugas[idx].status = becomingDone ? 'Done' : 'Pending';
    dataTugas[idx].isSynced = false;
    saveLocal();
    if (becomingDone && typeof confetti === 'function') confetti({ particleCount: 75, spread: 65, origin: { y: 0.7 } });
    showToast(becomingDone ? '🎉 Mantap! Tugas selesai!' : 'Tugas dikembalikan ke Aktif');
  }
}
function toggleSubtask(tugasId, subIdx) {
  const t = dataTugas.find(item => item.id === tugasId);
  if (t && t.subtasks[subIdx]) { t.subtasks[subIdx].done = !t.subtasks[subIdx].done; t.isSynced = false; saveLocal(); }
}
function hapusTugas(id) {
  if (!confirm('Hapus tugas ini?')) return;
  dataTugas = dataTugas.filter(t => t.id !== id);
  deletedTugas.push(id);
  saveLocal();
}
function setTugasFilter(status) {
  currentTugasFilter = status;
  document.getElementById('filterPending').className = status === 'Pending' ? 'flex-1 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm transition' : 'flex-1 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 transition';
  document.getElementById('filterDone').className = status === 'Done' ? 'flex-1 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm transition' : 'flex-1 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 transition';
  renderTugas();
}

function getDeadlineBadge(deadlineStr, status) {
  if (status === 'Done') return `<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold">Done</span>`;
  const diffHours = (new Date(deadlineStr) - new Date()) / 3600000;
  if (diffHours < 0) return `<span class="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold">Terlewat!</span>`;
  if (diffHours <= 24) return `<span class="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-bold">Sisa ${Math.max(1, Math.floor(diffHours))} Jam</span>`;
  if (diffHours <= 72) return `<span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold">< 3 Hari</span>`;
  return `<span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">Aman</span>`;
}

function renderTugasCard(t) {
  const prioDot = t.prioritas === 'Tinggi' ? '🔴' : (t.prioritas === 'Rendah' ? '🟢' : '🟡');
  const subsHtml = (t.subtasks && t.subtasks.length > 0)
    ? `<div class="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">${t.subtasks.map((s, idx) => `<label class="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer"><input type="checkbox" ${s.done ? 'checked' : ''} onchange="toggleSubtask('${t.id}', ${idx})" class="rounded text-indigo-600" /><span class="${s.done ? 'line-through opacity-60' : ''}">${s.text}</span></label>`).join('')}</div>` : '';

  return `
    <div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-1 flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">${prioDot} ${t.matkul}</span>
            ${getDeadlineBadge(t.deadline, t.status)}
          </div>
          <p class="text-sm font-bold ${t.status === 'Done' ? 'line-through text-slate-400' : ''}">${t.judul_tugas}</p>
          <div class="flex items-center gap-3 text-[11px] text-slate-500">
            <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ${t.deadline}</span>
            ${t.link ? `<a href="${t.link}" target="_blank" class="text-indigo-500 font-bold flex items-center gap-0.5 underline"><i data-lucide="external-link" class="w-3 h-3"></i> Link</a>` : ''}
          </div>
        </div>
        <div class="flex flex-col items-center gap-2">
          <button onclick="toggleTugasStatus('${t.id}')" class="w-9 h-9 rounded-full flex items-center justify-center border transition active:scale-90 ${t.status === 'Done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700 text-slate-300 hover:border-indigo-500'}"><i data-lucide="check" class="w-5 h-5"></i></button>
          <div class="flex gap-2 text-slate-400">
            <button onclick="openTugasModal('${t.id}')" class="hover:text-indigo-500"><i data-lucide="pencil" class="w-3 h-3"></i></button>
            <button onclick="hapusTugas('${t.id}')" class="hover:text-rose-500"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
          </div>
        </div>
      </div>
      ${subsHtml}
    </div>`;
}

function renderTugas() {
  const matkulSelect = document.getElementById('filterMatkul');
  const currentVal = matkulSelect.value;
  const uniqueMatkul = [...new Set(dataTugas.map(t => t.matkul))];
  matkulSelect.innerHTML = `<option value="ALL">Semua Matkul</option>` + uniqueMatkul.map(m => `<option value="${m}" ${m === currentVal ? 'selected' : ''}>${m}</option>`).join('');
  const filtered = [...dataTugas].filter(t => t.status === currentTugasFilter && (matkulSelect.value === 'ALL' || t.matkul === matkulSelect.value)).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  document.getElementById('tugasList').innerHTML = filtered.length ? filtered.map(renderTugasCard).join('') : `<div class="text-center py-8 text-xs text-slate-400">Tidak ada tugas di kategori ini.</div>`;
  lucide.createIcons();
}

// --- POMODORO & NAVIGASI ---
let pomoSeconds = 25 * 60, pomoInterval = null;
function setPomodoroMode(mins, label) {
  clearInterval(pomoInterval); pomoInterval = null; pomoSeconds = mins * 60;
  document.getElementById('pomoLabel').textContent = label;
  document.getElementById('pomoStartBtn').textContent = 'Mulai';
  document.getElementById('pomoFocusBtn').className = mins === 25 ? 'px-3 py-1 rounded-full bg-indigo-600 text-white' : 'px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500';
  document.getElementById('pomoBreakBtn').className = mins === 5 ? 'px-3 py-1 rounded-full bg-emerald-600 text-white' : 'px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500';
  document.getElementById('pomoDisplay').textContent = `${String(mins).padStart(2, '0')}:00`;
}
function togglePomodoro() {
  if (pomoInterval) { clearInterval(pomoInterval); pomoInterval = null; document.getElementById('pomoStartBtn').textContent = 'Lanjut'; }
  else {
    document.getElementById('pomoStartBtn').textContent = 'Jeda';
    pomoInterval = setInterval(() => {
      if (pomoSeconds > 0) {
        pomoSeconds--;
        document.getElementById('pomoDisplay').textContent = `${String(Math.floor(pomoSeconds / 60)).padStart(2, '0')}:${String(pomoSeconds % 60).padStart(2, '0')}`;
      } else {
        clearInterval(pomoInterval); pomoInterval = null;
        if (typeof confetti === 'function') confetti({ particleCount: 80, spread: 70 });
        showToast('⏰ Sesi Pomodoro selesai!');
        document.getElementById('pomoStartBtn').textContent = 'Mulai';
      }
    }, 1000);
  }
}
function resetPomodoro() { setPomodoroMode(25, 'Fokus Ngoding / Belajar'); }
function saveQuickNotes() { localStorage.setItem('ez_quick_notes', document.getElementById('quickNotesArea').value); }
function requestNotifPermission() {
  if (!('Notification' in window)) return showToast('Browser tidak mendukung notifikasi');
  Notification.requestPermission().then(perm => showToast(perm === 'granted' ? 'Pengingat aktif!' : 'Izin ditolak'));
}
function saveBudgetLimit() {
  budgetLimit = Number(document.getElementById('inputBudgetLimit').value) || 1000000;
  localStorage.setItem('ez_budget_limit', budgetLimit);
  renderAll(); showToast('Target budget disimpan!');
}
function updateSyncCounter() {
  document.getElementById('syncText').textContent = `Sync (${getUnsyncedCount()})`;
  const last = localStorage.getItem('ez_last_sync');
  if (last) document.getElementById('lastSyncLabel').textContent = `Sync: ${last}`;
}

function switchAkademikSub(sub) {
  ['jadwal', 'ujian', 'ipk', 'focus'].forEach(s => {
    document.getElementById('ak-' + s).classList.toggle('hidden', s !== sub);
    const btn = document.getElementById('subTab' + s.charAt(0).toUpperCase() + s.slice(1));
    btn.className = s === sub
      ? 'py-1.5 rounded-lg bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm transition'
      : 'py-1.5 rounded-lg text-slate-600 dark:text-slate-400 transition';
  });
}

const tabOrder = ['dashboard', 'keuangan', 'tugas', 'akademik', 'settings'];
function switchTab(tab, idx = null) {
  const tabIndex = idx !== null ? idx : tabOrder.indexOf(tab);
  document.getElementById('navPill').style.transform = `translateX(${tabIndex * 100}%)`;
  tabOrder.forEach((t, i) => {
    document.getElementById('view-' + t).classList.toggle('hidden', t !== tab);
    document.getElementById('nav-' + t).className = i === tabIndex
      ? 'relative z-10 flex flex-col items-center justify-center py-1.5 text-white transition-colors'
      : 'relative z-10 flex flex-col items-center justify-center py-1.5 text-slate-500 dark:text-slate-400 transition-colors';
  });
}

function renderAll() {
  const bulanIni = new Date().toISOString().slice(0, 7);
  const bulanFilter = document.getElementById('filterBulan').value || bulanIni;
  let balTunai = 0, balBank = 0, balEwallet = 0, totalTabungan = 0, keluarBulanIni = 0, periodMasuk = 0, periodKeluar = 0;

  dataKeuangan.forEach(k => {
    const d = k.dompet || 'Tunai';
    if (k.jenis === 'Transfer') {
      if (d === 'Bank') balBank -= k.nominal; else if (d === 'E-Wallet') balEwallet -= k.nominal; else balTunai -= k.nominal;
      const dest = k.dompet_tujuan || 'Bank';
      if (dest === 'Bank') balBank += k.nominal; else if (dest === 'E-Wallet') balEwallet += k.nominal; else balTunai += k.nominal;
      return;
    }
    const sign = k.jenis === 'Pemasukan' ? 1 : -1;
    if (k.kategori === 'Tabungan') totalTabungan += k.nominal;
    else {
      if (d === 'Bank') balBank += sign * k.nominal; else if (d === 'E-Wallet') balEwallet += sign * k.nominal; else balTunai += sign * k.nominal;
      if (k.tanggal.startsWith(bulanIni) && k.jenis === 'Pengeluaran') keluarBulanIni += k.nominal;
      if (k.tanggal.startsWith(bulanFilter)) { if (k.jenis === 'Pemasukan') periodMasuk += k.nominal; else periodKeluar += k.nominal; }
    }
  });

  const savingRate = periodMasuk > 0 ? Math.max(0, Math.round(((periodMasuk - periodKeluar) / periodMasuk) * 100)) : 0;
  document.getElementById('dashSaldo').textContent = formatRupiah(balTunai + balBank + balEwallet);
  document.getElementById('dashTabungan').textContent = formatRupiah(totalTabungan);
  document.getElementById('balTunai').textContent = formatRupiah(balTunai);
  document.getElementById('balBank').textContent = formatRupiah(balBank);
  document.getElementById('balEwallet').textContent = formatRupiah(balEwallet);
  document.getElementById('periodMasuk').textContent = formatRupiah(periodMasuk);
  document.getElementById('periodKeluar').textContent = formatRupiah(periodKeluar);
  document.getElementById('savingRateText').textContent = `${savingRate}%`;

  const pct = Math.min(100, Math.round((keluarBulanIni / budgetLimit) * 100));
  const bar = document.getElementById('budgetBar');
  bar.style.width = pct + '%';
  bar.className = `h-full rounded-full transition-all duration-500 ${pct >= 90 ? 'bg-rose-500' : (pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500')}`;
  document.getElementById('budgetText').textContent = `${formatRupiah(keluarBulanIni)} / ${formatRupiah(budgetLimit)}`;
  document.getElementById('budgetHint').textContent = pct >= 100 ? '⚠️ Melewati batas budget bulanan!' : `Terpakai ${pct}% dari limit bulanan.`;

  const pendingSorted = [...dataTugas].filter(t => t.status === 'Pending').sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  document.getElementById('dashTugasList').innerHTML = pendingSorted.length ? pendingSorted.slice(0, 2).map(renderTugasCard).join('') : `<div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">Semua tugas beres!</div>`;

  renderJadwal();
  renderUjian();
  renderIpkCalculator();
  renderRutinitas();
  renderCharts(bulanFilter);
  renderGoals();
  renderPiutang();
  renderKeuanganList();
  renderTugas();
  updateSyncCounter();
  applyPrivacyState();
  lucide.createIcons();
}

applyUserProfile();
updateOnlineStatus();
renderAll();