import React, { useState, useMemo } from 'react';
import { Plus, Building2, Landmark, User, AlertTriangle, Check, X } from 'lucide-react';
import { useEntityRegistry } from '../context/EntityRegistryContext';
import {
  EntityType,
  EntityEntry,
  ENTITY_TYPE_LABELS,
  COMPLETION_STATUS_LABELS,
} from '../lib/entityRegistryTypes';
import {
  inputClass,
  labelClass,
  subtleTextClass,
  OptionButton,
} from './FinancialFootprintShared';

type EntityPickerProps = {
  allowedTypes: EntityType[];
  selectedEntityId?: string;
  onSelect: (entity: EntityEntry) => void;
  sourceSection?: string;
  placeholder?: string;
  label?: string;
  excludeEntityIds?: string[];
};

const TYPE_ICONS: Record<EntityType, React.ReactNode> = {
  person: <User className="w-4 h-4" />,
  trust: <Landmark className="w-4 h-4" />,
  corporation: <Building2 className="w-4 h-4" />,
  partnership: <Building2 className="w-4 h-4" />,
  sole_proprietorship: <Building2 className="w-4 h-4" />,
  property: <Building2 className="w-4 h-4" />,
};

export default function EntityPicker({
  allowedTypes,
  selectedEntityId,
  onSelect,
  sourceSection,
  placeholder = 'Search or add an entity...',
  label = 'Select an entity',
  excludeEntityIds = [],
}: EntityPickerProps) {
  const { getEntitiesByType, checkSimilar, createEntity, getEntityById } = useEntityRegistry();
  const [searchText, setSearchText] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState<EntityType>(allowedTypes[0] || 'corporation');
  const [duplicateWarning, setDuplicateWarning] = useState<EntityEntry | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);

  const availableEntities = useMemo(() => {
    const excludeSet = new Set(excludeEntityIds);
    let result: EntityEntry[] = [];
    for (const t of allowedTypes) {
      result = result.concat(getEntitiesByType(t));
    }
    return result.filter((e) => !excludeSet.has(e.id));
  }, [allowedTypes, getEntitiesByType, excludeEntityIds]);

  const filteredEntities = useMemo(() => {
    if (!searchText.trim()) return availableEntities;
    const search = searchText.trim().toLowerCase();
    return availableEntities.filter((e) => e.displayName.toLowerCase().includes(search));
  }, [availableEntities, searchText]);

  const selectedEntity = selectedEntityId ? getEntityById(selectedEntityId) : undefined;

  const handleAddNew = async () => {
    const trimmed = newEntityName.trim();
    if (!trimmed) return;

    const duplicates = checkSimilar(trimmed, newEntityType);
    if (duplicates.length > 0 && !showDuplicates) {
      setDuplicateWarning(duplicates[0]);
      setShowDuplicates(true);
      return;
    }

    const result = await createEntity(trimmed, newEntityType, {
      sourceSection,
      completionStatus: 'identified',
    });
    onSelect(result.entity);
    setNewEntityName('');
    setShowAddNew(false);
    setShowDuplicates(false);
    setDuplicateWarning(null);
  };

  const handleUseExisting = () => {
    if (duplicateWarning) {
      onSelect(duplicateWarning);
    }
    setNewEntityName('');
    setShowAddNew(false);
    setShowDuplicates(false);
    setDuplicateWarning(null);
  };

  const handleCreateSeparate = async () => {
    const trimmed = newEntityName.trim();
    if (!trimmed) return;
    const result = await createEntity(trimmed, newEntityType, {
      sourceSection,
      completionStatus: 'identified',
    });
    onSelect(result.entity);
    setNewEntityName('');
    setShowAddNew(false);
    setShowDuplicates(false);
    setDuplicateWarning(null);
  };

  if (selectedEntity) {
    return (
      <div className="border border-blue-600/40 rounded-lg p-4 bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {TYPE_ICONS[selectedEntity.entityType]}
            <div>
              <p className="text-sm font-medium text-white">{selectedEntity.displayName}</p>
              <p className="text-xs text-gray-400">
                {ENTITY_TYPE_LABELS[selectedEntity.entityType]} · {COMPLETION_STATUS_LABELS[selectedEntity.completionStatus]}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelect({} as EntityEntry)}
            className="text-gray-400 hover:text-red-400"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className={labelClass}>{label}</label>

      <input
        type="text"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />

      {filteredEntities.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredEntities.map((e) => (
            <OptionButton
              key={e.id}
              label={`${e.displayName} — ${ENTITY_TYPE_LABELS[e.entityType]}${e.sourceSection ? ` · from ${e.sourceSection}` : ''}`}
              selected={false}
              onClick={() => onSelect(e)}
              icon={TYPE_ICONS[e.entityType]}
            />
          ))}
        </div>
      )}

      {filteredEntities.length === 0 && !showAddNew && (
        <p className={subtleTextClass}>
          {availableEntities.length === 0
            ? 'No entities exist yet. Add a new one below.'
            : 'No matches found. Add a new one below.'}
        </p>
      )}

      {!showAddNew && (
        <button
          type="button"
          onClick={() => {
            setShowAddNew(true);
            setNewEntityName(searchText);
            setSearchText('');
          }}
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-500 text-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-400 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          {allowedTypes.length === 1
            ? `Add new ${ENTITY_TYPE_LABELS[allowedTypes[0]].toLowerCase()}`
            : 'Add new entity'}
        </button>
      )}

      {showAddNew && (
        <div className="border border-blue-500/40 rounded-lg p-4 bg-gray-800 space-y-3">
          {allowedTypes.length > 1 && (
            <div>
              <label className={labelClass}>Entity type</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allowedTypes.map((t) => (
                  <OptionButton
                    key={t}
                    label={ENTITY_TYPE_LABELS[t]}
                    selected={newEntityType === t}
                    onClick={() => {
                      setNewEntityType(t);
                      setShowDuplicates(false);
                      setDuplicateWarning(null);
                    }}
                    icon={TYPE_ICONS[t]}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>Name</label>
            <input
              type="text"
              value={newEntityName}
              onChange={(e) => {
                setNewEntityName(e.target.value);
                setShowDuplicates(false);
                setDuplicateWarning(null);
              }}
              placeholder="Enter name"
              className={inputClass}
              autoFocus
            />
          </div>

          {duplicateWarning && showDuplicates && (
            <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-amber-300">Possible duplicate detected</p>
                  <p className="text-xs text-amber-200/80 mt-1">
                    "{duplicateWarning.displayName}" ({ENTITY_TYPE_LABELS[duplicateWarning.entityType]}) already exists.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleUseExisting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500"
                >
                  <Check className="w-3.5 h-3.5" />
                  Use existing
                </button>
                <button
                  type="button"
                  onClick={handleCreateSeparate}
                  className="px-3 py-1.5 bg-gray-700 text-gray-200 rounded-lg text-sm hover:bg-gray-600"
                >
                  Create separate entity
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddNew}
              disabled={!newEntityName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddNew(false);
                setNewEntityName('');
                setShowDuplicates(false);
                setDuplicateWarning(null);
              }}
              className="text-sm text-gray-400 hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
