import { describe, expect, it } from 'vitest';
import { plannedCourseIds, planOf, schedulesReviews, setStudyPlan, studyPlanIncludes, tracksMastery, withMasteryTracked, withReviewsScheduled } from './studyPlan';

describe('study plans', () => {
  const plans = { cmpd363: 'review', 'hsk-1': 'practice' } as const;
  const records = [{ id: 'a', courseId: 'cmpd363' }, { id: 'b', courseId: 'hsk-1' }, { id: 'c', courseId: 'jlpt-n5' }, { id: 'd' }];

  it('treats a subject without a plan, and work outside a subject, as material only', () => {
    expect(planOf(plans, 'jlpt-n5')).toBe('material');
    expect(planOf(plans, undefined)).toBe('material');
    expect(tracksMastery(plans, 'jlpt-n5')).toBe(false);
    expect(schedulesReviews(plans, undefined)).toBe(false);
  });

  it('tracks weak topics from "practice" up and schedules reviews only at "review"', () => {
    expect(tracksMastery(plans, 'hsk-1')).toBe(true);
    expect(schedulesReviews(plans, 'hsk-1')).toBe(false);
    expect(schedulesReviews(plans, 'cmpd363')).toBe(true);
    expect(withMasteryTracked(records, plans).map((record) => record.id)).toEqual(['a', 'b']);
    expect(withReviewsScheduled(records, plans).map((record) => record.id)).toEqual(['a']);
  });

  it('lists what each level includes, adding to the one before', () => {
    expect(studyPlanIncludes('material')).toHaveLength(1);
    expect(studyPlanIncludes('practice')).toHaveLength(3);
    expect(studyPlanIncludes('review')).toHaveLength(4);
  });

  it('stores only levels above material', () => {
    expect(setStudyPlan(plans, 'jlpt-n5', 'practice')).toEqual({ ...plans, 'jlpt-n5': 'practice' });
    expect(setStudyPlan(plans, 'cmpd363', 'material')).toEqual({ 'hsk-1': 'practice' });
    expect(plannedCourseIds({ ...plans, x: 'material' })).toEqual(['cmpd363', 'hsk-1']);
  });
});
