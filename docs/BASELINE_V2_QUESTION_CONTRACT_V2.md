# BASELINE V2 QUESTION CONTRACT V2 — EVIDENCE-BASED

This document replaces the previous BASELINE_V2_QUESTION_CONTRACT.md.

Every capability is assigned one of: REACHABLE, PRESENT_BUT_BROKEN, ORPHANED, LEGACY_ONLY, NOT_PRESENT, NEEDS_RUNTIME_VERIFICATION.

---

## FAMILY TRUSTS

### Trust Identity
- **CAPABILITY:** Trust legal name
- **STATUS:** REACHABLE
- **SOURCE:** FamilyTrustSection.tsx → TrustProfileEditor
- **RENDER PATH:** StepForm → FamilyTrustSection → TrustProfileEditor
- **STORAGE:** `FamilyTrust.legalName` in `familyTrustsData[]`

### Trust Establishment Date
- **CAPABILITY:** Establishment date (exact/year/unknown)
- **STATUS:** REACHABLE
- **SOURCE:** FamilyTrustSection.tsx → TrustProfileEditor
- **STORAGE:** `FamilyTrust.establishmentDate`

### Trust Deed Location
- **CAPABILITY:** Trust deed document location
- **STATUS:** REACHABLE
- **SOURCE:** FamilyTrustSection.tsx → TrustProfileEditor
- **STORAGE:** `FamilyTrust.deedLocation` (DocumentLocationRef)

### Settlor
- **CAPABILITY:** Settlor name, relationships, status
- **STATUS:** REACHABLE
- **SOURCE:** FamilyTrustSection.tsx → TrustProfileEditor
- **STORAGE:** `FamilyTrust.settlor`

### Trustees
- **CAPABILITY:** Multiple trustees, decision rule, succession
- **STATUS:** REACHABLE
- **SOURCE:** FamilyTrustSection.tsx → TrusteesSubsection
- **STORAGE:** `FamilyTrust.trustees[]`, `FamilyTrust.trusteeDecisionRule`

### Beneficiaries
- **CAPABILITY:** Multiple beneficiaries with relationship and entitlement
- **STATUS:** REACHABLE
- **SOURCE:** FamilyTrustSection.tsx → BeneficiariesSubsection
- **STORAGE:** `FamilyTrust.beneficiaries[]`

### Asset Holdings
- **CAPABILITY:** Trust asset holdings with entity links
- **STATUS:** REACHABLE
- **SOURCE:** FamilyTrustSection.tsx → AssetsSubsection
- **STORAGE:** `FamilyTrust.assetHoldings[]`

### Trust Debts
- **CAPABILITY:** Trust debts with lender, balance, security, collateral
- **STATUS:** REACHABLE
- **SOURCE:** FamilyTrustSection.tsx → DebtsSubsection
- **STORAGE:** `FamilyTrust.debts[]`

### Trust Receivables — Is anyone currently indebted to the Trust?
- **CAPABILITY:** Gateway question "Is anyone currently indebted to the Trust?"
- **STATUS:** REACHABLE
- **SOURCE:** FamilyTrustSection.tsx → DebtsAndReceivablesSubsection (line 1555)
- **STORAGE:** `FamilyTrust.hasReceivables`

### Trust Receivables — Borrower details
- **CAPABILITY:** Borrower name, relationship/entity, type of amount, approx. amount, notes
- **STATUS:** REACHABLE
- **SOURCE:** FamilyTrustSection.tsx (lines 1569–1574)
- **STORAGE:** `FamilyTrust.receivables[]` → `TrustReceivable.borrower`, `borrowerType`, `amountOwingType`, `approximateAmount`, `notes`

### Trust Receivables — Document location
- **CAPABILITY:** Where the supporting document for the receivable is located
- **STATUS:** NOT_PRESENT
- **SOURCE:** `TrustReceivable.documentLocation` field exists in type (`familyTrustTypes.ts:97`) but is NOT rendered in the active UI
- **RENDER PATH:** FamilyTrustSection.tsx lines 1555–1588 render borrower, borrowerType, amountOwingType, approximateAmount, and notes fields only. No document location picker is rendered for receivables.
- **NOTES:** This is a product-gap item for the later manual-audit repair phase. Do NOT add the question in this hardening prompt.

### 21-Year Rule Planning
- **CAPABILITY:** Confirmed by professional, confirmed date, planning completed
- **STATUS:** REACHABLE
- **SOURCE:** FamilyTrustSection.tsx → TwentyOneYearSubsection
- **STORAGE:** `FamilyTrust.twentyOneYearRule`

### Trust Tax Records Location
- **CAPABILITY:** Where tax returns and accounting records can be found
- **STATUS:** REACHABLE
- **SOURCE:** FamilyTrustSection.tsx → ProfessionalsSubsection (line 1691)
- **STORAGE:** `FamilyTrust.taxRecords.documentLocation`

### Trust Documents
- **CAPABILITY:** Multiple trust document entries with document type and location
- **STATUS:** REACHABLE
- **SOURCE:** FamilyTrustSection.tsx → DocumentsSubsection
- **STORAGE:** `FamilyTrust.trustDocuments[]`

### Trust Accountant/Lawyer Links
- **CAPABILITY:** Link trust to accountant and lawyer from Professional Team
- **STATUS:** REACHABLE
- **SOURCE:** FamilyTrustSection.tsx → ProfessionalsSubsection
- **STORAGE:** `FamilyTrust.accountantAdvisor`, `FamilyTrust.lawyerAdvisor`

---

## CORPORATIONS

### Multiple Corporations
- **CAPABILITY:** 1–15 corporations
- **STATUS:** REACHABLE
- **SOURCE:** CorporationRegistrySection.tsx
- **RENDER PATH:** StepForm → CorporationRegistrySection
- **STORAGE:** `corporationsData[]`

### Corporation Identity & Jurisdiction
- **CAPABILITY:** Legal name, jurisdiction, corporation type
- **STATUS:** REACHABLE
- **SOURCE:** CorporationRegistrySection.tsx
- **STORAGE:** Entity registry `corporation` entities

### Shareholders
- **CAPABILITY:** People, Trust, Corporate shareholders via EntityPicker
- **STATUS:** REACHABLE
- **SOURCE:** CorporationRegistrySection.tsx
- **STORAGE:** Entity registry relationships

### Share Classes & Ownership %
- **CAPABILITY:** Multiple share classes, per-shareholder ownership %, 100% validation
- **STATUS:** REACHABLE
- **SOURCE:** CorporationRegistrySection.tsx
- **STORAGE:** `corporationsData[].shareClasses[]`

### Continuity & Interim Management
- **CAPABILITY:** Ownership succession, management succession, interim manager
- **STATUS:** NEEDS_RUNTIME_VERIFICATION
- **SOURCE:** CorporationRegistrySection.tsx → BusinessOwnerBranch
- **STORAGE:** `corporationsData[].ownershipSuccession`, `managementSuccession`

### Key Personnel
- **CAPABILITY:** Additional key people, accountant, banker, payroll, lawyer
- **STATUS:** NEEDS_RUNTIME_VERIFICATION
- **SOURCE:** CorporationRegistrySection.tsx
- **STORAGE:** `corporationsData[].additionalKeyPeople[]`

---

## CORPORATE FINANCIAL CONNECTIONS

### Personal Guarantees
- **CAPABILITY:** Gateway + structured guarantee records
- **STATUS:** REACHABLE
- **SOURCE:** StepForm.tsx (line 6099) → PersonalGuaranteeDetails
- **STORAGE:** `personalGuaranteesData[]`

### Shareholder Loans
- **CAPABILITY:** Gateway + structured loan records
- **STATUS:** REACHABLE
- **SOURCE:** StepForm.tsx (line 6253) → ShareholderLoanDetails
- **STORAGE:** `shareholderLoansData[]`

### Company Owed
- **CAPABILITY:** Gateway + structured owed records
- **STATUS:** REACHABLE
- **SOURCE:** StepForm.tsx (line 6395) → CompanyOwedDetails
- **STORAGE:** `companyOwedData[]`

### Intercompany Loans
- **CAPABILITY:** Gateway + structured intercompany records (requires ≥2 corporations)
- **STATUS:** REACHABLE
- **SOURCE:** StepForm.tsx (line 6506) → IntercompanyLoanDetails
- **STORAGE:** `intercompanyLoansData[]`

### Related-Party Loans
- **CAPABILITY:** Gateway + structured related-party records
- **STATUS:** REACHABLE
- **SOURCE:** StepForm.tsx → RelatedPartyLoanDetails
- **STORAGE:** `relatedPartyLoansData[]`

---

## FINANCIAL FOOTPRINT

### Banking Structure
- **CAPABILITY:** Individual / joint / mixed
- **STATUS:** REACHABLE
- **SOURCE:** FinancialFootprintAssets.tsx / FinancialFootprintShared.tsx
- **STORAGE:** `bankingStructure`

### Investment Accounts
- **CAPABILITY:** RRSP, RRIF, TFSA, RESP, RDSP, non-registered
- **STATUS:** REACHABLE
- **SOURCE:** InvestmentsIntake.tsx
- **STORAGE:** `client1NonRegisteredAccountData[]`, etc.

### Currency — CAD/USD
- **CAPABILITY:** Currency per account
- **STATUS:** NEEDS_RUNTIME_VERIFICATION
- **SOURCE:** InvestmentsIntake.tsx
- **STORAGE:** `InvestmentAccount.currency`

### Successor Designation
- **CAPABILITY:** RRSP/RRIF successor holder
- **STATUS:** NEEDS_RUNTIME_VERIFICATION
- **SOURCE:** InvestmentsIntake.tsx
- **STORAGE:** `InvestmentAccount.successor`

### Multiple Beneficiaries
- **CAPABILITY:** Per-account beneficiary designation
- **STATUS:** NEEDS_RUNTIME_VERIFICATION
- **SOURCE:** InvestmentsIntake.tsx
- **STORAGE:** `InvestmentAccount.beneficiaries[]`

### Credit Cards
- **CAPABILITY:** Multiple credit card records
- **STATUS:** REACHABLE
- **SOURCE:** CreditCardIntake.tsx
- **STORAGE:** `creditCardsData[]`

---

## REAL ESTATE

### Primary Home
- **CAPABILITY:** Primary home structured record
- **STATUS:** REACHABLE
- **SOURCE:** StepForm.tsx realEstate section
- **STORAGE:** `primaryHomeData`

### Additional Properties
- **CAPABILITY:** Repeatable property records
- **STATUS:** REACHABLE
- **SOURCE:** StepForm.tsx realEstate section
- **STORAGE:** `propertiesData[]`

### Owners & Ownership %
- **CAPABILITY:** Multiple owners with ownership percentages
- **STATUS:** REACHABLE
- **SOURCE:** PropertyDetails.tsx
- **STORAGE:** `propertiesData[].owners[]`, `ownershipPercentages`

### Mortgage
- **CAPABILITY:** Mortgage lender, balance, payment
- **STATUS:** REACHABLE
- **SOURCE:** StepForm.tsx realEstate section
- **STORAGE:** `primaryHomeData.mortgageLender`, `mortgageBalance`, etc.

### HELOC
- **CAPABILITY:** HELOC lender, balance, credit limit
- **STATUS:** REACHABLE
- **SOURCE:** StepForm.tsx realEstate section
- **STORAGE:** `primaryHomeData.helocLender`, `helocBalance`, etc.

---

## DEBT & OBLIGATIONS

### Additional Debt
- **CAPABILITY:** Repeatable additional debt records
- **STATUS:** REACHABLE
- **SOURCE:** DebtObligations.tsx
- **STORAGE:** `additionalDebtsData[]`

### Property Debt Linkage
- **CAPABILITY:** Mortgage/HELOC linked from real estate
- **STATUS:** REACHABLE
- **SOURCE:** StepForm.tsx → DebtObligations.tsx
- **STORAGE:** Cross-referenced via `propertyEntityId`

---

## PROFESSIONAL TEAM

### Financial Planner / Wealth Advisor
- **CAPABILITY:** Has-advisor gate, advisor details, additional advisors
- **STATUS:** REACHABLE
- **SOURCE:** StepForm.tsx professionalTeam section
- **STORAGE:** `fpAdvisor1*`, `fpAdditionalAdvisorsData[]`

### Accountant
- **CAPABILITY:** Has-advisor gate, advisor details, additional advisors
- **STATUS:** REACHABLE
- **SOURCE:** StepForm.tsx professionalTeam section
- **STORAGE:** `acctAdvisor1*`, `acctAdditionalData[]`

### Lawyer / Legal Counsel
- **CAPABILITY:** Has-advisor gate, advisor details, additional advisors
- **STATUS:** REACHABLE
- **SOURCE:** StepForm.tsx professionalTeam section
- **STORAGE:** `lawAdvisor1*`, `lawAdditionalData[]`

### Insurance Advisor
- **CAPABILITY:** Has-advisor gate, advisor details, additional advisors
- **STATUS:** REACHABLE
- **SOURCE:** StepForm.tsx professionalTeam section
- **STORAGE:** `insAdvisor1*`, `insAdditionalData[]`

### Health Professionals
- **CAPABILITY:** Family physician, specialists, pharmacists (repeatable)
- **STATUS:** REACHABLE
- **SOURCE:** StepForm.tsx professionalTeam section
- **STORAGE:** `sp_health_*` keys

---

## CHILDREN / GUARDIANSHIP

### Children Records
- **CAPABILITY:** Repeatable children with full details
- **STATUS:** REACHABLE
- **SOURCE:** ChildPlanningSection.tsx
- **STORAGE:** `childrenData[]`

### Guardian Designation
- **CAPABILITY:** Guardian per minor with contact
- **STATUS:** REACHABLE
- **SOURCE:** ChildPlanningSection.tsx / GuardianTransitionSection.tsx
- **STORAGE:** Per-child guardian fields

---

## WILLS

### Has-Will Gate
- **CAPABILITY:** Has will, location, date, prepared by
- **STATUS:** REACHABLE
- **SOURCE:** CurrentWillSection.tsx / StepForm.tsx
- **STORAGE:** `client1HasWill`, `client1WillLocation`, etc.

### Will Understanding Details
- **CAPABILITY:** Familiarity, residue, child predecease, specific gifts
- **STATUS:** REACHABLE
- **SOURCE:** CurrentWillSection.tsx
- **STORAGE:** `WillDocumentBasics` structure

---

## POAs

### Personal Care POA
- **CAPABILITY:** Has POA, spouse is attorney, named attorney, contact
- **STATUS:** REACHABLE
- **SOURCE:** StepForm.tsx poa section
- **STORAGE:** `client1PoaPersonalCare*`

### Property POA
- **CAPABILITY:** Has POA, spouse is attorney, named attorney, contact
- **STATUS:** REACHABLE
- **SOURCE:** StepForm.tsx poa section / PoaPropertyAttorneyDetails.tsx
- **STORAGE:** `client1PoaProperty*`

---

## ESTATE TRUSTEES / EXECUTORS

### Estate Trustee
- **CAPABILITY:** Has trustee, spouse is trustee, named trustee, contact, alternate
- **STATUS:** REACHABLE
- **SOURCE:** StepForm.tsx estateTrustees section
- **STORAGE:** `client1EstateTrustee*`

---

## FINAL WISHES / FUNERAL ARRANGEMENTS

### Funeral Arrangements
- **CAPABILITY:** Existing arrangements, types, provider, prepaid
- **STATUS:** REACHABLE
- **SOURCE:** FinalWishesArrangementsSection.tsx
- **STORAGE:** Per-person profile in `finalWishes*`

---

## PROPERTY & LIABILITY INSURANCE

### Insurance Policies
- **CAPABILITY:** Multiple policies with carrier, broker, assets
- **STATUS:** REACHABLE
- **SOURCE:** PropertyLiabilityInsuranceSection.tsx
- **STORAGE:** `propertyLiabilityPolicies[]`

---

## LEGACY INTENT

### Legacy Records
- **CAPABILITY:** Per-asset legacy intent with scenarios
- **STATUS:** REACHABLE
- **SOURCE:** LegacyIntentSection.tsx
- **STORAGE:** `legacyIntentsData[]`

---

## WORKPLACE / PENSIONS

### Workplace Benefits
- **CAPABILITY:** Multiple employers, benefit types, DB pension details
- **STATUS:** REACHABLE
- **SOURCE:** WorkplacePensionsBenefits.tsx / DbPensionDetail.tsx
- **STORAGE:** `employers[]`, benefit records

### Government Benefits
- **CAPABILITY:** CPP/QPP, OAS
- **STATUS:** REACHABLE
- **SOURCE:** GovernmentRetirementBenefits.tsx
- **STORAGE:** `cppData`, `oasData`

---

## ABOUT YOU

### Client Information
- **CAPABILITY:** Client 1 name, marital status, spouse, province
- **STATUS:** REACHABLE
- **SOURCE:** StepForm.tsx aboutYou section
- **STORAGE:** `aboutYou.fullName`, `maritalStatus`, etc.
