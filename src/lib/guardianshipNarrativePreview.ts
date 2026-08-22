import type {
  GuardianshipNarrativeModel,
  NarrativeBlock,
  GuardianshipChildNarrative,
} from './guardianshipNarrativeTypes';

const IMPORTANCE_LABEL: Record<string, string> = {
  primary: '[PRIMARY]',
  important: '[IMPORTANT]',
  supporting: '[SUPPORTING]',
  reference: '[REFERENCE]',
};

const SOURCE_LABEL: Record<string, string> = {
  knownFact: '(Known Fact)',
  parentPreference: '(Parent Preference)',
  parentUnderstanding: '(Parent Understanding)',
  derived: '(Derived)',
  professionalReview: '(Professional Review)',
};

function renderBlock(block: NarrativeBlock, indent = ''): string {
  const lines: string[] = [];
  const tag = `${IMPORTANCE_LABEL[block.importance] || ''} ${SOURCE_LABEL[block.sourceType] || ''}`.trim();

  if (block.heading) {
    lines.push(`${indent}### ${block.heading} ${tag}`);
  } else if (tag) {
    lines.push(`${indent}${tag}`);
  }

  if (block.body) {
    lines.push(`${indent}${block.body}`);
  }

  if (block.bullets && block.bullets.length > 0) {
    for (const bullet of block.bullets) {
      lines.push(`${indent}  - ${bullet}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

function renderBlocks(blocks: NarrativeBlock[] | undefined, indent = ''): string {
  if (!blocks || blocks.length === 0) return '';
  return blocks.map(b => renderBlock(b, indent)).join('\n');
}

function renderChild(child: GuardianshipChildNarrative): string {
  const lines: string[] = [];
  const separator = '='.repeat(60);

  lines.push(separator);
  lines.push(`# ${child.childName}`);
  lines.push(separator);
  lines.push('');

  if (child.introduction && child.introduction.length > 0) {
    lines.push(renderBlocks(child.introduction));
  }

  if (child.education && child.education.length > 0) {
    lines.push('--- Education ---');
    lines.push(renderBlocks(child.education));
  }

  if (child.healthcare && child.healthcare.length > 0) {
    lines.push('--- Healthcare ---');
    lines.push(renderBlocks(child.healthcare));
  }

  if (child.supportTransition && child.supportTransition.length > 0) {
    lines.push('--- Support Transition ---');
    lines.push(renderBlocks(child.supportTransition));
  }

  if (child.peopleAndConnections && child.peopleAndConnections.length > 0) {
    lines.push('--- People and Connections ---');
    lines.push(renderBlocks(child.peopleAndConnections));
  }

  if (child.activities && child.activities.length > 0) {
    lines.push('--- Activities ---');
    lines.push(renderBlocks(child.activities));
  }

  if (child.communitiesAndTraditions && child.communitiesAndTraditions.length > 0) {
    lines.push('--- Communities and Traditions ---');
    lines.push(renderBlocks(child.communitiesAndTraditions));
  }

  if (child.inheritance && child.inheritance.length > 0) {
    lines.push('--- Inheritance ---');
    lines.push(renderBlocks(child.inheritance));
  }

  if (child.adultTransition && child.adultTransition.length > 0) {
    lines.push('--- Looking Ahead ---');
    lines.push(renderBlocks(child.adultTransition));
  }

  return lines.join('\n');
}

export function renderNarrativeAsText(narrative: GuardianshipNarrativeModel): string {
  const lines: string[] = [];
  const separator = '#'.repeat(60);

  lines.push(separator);
  lines.push('# GUARDIANSHIP ROADMAP — NARRATIVE PREVIEW');
  lines.push(separator);
  lines.push('');

  // Family Context
  if (narrative.familyContext.length > 0) {
    lines.push('========================================================');
    lines.push('# FAMILY CONTEXT');
    lines.push('========================================================');
    lines.push('');
    lines.push(renderBlocks(narrative.familyContext));
  }

  // Guardian Plan
  if (narrative.guardianPlan.length > 0) {
    lines.push('========================================================');
    lines.push('# GUARDIAN PLAN');
    lines.push('========================================================');
    lines.push('');
    lines.push(renderBlocks(narrative.guardianPlan));
  }

  // Children
  for (const child of narrative.children) {
    lines.push(renderChild(child));
  }

  // Family Roles
  if (narrative.familyRoles.length > 0) {
    lines.push('========================================================');
    lines.push('# FAMILY ROLES');
    lines.push('========================================================');
    lines.push('');
    lines.push(renderBlocks(narrative.familyRoles));
  }

  // Financial Resources
  if (narrative.financialResources.length > 0) {
    lines.push('========================================================');
    lines.push('# FINANCIAL RESOURCES');
    lines.push('========================================================');
    lines.push('');
    lines.push(renderBlocks(narrative.financialResources));
  }

  // Funding Philosophy
  if (narrative.fundingPhilosophy && narrative.fundingPhilosophy.length > 0) {
    lines.push('========================================================');
    lines.push('# FUNDING PHILOSOPHY');
    lines.push('========================================================');
    lines.push('');
    lines.push(renderBlocks(narrative.fundingPhilosophy));
  }

  // Coordination
  if (narrative.coordination && narrative.coordination.length > 0) {
    lines.push('========================================================');
    lines.push('# COORDINATION');
    lines.push('========================================================');
    lines.push('');
    lines.push(renderBlocks(narrative.coordination));
  }

  // Documents
  if (narrative.documents.length > 0) {
    lines.push('========================================================');
    lines.push('# DOCUMENTS');
    lines.push('========================================================');
    lines.push('');
    lines.push(renderBlocks(narrative.documents));
  }

  // Readiness
  lines.push('========================================================');
  lines.push('# READINESS');
  lines.push('========================================================');
  lines.push('');

  if (narrative.readiness.decisionsMade.length > 0) {
    lines.push('--- Decisions You\'ve Made ---');
    lines.push(renderBlocks(narrative.readiness.decisionsMade));
  }

  if (narrative.readiness.thingsWorthConfirming.length > 0) {
    lines.push('--- Things Worth Confirming ---');
    lines.push(renderBlocks(narrative.readiness.thingsWorthConfirming));
  }

  if (narrative.readiness.thingsStillToDo.length > 0) {
    lines.push('--- Things Still To Do ---');
    lines.push(renderBlocks(narrative.readiness.thingsStillToDo));
  }

  // Immediate Actions
  if (narrative.immediateActions.length > 0) {
    lines.push('========================================================');
    lines.push('# IF SOMETHING HAPPENED TOMORROW');
    lines.push('========================================================');
    lines.push('');

    for (const action of narrative.immediateActions) {
      const wishTag = action.isParentWish ? ' [Parent Wish]' : '';
      lines.push(`${action.priority}. ${action.heading}${wishTag}`);
      if (action.body) {
        lines.push(`   ${action.body}`);
      }
      if (action.childNames.length > 0) {
        lines.push(`   Children: ${action.childNames.join(', ')}`);
      }
      lines.push('');
    }
  }

  // Quick Reference
  if (narrative.quickReference.length > 0) {
    lines.push('========================================================');
    lines.push('# QUICK REFERENCE');
    lines.push('========================================================');
    lines.push('');

    for (const item of narrative.quickReference) {
      lines.push(`  ${item.label}: ${item.value}`);
    }
  }

  return lines.join('\n');
}

export function renderNarrativeAsHtml(narrative: GuardianshipNarrativeModel): string {
  const sections: string[] = [];

  const blockToHtml = (block: NarrativeBlock): string => {
    const cls = `narrative-block type-${block.type} importance-${block.importance}`;
    const parts: string[] = [];
    if (block.heading) parts.push(`<h4>${block.heading}</h4>`);
    if (block.body) parts.push(`<p>${block.body.replace(/\n/g, '<br>')}</p>`);
    if (block.bullets) parts.push(`<ul>${block.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`);
    return `<div class="${cls}">${parts.join('')}</div>`;
  };

  const blocksToHtml = (blocks?: NarrativeBlock[]): string =>
    blocks ? blocks.map(blockToHtml).join('') : '';

  sections.push('<section id="family-context"><h2>Family Context</h2>' + blocksToHtml(narrative.familyContext) + '</section>');
  sections.push('<section id="guardian-plan"><h2>Guardian Plan</h2>' + blocksToHtml(narrative.guardianPlan) + '</section>');

  for (const child of narrative.children) {
    const parts: string[] = [`<h2>${child.childName}</h2>`];
    parts.push(blocksToHtml(child.introduction));
    if (child.education?.length) parts.push(`<h3>Education</h3>${blocksToHtml(child.education)}`);
    if (child.healthcare?.length) parts.push(`<h3>Healthcare</h3>${blocksToHtml(child.healthcare)}`);
    if (child.supportTransition?.length) parts.push(`<h3>Support Transition</h3>${blocksToHtml(child.supportTransition)}`);
    if (child.peopleAndConnections?.length) parts.push(`<h3>People and Connections</h3>${blocksToHtml(child.peopleAndConnections)}`);
    if (child.activities?.length) parts.push(`<h3>Activities</h3>${blocksToHtml(child.activities)}`);
    if (child.communitiesAndTraditions?.length) parts.push(`<h3>Communities and Traditions</h3>${blocksToHtml(child.communitiesAndTraditions)}`);
    if (child.inheritance?.length) parts.push(`<h3>Inheritance</h3>${blocksToHtml(child.inheritance)}`);
    if (child.adultTransition?.length) parts.push(`<h3>Looking Ahead</h3>${blocksToHtml(child.adultTransition)}`);
    sections.push(`<section class="child-narrative">${parts.join('')}</section>`);
  }

  if (narrative.familyRoles.length) {
    sections.push('<section id="family-roles"><h2>Family Roles</h2>' + blocksToHtml(narrative.familyRoles) + '</section>');
  }
  if (narrative.financialResources.length) {
    sections.push('<section id="financial-resources"><h2>Financial Resources</h2>' + blocksToHtml(narrative.financialResources) + '</section>');
  }
  if (narrative.fundingPhilosophy && narrative.fundingPhilosophy.length) {
    sections.push('<section id="funding-philosophy"><h2>Funding Philosophy</h2>' + blocksToHtml(narrative.fundingPhilosophy) + '</section>');
  }
  if (narrative.coordination && narrative.coordination.length) {
    sections.push('<section id="coordination"><h2>Coordination</h2>' + blocksToHtml(narrative.coordination) + '</section>');
  }
  if (narrative.documents.length) {
    sections.push('<section id="documents"><h2>Documents</h2>' + blocksToHtml(narrative.documents) + '</section>');
  }

  const readinessParts: string[] = [];
  if (narrative.readiness.decisionsMade.length) readinessParts.push(`<h3>Decisions You've Made</h3>${blocksToHtml(narrative.readiness.decisionsMade)}`);
  if (narrative.readiness.thingsWorthConfirming.length) readinessParts.push(`<h3>Things Worth Confirming</h3>${blocksToHtml(narrative.readiness.thingsWorthConfirming)}`);
  if (narrative.readiness.thingsStillToDo.length) readinessParts.push(`<h3>Things Still To Do</h3>${blocksToHtml(narrative.readiness.thingsStillToDo)}`);
  if (readinessParts.length) sections.push('<section id="readiness"><h2>Readiness</h2>' + readinessParts.join('') + '</section>');

  if (narrative.immediateActions.length) {
    const actionHtml = narrative.immediateActions.map(a =>
      `<div class="action priority-${a.priority}${a.isParentWish ? ' parent-wish' : ''}"><h4>${a.heading}</h4><p>${a.body}</p>${a.childNames.length ? `<p><em>Children: ${a.childNames.join(', ')}</em></p>` : ''}</div>`
    ).join('');
    sections.push('<section id="immediate-actions"><h2>If Something Happened Tomorrow</h2>' + actionHtml + '</section>');
  }

  if (narrative.quickReference.length) {
    const qrHtml = narrative.quickReference.map(i => `<div class="qr-item"><strong>${i.label}:</strong> ${i.value}</div>`).join('');
    sections.push('<section id="quick-reference"><h2>Quick Reference</h2>' + qrHtml + '</section>');
  }

  return `<div class="guardianship-narrative-preview">${sections.join('\n')}</div>`;
}
