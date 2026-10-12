/**
 * Judges one response: rules for typed answers, the sandbox for runnable code and SQL, and
 * an honest self-review for code that cannot be run here (C, Bash), which is never
 * reported as tested.
 */
import type { CodeQuestion, Question } from '@/domain/content/types';
import { evaluate, isSyncQuestion } from '@/domain/evaluation/evaluate';
import { codeFeedback, sqlFeedback } from '@/domain/evaluation/runFeedback';
import type { Feedback, Response } from '@/domain/evaluation/types';
import { codeRunner, isRunnableLanguage } from '@/features/playground/execution/codeRunner';
import { newId } from '@/lib/ids';
import type { RunResponse } from '@/workers/protocol';

export interface Judgement {
  feedback: Feedback;
  run?: RunResponse;
}

const responseCode = (response: Response) => (response.type === 'code' || response.type === 'sql' ? response.code : '');

export async function judgeResponse(question: Question, response: Response, onStatus?: (message: string) => void): Promise<Judgement> {
  if (isSyncQuestion(question)) return { feedback: evaluate(question, response) };

  if (question.type === 'sql') {
    const run = await codeRunner.run(
      { id: newId(), language: 'sql', code: responseCode(response), setupSql: question.schema, solutionSql: question.solution },
      { timeoutMs: 8000, onStatus },
    );
    return { feedback: sqlFeedback(question, run), run };
  }

  const { language } = question;
  if (!isRunnableLanguage(language)) return { feedback: notExecutedFeedback(question) };
  const run = await codeRunner.run(
    { id: newId(), language, code: responseCode(response), tests: question.tests, packages: question.packages },
    { timeoutMs: question.timeoutMs, onStatus },
  );
  return { feedback: codeFeedback(question, run), run };
}

function notExecutedFeedback(question: CodeQuestion): Feedback {
  return {
    verdict: 'self-review',
    score: 0.5,
    headline: 'Compare your code with the model solution',
    points: [{ tone: 'info', message: `${question.language.toUpperCase()} code cannot be run in Study Hub yet (editor only), so it was not executed.` }],
    missing: [],
    expected: question.solution ? [question.solution] : [],
    limitations: 'Not executed: check your code against the task and the solution yourself.',
  };
}
