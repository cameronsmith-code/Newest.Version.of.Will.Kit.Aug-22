# AUTOMATIC CLEARING INVENTORY V2

This document replaces the previous AUTOMATIC_CLEARING_INVENTORY.md.

## Classification Model

Every automatic clear is classified as:

- **A. UI_EPHEMERAL_SAFE** — temporary text/flags belonging only to an unselected option
- **B. RELATIONSHIP_ONLY_REVIEW** — underlying Person/Entity persists, relationship may become inactive
- **C. STRUCTURED_FACT_RISK** — Person, Professional, Trust, Corporation, Policy, Account, Property, detailed Will/POA record, financial obligation
- **D. INTENTIONAL_USER_DELETE** — deletion from explicit user delete/remove action
- **E. NEEDS_REVIEW** — uncertain without deeper context

---

## Gateway-Triggered `useEffect` Clears in StepForm.tsx

### Professional Team — Additional Advisors

| # | Lines | Gateway | Field Cleared | Classification | At Risk |
|---|-------|---------|---------------|----------------|---------|
| 3 | 216–225 | `fpHasAdvisor !== 'yes'` | `fpAdditionalAdvisorsData` + all fp fields | C | Additional financial planner records |
| 4 | 326–335 | `fpHasAdditionalAdvisor !== 'yes'` | `fpAdditionalAdvisorsData` | C | Additional FP records |
| 5 | 337–345 | `acctHasAccountant !== 'yes'` | `acctAdditionalData` + all acct fields | C | Additional accountant records |
| 6 | 347–356 | `acctHasAdditional !== 'yes'` | `acctAdditionalData` | C | Additional accountant records |
| 7 | 358–366 | `lawHasLawyer !== 'yes'` | `lawAdditionalData` + all law fields | C | Additional lawyer records |
| 8 | 368–377 | `lawHasAdditional !== 'yes'` | `lawAdditionalData` | C | Additional lawyer records |
| 9 | 379–387 | `insHasAdvisor` not yes/na | `insAdditionalData` + all ins fields | C | Additional insurance advisor records |
| 10 | 389–403 | `insHasAdditional !== 'yes'` | `insAdditionalData` | C | Additional insurance records |

**Recommended future action:** Preserve structured additional-advisor arrays when gateway changes. Gateway controls visibility, not deletion. The advisor Person/Professional should persist in the People repository.

### Real Estate — Primary Home

| # | Lines | Gateway | Field Cleared | Classification | At Risk |
|---|-------|---------|---------------|----------------|---------|
| 11 | 406–414 | `hasRealEstate !== 'yes'` | `propertyCount`, flat `propertyN` keys | C | Flat property detail blocks |
| 12 | 416–425 | `propertyCount` decreases | `propertyN` where N > count | C | Excess property records |
| 13 | 428–434 | `livingSituation !== 'own'` | `primaryHomeData` | C | **Primary home structured record (address, value, mortgage, entityId)** |

**Recommended future action:** `primaryHomeData` should persist when `livingSituation` changes. The home record is a structured fact. Gateway should control presentation, not deletion.

### POA Attorney Data

| # | Lines | Gateway | Field Cleared | Classification | At Risk |
|---|-------|---------|---------------|----------------|---------|
| 29 | 629–649 | `client1HasPoaPersonalCare === 'no'` | `client1PoaPersonalCareName/Phone/Email/Relationship/IsCanadaResident/Country/Province/City/HasDocCopy` | C | POA personal-care attorney data |
| 30 | 651–671 | `client2HasPoaPersonalCare === 'no'` | `client2PoaPersonalCare*` | C | POA personal-care attorney data |
| 31 | 673–692 | `client1SpouseIsPoaPersonalCare === 'yes'` | `client1PoaPersonalCareName/Phone/Email/Relationship/...` | C | Named attorney data wiped when spouse selected |
| 32 | 694–713 | `client2SpouseIsPoaPersonalCare === 'yes'` | `client2PoaPersonalCare*` | C | Same for client2 |

**Recommended future action:** Named attorney data should persist when spouse is selected. The named attorney Person should remain in the People repository even if the relationship becomes inactive.

### Health Professionals

| # | Lines | Gateway | Field Cleared | Classification | At Risk |
|---|-------|---------|---------------|----------------|---------|
| 17 | 488–497 | `sp_health_has !== 'yes'` | all `sp_health_*` keys | C | Specialist physician records |
| 18 | 499–516 | `*_health_*_has_additional !== 'yes'` | cascade-clears subsequent specialist cards | C | Health-professional records in cascade |

### Spouse Data

| # | Lines | Gateway | Field Cleared | Classification | At Risk |
|---|-------|---------|---------------|----------------|---------|
| 35 | 739–754 | `maritalStatus` not married/common-law | `spouseName`, `spouseDateOfBirth`, `spouseEmail`, `spousePhone`, spouse address fields, `hasMarriageContract`, `marriageContractLocation` | C | Spouse personal data |
| 36 | 756–762 | `hasMarriageContract !== 'yes'` | `marriageContractLocation` | A | Document location flag |

### Will Fields

| # | Lines | Gateway | Field Cleared | Classification | At Risk |
|---|-------|---------|---------------|----------------|---------|
| 21 | 534–546 | `client1HasSecondaryWill === 'no'` | `client1SecondaryWillLocation`, `client1SecondaryWillJurisdiction` | A | Will location |
| 22 | 548–560 | `client2HasSecondaryWill === 'no'` | `client2SecondaryWill*` | A | Will location |
| 23 | 562–574 | `client1HasWill === 'no'` | `client1HasSecondaryWill`, `client1HasHensonTrust` | A | Cascade gates |
| 25 | 589–599 | `client1WillPreparedInCanada` | country or province | A | Jurisdiction detail |
| 27 | 613–619 | `client1HasDigitalWillCopy === 'no'` | `client1DigitalWillLocation` | A | Document location |

### UI-Ephemeral / Safe

| # | Lines | Gateway | Field Cleared | Classification |
|---|-------|---------|---------------|----------------|
| 1 | 200–206 | `spouseIsPoaPersonalCare === 'no'` | `spousePoaPersonalCareHasDocCopy` | A |
| 2 | 208–214 | `spouseIsPoaProperty === 'no'` | `spousePoaPropertyHasDocCopy` | A |
| 37 | 764–770 | `hasChildren !== 'yes'` | `numberOfChildren` only (NOT `childrenData`) | A |
| 38 | 772–778 | `client1HasPreviousRelationship !== 'yes'` | count only | A |
| 39 | 780–786 | `client2HasPreviousRelationship !== 'yes'` | count only | A |

### Family Trust (FIXED in this Closure Gate)

| # | Lines | Gateway | Field Cleared | Classification | Status |
|---|-------|---------|---------------|----------------|--------|
| 40 | 788–794 | `hasFamilyTrust !== 'yes'` | Legacy flat keys only | A | **`familyTrustsData` PRESERVED** |

### Corporate Financial (FIXED in this Closure Gate)

| # | Lines | Gateway | Field Cleared | Classification | Status |
|---|-------|---------|---------------|----------------|--------|
| PG | 6105 | `pgHasPersonalGuarantee !== 'yes'` | `personalGuaranteesData` | C | **FIXED: preserved** |
| SL | 6259 | `slHasShareholderLoan !== 'yes'` | `shareholderLoansData` | C | **FIXED: preserved** |
| CO | 6400 | `slOwesCompany !== 'yes'` | `companyOwedData` | C | **FIXED: preserved** |
| IC | 6541 | `slIntercompanyLoan !== 'yes'` | `intercompanyLoansData` | C | **FIXED: preserved** |
| RPL | 6679 | `slRelatedPartyLoan !== 'yes'` | `relatedPartyLoansData` | C | **FIXED: preserved** |

---

## Array-Wipe Patterns

| File | Line | Context | Field | Classification |
|------|------|---------|-------|----------------|
| StepForm.tsx | 10050 | `client1HasNonRegisteredAccount === 'no'` | `client1NonRegisteredAccountData` set to `[]` | C |

**Recommended future action:** Investment account records should persist when the gateway changes.

---

## User-Initiated Delete Handlers (INTENTIONAL_USER_DELETE)

| File | Line | Field | Behavior |
|------|------|-------|----------|
| CreditCardIntake.tsx | 289 | `creditCardsData` | undefined when last card deleted |
| DebtObligations.tsx | 636 | `additionalDebtsData` | undefined when last debt deleted + canonical entity removed |
| FamilyTrustSection.tsx | 185 | `familyTrustsData` | undefined when last trust deleted |
| LegacyIntentSection.tsx | 122 | `legacyIntentsData` | undefined when last intent deleted |

These are legitimate user-initiated deletes and classified as D.

---

## State-Machine Cleanup

| File | Line | Trigger | Field | Classification |
|------|------|---------|-------|----------------|
| DebtObligations.tsx | 644–656 | debts list length changes | `reviewConfirmed` | A |
| CreditCardIntake.tsx | 296–300 | `hasCreditCards === 'no'` + length 0 | local draft state only | A |

---

## People / Professional Clearing Distinction

For the Professional Team items above (entries 3–10):

**Relationship at risk:** "John's accountant" — the advisor relationship to the client
**Person/Professional entity at risk:** "Jane Smith, CPA" — the professional Person record

The current code clears BOTH the relationship AND the structured professional record when the gateway changes. Per BASELINE V2 principles, the Person/Professional should persist in the People repository. Only the relationship should become inactive.

This same principle applies to:
- POA attorneys (entries 29–32)
- Estate trustees (if similar patterns exist in unexamined lines)
- Guardians
- Health professionals (entries 17–18)

---

## Unexamined Regions

StepForm.tsx is ~14,434 lines. This audit covered effects through line 794 and specific corporate financial clearing through line 6679. Additional clearing patterns may exist in lines 795–14434 covering:
- POA property attorney data
- Estate trustee data
- Corporation structured data
- Investment account beneficiary data
- Pension/retirement benefit data

These should be examined in future domain-by-domain modernization work.
