import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

type License = {
  nature: string;
  documentLocation: string;
};

type SocialAccount = {
  platform: string;
  credentialsLocation: string;
};

type OnlinePersona = {
  name: string;
  credentialsLocation: string;
};

type BusinessAsset = {
  name: string;
  type: string;
  recordsLocation: string;
};

type BusinessLiability = {
  lenderName: string;
  liabilityType: string;
  lenderContact: string;
  documentationLocation: string;
};

export type SoleProprietorshipData = {
  registeredName: string;
  natureOfBusiness: string;
  hasLicenses: string;
  licenses: License[];
  bookkeeper: string;
  bookkeeperFirm: string;
  bookkeeperContact: string;
  bookkeeperPhone: string;
  bookkeeperEmail: string;
  bookkeeperWebsite: string;
  accountingRecordsLocation: string;
  hasDigitalAssets: string;
  website: string;
  websiteCredentialsLocation: string;
  domainProvider: string;
  domainCredentialsLocation: string;
  socialAccounts: SocialAccount[];
  onlinePersonas: OnlinePersona[];
  hasMajorAssets: string;
  assets: BusinessAsset[];
  hasLiabilities: string;
  liabilities: BusinessLiability[];
  dissolutionPlan: string;
  dissolutionPlanDocLocation: string;
  executorAuthority: string;
};

type Props = {
  index: number;
  data: Partial<SoleProprietorshipData>;
  onChange: (field: keyof SoleProprietorshipData, value: unknown) => void;
  onMultiChange?: (updates: Partial<SoleProprietorshipData>) => void;
  clientName: string;
};

const inputClass =
  'w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all';

const labelClass = 'block text-sm font-medium text-gray-300 mb-2';

export default function SoleProprietorshipDetails({ index, data, onChange, onMultiChange, clientName }: Props) {
  const licenses: License[] = data.licenses || [];
  const socialAccounts: SocialAccount[] = data.socialAccounts || [];
  const onlinePersonas: OnlinePersona[] = data.onlinePersonas || [];
  const assets: BusinessAsset[] = data.assets || [];
  const liabilities: BusinessLiability[] = data.liabilities || [];

  const updateAsset = (i: number, field: keyof BusinessAsset, value: string) => {
    const updated = [...assets];
    if (!updated[i]) updated[i] = { name: '', type: '', recordsLocation: '' };
    updated[i] = { ...updated[i], [field]: value };
    onChange('assets', updated);
  };

  const addAsset = () => {
    onChange('assets', [...assets, { name: '', type: '', recordsLocation: '' }]);
  };

  const removeAsset = (i: number) => {
    onChange('assets', assets.filter((_, idx) => idx !== i));
  };

  const updateLiability = (i: number, field: keyof BusinessLiability, value: string) => {
    const updated = [...liabilities];
    if (!updated[i]) updated[i] = { lenderName: '', liabilityType: '', lenderContact: '', documentationLocation: '' };
    updated[i] = { ...updated[i], [field]: value };
    onChange('liabilities', updated);
  };

  const addLiability = () => {
    onChange('liabilities', [...liabilities, { lenderName: '', liabilityType: '', lenderContact: '', documentationLocation: '' }]);
  };

  const removeLiability = (i: number) => {
    onChange('liabilities', liabilities.filter((_, idx) => idx !== i));
  };

  const updateLicense = (i: number, field: keyof License, value: string) => {
    const updated = [...licenses];
    if (!updated[i]) updated[i] = { nature: '', documentLocation: '' };
    updated[i] = { ...updated[i], [field]: value };
    onChange('licenses', updated);
  };

  const addLicense = () => {
    onChange('licenses', [...licenses, { nature: '', documentLocation: '' }]);
  };

  const removeLicense = (i: number) => {
    onChange('licenses', licenses.filter((_, idx) => idx !== i));
  };

  const updateSocialAccount = (i: number, field: keyof SocialAccount, value: string) => {
    const updated = [...socialAccounts];
    if (!updated[i]) updated[i] = { platform: '', credentialsLocation: '' };
    updated[i] = { ...updated[i], [field]: value };
    onChange('socialAccounts', updated);
  };

  const addSocialAccount = () => {
    onChange('socialAccounts', [...socialAccounts, { platform: '', credentialsLocation: '' }]);
  };

  const removeSocialAccount = (i: number) => {
    onChange('socialAccounts', socialAccounts.filter((_, idx) => idx !== i));
  };

  const updateOnlinePersona = (i: number, field: keyof OnlinePersona, value: string) => {
    const updated = [...onlinePersonas];
    if (!updated[i]) updated[i] = { name: '', credentialsLocation: '' };
    updated[i] = { ...updated[i], [field]: value };
    onChange('onlinePersonas', updated);
  };

  const addOnlinePersona = () => {
    onChange('onlinePersonas', [...onlinePersonas, { name: '', credentialsLocation: '' }]);
  };

  const removeOnlinePersona = (i: number) => {
    onChange('onlinePersonas', onlinePersonas.filter((_, idx) => idx !== i));
  };

  const registeredName = data.registeredName || `Sole Proprietorship ${index + 1}`;

  return (
    <div className="border border-gray-600 rounded-lg p-6 bg-gray-750 space-y-6" style={{ backgroundColor: 'rgb(30, 41, 59)' }}>
      <h3 className="text-xl font-bold text-white">
        {clientName} — Sole Proprietorship {index + 1}
      </h3>

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
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelClass}>Do you have any professional or municipal licenses?</label>
          <div className="space-y-2">
            {['yes', 'no'].map((opt) => (
              <label key={opt} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                <input
                  type="radio"
                  name={`hasLicenses-${index}`}
                  value={opt}
                  checked={data.hasLicenses === opt}
                  onChange={() => {
                    if (opt === 'no' && onMultiChange) {
                      onMultiChange({ hasLicenses: 'no', licenses: [] });
                    } else {
                      onChange('hasLicenses', opt);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-300 capitalize">{opt === 'yes' ? 'Yes' : 'No'}</span>
              </label>
            ))}
          </div>
        </div>

        {data.hasLicenses === 'yes' && (
          <div className="space-y-4 pl-4 border-l-2 border-blue-500">
            {licenses.map((license, i) => (
              <div key={i} className="border border-gray-600 rounded-lg p-4 bg-gray-700 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-300">License {i + 1}</span>
                  {licenses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLicense(i)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div>
                  <label className={labelClass}>What is the nature of the license?</label>
                  <input
                    type="text"
                    value={license.nature}
                    onChange={(e) => updateLicense(i, 'nature', e.target.value)}
                    placeholder="Describe the license"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>What is the location of the original documents?</label>
                  <input
                    type="text"
                    value={license.documentLocation}
                    onChange={(e) => updateLicense(i, 'documentLocation', e.target.value)}
                    placeholder="Enter document location"
                    className={inputClass}
                  />
                </div>
              </div>
            ))}

            {licenses.length === 0 && (
              <div className="border border-gray-600 rounded-lg p-4 bg-gray-700 space-y-3">
                <div>
                  <label className={labelClass}>What is the nature of the license?</label>
                  <input
                    type="text"
                    value=""
                    onChange={(e) => { onChange('licenses', [{ nature: e.target.value, documentLocation: '' }]); }}
                    placeholder="Describe the license"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>What is the location of the original documents?</label>
                  <input
                    type="text"
                    value=""
                    onChange={(e) => { onChange('licenses', [{ nature: '', documentLocation: e.target.value }]); }}
                    placeholder="Enter document location"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={addLicense}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Do you have any additional professional or municipal licenses?
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelClass}>
            Do you have a bookkeeper or accountant familiar with your business revenues and expenses?
          </label>
          <div className="space-y-2">
            {[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No, I do my own bookkeeping and accounting' },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                <input
                  type="radio"
                  name={`bookkeeper-${index}`}
                  value={opt.value}
                  checked={data.bookkeeper === opt.value}
                  onChange={() => onChange('bookkeeper', opt.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {data.bookkeeper === 'yes' && (
          <div className="space-y-3 pl-4 border-l-2 border-blue-500">
            <div>
              <label className={labelClass}>Accountant/Book Keeper's Firm Name:</label>
              <input
                type="text"
                value={data.bookkeeperFirm || ''}
                onChange={(e) => onChange('bookkeeperFirm', e.target.value)}
                placeholder="Enter firm name"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Key Contact:</label>
              <input
                type="text"
                value={data.bookkeeperContact || ''}
                onChange={(e) => onChange('bookkeeperContact', e.target.value)}
                placeholder="Enter contact name"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone Number:</label>
              <input
                type="tel"
                value={data.bookkeeperPhone || ''}
                onChange={(e) => onChange('bookkeeperPhone', e.target.value)}
                placeholder="Enter phone number"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email Address:</label>
              <input
                type="email"
                value={data.bookkeeperEmail || ''}
                onChange={(e) => onChange('bookkeeperEmail', e.target.value)}
                placeholder="Enter email address"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Website:</label>
              <input
                type="text"
                value={data.bookkeeperWebsite || ''}
                onChange={(e) => onChange('bookkeeperWebsite', e.target.value)}
                placeholder="Enter website URL"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {data.bookkeeper && (
          <div>
            <label className={labelClass}>Where are your accounting records kept?</label>
            <input
              type="text"
              value={data.accountingRecordsLocation || ''}
              onChange={(e) => onChange('accountingRecordsLocation', e.target.value)}
              placeholder="Enter location of accounting records"
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelClass}>
            Do you have digital assets associated with the business, such as website domains, social media accounts, or online personas?
          </label>
          <div className="space-y-2">
            {['yes', 'no'].map((opt) => (
              <label key={opt} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                <input
                  type="radio"
                  name={`hasDigitalAssets-${index}`}
                  value={opt}
                  checked={data.hasDigitalAssets === opt}
                  onChange={() => onChange('hasDigitalAssets', opt)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-300 capitalize">{opt === 'yes' ? 'Yes' : 'No'}</span>
              </label>
            ))}
          </div>
        </div>

        {data.hasDigitalAssets === 'yes' && (
          <div className="space-y-5 pl-4 border-l-2 border-blue-500">
            <div className="space-y-3 border border-gray-600 rounded-lg p-4 bg-gray-700">
              <h5 className="text-sm font-semibold text-gray-200">Website</h5>
              <div>
                <label className={labelClass}>Website:</label>
                <input
                  type="text"
                  value={data.website || ''}
                  onChange={(e) => onChange('website', e.target.value)}
                  placeholder="Enter website URL"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Location where access credentials are stored:</label>
                <input
                  type="text"
                  value={data.websiteCredentialsLocation || ''}
                  onChange={(e) => onChange('websiteCredentialsLocation', e.target.value)}
                  placeholder="Enter credentials storage location"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-3 border border-gray-600 rounded-lg p-4 bg-gray-700">
              <h5 className="text-sm font-semibold text-gray-200">Domain Provider</h5>
              <div>
                <label className={labelClass}>Domain Provider:</label>
                <input
                  type="text"
                  value={data.domainProvider || ''}
                  onChange={(e) => onChange('domainProvider', e.target.value)}
                  placeholder="e.g., GoDaddy, Namecheap, Google Domains"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Location where access credentials are stored:</label>
                <input
                  type="text"
                  value={data.domainCredentialsLocation || ''}
                  onChange={(e) => onChange('domainCredentialsLocation', e.target.value)}
                  placeholder="Enter credentials storage location"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-sm font-semibold text-gray-200">Social Media Accounts</h5>
              {socialAccounts.map((account, i) => (
                <div key={i} className="border border-gray-600 rounded-lg p-4 bg-gray-700 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Account {i + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeSocialAccount(i)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div>
                    <label className={labelClass}>Social Media Account (platform & handle):</label>
                    <input
                      type="text"
                      value={account.platform}
                      onChange={(e) => updateSocialAccount(i, 'platform', e.target.value)}
                      placeholder="e.g., LinkedIn: @businessname"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Location where access credentials are stored:</label>
                    <input
                      type="text"
                      value={account.credentialsLocation}
                      onChange={(e) => updateSocialAccount(i, 'credentialsLocation', e.target.value)}
                      placeholder="Enter credentials storage location"
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addSocialAccount}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                Add Social Media Account
              </button>
            </div>

            <div className="space-y-3">
              <h5 className="text-sm font-semibold text-gray-200">Online Personas</h5>
              {onlinePersonas.map((persona, i) => (
                <div key={i} className="border border-gray-600 rounded-lg p-4 bg-gray-700 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Persona {i + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeOnlinePersona(i)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div>
                    <label className={labelClass}>Online Persona:</label>
                    <input
                      type="text"
                      value={persona.name}
                      onChange={(e) => updateOnlinePersona(i, 'name', e.target.value)}
                      placeholder="Enter online persona name or description"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Location where access credentials are stored:</label>
                    <input
                      type="text"
                      value={persona.credentialsLocation}
                      onChange={(e) => updateOnlinePersona(i, 'credentialsLocation', e.target.value)}
                      placeholder="Enter credentials storage location"
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addOnlinePersona}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                Add Online Persona
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-base font-semibold text-blue-300 mb-4 uppercase tracking-wide">
          Asset and Liability Inventory
        </h4>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Do you have any major assets (business assets, equipment, inventory, accounts receivable, etc.)?</label>
            <div className="space-y-2">
              {['yes', 'no'].map((opt) => (
                <label key={opt} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name={`hasMajorAssets-${index}`}
                    value={opt}
                    checked={data.hasMajorAssets === opt}
                    onChange={() => {
                      if (opt === 'no' && onMultiChange) {
                        onMultiChange({ hasMajorAssets: 'no', assets: [] });
                      } else {
                        onChange('hasMajorAssets', opt);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-300 capitalize">{opt === 'yes' ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </div>
          </div>

          {data.hasMajorAssets === 'yes' && (
            <div className="space-y-4 pl-4 border-l-2 border-blue-500">
              {(assets.length === 0 ? [{ name: '', type: '', recordsLocation: '' }] : assets).map((asset, i) => (
                <div key={i} className="border border-gray-600 rounded-lg p-4 bg-gray-700 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-300">Asset {i + 1}</span>
                    {assets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAsset(i)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Asset Name:</label>
                    <input
                      type="text"
                      value={assets[i]?.name || ''}
                      onChange={(e) => updateAsset(i, 'name', e.target.value)}
                      placeholder="Enter asset name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Asset Type:</label>
                    <input
                      type="text"
                      value={assets[i]?.type || ''}
                      onChange={(e) => updateAsset(i, 'type', e.target.value)}
                      placeholder="e.g., equipment, inventory, accounts receivable"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Location of Records:</label>
                    <input
                      type="text"
                      value={assets[i]?.recordsLocation || ''}
                      onChange={(e) => updateAsset(i, 'recordsLocation', e.target.value)}
                      placeholder="Enter location of records"
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addAsset}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                Do you have any other major assets?
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4 mt-4">
          <div>
            <label className={labelClass}>Do you have any outstanding liabilities or debts related to the business?</label>
            <div className="space-y-2">
              {['yes', 'no'].map((opt) => (
                <label key={opt} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name={`hasLiabilities-${index}`}
                    value={opt}
                    checked={data.hasLiabilities === opt}
                    onChange={() => {
                      if (opt === 'no' && onMultiChange) {
                        onMultiChange({ hasLiabilities: 'no', liabilities: [] });
                      } else {
                        onChange('hasLiabilities', opt);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-300 capitalize">{opt === 'yes' ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </div>
          </div>

          {data.hasLiabilities === 'yes' && (
            <div className="space-y-4 pl-4 border-l-2 border-blue-500">
              {(liabilities.length === 0 ? [{ lenderName: '', liabilityType: '', lenderContact: '', documentationLocation: '' }] : liabilities).map((liability, i) => (
                <div key={i} className="border border-gray-600 rounded-lg p-4 bg-gray-700 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-300">Liability {i + 1}</span>
                    {liabilities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLiability(i)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Lender Name:</label>
                    <input
                      type="text"
                      value={liabilities[i]?.lenderName || ''}
                      onChange={(e) => updateLiability(i, 'lenderName', e.target.value)}
                      placeholder="Enter lender name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Liability Type:</label>
                    <input
                      type="text"
                      value={liabilities[i]?.liabilityType || ''}
                      onChange={(e) => updateLiability(i, 'liabilityType', e.target.value)}
                      placeholder="e.g., business loan, line of credit, mortgage"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Lender Contact Information:</label>
                    <input
                      type="text"
                      value={liabilities[i]?.lenderContact || ''}
                      onChange={(e) => updateLiability(i, 'lenderContact', e.target.value)}
                      placeholder="Enter lender contact details"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Location of Documentation:</label>
                    <input
                      type="text"
                      value={liabilities[i]?.documentationLocation || ''}
                      onChange={(e) => updateLiability(i, 'documentationLocation', e.target.value)}
                      placeholder="Enter location of documentation"
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addLiability}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                Are there any additional liabilities or business debts?
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-base font-semibold text-blue-300 mb-4 uppercase tracking-wide">
          Business Continuity and Succession
        </h4>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>
              Since a sole proprietorship dissolves on death, do you have a plan for the orderly disposal of business assets and liabilities?
            </label>
            <div className="space-y-2">
              {[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'beneficiary', label: 'I intend for a beneficiary to carry on the business' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name={`dissolutionPlan-${index}`}
                    value={opt.value}
                    checked={data.dissolutionPlan === opt.value}
                    onChange={() => onChange('dissolutionPlan', opt.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {(data.dissolutionPlan === 'yes' || data.dissolutionPlan === 'beneficiary') && (
            <div>
              <label className={labelClass}>Location of the documentation:</label>
              <input
                type="text"
                value={data.dissolutionPlanDocLocation || ''}
                onChange={(e) => onChange('dissolutionPlanDocLocation', e.target.value)}
                placeholder="Enter location of documentation"
                className={inputClass}
              />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-base font-semibold text-blue-300 mb-4 uppercase tracking-wide">
          Executor Instructions and Authority
        </h4>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>
              Does your will authorize your executor to own, manage, and operate business assets until they can be sold or distributed? (without this authority, succession legislation may force an estate trustee to liquidate risky business shares at 'fire-sale' prices)
            </label>
            <div className="space-y-2">
              {[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'unsure', label: "I'm not sure" },
                { value: 'not_applicable', label: "The business doesn't have any assets of significant value to worry about" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center p-3 border border-gray-600 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name={`executorAuthority-${index}`}
                    value={opt.value}
                    checked={data.executorAuthority === opt.value}
                    onChange={() => onChange('executorAuthority', opt.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
