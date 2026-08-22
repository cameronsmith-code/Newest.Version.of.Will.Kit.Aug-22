import { StepQuestion } from '../lib/steps';
import DocumentLocationPicker from './DocumentLocationPicker';
import PersonPicker from './PersonPicker';
import ProfessionalPicker from './ProfessionalPicker';

type FormFieldProps = {
  question: StepQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
  answers?: Map<string, Record<string, unknown>>;
};

export default function FormField({ question, value, onChange, answers }: FormFieldProps) {
  const { key, label, type, placeholder, options, required, max, allowOther, multi, description } = question;

  const resolvedOptions = typeof options === 'function' ? options(answers || new Map()) : options;

  const commonClasses =
    'w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';

  if (type === 'label') {
    return (
      <div className="mb-4 mt-6">
        <h3 className="text-lg font-semibold text-white">{label}</h3>
      </div>
    );
  }

  if (type === 'display') {
    return (
      <div className="mb-4 mt-6">
        <h3 className="text-xl font-semibold text-white">{label}</h3>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="mb-6">
        <label htmlFor={key} className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <textarea
          id={key}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={4}
          className={commonClasses}
        />
      </div>
    );
  }

  if (type === 'select') {
    return (
      <div className="mb-6">
        <label htmlFor={key} className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <select
          id={key}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={commonClasses}
        >
          <option value="">Select an option</option>
          {resolvedOptions?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === 'checkbox-group') {
    const selectedValues = (value as string[]) || [];
    const otherEntries = selectedValues.filter(v => v.startsWith('other:'));
    const otherValues = otherEntries.map(v => v.slice(6));
    const presetValues = selectedValues.filter(v => !v.startsWith('other:'));

    const addOther = () => {
      const next = `other:New Obligation ${otherValues.length + 1}`;
      onChange([...selectedValues, next]);
    };
    const removeOther = (entry: string) => {
      onChange(selectedValues.filter(v => v !== entry));
    };
    const renameOther = (entry: string, newName: string) => {
      onChange(selectedValues.map(v => v === entry ? `other:${newName}` : v));
    };

    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        {description && (
          <p className="text-sm text-gray-400 italic mb-3">{description}</p>
        )}
        <div className="space-y-2">
          {resolvedOptions?.map((opt) => (
            <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={presetValues.includes(opt.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selectedValues, opt.value]);
                  } else {
                    onChange(selectedValues.filter(v => v !== opt.value));
                  }
                }}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
              />
              <span className="ml-3 text-gray-300">{opt.label}</span>
            </label>
          ))}

          {allowOther && otherEntries.map((entry) => (
            <div key={entry} className="flex items-center gap-2 p-3 border border-gray-600 bg-gray-700 rounded-lg">
              <input
                type="checkbox"
                checked
                readOnly
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
              />
              <input
                type="text"
                value={entry.slice(6)}
                onChange={(e) => renameOther(entry, e.target.value)}
                className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Describe other obligation"
              />
              <button
                type="button"
                onClick={() => removeOther(entry)}
                className="text-gray-400 hover:text-red-400 transition-colors p-1"
                aria-label="Remove"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}

          {allowOther && (
            <button
              type="button"
              onClick={addOther}
              className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-500 text-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-400 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Other
            </button>
          )}
        </div>
      </div>
    );
  }

  if (type === 'radio') {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        {description && (
          <p className="text-sm text-gray-400 italic mb-3">{description}</p>
        )}
        <div className="space-y-2">
          {resolvedOptions?.map((opt) => (
            <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
              <input
                type="radio"
                name={key}
                value={opt.value}
                checked={value === opt.value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'checkbox') {
    return (
      <div className="mb-6">
        <label className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            required={required}
            className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
          />
          <span className="ml-3 text-gray-300">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </span>
        </label>
      </div>
    );
  }

  if (type === 'location') {
    return (
      <DocumentLocationPicker
        label={typeof label === 'string' ? label : label(answers || new Map())}
        value={value as unknown}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        multi={multi || false}
        description={description}
      />
    );
  }

  if (type === 'person') {
    return (
      <PersonPicker
        label={typeof label === 'string' ? label : label(answers || new Map())}
        value={value as unknown}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        multi={multi || false}
        description={description}
        filterTypes={question.personFilterTypes}
        defaultPersonType={question.personDefaultType || 'trusted'}
        showContactFields={question.personShowContactFields || false}
      />
    );
  }

  if (type === 'professional') {
    return (
      <ProfessionalPicker
        label={typeof label === 'string' ? label : label(answers || new Map())}
        value={value as unknown}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        multi={multi || false}
        description={description}
        category={question.professionalCategory}
      />
    );
  }

  return (
    <div className="mb-6">
      <label htmlFor={key} className="block text-sm font-medium text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        id={key}
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        max={max}
        min={type === 'number' ? 0 : undefined}
        className={commonClasses}
      />
    </div>
  );
}
