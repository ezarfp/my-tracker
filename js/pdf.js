function exportKeuanganPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const { label: tzLabel } = getActiveTimezoneConfig();

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN REKAPITULASI KEUANGAN', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${userProfile.nama} • ${userProfile.universitas}`, 14, 24);
  doc.text(`${userProfile.jurusan} (${userProfile.kelas}) • Dicetak: ${formatDisplayDate(getTodayDateStr())} ${getCurrentTimeStr()} ${tzLabel}`, 14, 29);

  let totIn = 0, totOut = 0;
  const rows = dataKeuangan.map((tx, idx) => {
    const nom = Number(tx.nominal) || 0;
    if (tx.jenis === 'Pemasukan') totIn += nom;
    else totOut += nom;
    return [
      idx + 1,
      formatDisplayDate(tx.tanggal),
      tx.jenis,
      tx.kategori,
      tx.akun,
      tx.catatan || '-',
      formatRupiah(nom)
    ];
  });

  doc.autoTable({
    startY: 35,
    head: [['No', 'Tanggal', 'Jenis', 'Kategori', 'Akun', 'Catatan', 'Nominal']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 8 }
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Pemasukan : ${formatRupiah(totIn)}`, 14, finalY);
  doc.text(`Total Pengeluaran : ${formatRupiah(totOut)}`, 14, finalY + 6);
  doc.text(`Selisih Bersih    : ${formatRupiah(totIn - totOut)}`, 14, finalY + 12);

  doc.save(`Laporan_Keuangan_${userProfile.nama.replace(/\s+/g, '_')}_${getTodayDateStr()}.pdf`);
  showToast('PDF Laporan Keuangan berhasil diunduh!');
}

function exportJadwalPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const { label: tzLabel } = getActiveTimezoneConfig();
  const urutanHari = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6 };

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('KARTU JADWAL PERKULIAHAN MINGGUAN', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nama: ${userProfile.nama} | Kelas/NIM: ${userProfile.kelas}`, 14, 24);
  doc.text(`Prodi: ${userProfile.jurusan} — ${userProfile.universitas} (Zona Waktu: ${tzLabel})`, 14, 29);

  const sorted = [...dataJadwal].sort((a, b) => (urutanHari[a.hari] || 9) - (urutanHari[b.hari] || 9));
  const rows = sorted.map((j, idx) => [
    idx + 1,
    j.hari,
    `${normalizeTimeStr(j.jam_mulai)} - ${normalizeTimeStr(j.jam_selesai)} ${tzLabel}`,
    j.kode,
    j.matkul,
    j.dosen,
    j.ruangan,
    `${j.hadir}/${j.total_pertemuan || 16}`
  ]);

  doc.autoTable({
    startY: 35,
    head: [['No', 'Hari', 'Waktu', 'Kode', 'Mata Kuliah', 'Dosen', 'Ruang', 'Hadir']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 8 }
  });

  doc.save(`Jadwal_Kuliah_${userProfile.kelas.replace(/\s+/g, '_')}.pdf`);
  showToast('PDF Jadwal Kuliah berhasil diunduh!');
}

function exportTranskripPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSKRIP SIMULASI NILAI & IPK', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nama: ${userProfile.nama} | Kelas/NIM: ${userProfile.kelas}`, 14, 24);
  doc.text(`Prodi: ${userProfile.jurusan} — ${userProfile.universitas}`, 14, 29);

  let totalSks = 0, totalMutu = 0;
  const rows = dataNilai.map((n, idx) => {
    const bt = Number(n.bobot_tugas) || 30;
    const bu = Number(n.bobot_uts) || 35;
    const ba = Number(n.bobot_uas) || 35;
    const akhir = ((Number(n.tugas) * bt) + (Number(n.uts) * bu) + (Number(n.uas) * ba)) / 100;
    const { huruf, mutu } = konversiIndeks(akhir);
    totalSks += Number(n.sks);
    totalMutu += mutu * Number(n.sks);

    return [
      idx + 1,
      n.matkul,
      n.sks,
      `${bt}/${bu}/${ba}%`,
      `${n.tugas} / ${n.uts} / ${n.uas}`,
      akhir.toFixed(1),
      huruf
    ];
  });

  doc.autoTable({
    startY: 35,
    head: [['No', 'Mata Kuliah', 'SKS', 'Bobot T/UTS/UAS', 'Nilai T/UTS/UAS', 'Akhir', 'Indeks']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 8 }
  });

  const ips = totalSks > 0 ? (totalMutu / totalSks).toFixed(2) : '0.00';
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total SKS Ditempuh : ${totalSks} SKS`, 14, finalY);
  doc.text(`Indeks Prestasi (IPS) : ${ips}`, 14, finalY + 6);

  doc.save(`Transkrip_Simulasi_${userProfile.nama.replace(/\s+/g, '_')}.pdf`);
  showToast('PDF Transkrip Nilai berhasil diunduh!');
}