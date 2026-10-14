# The states, and whether the interface is telling the truth

Everything else in this pack is about whether a surface looks designed. This
file is about whether it is *honest*, and it is here because that is the half
a design doc forgets and the half an agent gets wrong most reliably.

A model asked to build a screen writes the happy path. Then, if it is a good
model, it writes the empty state, because an empty state is a visible,
nameable thing that a reviewer will ask for. What it almost never writes is
the fourth branch, and the fourth branch is where the lie lives.

## The finding this file exists for

I audited four applications in one product, reading them a screen at a time
rather than grepping. I expected to find composition problems: a screen badly
laid out, four apps that did not feel like one product. I found the same thing
in all four instead, and it was not a layout problem.

> **A read that failed rendered the surface's empty state.**

With a data layer that does not throw by default, `data?.items ?? []` turns
*"the request did not come back"* into *"you have none"*. That is not a
missing branch. It is a **wrong** one, and it is worse than a missing branch,
because the surface then says so in the voice it reserves for true things.

What it actually said, in the four apps:

| App | Candidates | The worst of it |
|---|---|---|
| messages | 15 | "This message has not been edited." The exact question somebody opens that sheet to check |
| forum | 13 | "Nothing reported. The communities you moderate are clear." A false all-clear, on a safety surface |
| events | 12 | Seven **public** pages telling visitors their link was dead and to ask the sender for a new one |
| calendar | 7 | An Undo that replaced a week with nothing and said "Working hours restored" |

**The counts got smaller and the defects got worse.** That is the opposite of
what a sweep predicts, and it is the whole argument for reading rather than
grepping: the last app had half as many candidates as the first and contained
the only one that destroyed data.

Two of them a grep could never have found, and both turned up by opening
files the grep had cleared. One was a read sitting among several mutation
`isPending` flags, so it did not look like a read at all. The other was a
`?? []` inside a *mutation* rather than in any render branch.

## The invariant, stated once

> **Branch on `ready`, not on `not failed`.**

Enumerating the ways a read can go wrong is a list that grows. Mine grew
*during* the audit, when a particular offline mode turned out to **pause** a
query rather than fail it, which no error branch anywhere was looking for.
Asking whether the read succeeded is one question with one answer, and any
future state that is neither success nor loading falls to the honest branch
by construction.

This is the one rule in this file I would put in a design doc verbatim.

## What to write down in your own doc

### Four branches, named

Every surface that reads something has four, and the doc should say what each
one is for and what it is allowed to claim:

- **loading** — claims nothing. A skeleton that holds the shape the content
  will take, not a spinner in the middle of nothing.
- **ready and empty** — claims *there is none*. This is a factual assertion
  about the world and it has to be earned.
- **ready and full** — the happy path.
- **failed** — claims *I could not find out*. Different words, a retry, and
  never the empty state's words.

The test for the third and fourth: **an empty state is a claim, and nobody
reads it as one.** If the empty copy would be a lie when the request fails,
the two branches cannot share it.

### Destructive actions, and the ratio as a finding

Count the confirmations against the modals. On the project above it was 40
modals to 4 confirmations, and I recorded that as a *question* rather than a
finding, because it is equally consistent with "only four destructive actions
exist". It was a finding. The confirmation component had exactly one real
consumer.

Trace every destructive mutation **to its call site**, rather than inferring
a guard from whether the file happens to contain a modal. That distinction
mattered immediately: the first pass flagged one action as unguarded and it
was not, because it goes through a dedicated dialog.

Then **undo where undo is truthful, and ask where it is not.** They do not
all take the same guard and the reason is not stylistic:

- An **undo window** is the better guard when the action is reversible and
  the person is likely to be acting in a flow. It costs them nothing.
- A **confirmation** is required when the action is irreversible, and
  especially when it *reaches past the person clicking*. Revoking a key
  breaks somebody's integration. Removing a sign-in provider breaks a whole
  organisation's access. Removing the last recovery address removes the only
  route back into an account.

And an undo must actually be truthful. The worst defect in the audit was an
Undo that destroyed the thing it exists to protect, and then reported
success.

### Loading

Say which surfaces get a skeleton and which get a spinner, and prefer the
skeleton: it claims the space the content will take instead of pulsing in the
middle of nothing. Then check that whatever you use is covered by a
`prefers-reduced-motion` rule, because those are written one class name at a
time and a hand-rolled utility animation is covered by none of them. The
`motionGuards` rule in [`../enforce/`](../enforce/) holds that one.

### Error copy is copy

Everything in [`voice.md`](./voice.md) applies to the failed branch, and that
is the branch where it is least likely to have been applied. "Something went
wrong" is the generated register. So is a bare `Loading…`. So is an error
that tells a visitor the thing they were sent is gone when the truth is that
a server did not answer.

## What a checker can and cannot hold here

**Can:** a file that draws a loading state and has no error branch at all is
greppable, and that grep is worth putting in CI. So is a bare `Loading…`
string. So is the destructive-action ratio, as a number you re-measure rather
than a gate.

**Cannot:** whether the empty copy would be a lie on failure. That is a
sentence-by-sentence judgement about meaning, and the only way through it is
to read the screens one at a time. Four passes of reading found something no
grep had, which is what reading is for.

**A count is a claim, so keep the command beside it.** Re-run before acting
on a number; never carry one forward because it is written down.
