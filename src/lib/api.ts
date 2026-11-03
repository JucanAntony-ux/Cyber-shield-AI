import { supabase } from './supabase';
import type {
  Finding,
  KnownFileHash,
  ScanInput,
  ScanRecord,
  Lesson,
  LessonProgress,
  Note,
  Problem,
  ProblemStatus,
  ProblemStep,
  QuizQuestion,
  Resource,
  Topic,
  Urgency,
} from './types';

export const PASS_RATIO = 0.7;

type QueryResult<T> = { data: T | null; error: { message: string } | null };

function unwrap<T>(result: QueryResult<T>): T | null {
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result.data;
}

function assertOk(result: { error: { message: string } | null }): void {
  if (result.error) {
    throw new Error(result.error.message);
  }
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

type LessonRow = Omit<Lesson, 'checklist'> & { checklist: unknown };

function toLesson(row: LessonRow): Lesson {
  return { ...row, checklist: toStringArray(row.checklist) };
}

export async function fetchLessons(): Promise<Lesson[]> {
  const rows = unwrap<LessonRow[]>(await supabase.from('lessons').select('*').order('title')) ?? [];
  return rows.map(toLesson);
}

export async function fetchLesson(slug: string): Promise<Lesson | null> {
  const row = unwrap<LessonRow>(await supabase.from('lessons').select('*').eq('slug', slug).maybeSingle());
  return row ? toLesson(row) : null;
}

export async function fetchGuide(topic: Topic): Promise<Lesson | null> {
  const row = unwrap<LessonRow>(
    await supabase.from('lessons').select('*').eq('topic', topic).eq('kind', 'guide').maybeSingle(),
  );
  return row ? toLesson(row) : null;
}

type QuizRow = Omit<QuizQuestion, 'options'> & { options: unknown };

export async function fetchQuizQuestions(lessonId: string): Promise<QuizQuestion[]> {
  const rows =
    unwrap<QuizRow[]>(
      await supabase.from('quiz_questions').select('*').eq('lesson_id', lessonId).order('position'),
    ) ?? [];
  return rows.map((row) => ({ ...row, options: toStringArray(row.options) }));
}

export async function fetchLessonProgress(): Promise<LessonProgress[]> {
  return unwrap<LessonProgress[]>(await supabase.from('lesson_progress').select('*')) ?? [];
}

export async function saveQuizResult(lessonId: string, score: number, total: number): Promise<void> {
  const completed = total > 0 && score / total >= PASS_RATIO;
  assertOk(
    await supabase.from('lesson_progress').upsert(
      {
        lesson_id: lessonId,
        quiz_score: score,
        quiz_total: total,
        completed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'lesson_id' },
    ),
  );
}

export async function fetchProblems(): Promise<Problem[]> {
  return (
    unwrap<Problem[]>(await supabase.from('problems').select('*').order('created_at', { ascending: false })) ?? []
  );
}

export async function fetchProblem(id: string): Promise<Problem | null> {
  return unwrap<Problem>(await supabase.from('problems').select('*').eq('id', id).maybeSingle());
}

export async function fetchProblemSteps(problemId: string): Promise<ProblemStep[]> {
  return (
    unwrap<ProblemStep[]>(
      await supabase.from('problem_steps').select('*').eq('problem_id', problemId).order('position'),
    ) ?? []
  );
}

export interface NewProblemInput {
  title: string;
  description: string;
  topic: Topic;
  situation: string;
  urgency: Urgency;
}

export async function createProblem(input: NewProblemInput, checklist: string[]): Promise<Problem> {
  const problem = unwrap<Problem>(await supabase.from('problems').insert(input).select().single());
  if (!problem) {
    throw new Error('The problem could not be saved.');
  }

  const steps = checklist.map((text, index) => ({
    problem_id: problem.id,
    position: index + 1,
    text,
    completed: false,
  }));
  const stepResult = await supabase.from('problem_steps').insert(steps);
  if (stepResult.error) {
    await supabase.from('problems').delete().eq('id', problem.id);
    throw new Error(stepResult.error.message);
  }

  return problem;
}

export async function setProblemStatus(id: string, status: ProblemStatus): Promise<void> {
  assertOk(
    await supabase
      .from('problems')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id),
  );
}

export async function setStepCompleted(id: string, completed: boolean): Promise<void> {
  assertOk(await supabase.from('problem_steps').update({ completed }).eq('id', id));
}

export async function deleteProblem(id: string): Promise<void> {
  assertOk(await supabase.from('problems').delete().eq('id', id));
}

export type NoteScope = 'problem' | 'lesson';

const NOTE_COLUMN: Record<NoteScope, 'problem_id' | 'lesson_id'> = {
  problem: 'problem_id',
  lesson: 'lesson_id',
};

export async function fetchNotes(scope: NoteScope, id: string): Promise<Note[]> {
  return (
    unwrap<Note[]>(
      await supabase
        .from('notes')
        .select('*')
        .eq(NOTE_COLUMN[scope], id)
        .order('created_at', { ascending: false }),
    ) ?? []
  );
}

export async function addNote(scope: NoteScope, id: string, body: string): Promise<void> {
  assertOk(await supabase.from('notes').insert({ [NOTE_COLUMN[scope]]: id, body }));
}

export async function deleteNote(id: string): Promise<void> {
  assertOk(await supabase.from('notes').delete().eq('id', id));
}

export async function fetchResources(): Promise<Resource[]> {
  return (
    unwrap<Resource[]>(await supabase.from('resources').select('*').order('created_at', { ascending: false })) ?? []
  );
}

export interface NewResourceInput {
  title: string;
  url: string;
  topic: Topic | null;
  description: string | null;
}

export async function addResource(input: NewResourceInput): Promise<void> {
  assertOk(await supabase.from('resources').insert(input));
}

export async function deleteResource(id: string): Promise<void> {
  assertOk(await supabase.from('resources').delete().eq('id', id));
}

function toFindings(value: unknown): Finding[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Finding =>
      typeof item === 'object' &&
      item !== null &&
      ['info', 'warning', 'danger'].includes((item as Finding).severity) &&
      typeof (item as Finding).text === 'string',
  );
}

type ScanRow = Omit<ScanRecord, 'findings'> & { findings: unknown };

export async function saveScan(input: ScanInput): Promise<void> {
  assertOk(await supabase.from('scan_results').insert(input));
}

export async function fetchScans(): Promise<ScanRecord[]> {
  const rows =
    unwrap<ScanRow[]>(
      await supabase.from('scan_results').select('*').order('created_at', { ascending: false }).limit(200),
    ) ?? [];
  return rows.map((row) => ({ ...row, findings: toFindings(row.findings) }));
}

export async function fetchKnownHash(sha256: string): Promise<KnownFileHash | null> {
  return unwrap<KnownFileHash>(await supabase.from('known_file_hashes').select('*').eq('sha256', sha256).maybeSingle());
}
