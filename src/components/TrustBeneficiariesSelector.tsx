import React, { useState } from 'react';
import { Trash2, Plus, User, Check } from 'lucide-react';

export type TrustBeneficiaryEntry = {
  beneficiaryName: string;
  relationshipToSettlor: string;
  countryOfResidence: string;
  phoneNumber: string;
  emailAddress: string;
  sourceId?: string;
  isOther?: boolean;
};

type FamilyMember = {
  id: string;
  name: string;
  relationship: string;
};

type Props = {
  label: string;
  entries: TrustBeneficiaryEntry[];
  familyMembers: FamilyMember[];
  onChange: (entries: TrustBeneficiaryEntry[]) => void;
};

export default function TrustBeneficiariesSelector({ label, entries, familyMembers, onChange }: Props) {
  const [showAddPanel, setShowAddPanel] = useState(false);

  const usedSourceIds = new Set(entries.filter((e) => e.sourceId && !e.isOther).map((e) => e.sourceId));
  const availableFamilyMembers = familyMembers.filter((m) => !usedSourceIds.has(m.id));

  const addFamilyMember = (member: FamilyMember) => {
    const newEntry: TrustBeneficiaryEntry = {
      beneficiaryName: member.name,
      relationshipToSettlor: member.relationship,
      countryOfResidence: '',
      phoneNumber: '',
      emailAddress: '',
      sourceId: member.id,
      isOther: false,
    };
    onChange([...entries, newEntry]);
    setShowAddPanel(false);
  };

  const addOther = () => {
    const newEntry: TrustBeneficiaryEntry = {
      beneficiaryName: '',
      relationshipToSettlor: '',
      countryOfResidence: '',
      phoneNumber: '',
      emailAddress: '',
      sourceId: `other_${Date.now()}`,
      isOther: true,
    };
    onChange([...entries, newEntry]);
    setShowAddPanel(false);
  };

  const updateEntry = (index: number, field: keyof TrustBeneficiaryEntry, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeEntry = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 mt-6">
      <h3 className="text-xl font-semibold text-white">{label}</h3>

      {entries.length === 0 && (
        <div className="border border-dashed border-gray-500 rounded-lg p-6 text-center">
          <p className="text-gray-400 text-sm">No beneficiaries have been added yet.</p>
          <p className="text-gray-500 text-xs mt-1">Click "Add a beneficiary" below to get started.</p>
        </div>
      )}

      {entries.map((entry, index) => (
        <div key={index} className="border border-gray-600 rounded-lg p-6 bg-gray-700 relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400">
                <User size={16} />
              </div>
              <h4 className="text-lg font-semibold text-white">Beneficiary {index + 1}</h4>
              {entry.isOther && (
                <span className="text-xs text-gray-400 bg-gray-600 px-2 py-0.5 rounded">Other</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeEntry(index)}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors"
              aria-label="Remove this beneficiary"
            >
              <Trash2 size={14} />
              Remove
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Beneficiary Name *</label>
              <input
                type="text"
                value={entry.beneficiaryName || ''}
                onChange={(e) => updateEntry(index, 'beneficiaryName', e.target.value)}
                placeholder="Enter beneficiary name"
                disabled={!entry.isOther}
                className={`w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !entry.isOther ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              />
              {!entry.isOther && (
                <p className="text-xs text-gray-500 mt-1">Selected from your family members</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Relationship to Settlor *</label>
              <p className="text-xs italic text-gray-400 mt-1 mb-2">e.g., Daughter, Son, Spouse, etc.</p>
              <input
                type="text"
                value={entry.relationshipToSettlor || ''}
                onChange={(e) => updateEntry(index, 'relationshipToSettlor', e.target.value)}
                placeholder=""
                disabled={!entry.isOther}
                className={`w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !entry.isOther ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Country of Residence</label>
              <input
                type="text"
                value={entry.countryOfResidence || ''}
                onChange={(e) => updateEntry(index, 'countryOfResidence', e.target.value)}
                placeholder="Enter country of residence"
                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
              <input
                type="tel"
                value={entry.phoneNumber || ''}
                onChange={(e) => updateEntry(index, 'phoneNumber', e.target.value)}
                placeholder="Enter phone number"
                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                value={entry.emailAddress || ''}
                onChange={(e) => updateEntry(index, 'emailAddress', e.target.value)}
                placeholder="Enter email address"
                className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      ))}

      {/* Add beneficiary panel */}
      {showAddPanel && (
        <div className="border border-blue-500/40 rounded-lg p-6 bg-gray-700">
          <h4 className="text-lg font-semibold text-white mb-1">Select a beneficiary to add</h4>
          <p className="text-sm text-gray-400 mb-4">Choose from your family members, or add someone else as "Other".</p>

          {availableFamilyMembers.length > 0 && (
            <div className="space-y-2 mb-4">
              {availableFamilyMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => addFamilyMember(member)}
                  className="w-full flex items-center justify-between p-3 border border-gray-600 bg-gray-600 rounded-lg hover:bg-gray-500 hover:border-blue-500 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-500 text-gray-300">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{member.name}</p>
                      <p className="text-xs text-gray-400">{member.relationship}</p>
                    </div>
                  </div>
                  <Plus size={18} className="text-gray-400" />
                </button>
              ))}
            </div>
          )}

          {availableFamilyMembers.length === 0 && familyMembers.length > 0 && (
            <p className="text-sm text-gray-400 mb-4 italic">All identified family members have already been added as beneficiaries.</p>
          )}

          {familyMembers.length === 0 && (
            <p className="text-sm text-gray-400 mb-4 italic">No family members have been identified yet in the questionnaire.</p>
          )}

          <button
            type="button"
            onClick={addOther}
            className="w-full flex items-center justify-between p-3 border border-dashed border-gray-500 bg-gray-600 rounded-lg hover:border-blue-500 hover:text-blue-400 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-500 text-gray-300">
                <Plus size={16} />
              </div>
              <div>
                <p className="text-white font-medium">Other</p>
                <p className="text-xs text-gray-400">Add a beneficiary not listed above</p>
              </div>
            </div>
            <Plus size={18} className="text-gray-400" />
          </button>

          <button
            type="button"
            onClick={() => setShowAddPanel(false)}
            className="mt-4 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Add beneficiary button + additional beneficiaries question */}
      {!showAddPanel && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowAddPanel(true)}
            className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-500 text-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-400 transition-colors"
          >
            <Plus size={18} />
            Add a beneficiary
          </button>

          {entries.length > 0 && (
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Are there additional beneficiaries to add?
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddPanel(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium"
                >
                  <Check size={16} />
                  Yes, add another
                </button>
                <div className="flex items-center px-4 py-2 text-gray-400 text-sm">
                  No, that's everyone
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
