import { Link } from 'react-router-dom';
import { CheckCircle, Download, Home, FileText, Eye, Loader2, Heart, GraduationCap, Users, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { generatePDF } from '../lib/pdfGenerator';
import { useEffect, useState, useMemo } from 'react';
import { useQuestionnaire } from '../context/QuestionnaireContext';
import { buildGuardianshipRoadmap } from '../lib/guardianshipRoadmapBuilder';
import { buildGuardianshipNarrative } from '../lib/guardianshipNarrativeBuilder';
import { composeGuardianshipForAudience } from '../lib/guardianshipAudienceComposer';
import { buildGuardianClarifyDocument } from '../lib/guardianRoadmapDocumentBuilder';
import { renderClarifyDocumentHtml } from '../lib/clarifyHtmlRenderer';
import { generateGuardianRoadmapPdf } from '../lib/guardianRoadmapPdfRenderer';
import type { GuardianshipRoadmapModel } from '../lib/guardianshipRoadmapTypes';

export default function Completion() {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showGuardianPreview, setShowGuardianPreview] = useState(false);
  const [guardianModel, setGuardianModel] = useState<GuardianshipRoadmapModel | null>(null);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const { answers, initQuestionnaire, loading } = useQuestionnaire();

  useEffect(() => {
    initQuestionnaire();
  }, [initQuestionnaire]);

  const hasLoadedAnswers = answers.size > 0 && !!(answers.get('aboutYou')?.fullName);

  useEffect(() => {
    const aboutYou = answers.get('aboutYou') || {};
    const previousRelationships = answers.get('previousRelationships') || {};
    const children = answers.get('children') || {};
    const familyTrusts = answers.get('familyTrusts') || {};
    const businessInterests = answers.get('businessInterests') || {};
    const corporations = answers.get('corporations') || {};
    const corporateFinancialConnections = answers.get('corporateFinancialConnections') || {};
    const professionalTeam = answers.get('professionalTeam') || {};
    const financialFootprint = answers.get('financialFootprint') || {};
    const realEstate = answers.get('realEstate') || {};
    const debtObligations = answers.get('debtObligations') || {};
    const lifeInsurance = answers.get('lifeInsurance') || {};
    const propertyLiabilityInsurance = answers.get('propertyLiabilityInsurance') || {};
    const legacyIntent = answers.get('legacyIntent') || {};
    const wills = answers.get('wills') || {};
    const powersOfAttorney = answers.get('powersOfAttorney') || {};
    const estateTrustees = answers.get('estateTrustees') || {};
    const funeralArrangements = answers.get('funeralArrangements') || {};
    const workplacePensionsBenefits = answers.get('workplacePensionsBenefits') || {};

    const data = {
      ...aboutYou,
      client1PreviousRelationshipsData: previousRelationships.client1PreviousRelationshipsData,
      client2PreviousRelationshipsData: previousRelationships.client2PreviousRelationshipsData,
      childrenData: children.childrenData,
      ...children,
      ...familyTrusts,
      ...businessInterests,
      ...corporations,
      ...corporateFinancialConnections,
      ...professionalTeam,
      ...financialFootprint,
      ...realEstate,
      ...debtObligations,
      ...lifeInsurance,
      ...propertyLiabilityInsurance,
      client1PensionsData: workplacePensionsBenefits.client1PensionsData,
      client2PensionsData: workplacePensionsBenefits.client2PensionsData,
      ...legacyIntent,
      ...wills,
      ...powersOfAttorney,
      ...estateTrustees,
      ...funeralArrangements,
      ...workplacePensionsBenefits,
    };

    setFormData(data);
  }, [answers]);

  // Build the Guardian Roadmap document from questionnaire answers
  const guardianClarifyDoc = useMemo(() => {
    if (!hasLoadedAnswers) return null;
    try {
      const model = buildGuardianshipRoadmap(answers);
      setGuardianModel(model);
      const narrative = buildGuardianshipNarrative(model);
      const aboutYou = answers.get('aboutYou') || {};
      const client1Name = (aboutYou.fullName as string) || '';
      const client2Name = (aboutYou.spouseName as string) || '';
      const clientNames = [client1Name, client2Name].filter(Boolean);
      const reportDate = new Date().toISOString().split('T')[0];

      const guardianDoc = composeGuardianshipForAudience(narrative, 'guardian', {
        clientNames,
        reportDate,
        roadmapModel: model,
      });
      const clarifyDoc = buildGuardianClarifyDocument(guardianDoc);

      // QA: block empty-rich-data mismatch
      // If the questionnaire has named clients and children but the document
      // falls back to "Your Family" or has almost no sections, refuse to emit it.
      const hasNamedClient = clientNames.length > 0;
      const childrenAnswers = answers.get('children') || {};
      const childrenData = (childrenAnswers.childrenData as unknown[]) || [];
      const hasNamedChildren = childrenData.length > 0;
      const coverUsesFallback = clarifyDoc.cover.familyName === 'Your Family';
      const hasMinimalSections = clarifyDoc.sections.length < 3;
      if (hasNamedClient && hasNamedChildren && (coverUsesFallback || hasMinimalSections)) {
        console.error(
          '[QA] BLOCKING: Questionnaire has named client(s) and children but Guardian document is near-empty. ' +
          `familyName="${clarifyDoc.cover.familyName}", sections=${clarifyDoc.sections.length}. ` +
          'Refusing to generate a misleading near-empty PDF.'
        );
        return null;
      }

      return clarifyDoc;
    } catch (err) {
      console.warn('Guardian Roadmap build failed:', err);
      return null;
    }
  }, [answers, hasLoadedAnswers]);

  const handleDownloadPDF = () => {
    generatePDF(formData as Parameters<typeof generatePDF>[0]);
  };

  const handleDownloadGuardianRoadmap = async () => {
    if (!guardianClarifyDoc || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const blob = await generateGuardianRoadmapPdf(guardianClarifyDoc);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = 'Guardianship-Roadmap.pdf';
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Guardian Roadmap PDF generation failed:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePreviewGuardian = () => {
    setShowGuardianPreview(true);
  };

  const handleClosePreview = () => {
    setShowGuardianPreview(false);
  };

  const guardianPreviewHtml = useMemo(() => {
    if (!guardianClarifyDoc) return '';
    return renderClarifyDocumentHtml(guardianClarifyDoc);
  }, [guardianClarifyDoc]);

  const hasGuardianData = guardianClarifyDoc !== null;
  const showLoadingSpinner = loading && !hasLoadedAnswers;

  if (showLoadingSpinner) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your questionnaire data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center border border-gray-700">
        <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />

        <h1 className="text-4xl font-bold text-white mb-4">
          Questionnaire Complete!
        </h1>

        <p className="text-xl text-gray-300 mb-8">
          Thank you for completing the questionnaire. Your documents are ready to download.
        </p>

        {/* Guardian Roadmap review summary */}
        {guardianModel && hasGuardianData && (
          <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-5 mb-6 text-left">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Guardianship Roadmap — Review Summary</h3>

            {/* Why We Chose [Guardian] */}
            {guardianModel.guardianTrust && (guardianModel.guardianTrust.selectionReason || guardianModel.guardianTrust.trustMessage || guardianModel.guardianTrust.ifNeededMessage) && (
              <div className="mb-3">
                <button
                  onClick={() => setExpandedReview(expandedReview === 'whyChose' ? null : 'whyChose')}
                  className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 w-full text-left"
                >
                  <Heart size={16} />
                  <span>Why We Chose {guardianModel.guardianAssignments[0]?.householdLabel || 'the Guardian'}</span>
                  {expandedReview === 'whyChose' ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
                </button>
                {expandedReview === 'whyChose' && (
                  <div className="mt-2 ml-6 space-y-2">
                    {guardianModel.guardianTrust.selectionReason && (
                      <div>
                        <p className="text-xs text-gray-500">Why we chose them</p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{guardianModel.guardianTrust.selectionReason}</p>
                      </div>
                    )}
                    {guardianModel.guardianTrust.trustMessage && (
                      <div>
                        <p className="text-xs text-gray-500">What the trust means</p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{guardianModel.guardianTrust.trustMessage}</p>
                      </div>
                    )}
                    {guardianModel.guardianTrust.ifNeededMessage && (
                      <div>
                        <p className="text-xs text-gray-500">If they ever had to step in</p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{guardianModel.guardianTrust.ifNeededMessage}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Education & Looking Ahead */}
            {guardianModel.children.some(c => c.educationTransition?.settingType || c.futureEducation?.aspirations?.length) && (
              <div className="mb-3">
                <button
                  onClick={() => setExpandedReview(expandedReview === 'education' ? null : 'education')}
                  className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 w-full text-left"
                >
                  <GraduationCap size={16} />
                  <span>Education & Looking Ahead</span>
                  {expandedReview === 'education' ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
                </button>
                {expandedReview === 'education' && (
                  <div className="mt-2 ml-6 space-y-3">
                    {guardianModel.children.filter(c => c.status === 'minor' || c.status === 'adult_dependant').map(child => (
                      <div key={child.childId}>
                        <p className="text-xs text-gray-500">{child.nickname || child.name}</p>
                        {child.educationTransition?.settingType && (
                          <p className="text-sm text-gray-300">Current setting: {child.educationTransition.settingType.replace(/_/g, ' ')}</p>
                        )}
                        {child.educationTransition?.educationImportance && (
                          <p className="text-sm text-gray-400">Importance: {child.educationTransition.educationImportance.replace(/_/g, ' ')}</p>
                        )}
                        {child.futureEducation?.aspirations && child.futureEducation.aspirations.length > 0 && (
                          <p className="text-sm text-gray-300">Future hopes: {child.futureEducation.aspirations.map(a => a.replace(/_/g, ' ')).join(', ')}</p>
                        )}
                        {child.futureEducation?.supportExpectation && (
                          <p className="text-sm text-gray-400">Financial support: {child.futureEducation.supportExpectation.replace(/_/g, ' ')}</p>
                        )}
                        {child.educationFairness?.principles && child.educationFairness.principles.length > 0 && (
                          <p className="text-sm text-gray-400">Education fairness: {child.educationFairness.principles.map(p => p.replace(/_/g, ' ')).join(', ')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Life in the Guardian Household */}
            {guardianModel.familyFairness && (guardianModel.familyFairness.principles?.length || guardianModel.familyFairness.details) && (
              <div className="mb-3">
                <button
                  onClick={() => setExpandedReview(expandedReview === 'fairness' ? null : 'fairness')}
                  className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 w-full text-left"
                >
                  <Users size={16} />
                  <span>Life in the Guardian Household</span>
                  {expandedReview === 'fairness' ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
                </button>
                {expandedReview === 'fairness' && (
                  <div className="mt-2 ml-6 space-y-2">
                    {guardianModel.familyFairness.principles && guardianModel.familyFairness.principles.length > 0 && (
                      <p className="text-sm text-gray-300">{guardianModel.familyFairness.principles.map(p => p.replace(/_/g, ' ')).join(', ')}</p>
                    )}
                    {guardianModel.familyFairness.principlesOther && (
                      <p className="text-sm text-gray-400">Other: {guardianModel.familyFairness.principlesOther}</p>
                    )}
                    {guardianModel.familyFairness.details && (
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">{guardianModel.familyFairness.details}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* What We Trust [Guardian] to Decide */}
            {guardianModel.guardianDiscretion && (guardianModel.guardianDiscretion.trustedDecisions || guardianModel.guardianDiscretion.especiallyImportantWishes) && (
              <div className="mb-3">
                <button
                  onClick={() => setExpandedReview(expandedReview === 'trust' ? null : 'trust')}
                  className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 w-full text-left"
                >
                  <Lightbulb size={16} />
                  <span>What We Trust {guardianModel.guardianAssignments[0]?.householdLabel || 'the Guardian'} to Decide</span>
                  {expandedReview === 'trust' ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
                </button>
                {expandedReview === 'trust' && (
                  <div className="mt-2 ml-6 space-y-2">
                    {guardianModel.guardianDiscretion.trustedDecisions && (
                      <div>
                        <p className="text-xs text-gray-500">Trusted decisions</p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{guardianModel.guardianDiscretion.trustedDecisions}</p>
                      </div>
                    )}
                    {guardianModel.guardianDiscretion.especiallyImportantWishes && (
                      <div>
                        <p className="text-xs text-gray-500">Especially important wishes</p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{guardianModel.guardianDiscretion.especiallyImportantWishes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Guardian Roadmap section */}
        {hasGuardianData && (
          <div className="bg-blue-900/30 border border-blue-700/40 rounded-lg p-6 mb-6 text-left">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-6 h-6 text-blue-300" />
              <h2 className="text-lg font-semibold text-blue-200">Guardianship Roadmap</h2>
            </div>
            <p className="text-sm text-blue-100/80 mb-4">
              A personalized guide for the people you would trust to care for your children.
              It includes child-specific information, important relationships, funding philosophy,
              and immediate actions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownloadGuardianRoadmap}
                className="flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                {isGeneratingPdf ? 'Generating...' : 'Download Guardianship Roadmap'}
              </button>
              <button
                onClick={handlePreviewGuardian}
                className="flex items-center justify-center px-5 py-2.5 bg-blue-800/50 text-blue-200 rounded-lg font-medium hover:bg-blue-800/70 transition-colors text-sm border border-blue-700/40"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </button>
            </div>
          </div>
        )}

        {/* Will Companion PDF section */}
        <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-400">
            The Will Companion Kit PDF includes your estate planning information.
            {hasGuardianData ? ' The Guardianship Roadmap is downloaded separately above.' : ''}
          </p>
        </div>

        <div className="bg-blue-900 border border-blue-700 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-300 mb-3">What's Next?</h2>
          <ul className="text-left space-y-2 text-blue-200">
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">1.</span>
              <span>Download your Guardianship Roadmap and Will Companion PDF</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">2.</span>
              <span>Review both documents with your family and advisors</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">3.</span>
              <span>Store the completed forms in a secure location</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Will Companion PDF
          </button>

          <Link
            to="/"
            className="flex items-center justify-center px-6 py-3 bg-gray-700 text-gray-100 rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Return Home
          </Link>
        </div>
      </div>

      {/* Guardian Roadmap Preview Modal */}
      {showGuardianPreview && guardianPreviewHtml && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={handleClosePreview}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Guardianship Roadmap — Preview</h3>
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadGuardianRoadmap}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
                </button>
                <button
                  onClick={handleClosePreview}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-4 bg-gray-100">
              <iframe
                srcDoc={guardianPreviewHtml}
                className="w-full h-full min-h-[70vh] bg-white border-0 rounded"
                title="Guardianship Roadmap Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
