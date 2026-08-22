# BASELINE V2 GUARDRAILS

## BASELINE V2 PRINCIPLE

The existing question set, branch logic, repeatable records, relationship capture, and downstream mappings are functional requirements unless explicitly approved for removal.

Presentation may change.

Functionality may not silently disappear.

---

## PERMANENT ENGINEERING PRINCIPLES

### 2A. FACTS PERSIST. OUTPUTS DERIVE.

Changing a gateway, branch, or UI visibility must not automatically destroy valuable structured facts.

Examples of facts that should generally persist:

- People
- Children
- Trusts
- Corporations
- Policies
- Accounts
- Properties
- Professionals
- document locations
- completed Will/POA information
- other reusable structured records

Branch visibility determines whether information is currently presented or applicable.

It does not automatically authorize deletion.

### 2B. NO IS A FACT. UNANSWERED IS DIFFERENT.

Never treat `undefined`, `blank`, or `unanswered` as equivalent to `No`.

Likewise: "I'm not sure" is a legitimate answer and must not be converted into missing or No.

### 2C. UNKNOWN IS NOT MISSING.

If a client explicitly indicates they do not know something: preserve that uncertainty.

Do not convert it into: `blank`, `missing`, `zero`, or `No`.

### 2D. UNASKED IS NOT MISSING.

If the questionnaire never fairly presented a question: do not later flag the client for failing to answer it.

### 2E. CREATE WHERE NEEDED. STORE WHERE IT BELONGS.

A Person entered while answering a child, Trust, guardian, insurance, professional, or corporation question should be stored in the correct canonical repository where the architecture supports it.

Relationships belong to the domain. The Person belongs in the People model.

The same principle applies to: Entities, Professionals, Documents, Properties, Accounts.

### 2F. CURRENT CANONICAL SOURCE FIRST.

Where both current and legacy structures exist: use the current canonical/current structured source first.

Legacy flat fields remain: migration/fallback only.

Do not create new features that depend primarily on legacy flat fields where a current model exists.

### 2G. DO NOT CREATE PARALLEL DOMAIN ARCHITECTURES.

Do not introduce a second independent model for: People, Trusts, Corporations, Investments, Properties, Documents, Professionals, Insurance, Debts — without an explicit migration plan that defines: OLD SOURCE, NEW SOURCE, MIGRATION, CUTOVER, RETIREMENT.

A new UX component must not quietly create a new disconnected data universe.

### 2H. UX CHANGES MUST PRESERVE THE QUESTION CONTRACT.

Before redesigning a questionnaire section: inventory its existing questions, branches, repeated entities, relationships, validation, and downstream mappings.

After redesign: every approved capability must remain reachable.

A visual redesign may change: layout, wording, grouping, progressive disclosure, cards, helper text, summaries.

It may NOT silently remove functionality.

### 2I. ONE DOMAIN AT A TIME.

Do not perform future prompts such as "modernize the entire questionnaire" or "apply this UX across the whole app."

Modernize one section. Verify it. Commit it. Then continue.

### 2J. NO NEW `@ts-nocheck` IN PRODUCTION CODE.

This baseline currently has no production `@ts-nocheck` escape hatches. Preserve that.

If TypeScript reports an error: fix the error. Do not silence an entire production file.

`@ts-ignore` must also not be used as a default workaround.

### 2K. NO GIANT NEW LOGIC IN STEPFORM.

StepForm is already extremely large. Do NOT add substantial new domain functionality directly into StepForm.

When a domain is later modernized: extract that domain deliberately into a dedicated component while preserving the complete functional contract.

Do not refactor StepForm broadly in this task.

---

## QUESTION CONTRACT RULE FOR FUTURE WORK

Before a future UX migration can be declared successful:

**BEFORE:** existing functional contract is captured.

**AFTER:** every approved capability must be:

- RENDERED
- REACHABLE
- EDITABLE
- PERSISTENT
- MAPPED TO THE SAME OR APPROVED NEW CANONICAL FACT

A component existing in source code is NOT sufficient.

Reachability from the actual questionnaire flow is required.

---

## STEPFORM RULE

No significant NEW domain intake logic should be added to StepForm.

Future domain modernization should:

1. define section contract
2. extract complete domain
3. verify functionality
4. modernize presentation
5. remove old duplicate render path only after verification
