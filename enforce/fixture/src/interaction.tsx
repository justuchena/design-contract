/* The interaction half of the fixture. Every element below either breaks one
   of the interaction rules or is a negative case for one, and the negative
   cases are the reason this file is long: a rule that catches the violation
   is easy, and a rule that leaves the deliberate pattern alone is the part
   that took several attempts.

   Each pair is positive first, then the negative beside it. */

/* A class list held in a constant rather than written on the element. The
   focus rule reads these as well as attributes, because a long class string
   is as often a `const` beside the component as it is inline, and the
   suppression tends to live in exactly those.

   🔴 **Mutation testing is why this is here, and it found more than a weak
   test.** Twenty-two mutants inside the rule's `CONST_EXPR` pattern survived
   at once, which is the signature of a branch nothing reaches: the fixture
   had only ever used JSX attributes, so the const-reading half of the rule
   was *documented and never once executed*. That is not a gap in the tests,
   it is a feature claim with nothing behind it. */
const DEAD_FOCUS = 'rounded px-2 focus-visible:outline-none text-slate-700';

export const Interaction = () => (
  <div>
    {/* focus: suppressed with nothing put back, then suppressed with a
        substitute, which is a decision rather than a leftover. */}
    <button className="focus:outline-none">Bare</button>
    <button className="focus-visible:outline-none focus-visible:bg-slate-100">Deliberate</button>
    <button className={DEAD_FOCUS}>Suppressed in a constant</button>

    {/* radius: an arbitrary value, then one carried by a named variable,
        which is a role chosen elsewhere rather than a sixth number. */}
    <div className="rounded-[7px]">Arbitrary</div>
    <div className="rounded-[var(--site-radius)]">A tenant's own theme</div>

    {/* radius tiers: the container radius on a control, then the same class
        on something that is a card in every way except the tag it uses.
        Padding is the tell, which is why both of these are buttons.

        This pair exists because mutation testing found the tier rule had
        been *configured* in the fixture config and never once triggered:
        zero `rounded-2xl` anywhere in the fixture, so the whole branch was
        dead and every mutant in it survived. A rule with config and no
        case is the exact failure this repo is about, one level in. */}
    <button className="rounded-2xl px-2 py-1">A control</button>
    <button className="rounded-2xl p-6">
      <Icon size={16} />
      A card that happens to be a button
    </button>

    {/* hit target: 14px glyph inside p-1 is 22, then the same control with
        an explicit height, which stands the rule down. */}
    <button aria-label="Dismiss" className="p-1">
      <Icon size={14} />
    </button>
    <button aria-label="Dismiss" className="min-h-11 p-1">
      <Icon size={14} />
    </button>

    {/* the accessible name half of the same rule: big enough, and nameless.
        Then a glyph beside a label, which is an ordinary control. */}
    <button className="p-3">
      <Icon size={18} />
    </button>
    <button className="p-3">
      <Icon size={18} />
      Save
    </button>

    {/* reveal: hover with no focus answer, then hover with one, then a
        caption that cannot be reached at all. */}
    <div className="opacity-0 group-hover:opacity-100">Keyboard cannot see this</div>
    <div className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100">Both</div>
    <div className="opacity-0 group-hover:opacity-100 pointer-events-none">Decoration</div>

    {/* motion: unguarded, then the stronger guard, which never starts. */}
    <div className="animate-pulse" />
    <div className="motion-safe:animate-pulse" />

    {/* fields: a placeholder is not a label, then an id, then a wrapping
        label with no id at all, which is the case that needs the ancestor
        walk rather than a regex. */}
    <input placeholder="Email" />
    <input id="email" placeholder="Email" />
    <label>
      Name
      <input className="rounded-lg border border-slate-300" />
    </label>

    {/* fields: the native picker, and the field radius. */}
    <input type="date" id="starts" />
    <input id="query" className="rounded-md border border-slate-300" />

    {/* fields: invisible controls have no geometry to get wrong and nothing
        to announce. `hidden` is display:none, and the file input behind a
        styled drop zone is reached only by the click that opens it. */}
    <input type="hidden" value="x" />
    <input type="file" className="hidden" accept="image/*" />

    {/* media: a raw img. The allowed one is in kit/, which owns the
        primitive, and the allow list names it with its reason. */}
    <img src="/cover.png" alt="A cover" />

    {/* surface: a hand-rolled shell, then one whose border carries state and
        would lose the affordance if it converted. */}
    <div className="rounded-xl border border-slate-200 bg-white p-4">Wireframe</div>
    <div className="rounded-xl border border-slate-200 bg-white p-4 data-[over=true]:border-blue-500">
      A drop target
    </div>

    {/* layout: the two-scrollbar fault, then the same pane with min-h-0. */}
    <div className="flex-1 overflow-y-auto">Grows past its frame</div>
    <div className="flex-1 overflow-y-auto min-h-0">Shrinks correctly</div>

    {/* ink as fill: a type token carrying a label, then the same token as a
        bare mark, which is what the ink ramp is for. */}
    <div className="bg-brand-ink text-white">Unreadable on dark</div>
    <div className="bg-brand-ink" />
  </div>
);
