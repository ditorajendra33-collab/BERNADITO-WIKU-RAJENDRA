import React, { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  Check,
  ChevronRight,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { FIVE_R_ASPECTS, createEmptyPhotos } from '../constants/fiveR';
import type { AreaItem, FiveRAspectKey, FiveRPhotos } from '../types/fiveR';
import { SpilDirectoryPanel } from './SpilDirectoryPanel';

interface SenderViewProps {
  branches: string[];
  divisions: string[];
  senders: string[];
  areas: AreaItem[];
  selectedBranch: string;
  selectedSender: string;
  selectedAreaCode: string | null;
  onChangeBranch: (branch: string) => void;
  onChangeSender: (sender: string) => void;
  onSelectArea: (code: string) => void;
  onClearSelectedArea: () => void;
  onOpenAddBranch: () => void;
  onDeleteBranch: (branch: string) => void;
  onOpenAddDivision: () => void;
  onOpenAddSender: () => void;
  onOpenAddArea: (presetDivision: string) => void;
  onDeleteArea: (code: string) => void;
  onOpenLightbox: (title: string, src: string) => void;
  onSubmitReport: (payload: {
    branch: string;
    senderName: string;
    areaCode: string;
    customArea?: { name: string; dept: string };
    photos: FiveRPhotos;
    senderNotes: string;
  }) => boolean;
  onShowToast: (msg: string) => void;
}

export function SenderView({
  branches,
  divisions,
  senders,
  areas,
  selectedBranch,
  selectedSender,
  selectedAreaCode,
  onChangeBranch,
  onChangeSender,
  onSelectArea,
  onClearSelectedArea,
  onOpenAddBranch,
  onDeleteBranch,
  onOpenAddDivision,
  onOpenAddSender,
  onOpenAddArea,
  onDeleteArea,
  onOpenLightbox,
  onSubmitReport,
  onShowToast,
}: SenderViewProps) {
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [areaSearch, setAreaSearch] = useState<string>('');

  const [formBranch, setFormBranch] = useState<string>(selectedBranch);
  const [formSenderName, setFormSenderName] = useState<string>(selectedSender);
  const [senderPhotos, setSenderPhotos] = useState<FiveRPhotos>(createEmptyPhotos);
  const [activePhotoAspect, setActivePhotoAspect] = useState<FiveRAspectKey>('ringkas');
  const [senderNotes, setSenderNotes] = useState<string>('');

  useEffect(() => {
    setFormBranch(selectedBranch);
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedSender) {
      setFormSenderName(selectedSender);
    }
  }, [selectedSender]);

  const matchedArea = selectedAreaCode
    ? areas.find((a) => a.code.toUpperCase() === selectedAreaCode.toUpperCase())
    : undefined;

  const prepareAreaForm = (code: string) => {
    setSenderPhotos(createEmptyPhotos());
    setActivePhotoAspect('ringkas');
    setSenderNotes('');
    setFormBranch(selectedBranch || branches[0] || '');
    setFormSenderName(selectedSender || formSenderName);
    onSelectArea(code);
  };

  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (typeof result !== 'string') {
          resolve('');
          return;
        }
        const img = new Image();
        img.onload = () => {
          const maxWidth = 640;
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.65));
          } else {
            resolve('');
          }
        };
        img.onerror = () => resolve('');
        img.src = result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const targetAspect = activePhotoAspect;
    const targetMeta = FIVE_R_ASPECTS.find((a) => a.key === targetAspect);

    const compressedList = (await Promise.all(files.map(compressImageFile))).filter(Boolean);
    if (compressedList.length === 0) return;

    setSenderPhotos((prev) => ({
      ...prev,
      [targetAspect]: [...prev[targetAspect], ...compressedList],
    }));

    if (targetMeta) {
      onShowToast(
        `${compressedList.length} foto ditambahkan ke ${targetMeta.code} (${targetMeta.shortTitle})`,
      );
    }
  };

  const handleRemovePhoto = (aspectKey: FiveRAspectKey, photoIndex: number) => {
    setSenderPhotos((prev) => ({
      ...prev,
      [aspectKey]: prev[aspectKey].filter((_, idx) => idx !== photoIndex),
    }));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAreaCode) return;

    const totalUploaded = FIVE_R_ASPECTS.reduce(
      (sum, asp) => sum + senderPhotos[asp.key].length,
      0,
    );
    if (totalUploaded === 0) {
      onShowToast('Unggah minimal 1 foto bukti 5R untuk dikirim ke Tim HSE');
      return;
    }

    if (!formBranch.trim() || !formSenderName.trim()) {
      onShowToast('Lengkapi Cabang/Kantor dan Nama Pengirim');
      return;
    }

    const ok = onSubmitReport({
      branch: formBranch,
      senderName: formSenderName.trim(),
      areaCode: selectedAreaCode,
      photos: senderPhotos,
      senderNotes: senderNotes.trim(),
    });

    if (ok) {
      setSenderPhotos(createEmptyPhotos());
      setSenderNotes('');
    }
  };

  const filteredAreas = useMemo(() => {
    const q = areaSearch.trim().toLowerCase();
    return areas.filter((a) => {
      const matchDiv = !selectedDivision || a.dept === selectedDivision;
      const matchQuery =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.dept.toLowerCase().includes(q);
      return matchDiv && matchQuery;
    });
  }, [areas, selectedDivision, areaSearch]);

  const uploadedPhotoItems = useMemo(() => {
    const list: Array<{
      key: FiveRAspectKey;
      code: string;
      title: string;
      shortTitle: string;
      src: string;
      index: number;
      totalInAspect: number;
    }> = [];
    FIVE_R_ASPECTS.forEach((asp) => {
      const arr = senderPhotos[asp.key];
      arr.forEach((src, index) => {
        list.push({
          key: asp.key,
          code: asp.code,
          title: asp.title,
          shortTitle: asp.shortTitle,
          src,
          index,
          totalInAspect: arr.length,
        });
      });
    });
    return list;
  }, [senderPhotos]);

  const coveredAspectsCount = FIVE_R_ASPECTS.filter(
    (a) => senderPhotos[a.key].length > 0,
  ).length;

  const activeAspectMeta =
    FIVE_R_ASPECTS.find((a) => a.key === activePhotoAspect) || FIVE_R_ASPECTS[0];

  return (
    <section className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-spilgreen-700">
            <span>Pelaporan Cabang &amp; Kantor</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-500">Dokumentasi Lapangan 5R</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {selectedAreaCode
              ? 'Unggah Foto Bukti Kondisi 5R'
              : 'Pilih Cabang & Area Inspeksi'}
          </h2>
          <p className="text-sm text-slate-600">
            {selectedAreaCode
              ? 'Ambil atau pilih foto bukti 5R, lalu kirim langsung ke antrean Tim HSE.'
              : 'Pilih cabang dan pengirim, lalu klik langsung salah satu area inspeksi untuk mulai upload foto.'}
          </p>
        </div>

        {selectedAreaCode && (
          <button
            type="button"
            onClick={() => {
              onClearSelectedArea();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold whitespace-nowrap shrink-0 transition"
          >
            ← Ganti Area
          </button>
        )}
      </div>

      {/* STEP 1: BRANCH & AREA SHORTLIST */}
      {!selectedAreaCode ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Official PT SPIL Branches Shortlist */}
          <div className="lg:col-span-5">
            <SpilDirectoryPanel
              branches={branches}
              selectedBranch={selectedBranch}
              onSelectBranch={(branchName) => {
                onChangeBranch(branchName);
                onShowToast(`Cabang "${branchName}" dipilih`);
              }}
              onOpenAddBranch={onOpenAddBranch}
              onDeleteBranch={onDeleteBranch}
              onOpenPosterLightbox={onOpenLightbox}
              compact
            />
          </div>

          {/* Right Column: Identity + Simple Area Shortlist */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Identitas &amp; Area Inspeksi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan Cabang &amp; Pengirim, lalu klik area yang ingin difoto.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenAddArea(selectedDivision)}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-spilgreen-600 hover:bg-spilgreen-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Area</span>
              </button>
            </div>

            {/* 3 Quick Selectors: Cabang, Pengirim, Filter Divisi */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="sender-branch-select"
                    className="text-xs font-bold text-slate-700"
                  >
                    Cabang / Kantor
                  </label>
                  <button
                    type="button"
                    onClick={onOpenAddBranch}
                    className="text-xs font-semibold text-spilgreen-700 hover:underline whitespace-nowrap"
                  >
                    + Cabang
                  </button>
                </div>
                <select
                  id="sender-branch-select"
                  value={selectedBranch}
                  onChange={(e) => onChangeBranch(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-spilgreen-600 outline-none font-medium text-sm text-slate-800"
                >
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="sender-name-select"
                    className="text-xs font-bold text-slate-700"
                  >
                    Nama Pengirim
                  </label>
                  <button
                    type="button"
                    onClick={onOpenAddSender}
                    className="text-xs font-semibold text-spilgreen-700 hover:underline whitespace-nowrap"
                  >
                    + Pengirim
                  </button>
                </div>
                <select
                  id="sender-name-select"
                  value={selectedSender}
                  onChange={(e) => onChangeSender(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-spilgreen-600 outline-none font-medium text-sm text-slate-800"
                >
                  <option value="">-- Pilih Pengirim --</option>
                  {senders.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="scanner-division-select"
                    className="text-xs font-bold text-slate-700"
                  >
                    Filter Divisi
                  </label>
                  <button
                    type="button"
                    onClick={onOpenAddDivision}
                    className="text-xs font-semibold text-spilgreen-700 hover:underline whitespace-nowrap"
                  >
                    + Divisi
                  </button>
                </div>
                <select
                  id="scanner-division-select"
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-spilgreen-600 outline-none font-medium text-sm text-slate-800"
                >
                  <option value="">Semua Divisi ({divisions.length})</option>
                  {divisions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Area Search + Simple Shortlist */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-700 tabular-nums">
                  Shortlist Area Inspeksi ({filteredAreas.length})
                </p>
                {(selectedDivision || areaSearch) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDivision('');
                      setAreaSearch('');
                    }}
                    className="text-xs font-semibold text-spilgreen-700 hover:underline self-start sm:self-auto"
                  >
                    Tampilkan Semua Area
                  </button>
                )}
              </div>

              {/* Search Area Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={areaSearch}
                  onChange={(e) => setAreaSearch(e.target.value)}
                  placeholder="Cari cepat nama area atau divisi..."
                  className="w-full h-10 pl-9 pr-9 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-spilgreen-600 outline-none text-xs sm:text-sm"
                />
                {areaSearch && (
                  <button
                    type="button"
                    onClick={() => setAreaSearch('')}
                    aria-label="Hapus pencarian area"
                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center absolute right-1.5 top-1/2 -translate-y-1/2 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {filteredAreas.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center space-y-2.5">
                  <p className="text-sm font-semibold text-slate-700">
                    Area inspeksi tidak ditemukan
                    {selectedDivision ? ` pada divisi "${selectedDivision}"` : ''}.
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {(selectedDivision || areaSearch) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDivision('');
                          setAreaSearch('');
                        }}
                        className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
                      >
                        Reset Filter
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenAddArea(selectedDivision)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-spilgreen-600 text-white text-xs font-bold hover:bg-spilgreen-700 transition"
                    >
                      + Tambah Area Baru
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                  {filteredAreas.map((area) => (
                    <div
                      key={area.code}
                      className="flex items-center justify-between gap-2 px-3.5 py-2.5 hover:bg-spilgreen-50/70 transition group"
                    >
                      <button
                        type="button"
                        onClick={() => prepareAreaForm(area.code)}
                        className="flex-1 min-w-0 min-h-[40px] text-left flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate group-hover:text-spilgreen-800 transition">
                            {area.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {area.dept}
                            {area.isCustomUser && ' · Tambahan'}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-spilgreen-700 inline-flex items-center gap-1 whitespace-nowrap shrink-0 group-hover:translate-x-0.5 transition">
                          <span>Pilih</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </button>

                      {area.isCustomUser && (
                        <button
                          type="button"
                          onClick={() => onDeleteArea(area.code)}
                          aria-label={`Hapus area ${area.name}`}
                          className="min-h-[36px] min-w-[36px] rounded-lg text-slate-400 hover:bg-rose-50 hover:text-spilred-600 flex items-center justify-center shrink-0 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* STEP 2: UPLOAD FORM (NO SCORES) */
        <form onSubmit={handleSubmitForm} className="space-y-6">
          {/* Selected Area Summary */}
          <div className="bg-spilgreen-800 text-white rounded-2xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-spilgreen-100">
                  <span>{formBranch || selectedBranch}</span>
                  <span aria-hidden="true">·</span>
                  <span>Dokumentasi Pelaporan Cabang</span>
                </div>
                <h3 className="text-xl font-bold leading-snug">
                  {matchedArea ? matchedArea.name : selectedAreaCode}
                </h3>
                <p className="text-sm text-spilgreen-100">
                  {matchedArea ? matchedArea.dept : 'Area Inspeksi PT SPIL'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClearSelectedArea}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold shrink-0 whitespace-nowrap transition"
              >
                Ganti Area
              </button>
            </div>
          </div>

          {/* Sender Identity */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="form-branch-select"
                  className="text-sm font-bold text-slate-900"
                >
                  Cabang / Kantor <span className="text-spilred-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={onOpenAddBranch}
                  className="text-xs font-semibold text-spilgreen-700 hover:underline"
                >
                  + Tambah Cabang
                </button>
              </div>
              <select
                id="form-branch-select"
                value={formBranch}
                onChange={(e) => setFormBranch(e.target.value)}
                className="w-full h-12 px-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-spilgreen-600 outline-none text-sm font-semibold text-slate-800"
                required
              >
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="sender-name-input"
                  className="text-sm font-bold text-slate-900"
                >
                  Nama Pengirim <span className="text-spilred-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={onOpenAddSender}
                  className="text-xs font-semibold text-spilgreen-700 hover:underline"
                >
                  + Daftar Pengirim
                </button>
              </div>
              <input
                id="sender-name-input"
                type="text"
                list="sender-datalist"
                value={formSenderName}
                onChange={(e) => setFormSenderName(e.target.value)}
                placeholder="Masukkan nama lengkap pengirim"
                className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-spilgreen-600 focus:ring-2 focus:ring-spilgreen-100 outline-none text-sm font-medium"
                required
              />
              <datalist id="sender-datalist">
                {senders.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Photo Upload per 5R Aspect */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Upload Foto Kondisi 5R untuk Dinilai Tim HSE
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap aspek 5R dapat diisi lebih dari 1 foto bukti lapangan (bisa pilih banyak
                  foto sekaligus dari galeri atau ambil berulang dari kamera).
                </p>
              </div>
              <span className="text-xs sm:text-sm font-bold text-spilgreen-700 tabular-nums shrink-0 whitespace-nowrap">
                {uploadedPhotoItems.length} Foto · {coveredAspectsCount}/5 Aspek
              </span>
            </div>

            {/* Aspect Selector */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600">1. Pilih Aspek 5R</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {FIVE_R_ASPECTS.map((asp) => {
                  const isSelected = activePhotoAspect === asp.key;
                  const count = senderPhotos[asp.key].length;
                  const hasPhoto = count > 0;
                  return (
                    <button
                      key={asp.key}
                      type="button"
                      onClick={() => setActivePhotoAspect(asp.key)}
                      className={`min-h-[54px] px-3 py-2 rounded-xl border-2 text-left transition flex items-center justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-spilgreen-600 text-white border-spilgreen-600'
                          : hasPhoto
                            ? 'bg-spilgreen-50 text-spilgreen-800 border-spilgreen-300'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div className="leading-tight min-w-0">
                        <div className="font-mono text-[11px] font-bold opacity-90">
                          {asp.code}
                        </div>
                        <div className="text-xs font-bold truncate">{asp.shortTitle}</div>
                      </div>
                      {hasPhoto && (
                        <span
                          className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-bold tabular-nums shrink-0 ${
                            isSelected ? 'text-white' : 'text-spilgreen-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{count}</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Aspect Guide */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900">
                {activeAspectMeta.code} — {activeAspectMeta.title}:
              </span>{' '}
              {activeAspectMeta.desc}
            </div>

            {/* Camera / Gallery Upload Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-600">
                  2. Tambah Foto untuk{' '}
                  <span className="text-spilgreen-700 font-bold">
                    {activeAspectMeta.code} - {activeAspectMeta.title}
                  </span>
                </p>
                {senderPhotos[activePhotoAspect].length > 0 && (
                  <span className="text-xs font-bold text-spilgreen-700 tabular-nums">
                    {senderPhotos[activePhotoAspect].length} foto terpasang di aspek ini
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="min-h-[52px] px-4 py-3 rounded-xl border-2 border-dashed border-spilgreen-400 bg-spilgreen-50/50 hover:bg-spilgreen-50 text-spilgreen-800 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition">
                  <Camera className="w-5 h-5 shrink-0" />
                  <span>
                    {senderPhotos[activePhotoAspect].length > 0 ? '+ Tambah via Kamera' : 'Kamera'} (
                    {activeAspectMeta.code} {activeAspectMeta.shortTitle})
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>

                <label className="min-h-[52px] px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition">
                  <Upload className="w-5 h-5 shrink-0" />
                  <span>
                    {senderPhotos[activePhotoAspect].length > 0
                      ? '+ Tambah Banyak Foto (Galeri)'
                      : 'Pilih Foto Galeri (Bisa Banyak)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>
            </div>

            {/* Preview Grid */}
            {uploadedPhotoItems.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                Belum ada foto bukti ditambahkan. Pilih salah satu aspek 5R di atas lalu ambil atau
                pilih foto (bisa lebih dari 1 foto per aspek).
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                <p className="text-xs font-semibold text-slate-600 tabular-nums">
                  {uploadedPhotoItems.length} Foto Siap Dikirim ke Tim HSE (klik foto untuk perbesar)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {uploadedPhotoItems.map((item) => (
                    <div
                      key={`${item.key}-${item.index}`}
                      className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col"
                    >
                      <div className="px-3 py-2 bg-white border-b border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {item.code} · {item.shortTitle}
                          {item.totalInAspect > 1 ? ` #${item.index + 1}` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(item.key, item.index)}
                          className="min-h-[32px] px-2.5 py-1 rounded-lg text-spilred-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1 shrink-0 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                      <img
                        src={item.src}
                        alt={`Foto ${item.title} ${item.index + 1}`}
                        onClick={() =>
                          onOpenLightbox(
                            `${item.code} · ${item.title}${item.totalInAspect > 1 ? ` (#${item.index + 1})` : ''}`,
                            item.src,
                          )
                        }
                        className="w-full h-44 object-contain bg-slate-100 cursor-zoom-in"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sender Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
            <label htmlFor="sender-notes" className="block text-sm font-bold text-slate-900">
              Keterangan / Laporan dari Cabang (Opsional)
            </label>
            <textarea
              id="sender-notes"
              rows={3}
              value={senderNotes}
              onChange={(e) => setSenderNotes(e.target.value)}
              placeholder="Tuliskan keterangan kondisi area atau informasi tambahan untuk Tim HSE..."
              className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-spilgreen-600 focus:ring-2 focus:ring-spilgreen-100 outline-none text-sm"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full min-h-[54px] rounded-xl bg-spilgreen-600 hover:bg-spilgreen-700 active:scale-[0.99] text-white font-bold text-base transition flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            <span>Kirim Foto 5R ke Tim HSE</span>
          </button>
        </form>
      )}
    </section>
  );
}
