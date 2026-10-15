# Two standing copy rules

Design is not only geometry. Most of what makes an interface read as
generated is the writing in it, and the writing is the part nobody puts under
a rule.

These are the two rules I carry into every project. Both were applied across
a whole site at once, retroactively, which is a job nobody should have to do
twice — so they go in the design doc on day one.

## 1. No em dashes, anywhere a visitor can read

`—` is banned in all user-visible copy: page text, headings, window titles,
meta descriptions, structured data, `llms.txt`, legal documents.

**Why this specific punctuation mark.** The em dash is the single most
reliable tell of generated prose. It is grammatically defensible almost
everywhere, which is exactly the problem: a model reaches for it whenever the
relationship between two clauses is unresolved, and the result is text that
is fluent and uncommitted. Banning it forces the sentence to decide what it
is doing.

Use what the sentence actually needs:

| Instead of an em dash | Use |
|---|---|
| a parenthetical aside | commas, or real parentheses |
| a list about to be named | a colon |
| a second, separate thought | a full stop |
| a label / value separator | `·` |

**Do not substitute a hyphen or an en dash.** That trades one symbol for
another and keeps the undecided sentence. Rewrite the punctuation.

**Comments in source are exempt: they are not the website.** This exemption
matters more than it looks. A checker that fires on the comment explaining a
ban is a checker that punishes writing the explanation down, so the comment
stripper in [`enforce/design-check.mjs`](../enforce/design-check.mjs) runs
before this rule and is the reason the rule survives contact with a real
codebase.

The rule is enforced by the `copy` rule in the checker. It is one line of
config:

```js
copyBans: [{ rule: "copy", pattern: "—", why: "No em dashes anywhere a visitor can read." }],
```

## 2. One register, chosen deliberately, never the engineering one

Decide who reads the page, then describe what the product is *for* and who it
affects — never how it is built. The test I use: **if the reader would have
to look a word up, it does not ship.**

This is the rule that separates product copy from a changelog, and models
violate it constantly, because the implementation is what is in context and
the consequence is not.

Build the table for your own product. Mine, from a platform read by deans and
registrars, looked like this:

| Don't write | Write |
|---|---|
| "one codebase", "same codebase" | "one product", "one set of features" |
| "native peer-to-peer video rooms" | "students meet and share their screen inside the app; nothing to install" |
| "tenant", "multi-tenancy", "record-level isolation" | "your own school on the platform"; "no other institution can see it" |
| "subject-agnostic" | "works for any subject, not only technical ones" |
| "audited ledger" | "a running account; every entry can be traced back" |
| "MFA, passkeys, active device sessions" | "two-step sign-in, sign-in without a password, every device an account is signed in on" |
| "different codepaths", "shapes the schema" | say the consequence, not the mechanism |
| "eventually consistent" | "there is no version of that being roughly right" |

Three things about this table that make it work:

- **It is a translation table, not a banned-words list.** Every row carries
  the replacement actually used. A ban with no replacement gets ignored under
  deadline, because the writer still has a sentence to finish.
- **The right-hand column is longer than the left.** That is the trade. Plain
  language costs words. Pay it.
- **Record the exception.** Mine: the legal pages, where "tenant" is a
  defined term doing real work in the controller/processor sections.
  Precision beats warmth in a document somebody signs. An unstated exception
  becomes either a violated rule or a wrong legal document.

## The prose layer is somebody else's job, and they do it better

These two rules are the ones that belong in a *design doc*: they govern every
string a visitor can read, they are checkable, and they have to be in context
when a page is being built. They are not a theory of good writing.

For that, use **[petergyang/no-ai-slop](https://github.com/petergyang/no-ai-slop)**
(MIT). It is a skill that edits prose against 18 named patterns, and it is
better at that job than anything I would write: binary contrasts ("it's not
X, it's Y"), throat-clearing openers, colon reveals, faux-insight setups,
importance puffery, weasel attribution, synonym cycling, negative listing,
dramatic fragmentation, rhetorical setups, fake-profound kickers,
summary-recap endings, plus banned words and empty adverbs.

The division of labour is clean, and worth stating so neither of us has to
guess. That skill edits a draft. This pack specifies an interface. They meet
in exactly one place, which is the copy inside a component, and the rule
there is: write it against the two rules below, then run that skill over it
if it is longer than a label.

Two of its findings arrived at the same place I did, independently, and that
is the most useful thing about reading it:

- **Its pattern 18 is em dashes.** Same conclusion, from prose rather than
  from a codebase sweep.
- **Its "formatting slop" is decorative emoji, mid-sentence bold and
  unnecessary bullets.** This repo had eighteen severity markers scattered
  through its own source before somebody pointed out they encoded nothing.

When two people auditing different material ban the same two things, that is
better evidence than either of us arguing for it alone.

## Why these belong in the design doc rather than a content style guide

Because the design doc is the file that gets read before someone builds a
page, and a content style guide is the file that gets read after someone
complains. In an agent workflow the asymmetry is even starker: the design doc
is in context when the copy is being written, and a separate guide is not.
