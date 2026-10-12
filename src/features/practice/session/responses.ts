/** Empty and "has content" helpers for responses, per question type. */
import type { Question } from '@/domain/content/types';
import type { Response } from '@/domain/evaluation/types';

export function emptyResponse(question: Question): Response {
  switch (question.type) {
    case 'choice':
      return { type: 'choice', selected: [] };
    case 'short':
      return { type: 'short', text: '' };
    case 'cloze':
      return { type: 'cloze', blanks: {} };
    case 'long':
      return { type: 'long', text: '' };
    case 'translation':
      return { type: 'translation', text: '' };
    case 'code':
      return { type: 'code', code: question.starterCode };
    case 'sql':
      return { type: 'sql', code: question.starterCode };
  }
}

export function hasAnswer(response: Response | undefined): boolean {
  if (!response) return false;
  switch (response.type) {
    case 'choice':
      return response.selected.length > 0;
    case 'cloze':
      return Object.values(response.blanks).some((value) => value.trim() !== '');
    case 'code':
    case 'sql':
      return response.code.trim() !== '';
    default:
      return response.text.trim() !== '';
  }
}

/** Short human summary of a response for notes and history. */
export function describeResponse(response: Response, question: Question): string {
  switch (response.type) {
    case 'choice': {
      const options = question.type === 'choice' ? question.options : [];
      return response.selected.map((id) => options.find((option) => option.id === id)?.text ?? id).join(', ');
    }
    case 'cloze':
      return Object.entries(response.blanks)
        .map(([id, value]) => `[${id}] ${value}`)
        .join('  ');
    case 'code':
    case 'sql':
      return response.code;
    default:
      return response.text;
  }
}
