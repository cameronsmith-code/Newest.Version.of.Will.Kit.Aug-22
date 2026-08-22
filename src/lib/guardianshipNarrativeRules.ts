import type { NarrativeRule } from './guardianshipNarrativeTypes';

export const RULE_CATALOGUE: NarrativeRule[] = [
  { id: 'GUARDIAN-01', description: 'Identify the intended guardian household for each minor child' },
  { id: 'GUARDIAN-02', description: 'Note whether the guardian has been approached and has agreed' },
  { id: 'GUARDIAN-03', description: 'Note whether the guardian is already named in the Will' },
  { id: 'GUARDIAN-04', description: 'Identify alternate guardian if one has been considered' },
  { id: 'GUARDIAN-05', description: 'Flag when no Will exists but guardian intentions are documented' },

  { id: 'MOVE-01', description: 'Child is expected to move to guardian community' },
  { id: 'MOVE-02', description: 'Move is possible but not yet decided' },
  { id: 'MOVE-03', description: 'Cross-province or cross-border move implications' },

  { id: 'SCHOOL-01', description: 'School change likely — current school is a transition resource' },
  { id: 'SCHOOL-02', description: 'IEP and learning supports should be transferred' },
  { id: 'SCHOOL-03', description: 'Education records location for transfer' },

  { id: 'HEALTH-01', description: 'Current healthcare providers are transition resources' },
  { id: 'HEALTH-02', description: 'Medications need to be continued and managed' },
  { id: 'HEALTH-03', description: 'Allergies must be communicated to new caregivers' },
  { id: 'HEALTH-04', description: 'Care plan exists and should be shared' },

  { id: 'SUPPORT-01', description: 'Disability support transition — what exists, why it matters, what to do' },
  { id: 'SUPPORT-02', description: 'Support provider can help transfer history' },

  { id: 'CONNECTION-01', description: 'Especially important relationship may need intentional effort after move' },
  { id: 'CONNECTION-02', description: 'Important relationship with continuity ideas' },
  { id: 'CONNECTION-03', description: 'Important relationship without contact info' },

  { id: 'SIBLING-01', description: 'Adult independent sibling is a sister/brother, not a replacement parent' },
  { id: 'SIBLING-02', description: 'Adult sibling role — what they should and should not be expected to do' },

  { id: 'ACTIVITY-01', description: 'Important activity is part of identity and routine' },
  { id: 'ACTIVITY-02', description: 'Critical activity may be a primary anchor for the child' },

  { id: 'COMMUNITY-01', description: 'Community belonging worth preserving' },
  { id: 'TRADITION-01', description: 'Family tradition worth continuing if practical' },

  { id: 'INHERITANCE-01', description: 'Inheritance managed in stages rather than outright' },
  { id: 'INHERITANCE-02', description: 'Trustee identified for managed inheritance' },
  { id: 'INHERITANCE-03', description: 'Child-specific trust arrangement for disabled child' },
  { id: 'INHERITANCE-04', description: 'Inheritance intentions are parent understanding, not confirmed' },

  { id: 'ADULT-TRANSITION-01', description: 'Future support expectations for child approaching adulthood' },
  { id: 'ADULT-TRANSITION-02', description: 'Disability Tax Credit and review milestone' },

  { id: 'PARENT-VOICE-01', description: 'Preserve parent-entered free text about the child' },
  { id: 'PARENT-VOICE-02', description: 'Preserve parent first-days wishes' },
  { id: 'PARENT-VOICE-03', description: 'Preserve parent notes about transition' },

  { id: 'READINESS-01', description: 'Decisions already made and confirmed' },
  { id: 'READINESS-02', description: 'Things worth confirming with professionals' },
  { id: 'READINESS-03', description: 'Things still to do' },

  { id: 'IMMEDIATE-01', description: 'Contact the intended guardians' },
  { id: 'IMMEDIATE-02', description: 'Keep minor siblings together' },
  { id: 'IMMEDIATE-03', description: 'Contact important family members' },
  { id: 'IMMEDIATE-04', description: 'Locate Wills and contact Estate Trustee' },
  { id: 'IMMEDIATE-05', description: 'Gather school and health records' },
  { id: 'IMMEDIATE-06', description: 'Help children stay connected to important people' },
  { id: 'IMMEDIATE-07', description: 'Follow parent first-days wishes' },
  { id: 'IMMEDIATE-08', description: 'Avoid unnecessary changes initially' },

  { id: 'FINANCIAL-01', description: 'Life insurance exists for the family' },
  { id: 'FINANCIAL-02', description: 'RESP mapped to specific children' },
  { id: 'FINANCIAL-03', description: 'RDSP exists for disabled child' },

  { id: 'DOC-01', description: 'Will location and existence' },
  { id: 'DOC-02', description: 'Education records location' },
  { id: 'DOC-03', description: 'Health records location' },
  { id: 'DOC-04', description: 'Care plan location' },
  { id: 'DOC-05', description: 'IEP document location' },
  { id: 'DOC-06', description: 'Birth certificate location' },
  { id: 'DOC-07', description: 'DTC documentation location' },

  { id: 'ROLE-01', description: 'Day-to-day care role assignment' },
  { id: 'ROLE-02', description: 'Inheritance trustee role' },
  { id: 'ROLE-03', description: 'Sibling connection role' },

  { id: 'FUNDING-01', description: 'Overall funding philosophy — resources are meant to support the guardian household' },
  { id: 'FUNDING-02', description: 'Everyday household costs should be covered, not itemized' },
  { id: 'FUNDING-03', description: 'Meaningful child-specific costs identified' },
  { id: 'FUNDING-04', description: 'Major household changes anticipated and supported' },
  { id: 'FUNDING-05', description: 'Housing support — larger home if needed' },
  { id: 'FUNDING-06', description: 'Vehicle support if needed' },
  { id: 'FUNDING-07', description: 'Guardian reducing work — lost income support' },
  { id: 'FUNDING-08', description: 'Childcare or household help support' },
  { id: 'FUNDING-09', description: 'Shared household benefit — expenses benefiting everyone' },
  { id: 'FUNDING-10', description: 'Fairness within guardian household — own children not disadvantaged' },
  { id: 'FUNDING-11', description: 'Record-keeping philosophy' },
  { id: 'FUNDING-12', description: 'Parent message about financial support' },

  { id: 'COORDINATION-01', description: 'Different people hold care and financial roles' },
  { id: 'COORDINATION-02', description: 'Same person holds both care and financial roles' },
  { id: 'COORDINATION-03', description: 'Guardian judgment — how much weight to give guardian perspective' },
  { id: 'COORDINATION-04', description: 'Long-term financial responsibility' },
  { id: 'COORDINATION-05', description: 'Major decisions requiring discussion' },
  { id: 'COORDINATION-06', description: 'Discussion threshold — when to consult' },
  { id: 'COORDINATION-07', description: 'Disagreement process' },
  { id: 'COORDINATION-08', description: 'Professional escalation — who to involve if unresolved' },
  { id: 'COORDINATION-09', description: 'Parent message to guardian' },
  { id: 'COORDINATION-10', description: 'Parent message to financial decision-maker' },
  { id: 'COORDINATION-11', description: 'Parent message about working together' },
];
