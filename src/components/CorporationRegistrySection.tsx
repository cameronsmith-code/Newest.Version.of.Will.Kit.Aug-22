import { useState, useMemo, useEffect } from 'react';
import { Building2, Plus, Trash2 } from 'lucide-react';
import { useEntityRegistry } from '../context/EntityRegistryContext';
import {
  EntityEntry,
  COMPLETION_STATUS_LABELS,
} from '../lib/entityRegistryTypes';
import {
  subtleTextClass,
  SectionHeading,
  OptionButton,
} from './FinancialFootprintShared';
import EntityPicker from './EntityPicker';
import type { FamilyTrust } from '../lib/familyTrustTypes';
import { generateTrustEntityId } from '../lib/familyTrustTypes';

type CorporationRegistrySectionProps = {
  answers: Record<string, unknown>;
  onAnswerChange: (key: string, value: unknown) => void;
};

type CorpData = Record<string, string>;

export default function CorporationRegistrySection({
  answers,
  onAnswerChange,
}: CorporationRegistrySectionProps) {
  const {
    entities,
    getEntitiesByType,
    getOrCreateEntity,
    createRelationship,
    updateRelationship,
    removeRelationship,
    getOwnersOf,
    getOwnedBy,
    getEntityById,
    checkCircularOwnership,
  } = useEntityRegistry();

  const corporationsData = (answers['corporationsData'] as CorpData[]) || [];
  const hasAdditionalCorps = answers['hasAdditionalCorps'] as string;

  const registryCorps = useMemo(() => getEntitiesByType('corporation'), [getEntitiesByType, entities]);
  const registryTrusts = useMemo(() => getEntitiesByType('trust'), [getEntitiesByType, entities]);

  const [activeCorpEntityId, setActiveCorpEntityId] = useState<string | null>(null);
  const [showOwnershipPanel, setShowOwnershipPanel] = useState(false);
  const [showAddCorpPanel, setShowAddCorpPanel] = useState(false);
  const [newCorpName, setNewCorpName] = useState('');
  const [newCorpOwnerEntity, setNewCorpOwnerEntity] = useState<EntityEntry | null>(null);
  const [newCorpOwnershipPct, setNewCorpOwnershipPct] = useState('');

  const corpsFromRegistry = useMemo(() => {
    const sectionCorpNames = new Set(
      corporationsData.map((c) => c.legalName?.trim().toLowerCase()).filter(Boolean)
    );
    return registryCorps.filter((e) => !sectionCorpNames.has(e.displayName.trim().toLowerCase()));
  }, [registryCorps, corporationsData]);

  const syncCorporationToRegistry = async (corp: CorpData, index: number) => {
    if (!corp.legalName?.trim()) return;
    await getOrCreateEntity(corp.legalName, 'corporation', {
      sourceSection: 'corporations',
      sourceEntityRef: `corp_${index}`,
      completionStatus: corp.incorporatedInCanada && corp.corporationType ? 'partial' : 'identified',
      metadata: {
        incorporatedInCanada: corp.incorporatedInCanada,
        jurisdiction: corp.jurisdiction,
        corporationType: corp.corporationType,
      },
    });
  };

  useEffect(() => {
    corporationsData.forEach((corp, index) => {
      if (corp.legalName?.trim()) {
        syncCorporationToRegistry(corp, index);
      }
    });
  }, [corporationsData]);

  const handleAddOwner = async (
    targetCorpEntityId: string,
    ownerEntity: EntityEntry,
    ownershipPercentage: string
  ) => {
    const circular = checkCircularOwnership(ownerEntity.id, targetCorpEntityId);
    if (circular.blocked) {
      alert(circular.reason);
      return;
    }
    await createRelationship(ownerEntity.id, targetCorpEntityId, 'owns', {
      ownershipPercentage,
      metadata: { source: 'corporation_intake' },
    });

    if (ownerEntity.entityType === 'trust') {
      syncTrustHolding(ownerEntity.id, targetCorpEntityId, ownershipPercentage);
    }

    setShowOwnershipPanel(false);
  };

  const syncTrustHolding = (
    trustEntityId: string,
    corpEntityId: string,
    ownershipPercentage: string
  ) => {
    const trustData = (answers['familyTrustsData'] as FamilyTrust[]) || [];
    const trust = trustData.find((t) => t.entityId === trustEntityId);
    if (!trust) return;

    const existingHolding = trust.assetHoldings.find(
      (h) => h.corporationEntityId === corpEntityId
    );
    if (existingHolding) return;

    const newHolding = {
      id: generateTrustEntityId('hold'),
      assetType: 'private_corp_shares' as const,
      corporationEntityId: corpEntityId,
      ownershipPercentage,
    };

    const updatedTrusts = trustData.map((t) =>
      t.id === trust.id
        ? { ...t, assetHoldings: [...t.assetHoldings, newHolding] }
        : t
    );
    onAnswerChange('familyTrustsData', updatedTrusts);
  };

  const handleOwnershipPercentChange = async (
    relId: string,
    newPercentage: string
  ) => {
    await updateRelationship(relId, { ownershipPercentage: newPercentage });
  };

  const handleRemoveOwner = async (relId: string) => {
    await removeRelationship(relId);
  };

  const handleCompleteDetails = (corp: EntityEntry) => {
    const newCorps = [...corporationsData];
    const existingIndex = newCorps.findIndex(
      (c) => c.legalName?.trim().toLowerCase() === corp.displayName.trim().toLowerCase()
    );
    if (existingIndex === -1) {
      newCorps.push({ legalName: corp.displayName });
      onAnswerChange('corporationsData', newCorps);
      onAnswerChange('numberOfCorporations', String(newCorps.length));
    }
    setActiveCorpEntityId(null);
  };

  const handleAddNewCorp = async () => {
    if (!newCorpName.trim()) return;

    const result = await getOrCreateEntity(newCorpName, 'corporation', {
      sourceSection: 'corporations',
      sourceEntityRef: `corp_${corporationsData.length}`,
      completionStatus: 'identified',
    });

    const newCorps = [...corporationsData, { legalName: newCorpName.trim() }];
    onAnswerChange('corporationsData', newCorps);
    onAnswerChange('numberOfCorporations', String(newCorps.length));

    if (newCorpOwnerEntity?.id && result.entity?.id) {
      const circular = checkCircularOwnership(newCorpOwnerEntity.id, result.entity.id);
      if (!circular.blocked) {
        await createRelationship(newCorpOwnerEntity.id, result.entity.id, 'owns', {
          ownershipPercentage: newCorpOwnershipPct,
          metadata: { source: 'corporation_intake' },
        });

        if (newCorpOwnerEntity.entityType === 'trust') {
          syncTrustHolding(newCorpOwnerEntity.id, result.entity.id, newCorpOwnershipPct);
        }
      }
    }

    setNewCorpName('');
    setNewCorpOwnerEntity(null);
    setNewCorpOwnershipPct('');
    setShowAddCorpPanel(false);
  };

  return (
    <div className="space-y-6">
      {corpsFromRegistry.length > 0 && (
        <div className="space-y-4">
          <div className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              We already have {corpsFromRegistry.length} corporation{corpsFromRegistry.length > 1 ? 's' : ''} identified from earlier sections.
            </p>
          </div>

          {corpsFromRegistry.map((corp) => {
            const owners = getOwnersOf(corp.id);
            const ownedBy = getOwnedBy(corp.id);
            const isActive = activeCorpEntityId === corp.id;

            return (
              <div key={corp.id} className="border border-gray-600 rounded-lg p-6 bg-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    <div>
                      <h4 className="text-lg font-semibold text-white">{corp.displayName}</h4>
                      <p className="text-xs text-gray-400">
                        {COMPLETION_STATUS_LABELS[corp.completionStatus]}
                      </p>
                    </div>
                  </div>
                  {corp.completionStatus !== 'complete' && (
                    <button
                      type="button"
                      onClick={() => handleCompleteDetails(corp)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500"
                    >
                      Complete corporation details
                    </button>
                  )}
                </div>

                <div className="text-xs text-gray-400 space-y-1">
                  {corp.sourceSection && corp.sourceSection !== 'corporations' && (
                    <p>Identified earlier through {corp.sourceSection === 'familyTrusts' ? 'trust ownership' : corp.sourceSection}</p>
                  )}
                  {owners.length > 0 && (
                    <div className="pt-2">
                      <p className="text-gray-300 font-medium mb-1">Ownership identified earlier:</p>
                      {owners.map((rel) => {
                        const owner = getEntityById(rel.sourceEntityId);
                        return (
                          <div key={rel.id} className="flex items-center gap-2 ml-4">
                            <span className="text-gray-300">{owner?.displayName || 'Unknown'}</span>
                            <span className="text-gray-500">— {rel.ownershipPercentage || '---'}</span>
                            <input
                              type="text"
                              value={rel.ownershipPercentage || ''}
                              onChange={(e) => handleOwnershipPercentChange(rel.id, e.target.value)}
                              placeholder="edit %"
                              className="w-20 px-2 py-0.5 bg-gray-600 border border-gray-500 text-white text-xs rounded"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveOwner(rel.id)}
                              className="text-gray-500 hover:text-red-400 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {ownedBy.length > 0 && (
                    <div className="pt-2">
                      <p className="text-gray-300 font-medium mb-1">Owns:</p>
                      {ownedBy.map((rel) => {
                        const target = getEntityById(rel.targetEntityId);
                        return (
                          <div key={rel.id} className="flex items-center gap-2 ml-4">
                            <span className="text-gray-300">{target?.displayName || 'Unknown'}</span>
                            <span className="text-gray-500">{rel.ownershipPercentage || ''}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {isActive && showOwnershipPanel && (
                  <div className="mt-4 pt-4 border-t border-gray-600 space-y-3">
                    <EntityPicker
                      allowedTypes={['person', 'trust', 'corporation']}
                      onSelect={(entity) => {
                        if (entity.id) {
                          handleAddOwner(corp.id, entity, '');
                        }
                      }}
                      sourceSection="corporations"
                      label="Add an owner"
                      excludeEntityIds={[corp.id]}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOwnershipPanel(false)}
                      className="text-sm text-gray-400 hover:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {isActive && !showOwnershipPanel && (
                  <button
                    type="button"
                    onClick={() => setShowOwnershipPanel(true)}
                    className="mt-3 text-sm text-blue-400 hover:text-blue-300"
                  >
                    + Add owner
                  </button>
                )}

                {!isActive && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCorpEntityId(corp.id);
                      setShowOwnershipPanel(false);
                    }}
                    className="mt-3 text-sm text-gray-400 hover:text-gray-300"
                  >
                    View ownership details
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-gray-600 pt-4 space-y-4">
        <SectionHeading
          label="Additional Corporations"
          icon={<Building2 className="w-4 h-4" />}
        />
        <p className={subtleTextClass}>
          Do you either personally, through a trust, or through another corporation own or have an interest in any additional corporations?
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <OptionButton
            label="Yes"
            selected={hasAdditionalCorps === 'yes'}
            onClick={() => onAnswerChange('hasAdditionalCorps', 'yes')}
          />
          <OptionButton
            label="No"
            selected={hasAdditionalCorps === 'no'}
            onClick={() => onAnswerChange('hasAdditionalCorps', 'no')}
          />
        </div>
      </div>

      {hasAdditionalCorps === 'yes' && !showAddCorpPanel && (
        <button
          type="button"
          onClick={() => setShowAddCorpPanel(true)}
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-500 text-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-400 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Add another corporation
        </button>
      )}

      {hasAdditionalCorps === 'yes' && showAddCorpPanel && (
        <div className="border border-blue-500/40 rounded-lg p-5 bg-gray-800 space-y-4">
          <h4 className="text-sm font-medium text-white">Add a new corporation</h4>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Corporation legal name</label>
            <input
              type="text"
              value={newCorpName}
              onChange={(e) => setNewCorpName(e.target.value)}
              placeholder="Enter legal name of corporation"
              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Who owns this corporation?</label>
            <EntityPicker
              allowedTypes={['person', 'trust', 'corporation']}
              selectedEntityId={newCorpOwnerEntity?.id}
              onSelect={(entity) => setNewCorpOwnerEntity(entity)}
              sourceSection="corporations"
              label=""
              placeholder="Select an owner (Client, trust, or corporation)..."
            />
            {registryTrusts.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">Tip: trusts identified in the Family Trust section will appear here as potential owners.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ownership percentage (optional)</label>
            <input
              type="text"
              value={newCorpOwnershipPct}
              onChange={(e) => setNewCorpOwnershipPct(e.target.value)}
              placeholder="e.g., 100%"
              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddNewCorp}
              disabled={!newCorpName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Add corporation
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddCorpPanel(false);
                setNewCorpName('');
                setNewCorpOwnerEntity(null);
                setNewCorpOwnershipPct('');
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
