import type { DigestNight, DigestRow } from '../digest/types.js';
import { isFlagged } from '../digest/flags.js';

const dash = (v: string | null) => (v === null ? '—' : v);

function DigestTableRow({ row }: { row: DigestRow }) {
  const flagged = isFlagged(row);
  return (
    <tr class={flagged ? 'warn' : undefined}>
      <td>{row.job}</td>
      <td>{dash(row.owner)}</td>
      <td>{row.runs}</td>
      <td>{row.retries}</td>
      <td>
        {row.lastStatus}
        {flagged ? ' · flagged' : null}
      </td>
      <td>{dash(row.lastError)}</td>
      <td>{row.firstAt}</td>
      <td>{row.lastAt}</td>
    </tr>
  );
}

export function DigestPage({ digest }: { digest: DigestNight }) {
  return (
    <>
      <h1>digest · {digest.night}</h1>
      {digest.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first</th>
              <th>last</th>
            </tr>
          </thead>
          <tbody>
            {digest.rows.map((row) => (
              <DigestTableRow row={row} />
            ))}
          </tbody>
        </table>
      )}
      {digest.badLines > 0 ? <p class="mute">{digest.badLines} unreadable lines skipped</p> : null}
    </>
  );
}
