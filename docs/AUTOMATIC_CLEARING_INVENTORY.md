# AUTOMATIC CLEARING INVENTORY

This document inventories active automatic state clearing in the restored Baseline V2 codebase.

Patterns searched: `onAnswerChange(..., undefined)`, `onAnswerChange(..., [])`, `onAnswerChange(..., {})`

## Classification Legend

- **EPHEMERAL_SAFE_CLEAR** — temporary UI-only data, "Other" text after deselection, short-lived branch data
- **STRUCTURED_DATA_RISK** — People, Trusts, Corporations, Policies, Accounts, Properties, Professionals, detailed Will/POA records
- **NEEDS_REVIEW** — unclear without deeper context

---

## Inventory

### FamilyTrustSection.tsx

| Line | Code | Classification |
|------|------|----------------|
| 185 | `onAnswerChange('familyTrustsData', updated.length > 0 ? updated : undefined)` | EPHEMERAL_SAFE_CLEAR — clears only when array is empty (no trusts remain); this is correct empty-array handling, not destructive |

### Wizard.tsx (REMOVED)

| Line | Code | Classification |
|------|------|----------------|
| (removed) | Hidden-step clearing: `updateAnswer(step.sectionId, key, undefined)` for all keys in a step when visibility changes | STRUCTURED_DATA_RISK — **REMOVED in Baseline V2** per Part 3 |

### StepForm.tsx — "Other" text clearing

| Line | Code | Classification |
|------|------|----------------|
| 200 | `onAnswerChange('spousePoaPersonalCareHasDocCopy', undefined)` | EPHEMERAL_SAFE_CLEAR — clearing doc copy flag when POA selection changes |
| 208 | `onAnswerChange('spousePoaPropertyHasDocCopy', undefined)` | EPHEMERAL_SAFE_CLEAR — same pattern for property POA |
| 218 | `onAnswerChange(key, undefined)` — clearing alternate POA keys | EPHEMERAL_SAFE_CLEAR — clearing alternate fields when gate changes |
| 300, 317 | `onAnswerChange(key, undefined)` — clearing additional advisor keys | EPHEMERAL_SAFE_CLEAR — clearing additional advisor fields when "has additional" changes |
| 326 | `onAnswerChange('fpAdditionalAdvisorsData', undefined)` | NEEDS_REVIEW — clears additional advisors data array when gate closes |
| 329 | `onAnswerChange('fpAdditionalHasAdditional', undefined)` | EPHEMERAL_SAFE_CLEAR — clearing continuation flag |
| 347, 368, 389 | `onAnswerChange('acctAdditionalData'/'lawAdditionalData'/'insAdditionalData', undefined)` | NEEDS_REVIEW — same pattern for accountant/lawyer/insurance additional data |
| 350, 371, 392 | `onAnswerChange('acctAdditionalHasAdditional'/'lawAdditionalHasAdditional'/'insAdditionalHasAdditional', undefined)` | EPHEMERAL_SAFE_CLEAR |
| 396-480 | Various `onAnswerChange(key, undefined)` for health professionals | EPHEMERAL_SAFE_CLEAR — clearing health pro fields when gate changes |
| 428 | `onAnswerChange('primaryHomeData', undefined)` | STRUCTURED_DATA_RISK — clears primary home data when "has primary home" changes |
| 438-490 | Various `onAnswerChange(key, undefined)` for property fields | EPHEMERAL_SAFE_CLEAR — clearing per-property fields when count decreases |

### DebtObligations.tsx

| Line | Code | Classification |
|------|------|----------------|
| 636 | `onAnswerChange('additionalDebtsData', updated.length > 0 ? updated : undefined)` | EPHEMERAL_SAFE_CLEAR — correct empty-array handling |
| 654 | `onAnswerChange('reviewConfirmed', undefined)` | EPHEMERAL_SAFE_CLEAR — clearing review flag when debt data changes |

### CreditCardIntake.tsx

| Line | Code | Classification |
|------|------|----------------|
| 289 | `onAnswerChange('creditCardsData', updated.length > 0 ? updated : undefined)` | EPHEMERAL_SAFE_CLEAR — correct empty-array handling |

### LegacyIntentSection.tsx

| Line | Code | Classification |
|------|------|----------------|
| 122 | `onAnswerChange('legacyIntentsData', updated.length > 0 ? updated : undefined)` | EPHEMERAL_SAFE_CLEAR — correct empty-array handling |

---

## Items Fixed in This Baseline

1. **Wizard.tsx hidden-step deletion** — REMOVED (Part 3)
2. **FamilyTrustSection.tsx gateway deletion** — REMOVED: `onAnswerChange('familyTrustsData', undefined)` when gateway changes from Yes → No/NotSure (Part 5)

## Items NOT Fixed (As Directed)

All other entries above are inventoried but NOT automatically fixed, per Part 4 instructions. The STRUCTURED_DATA_RISK and NEEDS_REVIEW items should be evaluated in future domain-by-domain modernization work.
