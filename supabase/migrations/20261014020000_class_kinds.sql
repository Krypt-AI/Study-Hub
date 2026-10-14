-- Weekly classes are now only lectures and labs. Classes saved as tutorials or "other" become
-- lectures, the same rule the app applies when it reads them (normalizeClassKind).

update public.timetable_classes
set record = jsonb_set(record, '{kind}', '"lecture"')
where record ->> 'kind' in ('tutorial', 'other');
