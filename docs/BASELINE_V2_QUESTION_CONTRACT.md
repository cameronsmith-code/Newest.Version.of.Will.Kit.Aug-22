# BASELINE V2 QUESTION CONTRACT

This is a development-only baseline contract inventory of existing capabilities in the restored Baseline V2 codebase. It exists to stop future UX work from orphaning existing functionality.

## ABOUT YOU

- Client 1 full name (required)
- Marital status (married/common_law/single/divorced/widowed/separated)
- Spouse name (conditional on married/common_law)
- Client 1 age/birth year
- Client 2 age/birth year (conditional on spouse)
- Province/jurisdiction
- Previous relationships (separate section, repeatable records with per-relationship detail)
- Client name reuse across all downstream sections
- Spouse branching controls visibility across the entire questionnaire

## CHILDREN / DEPENDANTS

- Repeatable children records (childrenData array)
- Per-child: name, relationship (child/stepchild/adopted/foster/other), birthDate/age, phone, email, city, province, country
- Three-way classification: minor / independent_adult / adult_dependant
- Per-child grandchildren (numberOfGrandchildren + grandchild names)
- Guardian designation per-minor with contact fields
- Planning persons with linkage (sourceId)
- Connections & belonging per child (connectionType, contexts, importance, contact info, continuity ideas)
- Communities and traditions per child
- Rich relationship type enum

## FAMILY TRUSTS

- Multiple trusts (repeatable)
- Trust identity (legalName), entity registry link (entityId)
- Establishment date (exact/year/unknown)
- Trust deed location (DocumentLocationRef), deed missing/no copy flags
- Settlor (name, relationships to both clients, status: living/deceased/unknown)
- Multiple trustees (TrusteeEntry[] with personId, personType)
- Trustee decision rule (any_one/all_together/majority/other/not_sure)
- Trustee continuity per client (succession, successor trustee, doc location)
- Beneficiaries (TrustBeneficiaryEntry[] with relationship, entitlement: income/capital/both/not_sure)
- Additional beneficiary classes
- Asset holdings (TrustAssetHolding[] with assetType, links to corporation/property/accounts, share class, ownership %, voting shares)
- Trust debts (TrustDebt[] with lender, loanType, balance, secured, collateral, guarantee, guarantor, limited recourse, exposure, document location)
- Trust receivables (TrustReceivable[] with borrower, amount, document location)
- Accountant and lawyer advisor links
- Tax records location
- 21-year rule (confirmedByProfessional, confirmedDate, planningCompleted, planningNotes, planningDocLocation)
- Anniversary calculation and status
- Trust documents (TrustDocumentEntry[] with multiple doc types)
- Automated review flags (deed missing, 21-year urgency, trustee succession, guarantor exposure, undocumented receivables)
- Family notes

## SOLE PROPRIETORSHIPS / PARTNERSHIPS

- Client 1 sole proprietorship (yes/no) + count
- Client 1 partnership (yes/no) + count
- Client 2 sole proprietorship (yes/no) + count (conditional on spouse)
- Client 2 partnership (yes/no) + count (conditional on spouse)

## CORPORATIONS

- Multiple corporations (numberOfCorporations 1–15, corporationsData array)
- Corporation identity (legalName)
- Jurisdiction (province/entity registry)
- Corporation type (entity registry type system)
- Multiple shareholders (owners + otherOwners array)
- People shareholders (EntityPicker person type)
- Trust shareholders (EntityPicker trust type; trust holding sync)
- Corporate shareholders (EntityPicker corporation type)
- Multiple share classes
- Ownership percentages (per-shareholder)
- Per-share-class ownership
- Validation to 100% (share-class percentage sum validation)
- Circular ownership detection
- Shareholder agreement (referenced in legacy intent)
- Signing authority
- Continuity intentions (BusinessOwnerBranch: ownershipSuccession + managementSuccession)
- Interim management (interimManager name)
- Key personnel (additionalKeyPeople array)
- Accountant/bookkeeper
- Banker
- Payroll
- Lawyer/legal counsel
- Corporate documents (document location references)
- Additional corporations (repeatable registry)

## CORPORATE FINANCIAL CONNECTIONS

- Personal guarantee flag (yes/no/not_sure)
- Shareholder loan — money into company (yes/no/not_sure)
- Owes company — money taken from company (yes/no/not_sure)
- Intercompany loans (yes/no/not_sure)
- Related-party loans (yes/no/not_sure)
- Review confirmation (conditional on any yes)
- Per-record CompanyOwedData: owedBy, selectedCompany, amount/amountUnknown, balanceChanges, written agreement, document location, interest, repayment terms
- Repeatable additional records
- Entity IDs for obligation/borrower/lender
- CorporateFinancialReview screen with ConnectionCard (edit/remove/add/confirm)

## PROFESSIONAL TEAM

- Financial Planner / Wealth Advisor (with "Cameron Smith CFP®" preset)
- Accountant
- Lawyer / Legal Counsel
- Insurance Advisor / Broker
- Family Physician (repeatable)
- Specialist Physicians (repeatable)
- Pharmacists (repeatable)
- Other professionals (extensible)
- Per-professional: has-advisor gate, works-with (client1/client2), firm, name, phone, email
- Additional advisors per professional type (repeatable with gate)

## FINANCIAL FOOTPRINT

- Banking structure: individual / joint / mixed
- Client 1 institutions (repeatable: name, accountType)
- Client 2 institutions (conditional on spouse + individual/mixed)
- Joint institutions (joint structure)
- Mixed joint/client1/client2 institutions
- Investment accounts — Client 1 ownership
- Investment accounts — Client 2 ownership
- Joint accounts
- RRSP, RRIF, TFSA, RESP, RDSP, non-registered accounts (asset subtypes)
- Multiple beneficiaries (per-account designation)
- Successor designation (RRSP/RRIF successor holder)
- CAD / USD currency
- Advisor / institution relationships
- Workplace-origin accounts (linked to workplace pensions via footprintAccountId)
- Corporate / trust-related financial assets (linked via entity IDs)
- Multi-screen wizard: intro → banking → investments → pensions → equity → receivables → other → review
- Derivation engine (advisors, institutions, employers, receivables)
- Credit cards (creditCardsData)
- Other assets (vehicles, boats, etc.)
- Receivables (loans receivable data)

## REAL ESTATE

- Existing residence reuse (linkedResidence links to primary home)
- Primary home (primaryHomeData, separate from additional)
- Additional properties (propertiesData array, repeatable)
- Property type (primary_home, cottage, farm, rental, investment, commercial, etc.)
- Multiple owners (owners[], ownerEntityIds[], ownerEntityTypes)
- Ownership percentages (per-owner)
- Other (non-entity) owners (OtherOwner[])
- Full address (country, province, state, city, streetAddress, unit, postalCode)
- Property entity ID (registry-linked)
- Purchase year, purchased by, purchase-time ownership %, purchase price
- Renovations / capital improvements (repeatable CapitalImprovement)
- Inhabited annually, used for income, CCA claimed
- Principal residence election (claimedPREOtherProperty, preDesignatedYears)
- Title holding, co-ownership agreement + location
- Farm active engagement
- Property manager (name/phone/email/company)
- Landlord insurance + location
- Rental tax document locations (Canadian/foreign)
- Lease documents location
- Deeds location, records location (DocumentLocationRef)
- Mortgage (via debt obligations linkage)
- HELOC (via debt obligations linkage)

## DEBT & OBLIGATIONS

- Property debt / mortgage (linked from real estate, per-property)
- HELOC (per-property)
- Additional debt (repeatable AdditionalDebt: borrower, lender, amount, secured, collateral, guarantee, document location)
- Credit cards (CreditCardIntake component, creditCardsData)
- Guarantees (personal guarantee tracking — corporate + personal)
- Other existing debt flows

## LIFE INSURANCE

- Client 1 — employer life insurance (yes/no → up to 4 policies)
- Client 1 — personal life insurance (yes/no → up to 4 policies)
- Client 1 — critical illness (yes/no → up to 4 policies)
- Client 1 — disability (yes/no → up to 4 policies)
- Client 2 — all four types (conditional on spouse)
- Corporate insurance (auto-generated for up to 4 corporations)
- Per-policy: insurer, policy number, coverage amount, beneficiary, owner, premium, document location
- Policy owner (Client1/Client2/Corporate/Trust)
- Beneficiary designation (person selection + contingent)

## WORKPLACE / PENSIONS

- Has workplace benefits gate
- Multiple employers per client (EmployerRecord with isCurrent, countryCode)
- Former employer benefits
- Full benefit type enum (DB, DC, group RRSP, DPSP, group TFSA, PRPP, ESPP, stock options, RSU, PSU, DSU, supplemental retirement, deferred comp, deferred bonus, RCA, employer life insurance, employer death benefit, pension death benefit, other, not_sure)
- Benefit families (definedBenefitPension, accountBasedPlan, employerEquity, executiveDeferred, employerInsurance, other)
- Multiple benefits per employer (repeatable)
- DB pension: jurisdiction (federal + all provinces + outside Canada), status, estimates (repeatable), eligibility milestones, bridge benefit, indexing, survivor benefit, waiver, domestic agreement, guarantee period, in-payment details
- Equity / executive comp: planName, ownershipStatus, vesting, options, payment info, death/incapacity rules, termination rules, beneficiary, cross-border issuer
- Footprint reconciliation (footprintAccountId, footprintAssetRecognized)
- Administrator contact
- Document location (registry-backed)
- Government benefits: CPP/QPP (programType, status, amount, start age), OAS (status, amount, start age)
- Retirement income entitlements derivation
- Planning opportunities computation
- Bridge timing gaps computation
- Equity executor prompts and POA summaries
- Cross-border employer country support

## PROPERTY & LIABILITY INSURANCE

- Multiple policies (PropertyLiabilityPolicy[], repeatable)
- Policy types: property, auto, umbrella, valuable_articles, other
- Policy-first architecture (one policy covers multiple assets)
- Carrier/insurer (entity-linked)
- Broker/agent (professional team linked)
- Policy number, premium amount + frequency
- Payment source (linked to Financial Footprint bank/credit card)
- Renewal date
- Asset relationships (relatedPropertyIds, relatedVehicleIds, relatedOtherAssetIds)
- Umbrella coverage + underlying policy links
- Vacancy requirements, rental/landlord coverage
- Valuable articles + appraisal
- Document location (registry-backed)
- Coverage status (active/inactive)
- Per-property insurance status
- Household insurance manager
- Continuity notes
- Derivation helpers (properties, vehicles, bank accounts, credit cards)

## LEGACY INTENT

- Multiple legacy records (one per asset)
- Asset reference (assetId, sourceSectionId, assetName, assetType: real_estate/corporation/other, ownership, isBusiness)
- Available assets derivation (from real estate + corporations)
- First-death scenario (outcome, recipientIds, recipients with shares, notes)
- Both-deceased scenario
- No-surviving-descendants scenario
- Stay-in-family intent + recipient IDs + fallback
- Equalization intent
- Family discussion status + notes
- Reflected in estate documents
- Business owner branch (conditional when isBusiness): ownership succession, management succession, shareholder agreement consistency, post-mortem flexibility, post-mortem considered, planning documents, professional contacts, family discussion, successor discussion
- Indivisible asset detection
- Scenario-based recipient eligibility (excludes deceased/both clients/descendants based on scenario)
- People derivation (clients, children, grandchildren, previous partners)
- Automated review flags

## WILLS

- Per-client will understanding (both clients)
- Document basics (WillDocumentBasics)
- Familiarity level (very_familiar → dont_remember)
- First-death understanding + exceptions
- Residue understanding + recipients
- Child predecease understanding
- Inheritance type
- Trust stages + trustee
- Child-specific arrangements (per-child special arrangement)
- Specific gifts + charitable gifts
- Ultimate contingency + recipients
- Other provisions
- Overall confidence
- Wants to discuss with lawyer
- Estate plan alignments
- Similar to other client comparison
- Blended family answers
- Similar-wills comparison + differences
- Review confirmed
- Planning risk flags, planning flags, blended family flags
- Complexity factors (hasMinorChildren, hasDependentAdult, etc.)
- Has-will gate: hasWill (yes/no), willLocation, willDate, willPreparedBy

## POAs (POWERS OF ATTORNEY)

- Personal Care POA — Client 1: has POA, spouse is attorney, attorney name (person picker), contact, Canada residency/country/province/city, alternate attorney, living will/advance directive
- Personal Care POA — Client 2: full mirror (conditional on spouse)
- Property POA — Client 1: has POA, spouse is attorney, attorney name (person picker), contact, Canada residency, alternate attorney
- Property POA — Client 2: full mirror (conditional on spouse)
- Document copy questions (yes_on_file / no_can_access / no_not_discussed)

## ESTATE TRUSTEES / EXECUTORS

- Client 1: has estate trustee, spouse is trustee, trustee name (person picker), contact, Canada residency, has copy of Will, knows Will location, alternate estate trustee (full contact block)
- Client 2: full mirror (conditional on spouse)
- Person picker integration (trusted person filter, contact fields)

## FINAL WISHES / FUNERAL ARRANGEMENTS

- Per-person profiles (both clients)
- Existing arrangements status
- Arrangement types (multi-select)
- Provider details (name, contact, phone, email)
- Prepaid status
- Document locations (registry-backed)
- Disposition preference + notes
- Gathering preferences (multi-select) + notes
- Traditions (important flag, notes, contact person refs, external contacts)

---

## CROSS-CUTTING CAPABILITIES

- Entity registry (unified person/trust/corporation with stable IDs)
- Document location registry (canonical locations referenced across domains)
- Person repository (centralized person records with cross-section reuse)
- Obligation sync (cross-domain debt/obligation synchronization)
- Referential integrity (cross-section entity reference validation)
- Conflict detection
- Cross-border support (multi-jurisdiction/currency)
- Blended family integration (wills + children)
- Review flag generation (per-domain automated planning risk detection)
- Guardian roadmap (narrative builder + PDF renderer)
- Missing information tracking
- Output confidence
- Clarify/review pipeline
- Household debt totals aggregation
