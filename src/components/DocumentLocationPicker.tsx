import { useState, useCallback, useRef, useEffect } from 'react';
import { useDocumentLocations } from '../context/DocumentLocationContext';
import {
  DocumentLocationRef,
  DocumentLocationEntry,
  isLocationRef,
  isLocationRefArray,
  normalizeLocationLabel,
} from '../lib/documentLocationTypes';
import { MapPin, Plus, Check, AlertCircle, X } from 'lucide-react';

type DocumentLocationPickerProps = {
  label: string;
  value?: DocumentLocationRef | DocumentLocationRef[] | string | string[] | undefined;
  onChange: (value: DocumentLocationRef | DocumentLocationRef[] | undefined) => void;
  placeholder?: string;
  required?: boolean;
  multi?: boolean;
  description?: string;
};

const inputClasses =
  'w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';

export default function DocumentLocationPicker({
  label,
  value,
  onChange,
  placeholder = 'Select or add a location',
  required = false,
  multi = false,
  description,
}: DocumentLocationPickerProps) {
  const { locations, getOrCreateLocation, checkSimilar, createLocation, getLocationById } = useDocumentLocations();
  const [showAddNew, setShowAddNew] = useState(false);
  const [newLocationText, setNewLocationText] = useState('');
  const [similarMatches, setSimilarMatches] = useState<DocumentLocationEntry[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize incoming value to refs
  const currentRefs: DocumentLocationRef[] = (() => {
    if (!value) return [];
    if (Array.isArray(value)) {
      if (isLocationRefArray(value)) return value;
      return (value as string[]).filter(Boolean).map((label, i) => ({
        locationId: '',
        label,
      }));
    }
    if (isLocationRef(value)) return [value];
    if (typeof value === 'string' && value.trim()) {
      return [{ locationId: '', label: value }];
    }
    return [];
  })();

  const selectedLabels = currentRefs.map(r => r.label);

  const handleSelectExisting = useCallback(async (entry: DocumentLocationEntry) => {
    const ref: DocumentLocationRef = { locationId: entry.id, label: entry.canonicalLabel };
    if (multi) {
      const existing = currentRefs.filter(r => r.locationId !== entry.id && r.label !== entry.canonicalLabel);
      onChange([...existing, ref]);
    } else {
      onChange(ref);
    }
    setDropdownOpen(false);
    setShowAddNew(false);
    setSimilarMatches([]);
    setNewLocationText('');
  }, [multi, currentRefs, onChange]);

  const handleAddNewClick = useCallback(() => {
    setShowAddNew(true);
    setDropdownOpen(false);
    setNewLocationText('');
    setSimilarMatches([]);
  }, []);

  const handleNewLocationInput = useCallback((text: string) => {
    setNewLocationText(text);
    if (text.trim().length >= 3) {
      const similar = checkSimilar(text);
      setSimilarMatches(similar);
    } else {
      setSimilarMatches([]);
    }
  }, [checkSimilar]);

  const handleConfirmNewLocation = useCallback(async () => {
    const trimmed = newLocationText.trim();
    if (!trimmed) return;

    setIsCreating(true);
    try {
      const entry = await createLocation(trimmed);
      if (entry) {
        await handleSelectExisting(entry);
      }
    } finally {
      setIsCreating(false);
    }
  }, [newLocationText, createLocation, handleSelectExisting]);

  const handleUseSimilar = useCallback(async (entry: DocumentLocationEntry) => {
    await handleSelectExisting(entry);
  }, [handleSelectExisting]);

  const handleRemoveLocation = useCallback((ref: DocumentLocationRef) => {
    if (multi) {
      const remaining = currentRefs.filter(r =>
        r.locationId !== ref.locationId || r.label !== ref.label
      );
      onChange(remaining.length > 0 ? remaining : undefined);
    } else {
      onChange(undefined);
    }
  }, [multi, currentRefs, onChange]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Migrate legacy string values to refs on mount
  useEffect(() => {
    if (!value) return;
    const needsMigration = (() => {
      if (typeof value === 'string' && value.trim() && !isLocationRef(value)) return true;
      if (Array.isArray(value) && value.length > 0 && !isLocationRefArray(value)) return true;
      return false;
    })();

    if (!needsMigration) return;

    const migrate = async () => {
      const labels: string[] = [];
      if (typeof value === 'string') labels.push(value);
      else if (Array.isArray(value)) (value as string[]).forEach(v => { if (typeof v === 'string' && v.trim()) labels.push(v); });

      const refs: DocumentLocationRef[] = [];
      for (const label of labels) {
        const entry = await getOrCreateLocation(label);
        if (entry) {
          refs.push({ locationId: entry.id, label: entry.canonicalLabel });
        } else {
          refs.push({ locationId: '', label });
        }
      }

      if (refs.length > 0) {
        onChange(multi ? refs : refs[0]);
      }
    };
    migrate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeLocations = locations.filter(l => l.active);

  return (
    <div className="mb-6" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {description && (
        <p className="text-sm text-gray-400 italic mb-3">{description}</p>
      )}

      {/* Selected locations display */}
      {currentRefs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {currentRefs.map((ref, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/40 border border-blue-700/50 rounded-lg text-sm text-blue-100"
            >
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              {ref.label}
              <button
                type="button"
                onClick={() => handleRemoveLocation(ref)}
                className="ml-1 text-blue-300 hover:text-red-400 transition-colors"
                aria-label="Remove location"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add location dropdown */}
      {!showAddNew && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-left text-gray-400 hover:bg-gray-600 hover:text-gray-300 transition-all flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {currentRefs.length > 0 ? 'Add or change location' : placeholder}
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {activeLocations.length > 0 ? (
                activeLocations.map(loc => {
                  const isSelected = selectedLabels.some(l =>
                    normalizeLocationLabel(l) === loc.normalizedLabel
                  );
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => handleSelectExisting(loc)}
                      className="w-full px-4 py-2.5 text-left text-gray-300 hover:bg-gray-600 transition-colors flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        {loc.canonicalLabel}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-gray-500 text-sm">
                  No locations added yet
                </div>
              )}

              <div className="border-t border-gray-600">
                <button
                  type="button"
                  onClick={handleAddNewClick}
                  className="w-full px-4 py-2.5 text-left text-blue-400 hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add another location
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add new location form */}
      {showAddNew && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newLocationText}
              onChange={(e) => handleNewLocationInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newLocationText.trim()) {
                  e.preventDefault();
                  handleConfirmNewLocation();
                }
              }}
              placeholder="e.g., Home safe, lawyer's office, filing cabinet"
              autoFocus
              className={inputClasses}
            />
            <button
              type="button"
              onClick={handleConfirmNewLocation}
              disabled={!newLocationText.trim() || isCreating}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isCreating ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddNew(false);
                setNewLocationText('');
                setSimilarMatches([]);
              }}
              className="px-3 py-3 text-gray-400 hover:text-gray-300 transition-colors flex-shrink-0"
            >
              Cancel
            </button>
          </div>

          {/* Similar location detection */}
          {similarMatches.length > 0 && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-700/40 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-200 mb-2">
                    Is this the same as one of these existing locations?
                  </p>
                  <div className="space-y-1.5">
                    {similarMatches.map(match => (
                      <div
                        key={match.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-sm text-yellow-100">{match.canonicalLabel}</span>
                        <button
                          type="button"
                          onClick={() => handleUseSimilar(match)}
                          className="text-xs px-2.5 py-1 bg-yellow-700/40 text-yellow-100 rounded hover:bg-yellow-700/60 transition-colors"
                        >
                          Yes, use this
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSimilarMatches([])}
                      className="text-xs text-yellow-300 hover:text-yellow-200 transition-colors mt-1"
                    >
                      No, keep as "{newLocationText.trim()}"
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
