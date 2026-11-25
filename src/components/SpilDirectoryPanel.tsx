import { useMemo, useState } from 'react';
import { Check, Info, Plus, Search, Trash2, X, ZoomIn } from 'lucide-react';
import {
  ALL_SPIL_OFFICES,
  SPIL_POSTER_IMAGE_PATH,
  type SpilOfficeInfo,
} from '../constants/spilDirectory';

interface SpilDirectoryPanelProps {
  branches: string[];
  selectedBranch: string;
  onSelectBranch: (branchName: string) => void;
  onOpenAddBranch?: () => void;
  onDeleteBranch?: (branchName: string) => void;
  onOpenPosterLightbox?: (title: string, src: string) => void;
  compact?: boolean;
}

interface UnifiedBranchItem {
  name: string;
  meta?: SpilOfficeInfo;
  isCustom: boolean;
}

export function SpilDirectoryPanel({
  branches,
  selectedBranch,
  onSelectBranch,
  onOpenAddBranch,
  onDeleteBranch,
  onOpenPosterLightbox,
  compact = false,
}: SpilDirectoryPanelProps) {
  const [search, setSearch] = useState('');
  const [expandedName, setExpandedName] = useState<string | null>(null);

  const officeLookup = useMemo(() => {
    const map = new Map<string, SpilOfficeInfo>();
    ALL_SPIL_OFFICES.forEach((o) => {
      map.set(o.branchOptionName.toLowerCase(), o);
    });
    return map;
  }, []);

  const unifiedBranches = useMemo<UnifiedBranchItem[]>(() => {
    return branches.map((name) => {
      const meta = officeLookup.get(name.toLowerCase());
      return {
        name,
        meta,
        isCustom: !meta,
      };
    });
  }, [branches, officeLookup]);

  const filteredBranches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return unifiedBranches;
    return unifiedBranches.filter((item) => {
      const haystack = `${item.name} ${item.meta?.address || ''} ${item.meta?.email || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [unifiedBranches, search]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header + Banner */}
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 truncate">
              Pilih Cabang PT SPIL ({branches.length})
            </h3>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              Aktif: <span className="font-semibold text-spilgreen-700">{selectedBranch}</span>
            </p>
          </div>

          {onOpenAddBranch && (
            <button
              type="button"
              onClick={onOpenAddBranch}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-spilgreen-50 hover:bg-spilgreen-100 border border-spilgreen-200 text-spilgreen-800 text-xs font-bold flex items-center gap-1 whitespace-nowrap shrink-0 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cabang</span>
            </button>
          )}
        </div>

        {/* Banner Photo */}
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
          <img
            src={SPIL_POSTER_IMAGE_PATH}
            alt="PT Salam Pacific Indonesia Lines — Kita Indonesia"
            referrerPolicy="no-referrer"
            className="w-full h-auto aspect-[1200/480] object-cover cursor-zoom-in"
            onClick={() =>
              onOpenPosterLightbox?.(
                'PT Salam Pacific Indonesia Lines — Kita Indonesia',
                SPIL_POSTER_IMAGE_PATH,
              )
            }
          />
          <button
            type="button"
            onClick={() =>
              onOpenPosterLightbox?.(
                'PT Salam Pacific Indonesia Lines — Kita Indonesia',
                SPIL_POSTER_IMAGE_PATH,
              )
            }
            className="absolute bottom-2 right-2 min-h-[32px] px-2.5 py-1 rounded-lg bg-slate-900/75 hover:bg-slate-900 text-white text-[11px] font-semibold flex items-center gap-1 transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Perbesar</span>
          </button>
        </div>

        {/* Single Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama cabang atau kota..."
            className="w-full h-10 pl-9 pr-9 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-spilgreen-600 outline-none text-xs sm:text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Hapus pencarian cabang"
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center absolute right-1.5 top-1/2 -translate-y-1/2 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Simple Clickable List */}
      <div
        className={`${
          compact ? 'max-h-[260px]' : 'max-h-[380px]'
        } overflow-y-auto divide-y divide-slate-100`}
      >
        {filteredBranches.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            Cabang &ldquo;{search}&rdquo; tidak ditemukan.
          </div>
        ) : (
          filteredBranches.map((item) => {
            const isSelected = selectedBranch === item.name;
            const isExpanded = expandedName === item.name;

            return (
              <div
                key={item.name}
                className={`px-4 py-2 transition ${
                  isSelected ? 'bg-spilgreen-50/80' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectBranch(item.name)}
                    className="min-h-[36px] flex-1 min-w-0 text-left flex items-center gap-2"
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-spilgreen-600 text-white'
                          : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </span>
                    <span
                      className={`text-xs sm:text-sm truncate ${
                        isSelected
                          ? 'font-bold text-spilgreen-800'
                          : 'font-semibold text-slate-800'
                      }`}
                    >
                      {item.name}
                    </span>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.meta && (
                      <button
                        type="button"
                        onClick={() => setExpandedName(isExpanded ? null : item.name)}
                        aria-label={`Lihat detail ${item.name}`}
                        className={`min-h-[32px] px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                          isExpanded
                            ? 'bg-spilgreen-100 text-spilgreen-800'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Detail</span>
                      </button>
                    )}

                    {item.isCustom && onDeleteBranch && (
                      <button
                        type="button"
                        onClick={() => onDeleteBranch(item.name)}
                        aria-label={`Hapus ${item.name}`}
                        className="min-h-[32px] px-2 py-1 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-spilred-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && item.meta && (
                  <div className="mt-1.5 ml-6 pt-1.5 border-t border-slate-100 text-xs text-slate-600 space-y-0.5">
                    <p>{item.meta.address}</p>
                    <p className="text-[11px] text-slate-500">
                      {item.meta.tel && <span>Telp: {item.meta.tel} · </span>}
                      {item.meta.fax && <span>Fax: {item.meta.fax} · </span>}
                      <span className="font-mono text-spilgreen-700">{item.meta.email}</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
