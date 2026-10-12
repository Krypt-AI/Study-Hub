/**
 * The answer-sheet bubble: Study Hub's signature element. One bubble per question in an
 * answer strip, per mastery level, or per tenth of the daily goal. Filling and marking
 * animate once ("fill, then mark"); reduced-motion users get the final state immediately.
 */
import { cn } from '@/lib/cn';

export type BubbleState =
  | 'empty'
  | 'current'
  | 'filled'
  | 'correct'
  | 'almost'
  | 'wrong'
  | 'review'
  /* mastery levels */
  | 'new'
  | 'learning'
  | 'weak'
  | 'mastered';

const SIZES = {
  sm: { width: 16, height: 11 },
  md: { width: 22, height: 15 },
  lg: { width: 30, height: 20 },
} as const;

export type BubbleSize = keyof typeof SIZES;

export interface BubbleProps {
  state: BubbleState;
  size?: BubbleSize;
  /** Printed inside an empty bubble, like the option numbers on a mark sheet. */
  label?: string;
  /** Animate the fill when the state changes (only for live answers). */
  animate?: boolean;
  className?: string;
  title?: string;
}

const MARK_COLOR: Partial<Record<BubbleState, string>> = {
  correct: 'var(--correct)',
  almost: 'var(--slip)',
  wrong: 'var(--wrong)',
  weak: 'var(--wrong)',
};

export function Bubble({ state, size = 'md', label, animate = false, className, title }: BubbleProps) {
  const { width, height } = SIZES[size];
  const rx = width / 2 - 1.25;
  const ry = height / 2 - 1.25;
  const cx = width / 2;
  const cy = height / 2;
  const filled = state === 'filled' || state === 'correct' || state === 'almost' || state === 'wrong' || state === 'mastered';
  const stroke =
    state === 'current' ? 'var(--print)' : state === 'weak' ? 'var(--wrong)' : filled ? 'var(--mark)' : 'var(--print-line)';
  const mark = MARK_COLOR[state];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('inline-block shrink-0 overflow-visible align-middle', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="none"
        stroke={stroke}
        strokeWidth={state === 'current' ? 1.75 : 1.25}
        strokeDasharray={state === 'new' ? '2.5 2' : undefined}
      />
      {state === 'review' && <ellipse cx={cx} cy={cy} rx={rx - 2} ry={ry - 2} fill="var(--print-soft)" stroke="var(--print)" strokeWidth={1} />}
      {state === 'learning' && <path d={`M ${cx - rx + 1} ${cy} A ${rx - 1} ${ry - 1} 0 0 0 ${cx + rx - 1} ${cy} Z`} fill="var(--mark)" opacity={0.85} />}
      {filled && <ellipse cx={cx} cy={cy} rx={rx - 0.5} ry={ry - 0.5} fill="var(--mark)" className={animate ? 'bubble-fill-anim' : undefined} style={{ transformOrigin: 'center' }} />}
      {label && !filled && state !== 'learning' && (
        <text
          x={cx}
          y={cy}
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={height * 0.62}
          fontFamily="var(--font-display)"
          fill={state === 'current' ? 'var(--print-strong)' : 'var(--print)'}
        >
          {label}
        </text>
      )}
      {mark && filled && (
        <g className={animate ? 'bubble-mark-anim' : undefined} style={{ transformOrigin: `${width - 2}px 2px` }}>
          {state === 'correct' && (
            <path d={`M ${width - 7} ${2} l 2.6 3.2 l 5.2 -6.4`} fill="none" stroke={mark} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          )}
          {state === 'almost' && (
            <path d={`M ${width - 7} ${2} l 2.6 3.2 l 5.2 -6.4`} fill="none" stroke={mark} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 1.6" />
          )}
          {state === 'wrong' && (
            <path d={`M ${width - 6} ${-2.5} l 6 6 M ${width} ${-2.5} l -6 6`} fill="none" stroke={mark} strokeWidth={2} strokeLinecap="round" />
          )}
        </g>
      )}
    </svg>
  );
}

export interface BubbleStripProps {
  states: BubbleState[];
  size?: BubbleSize;
  /** Index of the bubble that just changed, to animate only that one. */
  animateIndex?: number;
  numbered?: boolean;
  label?: string;
  className?: string;
  onSelect?: (index: number) => void;
  selectedIndex?: number;
}

export function BubbleStrip({ states, size = 'sm', animateIndex, numbered = false, label, className, onSelect, selectedIndex }: BubbleStripProps) {
  return (
    <ol className={cn('flex flex-wrap items-center gap-x-1.5 gap-y-2', className)} aria-label={label}>
      {states.map((state, index) => {
        const bubble = (
          <Bubble
            state={index === selectedIndex && (state === 'empty' || state === 'review') ? 'current' : state}
            size={size}
            label={numbered ? String(index + 1) : undefined}
            animate={index === animateIndex}
          />
        );
        return (
          <li key={index} className="flex">
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(index)}
                aria-label={`Question ${index + 1}: ${STATE_LABELS[state]}`}
                aria-current={index === selectedIndex ? 'step' : undefined}
                className="rounded-full p-0.5 transition-transform duration-150 hover:scale-110"
              >
                {bubble}
              </button>
            ) : (
              <span title={`${index + 1}: ${STATE_LABELS[state]}`}>{bubble}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

const STATE_LABELS: Record<BubbleState, string> = {
  empty: 'not answered',
  current: 'current',
  filled: 'answered',
  correct: 'correct',
  almost: 'almost',
  wrong: 'incorrect',
  review: 'due for review',
  new: 'new',
  learning: 'learning',
  weak: 'weak',
  mastered: 'mastered',
};
