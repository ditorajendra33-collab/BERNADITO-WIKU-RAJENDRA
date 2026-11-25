import type {
  AreaItem,
  FiveRAspectKey,
  FiveRAspectMeta,
  FiveRPhotos,
  FiveRReport,
  FiveRScores,
} from '../types/fiveR';
import { ALL_SPIL_OFFICES } from './spilDirectory';

export const STORAGE_KEYS = {
  RECORDS: 'spil_5r_reports_v3',
  AREAS: 'spil_5r_areas_v3',
  DIVISIONS: 'spil_5r_divisions_v3',
  BRANCHES: 'spil_5r_branches_v4',
  SENDERS: 'spil_5r_senders_v3',
  HSE_TEAM: 'spil_5r_hse_team_v3',
  HSE_PIN: 'spil_5r_hse_pin_v2',
  LAST_BRANCH: 'spil_5r_last_branch_v4',
  LAST_SENDER: 'spil_5r_last_sender_v3',
  LAST_HSE: 'spil_5r_last_hse_v3',
} as const;

export const DEFAULT_HSE_PIN = 'HSESPIL2026';

export const DEFAULT_BRANCHES: string[] = ALL_SPIL_OFFICES.map(
  (office) => office.branchOptionName,
);

export const DEFAULT_DIVISIONS: string[] = [
  'Operasional Depo & Container Yard',
  'Terminal & Dermaga',
  'Logistik & Gudang CFS',
  'Workshop & Alat Berat',
  'Armada & Operasional Kapal',
  'HSE & Quality',
  'Kantor & General Affairs',
];

export const DEFAULT_SENDERS: string[] = [
  'Budi Santoso (PIC Surabaya)',
  'Rina Kusuma (PIC Jakarta)',
  'Ahmad Fauzi (PIC Makassar)',
  'Dian Permata (Kantor)',
];

export const DEFAULT_HSE_TEAM: string[] = [
  'Siti Rahma (HSE Lead)',
  'Andi Wijaya (HSE Officer)',
  'Dewi Lestari (HSE Auditor)',
];

export const DEFAULT_AREAS: AreaItem[] = [
  { code: 'SPIL-DEPO-01', name: 'Depo Petikemas Utama (CY-01)', dept: 'Operasional Depo & Container Yard' },
  { code: 'SPIL-TRM-01', name: 'Area Dermaga & Bongkar Muat', dept: 'Terminal & Dermaga' },
  { code: 'SPIL-CFS-01', name: 'Gudang CFS & Stuffing LCL', dept: 'Logistik & Gudang CFS' },
  { code: 'SPIL-WKS-01', name: 'Workshop Alat Berat & Reach Stacker', dept: 'Workshop & Alat Berat' },
  { code: 'SPIL-MNT-01', name: 'Area Repair & Washing Container', dept: 'Operasional Depo & Container Yard' },
  { code: 'SPIL-OFF-01', name: 'Kantor Operasional & Pelayanan Pelanggan', dept: 'Kantor & General Affairs' },
];

export const FIVE_R_ASPECTS: FiveRAspectMeta[] = [
  {
    key: 'ringkas',
    code: 'R1',
    shortTitle: 'Ringkas',
    title: 'Ringkas (Seiri)',
    desc: 'Memilah barang/peralatan yang diperlukan dan menyingkirkan barang tidak terpakai dari area kerja.',
  },
  {
    key: 'rapi',
    code: 'R2',
    shortTitle: 'Rapi',
    title: 'Rapi (Seiton)',
    desc: 'Penataan alat, dokumen, palet, dan container sesuai marka zona dengan identitas/label jelas.',
  },
  {
    key: 'resik',
    code: 'R3',
    shortTitle: 'Resik',
    title: 'Resik (Seiso)',
    desc: 'Kebersihan lantai, yard, mesin, meja kerja, bebas debu, ceceran oli, atau sampah berserakan.',
  },
  {
    key: 'rawat',
    code: 'R4',
    shortTitle: 'Rawat',
    title: 'Rawat (Seiketsu)',
    desc: 'Standarisasi visual control, jadwal piket/inspeksi rutin, dan konsistensi menjaga 3R pertama.',
  },
  {
    key: 'rajin',
    code: 'R5',
    shortTitle: 'Rajin',
    title: 'Rajin (Shitsuke)',
    desc: 'Kedisiplinan personel mematuhi SOP 5R, penggunaan APD wajib, serta budaya kerja berkelanjutan.',
  },
];

export const SCORE_LABELS: Record<number, { text: string; activeClass: string }> = {
  1: { text: '1 - Sangat Kurang', activeClass: 'bg-spilred-600 text-white border-spilred-600' },
  2: { text: '2 - Kurang', activeClass: 'bg-orange-500 text-white border-orange-500' },
  3: { text: '3 - Cukup', activeClass: 'bg-amber-500 text-white border-amber-500' },
  4: { text: '4 - Baik', activeClass: 'bg-spilgreen-500 text-white border-spilgreen-500' },
  5: { text: '5 - Sangat Baik', activeClass: 'bg-spilgreen-700 text-white border-spilgreen-700' },
};

export function createEmptyPhotos(): FiveRPhotos {
  return { ringkas: [], rapi: [], resik: [], rawat: [], rajin: [] };
}

export function normalizeReportPhotos(rawPhotos: unknown): FiveRPhotos {
  const empty = createEmptyPhotos();
  if (!rawPhotos || typeof rawPhotos !== 'object') return empty;
  const record = rawPhotos as Record<string, unknown>;
  FIVE_R_ASPECTS.forEach((asp) => {
    const val = record[asp.key];
    if (Array.isArray(val)) {
      empty[asp.key] = val.filter((item): item is string => typeof item === 'string' && item.length > 0);
    } else if (typeof val === 'string' && val.length > 0) {
      empty[asp.key] = [val];
    }
  });
  return empty;
}

export function createEmptyScores(): FiveRScores {
  return { ringkas: 0, rapi: 0, resik: 0, rawat: 0, rajin: 0 };
}

export function scoreToPercent(scoreOutOfFive: number): number {
  if (!Number.isFinite(scoreOutOfFive) || scoreOutOfFive <= 0) return 0;
  return Math.round((scoreOutOfFive / 5) * 100);
}

export function getGradeInfo(avg: number): {
  label: string;
  textClass: string;
  surfaceClass: string;
  darkBadgeClass: string;
} {
  if (avg >= 4.5) {
    return {
      label: 'Sangat Baik (A)',
      textClass: 'text-spilgreen-700',
      surfaceClass: 'bg-spilgreen-50 text-spilgreen-800 border-spilgreen-200',
      darkBadgeClass: 'bg-spilgreen-500 text-white',
    };
  }
  if (avg >= 3.8) {
    return {
      label: 'Baik (B)',
      textClass: 'text-teal-700',
      surfaceClass: 'bg-teal-50 text-teal-800 border-teal-200',
      darkBadgeClass: 'bg-teal-600 text-white',
    };
  }
  if (avg >= 3.0) {
    return {
      label: 'Cukup (C)',
      textClass: 'text-amber-700',
      surfaceClass: 'bg-amber-50 text-amber-800 border-amber-200',
      darkBadgeClass: 'bg-amber-500 text-white',
    };
  }
  return {
    label: 'Perlu Perbaikan (D)',
    textClass: 'text-spilred-600',
    surfaceClass: 'bg-rose-50 text-spilred-700 border-rose-200',
    darkBadgeClass: 'bg-spilred-600 text-white',
  };
}

export function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface ReportPhotoEntry {
  key: FiveRAspectKey;
  code: string;
  title: string;
  shortTitle: string;
  src: string;
  index: number;
  totalInAspect: number;
}

export function getReportPhotosList(item: FiveRReport): ReportPhotoEntry[] {
  const result: ReportPhotoEntry[] = [];
  if (item.photos) {
    FIVE_R_ASPECTS.forEach((asp) => {
      const rawVal = (item.photos as Record<string, unknown>)[asp.key];
      const list = Array.isArray(rawVal)
        ? rawVal.filter((s): s is string => typeof s === 'string' && s.length > 0)
        : typeof rawVal === 'string' && rawVal.length > 0
          ? [rawVal]
          : [];
      list.forEach((src, index) => {
        result.push({
          key: asp.key,
          code: asp.code,
          title: asp.title,
          shortTitle: asp.shortTitle,
          src,
          index,
          totalInAspect: list.length,
        });
      });
    });
  }
  return result;
}

export function createDemoSamplePhoto(
  labelR: string,
  areaText: string,
  branchText: string,
  bgHex: string,
): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = bgHex || '#ecfdf5';
    ctx.fillRect(0, 0, 480, 300);

    ctx.fillStyle = '#006130';
    ctx.fillRect(0, 0, 480, 56);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`FOTO BUKTI ${labelR} — PT SPIL`, 20, 36);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, 78, 432, 168);
    ctx.strokeStyle = '#86efac';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 78, 432, 168);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(areaText, 40, 122);

    ctx.fillStyle = '#007a3d';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(branchText, 40, 152);

    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    ctx.fillText('Contoh foto kiriman cabang untuk dinilai Tim HSE (1–5)', 40, 195);
    ctx.fillText('Klik foto ini di mode Penilai HSE untuk memperbesar.', 40, 218);

    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText('5R PT SPIL • Lampiran Bukti Lapangan', 24, 276);

    return canvas.toDataURL('image/jpeg', 0.72);
  } catch {
    return '';
  }
}

export function generateDemoRecords(): FiveRReport[] {
  const now = Date.now();
  const hour = 3600000;
  const day = 86400000;

  return [
    {
      id: 'SPIL-205',
      status: 'pending',
      timestamp: new Date(now - 1 * hour).toISOString(),
      branch: 'Kantor Pusat Surabaya',
      areaCode: 'SPIL-DEPO-01',
      areaName: 'Depo Petikemas Utama (CY-01)',
      dept: 'Operasional Depo & Container Yard',
      senderName: 'Budi Santoso (PIC Surabaya)',
      senderNotes: 'Foto kondisi blok CY-01 pagi ini setelah pembersihan jalur trailer. Mohon penilaian Tim HSE.',
      photos: {
        ringkas: [
          createDemoSamplePhoto('R1 RINGKAS #1', 'Zona Penyimpanan Container CY-01', 'Kantor Pusat Surabaya', '#f0fdf4'),
          createDemoSamplePhoto('R1 RINGKAS #2', 'Area Pemilahan Pallet Kosong CY-01', 'Kantor Pusat Surabaya', '#ecfdf5'),
        ],
        rapi: [createDemoSamplePhoto('R2 RAPI', 'Penataan Peralatan & Marka Jalur', 'Kantor Pusat Surabaya', '#ecfeff')],
        resik: [createDemoSamplePhoto('R3 RESIK', 'Kebersihan Lantai Yard & Drainase', 'Kantor Pusat Surabaya', '#f0fdf4')],
        rawat: [],
        rajin: [],
      },
      scores: null,
      totalScore: null,
      avgScore: null,
      hseEvaluator: '',
      hseNotes: '',
      reviewedAt: null,
    },
    {
      id: 'SPIL-204',
      status: 'pending',
      timestamp: new Date(now - 3 * hour).toISOString(),
      branch: 'Cabang Jakarta',
      areaCode: 'SPIL-CFS-01',
      areaName: 'Gudang CFS & Stuffing LCL',
      dept: 'Logistik & Gudang CFS',
      senderName: 'Rina Kusuma (PIC Jakarta)',
      senderNotes: 'Laporan foto mingguan gudang CFS dock 1–4. Ada beberapa palet yang sedang dirapikan.',
      photos: {
        ringkas: [createDemoSamplePhoto('R1 RINGKAS', 'Area Sorting Barang LCL', 'Cabang Jakarta', '#f0fdf4')],
        rapi: [],
        resik: [createDemoSamplePhoto('R3 RESIK', 'Lantai Loading Dock 1-4', 'Cabang Jakarta', '#fefce8')],
        rawat: [createDemoSamplePhoto('R4 RAWAT', 'Papan Jadwal Piket 5R CFS', 'Cabang Jakarta', '#f0fdf4')],
        rajin: [],
      },
      scores: null,
      totalScore: null,
      avgScore: null,
      hseEvaluator: '',
      hseNotes: '',
      reviewedAt: null,
    },
    {
      id: 'SPIL-203',
      status: 'reviewed',
      timestamp: new Date(now - 1 * day).toISOString(),
      branch: 'Cabang Makassar',
      areaCode: 'SPIL-OFF-01',
      areaName: 'Kantor Operasional & Pelayanan Pelanggan',
      dept: 'Kantor & General Affairs',
      senderName: 'Ahmad Fauzi (PIC Makassar)',
      senderNotes: 'Foto meja layanan pelanggan dan ruang arsip dokumen manifest.',
      photos: {
        ringkas: [createDemoSamplePhoto('R1 RINGKAS', 'Meja Layanan & Arsip Manifest', 'Cabang Makassar', '#f0fdf4')],
        rapi: [createDemoSamplePhoto('R2 RAPI', 'Rak Dokumen Berlabel', 'Cabang Makassar', '#ecfeff')],
        resik: [],
        rawat: [],
        rajin: [],
      },
      scores: { ringkas: 5, rapi: 5, resik: 5, rawat: 4, rajin: 5 },
      totalScore: 24,
      avgScore: 4.8,
      hseEvaluator: 'Siti Rahma (HSE Lead)',
      hseNotes: 'Foto sangat baik, arsip rapi dengan label jelas dan meja kerja bebas barang tidak perlu.',
      reviewedAt: new Date(now - 18 * hour).toISOString(),
    },
    {
      id: 'SPIL-202',
      status: 'reviewed',
      timestamp: new Date(now - 2 * day).toISOString(),
      branch: 'Kantor Pusat Surabaya',
      areaCode: 'SPIL-WKS-01',
      areaName: 'Workshop Alat Berat & Reach Stacker',
      dept: 'Workshop & Alat Berat',
      senderName: 'Budi Santoso (PIC Surabaya)',
      senderNotes: 'Kondisi bay servis alat berat setelah perbaikan forklift.',
      photos: {
        ringkas: [],
        rapi: [createDemoSamplePhoto('R2 RAPI', 'Shadow Board Kunci Workshop', 'Kantor Pusat Surabaya', '#fff7ed')],
        resik: [createDemoSamplePhoto('R3 RESIK', 'Lantai Bay Servis Alat Berat', 'Kantor Pusat Surabaya', '#fef2f2')],
        rawat: [],
        rajin: [],
      },
      scores: { ringkas: 3, rapi: 3, resik: 2, rawat: 3, rajin: 3 },
      totalScore: 14,
      avgScore: 2.8,
      hseEvaluator: 'Andi Wijaya (HSE Officer)',
      hseNotes: 'Terlihat ceceran oli di lantai bay servis pada foto R3 dan kunci pas belum kembali ke papan alat.',
      reviewedAt: new Date(now - 36 * hour).toISOString(),
    },
  ];
}

export function exportReportsToCSV(data: FiveRReport[]): void {
  const headers = [
    'ID Laporan',
    'Status',
    'Tanggal Kirim',
    'Cabang / Kantor',
    'Kode Area',
    'Nama Area',
    'Divisi',
    'Nama Pengirim',
    'Nama Penilai HSE',
    'R1 Ringkas (%)',
    'R2 Rapi (%)',
    'R3 Resik (%)',
    'R4 Rawat (%)',
    'R5 Rajin (%)',
    'Nilai Akhir (%)',
    'Skor Rata-rata (1-5)',
    'Predikat',
    'Keterangan Pengirim',
    'Catatan Tim HSE',
    'Foto Bukti 5R',
  ];

  const csvRows = [headers.join(',')];

  data.forEach((item) => {
    const isRev = item.status === 'reviewed' && item.scores !== null;
    const grade = isRev && item.avgScore !== null ? getGradeInfo(item.avgScore).label : 'Menunggu Penilaian HSE';
    const photosList = getReportPhotosList(item);
    const aspectPhotoParts = FIVE_R_ASPECTS.map((asp) => {
      const count = photosList.filter((p) => p.key === asp.key).length;
      return count > 0 ? `${asp.code} ${asp.shortTitle} (${count})` : null;
    }).filter(Boolean);
    const photoSummary =
      aspectPhotoParts.length > 0 ? aspectPhotoParts.join('; ') : 'Tidak Ada';

    const row = [
      item.id,
      isRev ? 'Sudah Dinilai HSE' : 'Menunggu Tim HSE',
      formatDateTime(item.timestamp),
      item.branch,
      item.areaCode,
      item.areaName,
      item.dept,
      item.senderName,
      item.hseEvaluator || '-',
      isRev && item.scores ? `${scoreToPercent(item.scores.ringkas)}%` : '-',
      isRev && item.scores ? `${scoreToPercent(item.scores.rapi)}%` : '-',
      isRev && item.scores ? `${scoreToPercent(item.scores.resik)}%` : '-',
      isRev && item.scores ? `${scoreToPercent(item.scores.rawat)}%` : '-',
      isRev && item.scores ? `${scoreToPercent(item.scores.rajin)}%` : '-',
      isRev && item.avgScore !== null ? `${scoreToPercent(item.avgScore)}%` : '-',
      isRev && item.avgScore !== null ? item.avgScore : '-',
      grade,
      item.senderNotes || '-',
      item.hseNotes || '-',
      photoSummary,
    ].map((val) => `"${String(val).replace(/"/g, '""')}"`);
    csvRows.push(row.join(','));
  });

  const csvContent = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `rekap-5r-pt-spil-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
