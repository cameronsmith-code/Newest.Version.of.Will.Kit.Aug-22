import { useCallback } from 'react';
import { Info, Landmark, ExternalLink } from 'lucide-react';
import {
  type GovernmentBenefitsData,
  type CppQppData,
  type OasData,
  OAS_START_AGE_OPTIONS,
} from '../lib/workplacePensionsTypes';

type Props = {
  data: GovernmentBenefitsData;
  onChange: (data: GovernmentBenefitsData) => void;
  clientName: string;
  clientProvince?: string;
};

const inputClass =
  'w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
const labelClass = 'block text-sm font-medium text-gray-300 mb-2';
const sectionCard = 'border border-gray-600 rounded-xl p-6 bg-gray-800 space-y-4';

export default function GovernmentRetirementBenefits({
  data,
  onChange,
  clientName,
  clientProvince,
}: Props) {
  const cppQpp: CppQppData = data.cppQpp || {
    programType: clientProvince === 'quebec' ? 'qpp' : 'cpp',
    status: 'not_sure',
  };
  const oas: OasData = data.oas || { status: 'not_sure' };

  const updateCppQpp = useCallback(
    (patch: Partial<CppQppData>) => {
      onChange({ ...data, cppQpp: { ...cppQpp, ...patch } });
    },
    [data, cppQpp, onChange],
  );

  const updateOas = useCallback(
    (patch: Partial<OasData>) => {
      onChange({ ...data, oas: { ...oas, ...patch } });
    },
    [data, oas, onChange],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-br from-blue-900/30 to-gray-800 border border-blue-800/40 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Landmark className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">
            Government Retirement Benefits — {clientName}
          </h3>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          These are retirement income benefits from the government. They are not included in your
          net-worth calculation — they represent future or current income, not account assets.
        </p>
      </div>

      {/* CPP / QPP */}
      <div className={sectionCard}>
        <h4 className="text-base font-semibold text-white">CPP / QPP</h4>

        {/* Program type */}
        <div>
          <label className={labelClass}>Which public pension information applies to you?</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'cpp', label: 'Canada Pension Plan (CPP)' },
              { value: 'qpp', label: 'Quebec Pension Plan (QPP)' },
              { value: 'not_sure', label: "I'm not sure" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateCppQpp({ programType: opt.value as CppQppData['programType'] })}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                  cppQpp.programType === opt.value
                    ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                    : 'border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Receiving? */}
        <div>
          <label className={labelClass}>
            Are you currently receiving {cppQpp.programType === 'qpp' ? 'QPP' : 'CPP'} retirement benefits?
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'not_started', label: 'Not yet' },
              { value: 'receiving', label: 'Yes, currently receiving' },
              { value: 'not_sure', label: "I'm not sure" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateCppQpp({ status: opt.value as CppQppData['status'] })}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                  cppQpp.status === opt.value
                    ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                    : 'border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Not started branch */}
        {cppQpp.status === 'not_started' && (
          <div className="space-y-4 pt-4 border-t border-gray-700">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-900/20 border border-blue-700/40">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span className="text-sm text-blue-200">
                Your most recent government benefit information is the best source for this estimate.
              </span>
            </div>
            {cppQpp.programType === 'cpp' && (
              <a
                href="https://www.canada.ca/en/employment-social-development/services/my-account.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300"
              >
                My Service Canada Account <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {cppQpp.programType === 'qpp' && (
              <a
                href="https://www.rrq.gouv.qc.ca/en/services_en_ligne/my_retraite/Pages/my_retraite.aspx"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300"
              >
                Retraite Québec — My Retirement <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <div>
              <label className={labelClass}>
                What does your most recent government information estimate your retirement pension will be?
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={cppQpp.estimatedAmount ?? ''}
                  onChange={(e) => updateCppQpp({ estimatedAmount: Number(e.target.value) || undefined })}
                  placeholder="$ / month"
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => updateCppQpp({ estimatedAmount: undefined })}
                className="mt-2 text-xs text-gray-400 hover:text-gray-300"
              >
                I don't have an estimate
              </button>
            </div>

            {cppQpp.estimatedAmount !== undefined && (
              <div>
                <label className={labelClass}>What age is that estimate based on?</label>
                <input
                  type="number"
                  value={cppQpp.estimateBasedOnAge ?? ''}
                  onChange={(e) => updateCppQpp({ estimateBasedOnAge: Number(e.target.value) || undefined })}
                  placeholder="Age (e.g., 65)"
                  className={`${inputClass} w-32`}
                />
              </div>
            )}

            <div>
              <label className={labelClass}>When was this estimate obtained?</label>
              <input
                type="text"
                value={cppQpp.estimateDate || ''}
                onChange={(e) => updateCppQpp({ estimateDate: e.target.value })}
                placeholder="Month/year"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                When are you currently thinking about starting {cppQpp.programType === 'qpp' ? 'QPP' : 'CPP'}?
              </label>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 11 }, (_, i) => 60 + i).map((age) => (
                  <button
                    key={age}
                    type="button"
                    onClick={() => updateCppQpp({ plannedStartAge: age })}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                      cppQpp.plannedStartAge === age
                        ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                        : 'border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {age}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => updateCppQpp({ plannedStartAge: undefined })}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                    cppQpp.plannedStartAge === undefined
                      ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                      : 'border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  I'm not sure
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Receiving branch */}
        {cppQpp.status === 'receiving' && (
          <div className="space-y-4 pt-4 border-t border-gray-700">
            <div>
              <label className={labelClass}>
                How much {cppQpp.programType === 'qpp' ? 'QPP' : 'CPP'} retirement pension are you currently receiving?
              </label>
              <input
                type="number"
                value={cppQpp.currentAmount ?? ''}
                onChange={(e) => updateCppQpp({ currentAmount: Number(e.target.value) || undefined })}
                placeholder="$ / month (gross before tax, if available)"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>When did you start receiving it?</label>
              <div className="flex flex-wrap gap-2">
                <input
                  type="number"
                  value={cppQpp.startedAge ?? ''}
                  onChange={(e) => updateCppQpp({ startedAge: Number(e.target.value) || undefined })}
                  placeholder="Age"
                  className={`${inputClass} w-24`}
                />
                <input
                  type="text"
                  value={cppQpp.startedDate || ''}
                  onChange={(e) => updateCppQpp({ startedDate: e.target.value })}
                  placeholder="Month/year"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* OAS */}
      <div className={sectionCard}>
        <h4 className="text-base font-semibold text-white">Old Age Security (OAS)</h4>

        <div>
          <label className={labelClass}>Are you currently receiving Old Age Security (OAS)?</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'not_started', label: 'Not yet' },
              { value: 'receiving', label: 'Yes, currently receiving' },
              { value: 'not_sure', label: "I'm not sure" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateOas({ status: opt.value as OasData['status'] })}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                  oas.status === opt.value
                    ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                    : 'border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Not started branch */}
        {oas.status === 'not_started' && (
          <div className="space-y-4 pt-4 border-t border-gray-700">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-900/20 border border-blue-700/40">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span className="text-sm text-blue-200">
                Service Canada is the best source for understanding your OAS entitlement. Eligibility
                and the eventual benefit can depend on factors including your age, Canadian residence
                history and when you choose to begin receiving OAS.
              </span>
            </div>
            <a
              href="https://www.canada.ca/en/employment-social-development/services/my-account.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300"
            >
              My Service Canada Account <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div>
              <label className={labelClass}>
                What does your most recent government information show as your estimated OAS benefit?
              </label>
              <input
                type="number"
                value={oas.estimatedAmount ?? ''}
                onChange={(e) => updateOas({ estimatedAmount: Number(e.target.value) || undefined })}
                placeholder="$ / month"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => updateOas({ estimatedAmount: undefined })}
                className="mt-2 text-xs text-gray-400 hover:text-gray-300"
              >
                I don't have an estimate
              </button>
            </div>

            <div>
              <label className={labelClass}>When was this estimate obtained?</label>
              <input
                type="text"
                value={oas.estimateDate || ''}
                onChange={(e) => updateOas({ estimateDate: e.target.value })}
                placeholder="Month/year"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>At what age are you currently planning to start OAS?</label>
              <div className="flex flex-wrap gap-2">
                {OAS_START_AGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateOas({ plannedStartAge: opt.value === 'not_sure' ? undefined : Number(opt.value) })}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                      (opt.value === 'not_sure' && oas.plannedStartAge === undefined) ||
                      oas.plannedStartAge === Number(opt.value)
                        ? 'border-blue-500 bg-blue-900/40 text-blue-200'
                        : 'border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Receiving branch */}
        {oas.status === 'receiving' && (
          <div className="space-y-4 pt-4 border-t border-gray-700">
            <div>
              <label className={labelClass}>How much OAS are you currently receiving?</label>
              <input
                type="number"
                value={oas.currentAmount ?? ''}
                onChange={(e) => updateOas({ currentAmount: Number(e.target.value) || undefined })}
                placeholder="$ / month (gross before tax, if available)"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>When did you start receiving OAS?</label>
              <div className="flex flex-wrap gap-2">
                <input
                  type="number"
                  value={oas.startedAge ?? ''}
                  onChange={(e) => updateOas({ startedAge: Number(e.target.value) || undefined })}
                  placeholder="Age"
                  className={`${inputClass} w-24`}
                />
                <input
                  type="text"
                  value={oas.startedDate || ''}
                  onChange={(e) => updateOas({ startedDate: e.target.value })}
                  placeholder="Month/year"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
