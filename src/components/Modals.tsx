import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Lock, Trash2, X } from 'lucide-react';
import {
  FIVE_R_ASPECTS,
  formatDateTime,
  getGradeInfo,
  getReportPhotosList,
  scoreToPercent,
} from '../constants/fiveR';
import type { AreaItem, FiveRReport } from '../types/fiveR';
import { SpilDirectoryPanel } from './SpilDirectoryPanel';

interface SimpleMasterModalProps {
  isOpen: boolean;
  title: string;
  subtitle: string;
  inputLabel: string;
  inputPlaceholder: string;
  listTitle: string;
  items: string[];
  submitLabel: string;
  onClose: () => void;
  onAdd: (value: string) => boolean;
  onDelete: (value: string) => void;
}

export function SimpleMasterModal({
  isOpen,
  title,
  subtitle,
  inputLabel,
  inputPlaceholder,
  listTitle,
  items,
  submitLabel,
  onClose,
  onAdd,
  onDelete,
}: SimpleMasterModalProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isOpen) setValue('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    if (onAdd(trimmed)) {
      setValue('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">{inputLabel}</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full h-12 px-3.5 rounded-xl border border-slate-200 focus:border-spilgreen-600 outline-none font-semibold text-sm"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">{listTitle}</p>
            <div className="max-h-40 overflow-y-auto flex flex-wrap gap-1.5">
              {items.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800"
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="text-slate-500 hover:text-spilred-600 font-bold px-0.5"
                    aria-label={`Hapus ${item}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-spilgreen-600 hover:bg-spilgreen-700 text-white font-bold text-sm transition"
          >
            {submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}

interface AddAreaModalProps {
  isOpen: boolean;
  divisions: string[];
  areas: AreaItem[];
  presetDivision: string;
  onClose: () => void;
  onOpenAddDivision: () => void;
  onAddArea: (area: AreaItem, goToSend: boolean) => boolean;
}

export function AddAreaModal({
  isOpen,
  divisions,
  areas,
  presetDivision,
  onClose,
  onOpenAddDivision,
  onAddArea,
}: AddAreaModalProps) {
  const [name, setName] = useState('');
  const [dept, setDept] = useState(presetDivision || divisions[0] || '');
  const submitActionRef = useRef<'save' | 'send'>('send');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDept(presetDivision || divisions[0] || '');
    }
  }, [isOpen, presetDivision, divisions]);

  if (!isOpen) return null;

  const generateUniqueCode = () => {
    let nextNum = areas.length + 1;
    let candidate = '';
    do {
      candidate = `SPIL-AREA-${String(nextNum).padStart(2, '0')}`;
      nextNum += 1;
    } while (areas.some((a) => a.code.toUpperCase() === candidate));
    return candidate;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedDept = dept.trim();
    if (!trimmedName || !trimmedDept) return;

    const generatedCode = generateUniqueCode();
    const ok = onAddArea(
      { code: generatedCode, name: trimmedName, dept: trimmedDept, isCustomUser: true },
      submitActionRef.current === 'send',
    );
    if (ok) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Tambah Area Inspeksi Baru</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cukup isi nama lokasi dan divisi, area langsung siap dipilih.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Nama Area / Lokasi *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Misal: Depo Petikemas Blok C"
              className="w-full h-12 px-3.5 rounded-xl border border-slate-200 focus:border-spilgreen-600 outline-none font-semibold text-sm"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Divisi *</label>
              <button
                type="button"
                onClick={onOpenAddDivision}
                className="text-xs font-bold text-spilgreen-700 hover:underline"
              >
                + Tambah Divisi
              </button>
            </div>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="w-full h-12 px-3.5 rounded-xl border border-slate-200 bg-white focus:border-spilgreen-600 outline-none font-semibold text-sm"
              required
            >
              {divisions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="submit"
              onClick={() => {
                submitActionRef.current = 'save';
              }}
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition"
            >
              Simpan Saja
            </button>
            <button
              type="submit"
              onClick={() => {
                submitActionRef.current = 'send';
              }}
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-spilgreen-600 hover:bg-spilgreen-700 text-white font-bold text-sm transition"
            >
              Simpan &amp; Upload Foto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ReportDetailModalProps {
  report: FiveRReport | null;
  isHseUnlocked: boolean;
  onClose: () => void;
  onOpenHseGrading: (reportId: string) => void;
  onDeleteReport: (reportId: string) => void;
  onOpenLightbox: (title: string, src: string) => void;
}

export function ReportDetailModal({
  report,
  isHseUnlocked,
  onClose,
  onOpenHseGrading,
  onDeleteReport,
  onOpenLightbox,
}: ReportDetailModalProps) {
  if (!report) return null;

  const isPending = report.status === 'pending';
  const grade =
    !isPending && report.avgScore !== null ? getGradeInfo(report.avgScore) : null;
  const photosList = getReportPhotosList(report);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <h3 className="font-bold text-slate-900 text-base">Detail Laporan 5R</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
            aria-label="Tutup detail"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500">
                <span className="font-bold text-spilgreen-700">{report.branch}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono font-semibold text-slate-700">{report.areaCode}</span>
              </div>
              <h4 className="text-lg font-extrabold text-slate-900 mt-1">{report.areaName}</h4>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                {report.dept} · Dikirim {formatDateTime(report.timestamp)}
              </p>
            </div>
            <div className="text-right shrink-0 tabular-nums">
              {isPending ? (
                <span className="text-xs font-bold text-amber-700">Menunggu HSE</span>
              ) : (
                <span
                  className={`text-sm font-extrabold ${
                    grade ? grade.textClass : 'text-spilgreen-700'
                  }`}
                >
                  {scoreToPercent(report.avgScore ?? 0)}% ({report.avgScore?.toFixed(1)}/5.0)
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs sm:text-sm space-y-1">
            <div>
              <span className="text-slate-500">Pengirim (Cabang/Kantor):</span>{' '}
              <span className="font-bold text-slate-900">{report.senderName}</span>
            </div>
            <div>
              <span className="text-slate-500">Penilai (Tim HSE):</span>{' '}
              <span className="font-bold text-spilgreen-700">
                {report.hseEvaluator || 'Belum dinilai'}
              </span>
            </div>
          </div>

          {!isPending && report.scores && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-600">Nilai Tim HSE (Persentase &amp; Skor)</p>
              <div className="grid grid-cols-5 gap-2 text-center">
                {FIVE_R_ASPECTS.map((asp) => {
                  const val = report.scores?.[asp.key] ?? 0;
                  return (
                    <div
                      key={asp.key}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white tabular-nums"
                    >
                      <div className="font-mono text-[11px] font-bold text-spilgreen-700">
                        {asp.code}
                      </div>
                      <div className="text-base sm:text-lg font-extrabold text-slate-900">
                        {scoreToPercent(val)}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{val}/5</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {report.senderNotes && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-600">Keterangan Pengirim</p>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {report.senderNotes}
              </p>
            </div>
          )}

          {!isPending && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-600">Catatan Evaluasi Tim HSE</p>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {report.hseNotes || (
                  <span className="italic text-slate-400">
                    Tidak ada catatan tambahan dari Tim HSE.
                  </span>
                )}
              </p>
            </div>
          )}

          {photosList.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-600 tabular-nums">
                Foto Bukti Kiriman ({photosList.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {photosList.map((p) => (
                  <div
                    key={`${p.code}-${p.index}`}
                    className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50"
                  >
                    <div className="px-3 py-1.5 bg-white border-b border-slate-100 text-xs font-bold text-slate-800">
                      {p.code} · {p.title}
                      {p.totalInAspect > 1 ? ` (#${p.index + 1})` : ''}
                    </div>
                    <img
                      src={p.src}
                      onClick={() =>
                        onOpenLightbox(
                          `${p.code} · ${p.title}${p.totalInAspect > 1 ? ` (#${p.index + 1})` : ''}`,
                          p.src,
                        )
                      }
                      alt={`Bukti ${p.title} ${p.index + 1}`}
                      className="w-full h-44 object-contain bg-slate-100 cursor-zoom-in"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenHseGrading(report.id);
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-spilgreen-600 hover:bg-spilgreen-700 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 transition"
            >
              {!isHseUnlocked && <Lock className="w-3.5 h-3.5 shrink-0" />}
              <span>
                {!isHseUnlocked
                  ? 'Buka Kunci & Nilai (Tim HSE)'
                  : isPending
                    ? 'Nilai Sekarang (Tim HSE)'
                    : 'Edit Nilai HSE'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onDeleteReport(report.id)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-spilred-600 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LightboxModalProps {
  title: string;
  src: string | null;
  onClose: () => void;
}

export function LightboxModal({ title, src, onClose }: LightboxModalProps) {
  if (!src) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] bg-slate-950/90 flex flex-col items-center justify-center p-4"
    >
      <div
        className="w-full max-w-3xl flex items-center justify-between text-white mb-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-bold text-sm sm:text-base">{title}</p>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold flex items-center gap-1.5"
        >
          <X className="w-4 h-4" />
          <span>Tutup</span>
        </button>
      </div>
      <img
        src={src}
        alt={title}
        className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

interface SpilDirectoryModalProps {
  isOpen: boolean;
  branches: string[];
  selectedBranch: string;
  onClose: () => void;
  onSelectBranch: (branchName: string) => void;
  onOpenAddBranch: () => void;
  onDeleteBranch: (branchName: string) => void;
  onOpenPosterLightbox: (title: string, src: string) => void;
}

export function SpilDirectoryModal({
  isOpen,
  branches,
  selectedBranch,
  onClose,
  onSelectBranch,
  onOpenAddBranch,
  onDeleteBranch,
  onOpenPosterLightbox,
}: SpilDirectoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 z-10 bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Daftar Cabang &amp; Kantor PT SPIL
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik cabang untuk memilih langsung atau lihat detail kontak resmi.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 shrink-0"
            aria-label="Tutup daftar cabang"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5">
          <SpilDirectoryPanel
            branches={branches}
            selectedBranch={selectedBranch}
            onSelectBranch={(branchName) => {
              onSelectBranch(branchName);
              onClose();
            }}
            onOpenAddBranch={() => {
              onClose();
              onOpenAddBranch();
            }}
            onDeleteBranch={onDeleteBranch}
            onOpenPosterLightbox={onOpenPosterLightbox}
          />
        </div>
      </div>
    </div>
  );
}

interface ChangeHsePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePin: (currentPin: string, newPin: string) => boolean;
}

export function ChangeHsePinModal({
  isOpen,
  onClose,
  onSavePin,
}: ChangeHsePinModalProps) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setShowPins(false);
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanedNew = newPin.trim();
    if (cleanedNew.length < 4 || cleanedNew.length > 24) {
      setErrorMsg('PIN baru harus terdiri dari 4 sampai 24 karakter.');
      return;
    }
    if (cleanedNew !== confirmPin.trim()) {
      setErrorMsg('Konfirmasi PIN baru tidak cocok.');
      return;
    }
    const ok = onSavePin(currentPin.trim(), cleanedNew);
    if (ok) {
      onClose();
    } else {
      setErrorMsg('PIN saat ini salah.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Ubah PIN Akses Tim HSE</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hanya anggota Tim HSE yang mengetahui PIN ini yang dapat menilai.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
            aria-label="Tutup modal PIN"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">PIN Saat Ini *</label>
              <button
                type="button"
                onClick={() => setShowPins((v) => !v)}
                className="text-xs font-semibold text-spilgreen-700 inline-flex items-center gap-1 hover:underline"
              >
                {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPins ? 'Sembunyikan' : 'Tampilkan'}</span>
              </button>
            </div>
            <input
              type={showPins ? 'text' : 'password'}
              maxLength={24}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              placeholder="Masukkan PIN saat ini"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-spilgreen-600 outline-none font-mono font-bold text-sm tracking-wider"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              PIN Baru (4–24 huruf/angka) *
            </label>
            <input
              type={showPins ? 'text' : 'password'}
              maxLength={24}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="Minimal 4 karakter (huruf atau angka)"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-spilgreen-600 outline-none font-mono font-bold text-sm tracking-wider"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Konfirmasi PIN Baru *</label>
            <input
              type={showPins ? 'text' : 'password'}
              maxLength={24}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Ulangi PIN baru"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-spilgreen-600 outline-none font-mono font-bold text-sm tracking-wider"
              required
            />
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-spilred-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-spilgreen-600 hover:bg-spilgreen-700 text-white font-bold text-sm transition"
          >
            Simpan PIN Baru
          </button>
        </form>
      </div>
    </div>
  );
}
