import { useState, useCallback, useRef, useEffect } from 'react';
import { usePeopleRepository } from '../context/PeopleRepositoryContext';
import {
  PersonRef,
  PersonEntry,
  PersonType,
  ProfessionalCategory,
  isPersonRef,
  isPersonRefArray,
  normalizePersonName,
} from '../lib/personRepositoryTypes';
import { User, Plus, Check, AlertCircle, X, Building2 } from 'lucide-react';

type PersonPickerProps = {
  label: string;
  value?: PersonRef | PersonRef[] | string | string[] | undefined;
  onChange: (value: PersonRef | PersonRef[] | undefined) => void;
  placeholder?: string;
  required?: boolean;
  multi?: boolean;
  description?: string;
  // Contextual filtering
  filterTypes?: PersonType[];
  excludeRoleTypes?: string[];
  onlyActive?: boolean;
  // Auto-populate fields when creating a new person
  defaultPersonType?: PersonType;
  defaultRelationship?: string;
  defaultProfessionalCategory?: ProfessionalCategory;
  // Show additional fields in the add-new form
  showContactFields?: boolean;
};

const inputClasses =
  'w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';

export default function PersonPicker({
  label,
  value,
  onChange,
  placeholder = 'Select or add a person',
  required = false,
  multi = false,
  description,
  filterTypes,
  defaultPersonType = 'trusted',
  defaultRelationship,
  defaultProfessionalCategory,
  showContactFields = false,
}: PersonPickerProps) {
  const { people, getOrCreatePerson, checkSimilar, createPerson, getPersonById } = usePeopleRepository();
  const [showAddNew, setShowAddNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCity, setNewCity] = useState('');
  const [similarMatches, setSimilarMatches] = useState<PersonEntry[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize incoming value to refs
  const currentRefs: PersonRef[] = (() => {
    if (!value) return [];
    if (Array.isArray(value)) {
      if (isPersonRefArray(value)) return value;
      return (value as string[]).filter(Boolean).map(name => ({
        personId: '',
        displayName: name,
      }));
    }
    if (isPersonRef(value)) return [value];
    if (typeof value === 'string' && value.trim()) {
      return [{ personId: '', displayName: value }];
    }
    return [];
  })();

  const selectedNames = currentRefs.map(r => r.displayName);

  // Filter people by context
  const filteredPeople = people.filter(p => {
    if (!p.active) return false;
    if (filterTypes && filterTypes.length > 0 && !filterTypes.includes(p.personType)) return false;
    return true;
  });

  const handleSelectExisting = useCallback(async (entry: PersonEntry) => {
    const ref: PersonRef = { personId: entry.id, displayName: entry.displayName };
    if (multi) {
      const existing = currentRefs.filter(r => r.personId !== entry.id && r.displayName !== entry.displayName);
      onChange([...existing, ref]);
    } else {
      onChange(ref);
    }
    setDropdownOpen(false);
    setShowAddNew(false);
    setSimilarMatches([]);
    setNewName('');
  }, [multi, currentRefs, onChange]);

  const handleAddNewClick = useCallback(() => {
    setShowAddNew(true);
    setDropdownOpen(false);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewCity('');
    setSimilarMatches([]);
  }, []);

  const handleNameInput = useCallback((text: string) => {
    setNewName(text);
    if (text.trim().length >= 3) {
      const similar = checkSimilar(text);
      setSimilarMatches(similar);
    } else {
      setSimilarMatches([]);
    }
  }, [checkSimilar]);

  const handleConfirmNew = useCallback(async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setIsCreating(true);
    try {
      const entry = await createPerson(trimmed, {
        personType: defaultPersonType,
        relationship: defaultRelationship,
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
        city: newCity.trim() || undefined,
        professionalCategory: defaultProfessionalCategory,
      });
      if (entry) {
        await handleSelectExisting(entry);
      }
    } finally {
      setIsCreating(false);
    }
  }, [newName, newPhone, newEmail, newCity, createPerson, defaultPersonType, defaultRelationship, defaultProfessionalCategory, handleSelectExisting]);

  const handleUseSimilar = useCallback(async (entry: PersonEntry) => {
    await handleSelectExisting(entry);
  }, [handleSelectExisting]);

  const handleRemovePerson = useCallback((ref: PersonRef) => {
    if (multi) {
      const remaining = currentRefs.filter(r =>
        r.personId !== ref.personId || r.displayName !== ref.displayName
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
      if (typeof value === 'string' && value.trim() && !isPersonRef(value)) return true;
      if (Array.isArray(value) && value.length > 0 && !isPersonRefArray(value)) return true;
      return false;
    })();

    if (!needsMigration) return;

    const migrate = async () => {
      const names: string[] = [];
      if (typeof value === 'string') names.push(value);
      else if (Array.isArray(value)) (value as string[]).forEach(v => { if (typeof v === 'string' && v.trim()) names.push(v); });

      const refs: PersonRef[] = [];
      for (const name of names) {
        const entry = await getOrCreatePerson(name, { personType: defaultPersonType });
        if (entry) {
          refs.push({ personId: entry.id, displayName: entry.displayName });
        } else {
          refs.push({ personId: '', displayName: name });
        }
      }

      if (refs.length > 0) {
        onChange(multi ? refs : refs[0]);
      }
    };
    migrate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mb-6" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {description && (
        <p className="text-sm text-gray-400 italic mb-3">{description}</p>
      )}

      {/* Selected people display */}
      {currentRefs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {currentRefs.map((ref, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/40 border border-blue-700/50 rounded-lg text-sm text-blue-100"
            >
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              {ref.displayName}
              <button
                type="button"
                onClick={() => handleRemovePerson(ref)}
                className="ml-1 text-blue-300 hover:text-red-400 transition-colors"
                aria-label="Remove person"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Select / add dropdown */}
      {!showAddNew && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-left text-gray-400 hover:bg-gray-600 hover:text-gray-300 transition-all flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {currentRefs.length > 0 ? 'Add or change person' : placeholder}
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {filteredPeople.length > 0 ? (
                filteredPeople.map(person => {
                  const isSelected = selectedNames.some(n =>
                    normalizePersonName(n) === person.normalizedName
                  );
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => handleSelectExisting(person)}
                      className="w-full px-4 py-2.5 text-left text-gray-300 hover:bg-gray-600 transition-colors flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        {person.personType === 'professional' ? (
                          <Building2 className="w-3.5 h-3.5 text-gray-500" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-gray-500" />
                        )}
                        {person.displayName}
                        {person.relationship && (
                          <span className="text-xs text-gray-500">({person.relationship})</span>
                        )}
                        {person.firm && (
                          <span className="text-xs text-gray-500">— {person.firm}</span>
                        )}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-gray-500 text-sm">
                  No people added yet
                </div>
              )}

              <div className="border-t border-gray-600">
                <button
                  type="button"
                  onClick={handleAddNewClick}
                  className="w-full px-4 py-2.5 text-left text-blue-400 hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add another person
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add new person form */}
      {showAddNew && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => handleNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName.trim()) {
                  e.preventDefault();
                  handleConfirmNew();
                }
              }}
              placeholder="Full name"
              autoFocus
              className={inputClasses}
            />
            <button
              type="button"
              onClick={handleConfirmNew}
              disabled={!newName.trim() || isCreating}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isCreating ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddNew(false);
                setNewName('');
                setSimilarMatches([]);
              }}
              className="px-3 py-3 text-gray-400 hover:text-gray-300 transition-colors flex-shrink-0"
            >
              Cancel
            </button>
          </div>

          {/* Optional contact fields */}
          {showContactFields && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Phone (optional)"
                className={inputClasses}
              />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email (optional)"
                className={inputClasses}
              />
              <input
                type="text"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="City (optional)"
                className={inputClasses}
              />
            </div>
          )}

          {/* Similar person detection */}
          {similarMatches.length > 0 && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-700/40 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-200 mb-2">
                    Is this the same as one of these existing people?
                  </p>
                  <div className="space-y-1.5">
                    {similarMatches.map(match => (
                      <div
                        key={match.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-sm text-yellow-100">
                          {match.displayName}
                          {match.relationship && ` (${match.relationship})`}
                        </span>
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
                      No, keep as "{newName.trim()}"
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
