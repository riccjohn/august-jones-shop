/**
 * Hidden honeypot field for bot prevention.
 * Renders an aria-hidden input that users cannot see or interact with.
 * Bots that fill this field are detected and rejected server-side.
 */
export function HoneypotField({ id }: { id: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute left-[-9999px] top-[-9999px] overflow-hidden"
    >
      <label htmlFor={id}>Website</label>
      <input
        id={id}
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
