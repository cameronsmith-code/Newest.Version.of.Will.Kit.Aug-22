import { Trash2 } from 'lucide-react';

export type PoaPropertyAttorneyData = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  city: string;
  province: string;
  country: string;
  isCanadaResident: string;
  knowsAppointment: string;
  hasDiscussedInstructions: string;
  knowsDocLocation: string;
  order: string;
};

type Props = {
  index: number;
  data: Partial<PoaPropertyAttorneyData>;
  clientName: string;
  variant: 'primary' | 'alternate';
  predefinedPeople: Array<{ name: string; phone?: string; city?: string }>;
  onChange: (field: keyof PoaPropertyAttorneyData, value: unknown) => void;
  onMultiChange: (updates: Partial<PoaPropertyAttorneyData>) => void;
  onRemove: () => void;
  canRemove: boolean;
};

const labelClass = 'block text-sm font-medium text-gray-300 mb-1';
const inputClass = 'w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
  'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
  'Quebec', 'Saskatchewan', 'Yukon',
];

const ORDERS = [
  { value: 'first', label: 'First alternate' },
  { value: 'second', label: 'Second alternate' },
  { value: 'other', label: 'Other' },
];

export default function PoaPropertyAttorneyDetails({
  index,
  data,
  clientName,
  variant,
  predefinedPeople,
  onChange,
  onMultiChange,
  onRemove,
  canRemove,
}: Props) {
  const title = variant === 'alternate' ? `Alternate Attorney ${index + 1}` : `Attorney ${index + 1}`;
  const displayName = data.name?.trim() || title;

  const handlePersonSelect = (selectedName: string) => {
    if (!selectedName) {
      onChange('name', '');
      return;
    }
    const person = predefinedPeople.find(p => p.name === selectedName);
    if (person) {
      onMultiChange({
        name: person.name,
        phone: person.phone || data.phone || '',
        city: person.city || data.city || '',
      });
    } else {
      onChange('name', selectedName);
    }
  };

  return (
    <div className="border border-gray-600 rounded-xl p-6 bg-gray-800 space-y-5 mt-2">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-600">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold shrink-0">
          {index + 1}
        </div>
        <h3 className="text-lg font-semibold text-white">{displayName}</h3>
        {canRemove && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onRemove(); }}
            aria-label={`Remove ${displayName}`}
            className="ml-auto inline-flex items-center gap-1.5 justify-center rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-400/10 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <Trash2 size={16} />
            Remove
          </button>
        )}
      </div>

      {/* Person selector from existing contacts */}
      {predefinedPeople.length > 0 && (
        <div>
          <label className={labelClass}>Select from existing contacts (optional)</label>
          <select
            value=""
            onChange={(e) => handlePersonSelect(e.target.value)}
            className={inputClass}
          >
            <option value="">— Add a new person, or select one below —</option>
            {predefinedPeople.map((p) => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Full name */}
      <div>
        <label className={labelClass}>Full name</label>
        <input
          type="text"
          value={data.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Enter full name"
          className={inputClass}
        />
      </div>

      {/* Relationship */}
      <div>
        <label className={labelClass}>Relationship to {clientName}</label>
        <input
          type="text"
          value={data.relationship || ''}
          onChange={(e) => onChange('relationship', e.target.value)}
          placeholder="e.g., Spouse, Son, Daughter, Friend"
          className={inputClass}
        />
      </div>

      {/* Phone */}
      <div>
        <label className={labelClass}>Phone</label>
        <input
          type="tel"
          value={data.phone || ''}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="Enter phone number"
          className={inputClass}
        />
      </div>

      {/* Email */}
      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          value={data.email || ''}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="Enter email address"
          className={inputClass}
        />
      </div>

      {/* City */}
      <div>
        <label className={labelClass}>City</label>
        <input
          type="text"
          value={data.city || ''}
          onChange={(e) => onChange('city', e.target.value)}
          placeholder="Enter city"
          className={inputClass}
        />
      </div>

      {/* Province/State */}
      <div>
        <label className={labelClass}>Province / State</label>
        <input
          type="text"
          value={data.province || ''}
          onChange={(e) => onChange('province', e.target.value)}
          placeholder="Enter province or state"
          className={inputClass}
        />
      </div>

      {/* Country */}
      <div>
        <label className={labelClass}>Country</label>
        <input
          type="text"
          value={data.country || ''}
          onChange={(e) => onChange('country', e.target.value)}
          placeholder="Enter country"
          className={inputClass}
        />
      </div>

      {/* Canadian resident? */}
      <div>
        <label className={labelClass}>Canadian resident?</label>
        <div className="flex gap-4">
          {['yes', 'no', 'unknown'].map((val) => (
            <label key={val} className="flex items-center">
              <input
                type="radio"
                name={`attorney-canada-${variant}-${index}`}
                value={val}
                checked={data.isCanadaResident === val}
                onChange={() => onChange('isCanadaResident', val)}
                className="mr-2"
              />
              <span className="text-gray-300 capitalize">{val === 'unknown' ? 'Unknown' : val === 'yes' ? 'Yes' : 'No'}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Order of appointment (alternates only) */}
      {variant === 'alternate' && (
        <div>
          <label className={labelClass}>Order of appointment (if specified in the document)</label>
          <select
            value={data.order || ''}
            onChange={(e) => onChange('order', e.target.value)}
            className={inputClass}
          >
            <option value="">Select order (optional)</option>
            {ORDERS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Readiness: knows appointment */}
      <div>
        <label className={labelClass}>
          Does {data.name?.trim() || `this attorney`} know they have been named as your attorney for property?
        </label>
        <div className="flex gap-4">
          {['yes', 'no', 'not_sure'].map((val) => (
            <label key={val} className="flex items-center">
              <input
                type="radio"
                name={`attorney-knows-${variant}-${index}`}
                value={val}
                checked={data.knowsAppointment === val}
                onChange={() => onChange('knowsAppointment', val)}
                className="mr-2"
              />
              <span className="text-gray-300">{val === 'not_sure' ? "I'm not sure" : val === 'yes' ? 'Yes' : 'No'}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Readiness: discussed instructions */}
      <div>
        <label className={labelClass}>
          Have you spoken with {data.name?.trim() || `this attorney`} about what you would want them to know if they ever needed to manage your financial affairs?
        </label>
        <div className="flex gap-4">
          {['yes', 'not_yet', 'not_sure'].map((val) => (
            <label key={val} className="flex items-center">
              <input
                type="radio"
                name={`attorney-discussed-${variant}-${index}`}
                value={val}
                checked={data.hasDiscussedInstructions === val}
                onChange={() => onChange('hasDiscussedInstructions', val)}
                className="mr-2"
              />
              <span className="text-gray-300">{val === 'not_sure' ? "I'm not sure" : val === 'yes' ? 'Yes' : 'Not yet'}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Knows document location */}
      <div>
        <label className={labelClass}>
          Does {data.name?.trim() || `this attorney`} know where the document is located or have access to a copy?
        </label>
        <div className="flex gap-4">
          {['yes', 'no', 'not_sure'].map((val) => (
            <label key={val} className="flex items-center">
              <input
                type="radio"
                name={`attorney-docloc-${variant}-${index}`}
                value={val}
                checked={data.knowsDocLocation === val}
                onChange={() => onChange('knowsDocLocation', val)}
                className="mr-2"
              />
              <span className="text-gray-300">{val === 'not_sure' ? "I'm not sure" : val === 'yes' ? 'Yes' : 'No'}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
