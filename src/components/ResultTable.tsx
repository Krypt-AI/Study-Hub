/** A SQL result set as a ruled table (first 50 rows). */
import type { TableResult } from '@/workers/protocol';

const ROW_LIMIT = 50;

export function ResultTable({ table, caption }: { table: TableResult; caption: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="pb-1 text-left text-xs text-ink-faint">{caption}</caption>
        <thead>
          <tr className="border-b border-print-line">
            {table.columns.map((column) => (
              <th key={column} className="px-2 py-1 font-display font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tabular">
          {table.rows.slice(0, ROW_LIMIT).map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-rule last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-2 py-1">
                  {cell === null ? <span className="text-ink-faint">NULL</span> : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.rows.length > ROW_LIMIT && (
        <p className="text-xs text-ink-faint">
          Showing {ROW_LIMIT} of {table.rows.length} rows.
        </p>
      )}
    </div>
  );
}
