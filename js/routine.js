function openRutinitasModal() { document.getElementById('modal-rutinitas').classList.remove('hidden'); }

function simpanRutinitas(e) {
  e.preventDefault();
  const siklus = Number(document.getElementById('rutinSiklus').value) || 7;
  const mulai = document.getElementById('rutinMulai').value || new Date().toISOString().split('T')[0];
  dataRutinitas.push({
    id: 'rut-' + Date.now(),
    nama: document.getElementById('rutinNama').value.trim(),
    siklus_hari: siklus,
    streak: 0,
    terakhir_selesai: '-',
    jadwal_berikutnya: mulai,
    catatan: document.getElementById('rutinCatatan').value.trim() || `Siklus tiap ${siklus} hari`,
    isSynced: false
  });
  e.target.reset();
  closeModal('modal-rutinitas');
  saveLocal();
  showToast('Rutinitas & Habit ditambahkan!');
}

function selesaikanRutinitas(id) {
  const r = dataRutinitas.find(item => item.id === id);
  if (!r) return;
  const todayStr = new Date().toISOString().split('T')[0];
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + Number(r.siklus_hari));

  r.streak = (r.streak || 0) + 1;
  r.terakhir_selesai = todayStr;
  r.jadwal_berikutnya = nextDate.toISOString().split('T')[0];
  r.isSynced = false;
  saveLocal();
  if (typeof confetti === 'function') confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 } });
  showToast(`🔥 Streak ${r.nama}: ${r.streak}x! Berikutnya: ${r.jadwal_berikutnya}`);
}

function hapusRutinitas(id) {
  if (!confirm('Hapus rutinitas ini?')) return;
  dataRutinitas = dataRutinitas.filter(r => r.id !== id);
  deletedRutinitas.push(id);
  saveLocal();
}

function renderRutinitas() {
  const today = new Date();
  document.getElementById('rutinitasList').innerHTML = dataRutinitas.length
    ? dataRutinitas.map(r => {
      const diff = Math.ceil((new Date(r.jadwal_berikutnya) - today) / 86400000);
      const dueLabel = diff <= 0 ? 'Waktunya Eksekusi!' : `${diff} hari lagi (${r.jadwal_berikutnya})`;
      const dueClass = diff <= 0 ? 'bg-amber-500 text-slate-950' : 'bg-indigo-500/10 text-indigo-500';
      return `
        <div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-2">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-500">🔥 ${r.streak || 0} Streak</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${dueClass}">${dueLabel}</span>
            </div>
            <h4 class="font-extrabold text-xs mt-1 truncate">${r.nama}</h4>
            <p class="text-[10px] text-slate-400">Siklus: tiap ${r.siklus_hari} hari • Terakhir: ${r.terakhir_selesai}</p>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <button onclick="selesaikanRutinitas('${r.id}')" class="px-2.5 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-xl active:scale-90 transition">✓ Selesai</button>
            <button onclick="hapusRutinitas('${r.id}')" class="text-slate-400 hover:text-rose-500 p-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
          </div>
        </div>`;
    }).join('')
    : `<div class="text-center py-4 text-xs text-slate-400">Belum ada habit / rutinitas berkala.</div>`;
}