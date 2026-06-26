import { Injectable } from '@nestjs/common'

interface Protocol {
  summary: string
  agenda_items: { title: string; duration_min: number }[]
  key_decisions: string[]
  action_items: { task: string; owner: string; due_date: string | null; priority: string }[]
  open_questions: string[]
  next_meeting: { proposed_date: string | null; topics: string[] } | null
}

const AGENDA_SAMPLES = [
  { title: 'Project status review', duration_min: 15 },
  { title: 'Q3 goals alignment', duration_min: 20 },
  { title: 'Budget discussion', duration_min: 10 },
  { title: 'Customer feedback review', duration_min: 15 },
  { title: 'Technical blockers', duration_min: 10 },
  { title: 'Team updates', duration_min: 10 },
  { title: 'Next steps planning', duration_min: 10 },
]

const DECISION_SAMPLES = [
  { decision: 'Move forward with the new project timeline', made_by: 'Team consensus' },
  { decision: 'Allocate additional budget for Q3 marketing', made_by: 'Management' },
  { decision: 'Prioritize user experience improvements', made_by: 'Product team' },
  { decision: 'Schedule weekly check-ins going forward', made_by: 'Team lead' },
  { decision: 'Adopt new tooling for project tracking', made_by: 'Engineering lead' },
]

const ACTION_SAMPLES = [
  { task: 'Prepare detailed project roadmap', owner: 'Project manager', priority: 'high' },
  { task: 'Review and finalize the budget proposal', owner: 'Finance team', priority: 'high' },
  { task: 'Set up customer feedback sessions', owner: 'Product team', priority: 'medium' },
  { task: 'Resolve technical blockers in staging environment', owner: 'Engineering', priority: 'high' },
  { task: 'Update stakeholders on timeline changes', owner: 'Team lead', priority: 'medium' },
  { task: 'Draft marketing campaign brief', owner: 'Marketing', priority: 'medium' },
  { task: 'Document meeting decisions and share with team', owner: 'Secretary', priority: 'low' },
]

const QUESTION_SAMPLES = [
  { question: 'What are the dependencies between Q3 and Q4 deliverables?', raised_by: 'Speaker 1' },
  { question: 'How will we measure success for this initiative?', raised_by: 'Speaker 2' },
  { question: 'Do we have the right resources allocated for this?', raised_by: 'Speaker 3' },
  { question: 'What is the contingency plan if the deadline is missed?', raised_by: 'Speaker 1' },
]

function pick<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(n, arr.length))
}

function futureDate(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

@Injectable()
export class MockAiService {
  generate(title: string, speakerCount: number): Protocol {
    return {
      summary: `The meeting "${title}" covered key project updates, budget discussions, and team alignment. ` +
        `${speakerCount} participants engaged in productive discussion about priorities and next steps. ` +
        `The team reached consensus on the main action items and agreed to follow up within two weeks.`,

      agenda_items: pick(AGENDA_SAMPLES, 4 + Math.floor(Math.random() * 3)),

      key_decisions: pick(DECISION_SAMPLES, 2 + Math.floor(Math.random() * 3)).map(
        (d) => `${d.decision} (${d.made_by})`,
      ),

      action_items: pick(ACTION_SAMPLES, 3 + Math.floor(Math.random() * 4)).map((a) => ({
        ...a,
        due_date: Math.random() > 0.3 ? futureDate(7 + Math.floor(Math.random() * 21)) : null,
      })),

      open_questions: pick(QUESTION_SAMPLES, 1 + Math.floor(Math.random() * 3)).map(
        (q) => `${q.question} — ${q.raised_by}`,
      ),

      next_meeting: {
        proposed_date: futureDate(7 + Math.floor(Math.random() * 7)),
        topics: ['Follow-up on action items', 'Review of progress', 'Planning next phase'],
      },
    }
  }
}
