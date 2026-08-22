import type {
  PlanningPerson,
  GuardianAssignment,
  EstateTrusteeInfo,
  EstateTrusteePerson,
  ClientInheritanceInfo,
  GuardianshipChildProfile,
  ChildCareFundingPhilosophy,
  FinancialDecisionMakerRole,
  CoordinationScenario,
} from './guardianshipRoadmapTypes';
import type { ProfessionalAdvisor } from './referentialIntegrity';
import { getProfessionalAdvisors, resolveProfessionalReference } from './referentialIntegrity';

type AnswersMap = Map<string, Record<string, unknown>>;

export type ResolvedPerson = {
  id: string;
  name: string;
  resolved: boolean;
  source: 'planningPerson' | 'spouse' | 'child' | 'unresolvedName';
  originalId?: string;
};

export type RoleResolutionResult = {
  people: ResolvedPerson[];
  personIds: string[];
  unresolvedNames: string[];
};

export type EscalationProfessional = {
  id: string;
  name: string;
  type: ProfessionalAdvisor['type'];
  active: boolean;
  originalId: string;
  resolved: boolean;
};

export type CareFundingCoordinationContext = {
  guardians: RoleResolutionResult;
  attorneysForProperty: RoleResolutionResult;
  estateTrustees: RoleResolutionResult;
  inheritanceTrustees: RoleResolutionResult;
  escalationProfessionals: EscalationProfessional[];
  hasUnresolvedIdentity: boolean;
};

const NAME_TO_ID_PREFIX = 'unresolved_';

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function nameToSyntheticId(name: string): string {
  return `${NAME_TO_ID_PREFIX}${normalizeName(name).replace(/\s+/g, '_')}`;
}

function findPlanningPersonByName(
  planningPersons: PlanningPerson[],
  name: string
): PlanningPerson | undefined {
  const normalized = normalizeName(name);
  return planningPersons.find(
    p => normalizeName(p.name) === normalized
  );
}

export function resolveGuardianPeople(
  guardianAssignments: GuardianAssignment[]
): RoleResolutionResult {
  const people: ResolvedPerson[] = [];
  const seenIds = new Set<string>();
  const unresolvedNames: string[] = [];

  for (const assignment of guardianAssignments) {
    for (const person of assignment.guardianPeople) {
      if (seenIds.has(person.id)) continue;
      seenIds.add(person.id);
      people.push({
        id: person.id,
        name: person.name,
        resolved: true,
        source: 'planningPerson',
      });
    }
  }

  return {
    people,
    personIds: people.map(p => p.id),
    unresolvedNames,
  };
}

export function resolveAttorneyForPropertyPeople(
  powersOfAttorneyAnswers: Record<string, unknown>,
  planningPersons: PlanningPerson[]
): RoleResolutionResult {
  const people: ResolvedPerson[] = [];
  const seenIds = new Set<string>();
  const unresolvedNames: string[] = [];

  const poaData = powersOfAttorneyAnswers.poaPropertyData as Array<Record<string, unknown>> | undefined;
  if (poaData) {
    for (const attorney of poaData) {
      const personId = String(attorney.attorneyPersonId || '');
      const name = String(attorney.attorneyName || '');

      if (personId && personId.startsWith('pp_')) {
        if (seenIds.has(personId)) continue;
        seenIds.add(personId);
        const pp = planningPersons.find(p => p.id === personId);
        people.push({
          id: personId,
          name: pp?.name || name || personId,
          resolved: !!pp,
          source: 'planningPerson',
          originalId: personId,
        });
      } else if (personId) {
        if (seenIds.has(personId)) continue;
        seenIds.add(personId);
        people.push({
          id: personId,
          name: name || personId,
          resolved: false,
          source: 'unresolvedName',
          originalId: personId,
        });
        if (name) unresolvedNames.push(name);
      } else if (name) {
        const pp = findPlanningPersonByName(planningPersons, name);
        const id = pp?.id || nameToSyntheticId(name);
        if (seenIds.has(id)) continue;
        seenIds.add(id);
        people.push({
          id,
          name,
          resolved: !!pp,
          source: pp ? 'planningPerson' : 'unresolvedName',
          originalId: undefined,
        });
        if (!pp) unresolvedNames.push(name);
      }
    }
  }

  return {
    people,
    personIds: people.map(p => p.id),
    unresolvedNames,
  };
}

export function resolveEstateTrusteePeople(
  estateTrustees: EstateTrusteeInfo[],
  willsAnswers: Record<string, unknown>,
  planningPersons: PlanningPerson[]
): RoleResolutionResult {
  const people: ResolvedPerson[] = [];
  const seenIds = new Set<string>();
  const unresolvedNames: string[] = [];

  const currentWillData = willsAnswers.currentWillData as Record<string, unknown> | undefined;
  const willClients = (currentWillData?.clients as Array<Record<string, unknown>>) || [];

  for (const et of estateTrustees) {
    if (!et.primaryTrustee?.name) continue;

    const will = willClients.find(c => c.clientId === et.clientId);
    const trustPersonId = String(will?.trustTrusteePersonId || '');

    if (trustPersonId && trustPersonId.startsWith('pp_')) {
      if (seenIds.has(trustPersonId)) continue;
      seenIds.add(trustPersonId);
      const pp = planningPersons.find(p => p.id === trustPersonId);
      people.push({
        id: trustPersonId,
        name: pp?.name || et.primaryTrustee.name,
        resolved: !!pp,
        source: 'planningPerson',
        originalId: trustPersonId,
      });
    } else {
      const name = et.primaryTrustee.name;
      const pp = findPlanningPersonByName(planningPersons, name);
      const id = pp?.id || nameToSyntheticId(name);
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      people.push({
        id,
        name,
        resolved: !!pp,
        source: pp ? 'planningPerson' : 'unresolvedName',
        originalId: trustPersonId || undefined,
      });
      if (!pp) unresolvedNames.push(name);
    }
  }

  return {
    people,
    personIds: people.map(p => p.id),
    unresolvedNames,
  };
}

export function resolveInheritanceTrusteePeople(
  childProfiles: GuardianshipChildProfile[],
  planningPersons: PlanningPerson[]
): RoleResolutionResult {
  const people: ResolvedPerson[] = [];
  const seenIds = new Set<string>();
  const unresolvedNames: string[] = [];

  for (const child of childProfiles) {
    for (const record of child.inheritanceByClient) {
      const trusteePersonId = record.trusteePersonId;
      const trusteeName = record.trusteeName;

      if (trusteePersonId && trusteePersonId.startsWith('pp_')) {
        if (seenIds.has(trusteePersonId)) continue;
        seenIds.add(trusteePersonId);
        const pp = planningPersons.find(p => p.id === trusteePersonId);
        people.push({
          id: trusteePersonId,
          name: pp?.name || trusteeName || trusteePersonId,
          resolved: !!pp,
          source: 'planningPerson',
          originalId: trusteePersonId,
        });
      } else if (trusteePersonId) {
        if (seenIds.has(trusteePersonId)) continue;
        seenIds.add(trusteePersonId);
        people.push({
          id: trusteePersonId,
          name: trusteeName || trusteePersonId,
          resolved: false,
          source: 'unresolvedName',
          originalId: trusteePersonId,
        });
        if (trusteeName) unresolvedNames.push(trusteeName);
      } else if (trusteeName) {
        const pp = findPlanningPersonByName(planningPersons, trusteeName);
        const id = pp?.id || nameToSyntheticId(trusteeName);
        if (seenIds.has(id)) continue;
        seenIds.add(id);
        people.push({
          id,
          name: trusteeName,
          resolved: !!pp,
          source: pp ? 'planningPerson' : 'unresolvedName',
        });
        if (!pp) unresolvedNames.push(trusteeName);
      }
    }
  }

  return {
    people,
    personIds: people.map(p => p.id),
    unresolvedNames,
  };
}

export function resolveEscalationProfessionals(
  philosophy: ChildCareFundingPhilosophy | undefined,
  allAnswers: AnswersMap
): EscalationProfessional[] {
  if (!philosophy?.escalationPersonIds || philosophy.escalationPersonIds.length === 0) {
    return [];
  }

  const advisors = getProfessionalAdvisors(allAnswers);

  return philosophy.escalationPersonIds.map(originalId => {
    const advisor = resolveProfessionalReference(originalId, advisors);
    if (advisor) {
      return {
        id: advisor.id,
        name: advisor.name,
        type: advisor.type,
        active: advisor.active,
        originalId,
        resolved: true,
      };
    }
    return {
      id: originalId,
      name: '',
      type: 'lawyer',
      active: false,
      originalId,
      resolved: false,
    };
  });
}

export function getCareFundingCoordinationContext(
  allAnswers: AnswersMap,
  guardianAssignments: GuardianAssignment[],
  childProfiles: GuardianshipChildProfile[],
  estateTrustees: EstateTrusteeInfo[],
  willsAnswers: Record<string, unknown>,
  planningPersons: PlanningPerson[],
  fundingPhilosophy: ChildCareFundingPhilosophy | undefined
): CareFundingCoordinationContext {
  const guardians = resolveGuardianPeople(guardianAssignments);
  const powersOfAttorneyAnswers = allAnswers.get('powersOfAttorney') || {};
  const attorneysForProperty = resolveAttorneyForPropertyPeople(powersOfAttorneyAnswers, planningPersons);
  const estateTrusteesResolved = resolveEstateTrusteePeople(estateTrustees, willsAnswers, planningPersons);
  const inheritanceTrustees = resolveInheritanceTrusteePeople(childProfiles, planningPersons);
  const escalationProfessionals = resolveEscalationProfessionals(fundingPhilosophy, allAnswers);

  const hasUnresolvedIdentity =
    guardians.unresolvedNames.length > 0 ||
    attorneysForProperty.unresolvedNames.length > 0 ||
    estateTrusteesResolved.unresolvedNames.length > 0 ||
    inheritanceTrustees.unresolvedNames.length > 0;

  return {
    guardians,
    attorneysForProperty,
    estateTrustees: estateTrusteesResolved,
    inheritanceTrustees,
    escalationProfessionals,
    hasUnresolvedIdentity,
  };
}

export function areSamePeople(
  idsA: string[],
  idsB: string[],
  unresolvedNamesA: string[],
  unresolvedNamesB: string[]
): { same: boolean; confidence: 'high' | 'low' } {
  const setA = new Set(idsA);
  const setB = new Set(idsB);

  const hasUnresolvedA = unresolvedNamesA.length > 0;
  const hasUnresolvedB = unresolvedNamesB.length > 0;

  if (hasUnresolvedA || hasUnresolvedB) {
    const resolvedA = idsA.filter(id => !id.startsWith(NAME_TO_ID_PREFIX));
    const resolvedB = idsB.filter(id => !id.startsWith(NAME_TO_ID_PREFIX));
    if (resolvedA.length === 0 || resolvedB.length === 0) {
      return { same: false, confidence: 'low' };
    }
    const overlap = resolvedA.some(id => setB.has(id));
    return { same: overlap, confidence: 'low' };
  }

  if (idsA.length === 0 || idsB.length === 0) return { same: false, confidence: 'high' };
  const overlap = idsA.some(id => setB.has(id));
  const allMatch = idsA.every(id => setB.has(id)) && idsB.every(id => setA.has(id));
  return { same: allMatch, confidence: 'high' };
}

export type ScenarioCoordination = {
  scenario: CoordinationScenario;
  childIds: string[];
  caregiverPersonIds: string[];
  financialDecisionMakers: {
    role: FinancialDecisionMakerRole;
    personIds: string[];
  }[];
  samePeople: boolean;
  coordinationNeeded: boolean;
  identityConfidence: 'high' | 'low';
};

export function buildScenarioCoordinations(
  guardianAssignments: GuardianAssignment[],
  ctx: CareFundingCoordinationContext
): ScenarioCoordination[] {
  const results: ScenarioCoordination[] = [];

  const scenarios: Array<{
    scenario: CoordinationScenario;
    role: FinancialDecisionMakerRole;
    resolution: RoleResolutionResult;
  }> = [
    { scenario: 'parentalIncapacity', role: 'attorneyForProperty', resolution: ctx.attorneysForProperty },
    { scenario: 'afterDeath', role: 'estateTrustee', resolution: ctx.estateTrustees },
    { scenario: 'ongoingInheritance', role: 'inheritanceTrustee', resolution: ctx.inheritanceTrustees },
  ];

  for (const assignment of guardianAssignments) {
    const guardianIds = assignment.guardianPersonIds;
    const guardianUnresolved: string[] = [];

    for (const { scenario, role, resolution } of scenarios) {
      if (resolution.personIds.length === 0) continue;

      const comparison = areSamePeople(
        guardianIds,
        resolution.personIds,
        guardianUnresolved,
        resolution.unresolvedNames
      );

      results.push({
        scenario,
        childIds: assignment.childIds,
        caregiverPersonIds: guardianIds,
        financialDecisionMakers: [{ role, personIds: resolution.personIds }],
        samePeople: comparison.same,
        coordinationNeeded: !comparison.same,
        identityConfidence: comparison.confidence,
      });
    }
  }

  const seen = new Set<string>();
  return results.filter(r => {
    const key = `${r.scenario}|${r.childIds.join(',')}|${r.caregiverPersonIds.join(',')}|${r.financialDecisionMakers.map(f => f.role).join(',')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
