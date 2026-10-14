/* The primitive that owns the element, and the one file the image rule
   allows. The allow list is by file and this is its reason: a rule with no
   sanctioned home for the thing it bans cannot be satisfied, and a rule that
   cannot be satisfied earns a disable comment in its first week.

   It is also the negative case for `fields.skipIn`. A field inside the kit
   takes its name from the prop its wrapper passes down, so the accessible-name
   rule stands down here and applies at every call site instead. */
export const Media = ({ src, alt }: { src: string; alt: string }) => (
  <img src={src} alt={alt} loading="lazy" decoding="async" />
);

export const Field = (props: Record<string, unknown>) => (
  <input className="rounded-lg border border-slate-300" {...props} />
);
