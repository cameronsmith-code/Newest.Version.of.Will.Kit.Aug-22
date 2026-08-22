export type PersonalGuarantee = {
  natureOfDebt: string;
  documentationLocation: string;
};

export type LiabilityInsurancePolicy = {
  description: string;
  documentationLocation: string;
};

export type PartnershipData = {
  registeredName: string;
  natureOfBusiness: string;
  partnershipType: string;
  hasWrittenAgreement: string;
  agreementDocLocation: string;
  agreementHasDeathProvisions: string;
  continuityContinues: string;
  hasBuySellAgreement: string;
  buySellDocLocation: string;
  buySellFundedByInsurance: string;
  buySellInsuranceDocLocation: string;
  hasValuationMethod: string;
  valuationMethodDocLocation: string;
  hasPersonalGuarantees: string;
  personalGuarantees: PersonalGuarantee[];
  isProfessionalPartnership: string;
  hasLiabilityInsurance: string;
  liabilityInsurancePolicies: LiabilityInsurancePolicy[];
};

type Props = {
  index: number;
  data: Partial<PartnershipData>;
  onChange: (field: keyof PartnershipData, value: string) => void;
  onMultiChange: (updates: Partial<PartnershipData>) => void;
  clientName: string;
};

const inputClass =
  'w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';

const labelClass = 'block text-sm font-medium text-gray-300 mb-2';

export default function PartnershipDetails({ index, data, onChange, onMultiChange, clientName }: Props) {
  const handleAgreementChange = (value: string) => {
    if (value === 'no') {
      onMultiChange({
        hasWrittenAgreement: 'no',
        agreementDocLocation: undefined,
        agreementHasDeathProvisions: undefined,
      });
    } else {
      onChange('hasWrittenAgreement', value);
    }
  };

  const handleBuySellChange = (value: string) => {
    if (value === 'no') {
      onMultiChange({
        hasBuySellAgreement: 'no',
        buySellDocLocation: undefined,
        buySellFundedByInsurance: undefined,
        buySellInsuranceDocLocation: undefined,
      });
    } else {
      onChange('hasBuySellAgreement', value);
    }
  };

  const handleBuySellInsuranceChange = (value: string) => {
    if (value === 'no') {
      onMultiChange({
        buySellFundedByInsurance: 'no',
        buySellInsuranceDocLocation: undefined,
      });
    } else {
      onChange('buySellFundedByInsurance', value);
    }
  };

  const handleValuationMethodChange = (value: string) => {
    if (value === 'no') {
      onMultiChange({
        hasValuationMethod: 'no',
        valuationMethodDocLocation: undefined,
      });
    } else {
      onChange('hasValuationMethod', value);
    }
  };

  const guarantees: PersonalGuarantee[] = data.personalGuarantees || [];

  const updateGuarantee = (gIdx: number, field: keyof PersonalGuarantee, value: string) => {
    const updated = [...guarantees];
    if (!updated[gIdx]) updated[gIdx] = { natureOfDebt: '', documentationLocation: '' };
    updated[gIdx] = { ...updated[gIdx], [field]: value };
    onMultiChange({ personalGuarantees: updated });
  };

  const handleHasPersonalGuaranteesChange = (value: string) => {
    if (value === 'no') {
      onMultiChange({ hasPersonalGuarantees: 'no', personalGuarantees: [] });
    } else {
      const initial: PersonalGuarantee[] = [{ natureOfDebt: '', documentationLocation: '' }];
      onMultiChange({ hasPersonalGuarantees: 'yes', personalGuarantees: initial });
    }
  };

  const addGuarantee = () => {
    onMultiChange({ personalGuarantees: [...guarantees, { natureOfDebt: '', documentationLocation: '' }] });
  };

  const removeLastGuarantee = () => {
    if (guarantees.length <= 1) {
      onMultiChange({ hasPersonalGuarantees: 'no', personalGuarantees: [] });
    } else {
      onMultiChange({ personalGuarantees: guarantees.slice(0, -1) });
    }
  };

  const policies: LiabilityInsurancePolicy[] = data.liabilityInsurancePolicies || [];

  const updatePolicy = (pIdx: number, field: keyof LiabilityInsurancePolicy, value: string) => {
    const updated = [...policies];
    if (!updated[pIdx]) updated[pIdx] = { description: '', documentationLocation: '' };
    updated[pIdx] = { ...updated[pIdx], [field]: value };
    onMultiChange({ liabilityInsurancePolicies: updated });
  };

  const handleHasLiabilityInsuranceChange = (value: string) => {
    if (value === 'no') {
      onMultiChange({ hasLiabilityInsurance: 'no', liabilityInsurancePolicies: [] });
    } else {
      const initial: LiabilityInsurancePolicy[] = [{ description: '', documentationLocation: '' }];
      onMultiChange({ hasLiabilityInsurance: 'yes', liabilityInsurancePolicies: initial });
    }
  };

  const addPolicy = () => {
    onMultiChange({ liabilityInsurancePolicies: [...policies, { description: '', documentationLocation: '' }] });
  };

  const removeLastPolicy = () => {
    if (policies.length <= 1) {
      onMultiChange({ hasLiabilityInsurance: 'no', liabilityInsurancePolicies: [] });
    } else {
      onMultiChange({ liabilityInsurancePolicies: policies.slice(0, -1) });
    }
  };

  const handleIsProfessionalChange = (value: string) => {
    if (value === 'no') {
      onMultiChange({
        isProfessionalPartnership: 'no',
        hasLiabilityInsurance: undefined,
        liabilityInsurancePolicies: [],
      });
    } else {
      onChange('isProfessionalPartnership', value);
    }
  };

  return (
    <div className="border border-gray-600 rounded-xl p-6 bg-gray-800 space-y-6">
      <h3 className="text-lg font-semibold text-white">
        {clientName}'s Partnership {index + 1}
      </h3>

      {/* Business Identification and Records */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-base font-semibold text-blue-300 mb-4 uppercase tracking-wide">
          Business Identification and Records
        </h4>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Registered Name of the Business:</label>
            <input
              type="text"
              value={data.registeredName || ''}
              onChange={(e) => onChange('registeredName', e.target.value)}
              placeholder="Enter registered business name"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Nature of the Business:</label>
            <input
              type="text"
              value={data.natureOfBusiness || ''}
              onChange={(e) => onChange('natureOfBusiness', e.target.value)}
              placeholder="Describe the nature of the business"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Type of Partnership:</label>
            <div className="space-y-2">
              {[
                { value: 'general', label: 'General Partner (with unlimited personal liability)' },
                { value: 'limited', label: 'Limited Partner (with limited liability)' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`partnershipType-${index}`}
                    value={opt.value}
                    checked={data.partnershipType === opt.value}
                    onChange={() => onChange('partnershipType', opt.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Do you have a written partnership agreement?</label>
            <div className="space-y-2">
              {[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`hasWrittenAgreement-${index}`}
                    value={opt.value}
                    checked={data.hasWrittenAgreement === opt.value}
                    onChange={() => handleAgreementChange(opt.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {data.hasWrittenAgreement === 'yes' && (
            <>
              <div>
                <label className={labelClass}>Where is the original document located?</label>
                <input
                  type="text"
                  value={data.agreementDocLocation || ''}
                  onChange={(e) => onChange('agreementDocLocation', e.target.value)}
                  placeholder="Enter location of original document"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Does it contain specific provisions for the death or incapacity of a partner?
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                    { value: 'unsure', label: "I'm not sure" },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`agreementHasDeathProvisions-${index}`}
                        value={opt.value}
                        checked={data.agreementHasDeathProvisions === opt.value}
                        onChange={() => onChange('agreementHasDeathProvisions', opt.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-300">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Continuity and Buy-Sell Provisions */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-base font-semibold text-blue-300 mb-4 uppercase tracking-wide">
          Continuity and Buy-Sell Provisions
        </h4>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>
              Does the partnership agreement specify that the business continues with the remaining partners, or is it to be wound up upon your death or incapacity?
            </label>
            <div className="space-y-2">
              {[
                { value: 'continues', label: 'Continues with remaining partners' },
                { value: 'wound_up', label: 'Wound up' },
                { value: 'unsure', label: "I'm not sure" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`continuityContinues-${index}`}
                    value={opt.value}
                    checked={data.continuityContinues === opt.value}
                    onChange={() => onChange('continuityContinues', opt.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Is there a buy-sell agreement that obliges the remaining partners to purchase your interest?
            </label>
            <div className="space-y-2">
              {[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`hasBuySellAgreement-${index}`}
                    value={opt.value}
                    checked={data.hasBuySellAgreement === opt.value}
                    onChange={() => handleBuySellChange(opt.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {data.hasBuySellAgreement === 'yes' && (
            <>
              <div>
                <label className={labelClass}>Location of the buy/sell document:</label>
                <input
                  type="text"
                  value={data.buySellDocLocation || ''}
                  onChange={(e) => onChange('buySellDocLocation', e.target.value)}
                  placeholder="Enter location of buy/sell document"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Is the buy/sell agreement funded by life insurance?
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`buySellFundedByInsurance-${index}`}
                        value={opt.value}
                        checked={data.buySellFundedByInsurance === opt.value}
                        onChange={() => handleBuySellInsuranceChange(opt.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-300">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {data.buySellFundedByInsurance === 'yes' && (
                <div>
                  <label className={labelClass}>Location of the buy/sell life insurance documentation:</label>
                  <input
                    type="text"
                    value={data.buySellInsuranceDocLocation || ''}
                    onChange={(e) => onChange('buySellInsuranceDocLocation', e.target.value)}
                    placeholder="Enter location of life insurance documentation"
                    className={inputClass}
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className={labelClass}>
              Is there a written valuation method for how your partnership interest would be valued for sale? (e.g., a pre-set price, a formula, or a formal independent valuation)
            </label>
            <div className="space-y-2">
              {[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`hasValuationMethod-${index}`}
                    value={opt.value}
                    checked={data.hasValuationMethod === opt.value}
                    onChange={() => handleValuationMethodChange(opt.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {data.hasValuationMethod === 'yes' && (
            <div>
              <label className={labelClass}>Location of the valuation method documentation:</label>
              <input
                type="text"
                value={data.valuationMethodDocLocation || ''}
                onChange={(e) => onChange('valuationMethodDocLocation', e.target.value)}
                placeholder="Enter location of valuation method documentation"
                className={inputClass}
              />
            </div>
          )}
        </div>
      </div>

      {/* Liability and Fiduciary Risks */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-base font-semibold text-blue-300 mb-4 uppercase tracking-wide">
          Liability and Fiduciary Risks
        </h4>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>
              Have you provided personal guarantees for partnership debts or bank loans?
            </label>
            <div className="space-y-2">
              {[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`hasPersonalGuarantees-${index}`}
                    value={opt.value}
                    checked={data.hasPersonalGuarantees === opt.value}
                    onChange={() => handleHasPersonalGuaranteesChange(opt.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {data.hasPersonalGuarantees === 'yes' && guarantees.length > 0 && (
            <div className="space-y-4">
              {guarantees.map((g, gIdx) => (
                <div key={gIdx} className="border border-gray-500 rounded-lg p-4 bg-gray-750 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-200">Personal Guarantee {gIdx + 1}</p>
                    {guarantees.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = guarantees.filter((_, i) => i !== gIdx);
                          onMultiChange({ personalGuarantees: updated });
                        }}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>What is the nature of the debt?</label>
                    <input
                      type="text"
                      value={g.natureOfDebt || ''}
                      onChange={(e) => updateGuarantee(gIdx, 'natureOfDebt', e.target.value)}
                      placeholder="Describe the nature of the debt"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Where is the documentation stored?</label>
                    <input
                      type="text"
                      value={g.documentationLocation || ''}
                      onChange={(e) => updateGuarantee(gIdx, 'documentationLocation', e.target.value)}
                      placeholder="Enter location of documentation"
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addGuarantee}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + Add Another Personal Guarantee
              </button>
            </div>
          )}

          <div>
            <label className={labelClass}>
              Is this a professional partnership (e.g., law, accounting, etc...)?
            </label>
            <div className="space-y-2">
              {[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`isProfessionalPartnership-${index}`}
                    value={opt.value}
                    checked={data.isProfessionalPartnership === opt.value}
                    onChange={() => handleIsProfessionalChange(opt.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {data.isProfessionalPartnership === 'yes' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  Do you have liability or errors and omissions insurance?
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`hasLiabilityInsurance-${index}`}
                        value={opt.value}
                        checked={data.hasLiabilityInsurance === opt.value}
                        onChange={() => handleHasLiabilityInsuranceChange(opt.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-300">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {data.hasLiabilityInsurance === 'yes' && policies.length > 0 && (
                <div className="space-y-4">
                  {policies.map((pol, pIdx) => (
                    <div key={pIdx} className="border border-gray-500 rounded-lg p-4 bg-gray-750 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-200">Policy {pIdx + 1}</p>
                        {policies.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = policies.filter((_, i) => i !== pIdx);
                              onMultiChange({ liabilityInsurancePolicies: updated });
                            }}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div>
                        <label className={labelClass}>Describe the insurance:</label>
                        <input
                          type="text"
                          value={pol.description || ''}
                          onChange={(e) => updatePolicy(pIdx, 'description', e.target.value)}
                          placeholder="Describe the insurance policy"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Location of the documentation:</label>
                        <input
                          type="text"
                          value={pol.documentationLocation || ''}
                          onChange={(e) => updatePolicy(pIdx, 'documentationLocation', e.target.value)}
                          placeholder="Enter location of documentation"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addPolicy}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    + Add Another Policy
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
