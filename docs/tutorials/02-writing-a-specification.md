# Tutorial 2 — From intent to approved Story

*(Informative. Normative sources:
[PP-0004](../../pp/PP-0004-product-specification.md) for the
specification kinds and acceptance criteria;
[PP-0002](../../pp/PP-0002-core-concepts.md) for the governed
lifecycle; [PP-0003](../../pp/PP-0003-product-brain.md) for Decisions.)*

Tutorial 1 left Notely with a Goal and one Knowledge item. Now you do
what a specification phase does: distill a conversation into the
governed hierarchy — Capability, Feature, Stories, Specification — and
carry one Story through `draft → proposed → approved`.

## 1. Start from intent

Intent arrives unstructured. This tutorial distills one fragment (a
running system would also retain the transcript and distill it into
Knowledge; PP-0010 §4):

> **Alex:** The pilot teams keep pasting notes into chat after
> meetings; people who missed the meeting get a stale copy. Sharing
> should be read-only — and for drafts I want to pick who sees them.
> **Sam:** So: share from the note itself, one click, link goes to
> the team. And if a link leaks, I need to kill it.

Four durable statements hide in there: share from the note by link;
viewers get read-only; audience can be restricted; links can be
revoked. That is a Capability with one Feature, two Stories, and rules
that must not get lost in planning.

## 2. The decomposition spine

Links point upward: Story → Feature → Capability → Goal; parents never
enumerate children (PP-0004 §1.1). Write
`.product/specification/cap-collaboration.yaml`:

```yaml
pp: "0.1"
kind: Capability
metadata:
  id: cap-collaboration
  name: Share and collaborate on notes
  version: 1.0.0
  lifecycle: draft
  createdAt: "2026-07-06T10:00:00Z"
spec:
  description: >
    Let a team work with each other's notes: share a note with the
    team or with specific teammates, view shared notes, and control
    who can see or edit what.
  serves:
    - ref: { kind: Goal, id: goal-team-adoption }
```

and `.product/specification/feat-note-sharing.yaml`:

```yaml
pp: "0.1"
kind: Feature
metadata:
  id: feat-note-sharing
  name: Note sharing
  version: 1.0.0
  lifecycle: draft
  createdAt: "2026-07-06T10:10:00Z"
spec:
  description: >
    Share a single note by link: create a share link, send it to
    teammates, view the note read-only, and revoke the link at any
    time. Restricting a link to named teammates is included; public
    (outside-the-team) links are out of scope for v1.
  capability: { ref: { kind: Capability, id: cap-collaboration } }
  personas:
    - note-author
    - note-viewer
```

The persona ids come from the Specification in step 4.

## 3. Two Stories with acceptance criteria

A Story is the narrowest governed slice; its acceptance criteria are
what make it testable, and a Story with none cannot be approved
(PP-0004 §7.3). Each criterion takes exactly one of two forms —
**given/when/then**, or a **single prose criterion**. The first Story,
`.product/specification/story-share-note-link.yaml`, uses both:

```yaml
pp: "0.1"
kind: Story
metadata:
  id: story-share-note-link
  name: Author shares a note by link
  version: 1.0.0
  lifecycle: draft
  createdAt: "2026-07-06T11:00:00Z"
spec:
  narrative: >
    As a note author, I want to share a note with my team by link
    right after a meeting, so that absent teammates can read it
    without me copying it into chat.
  feature: { ref: { kind: Feature, id: feat-note-sharing } }
  acceptanceCriteria:
    - id: ac-1
      given: a saved note owned by the author and a signed-in teammate
      when: the author creates a share link and the teammate opens it
      then: >
        the note renders read-only with its title and full content,
        and no edit controls are shown
      verification:
        method: automated
    - id: ac-2
      criterion: >
        Revoking a share link takes effect within 60 seconds; a
        revoked link shows an access-denied page, not the note.
      verification:
        method: automated
    - id: ac-3
      criterion: >
        The share dialog matches the approved prototype's flow: one
        action to create the link, one to copy it.
      verification:
        method: agentic
  businessRules:
    - BR-SHARE-1
    - BR-SHARE-2
```

`verification.method` is required on every criterion: `automated` for
deterministic checks, `agentic` for judgment an agent evaluator can
render, `manual` only when a human is genuinely required. Once Golden
Tests exist (tutorial 3), criteria can also carry
`verification.evaluations` refs pinning the exact check. The second
Story, `.product/specification/story-restrict-share.yaml`:

```yaml
pp: "0.1"
kind: Story
metadata:
  id: story-restrict-share
  name: Author restricts a shared note to named teammates
  version: 1.0.0
  lifecycle: draft
  createdAt: "2026-07-06T11:30:00Z"
spec:
  narrative: >
    As a note author, I want to limit a shared note to specific
    teammates, so that drafts and sensitive notes are not readable
    by the whole team.
  feature: { ref: { kind: Feature, id: feat-note-sharing } }
  acceptanceCriteria:
    - id: ac-1
      given: a note shared with only one named teammate
      when: a different signed-in teammate opens the share link
      then: access is denied and the attempt appears in the audit log
      verification:
        method: automated
  businessRules:
    - BR-SHARE-1
```

`businessRules` entries are plain strings: they must match rule ids
defined in a Specification whose scope covers this Feature
(PP-0004 §6.6) — which is why the Specification comes next.

## 4. The Specification

The Specification is the definition document: personas, identified
requirements, UX intent, and the business rules the Stories just
bound. Write `.product/specification/spec-note-sharing.yaml`:

```yaml
pp: "0.1"
kind: Specification
metadata:
  id: spec-note-sharing
  name: Note Sharing Specification
  version: 1.0.0
  lifecycle: draft
  createdAt: "2026-07-06T12:00:00Z"
  owners:
    - { type: human, id: alex@notely.dev, name: Alex Rivera }
spec:
  scope:
    - ref: { kind: Capability, id: cap-collaboration }
    - ref: { kind: Feature, id: feat-note-sharing }
  summary: >
    Defines note sharing end to end: who shares and who views, the
    functional behavior of share links and audience restriction,
    quality budgets, UX intent, and the rules governing access.
  businessGoals:
    - ref: { kind: Goal, id: goal-team-adoption }
  personas:
    - id: note-author
      name: Note author
      description: >
        The teammate who ran the meeting and owns the note; wants to
        share it in seconds, from the note itself.
    - id: note-viewer
      name: Note viewer
      description: >
        A teammate who missed the meeting; wants to read the note
        exactly as written, with no risk of editing it by accident.
  functionalRequirements:
    - id: FR-1
      statement: >
        The system MUST let a note's owner create a share link for a
        saved note in a single action from the note view.
      priority: critical
    - id: FR-2
      statement: >
        The system MUST let the owner revoke a share link; revocation
        MUST take effect within 60 seconds.
      priority: high
  nonFunctionalRequirements:
    - id: NFR-1
      category: performance
      statement: A shared note MUST open fast enough to feel instant.
      budget: { metric: p95_shared_note_open, value: 500, unit: ms }
    - id: NFR-2
      category: accessibility
      statement: >
        The share dialog and shared-note view MUST be operable by
        keyboard alone and satisfy WCAG 2.2 AA.
  ux:
    principles:
      - Sharing happens from the note; never send users to a settings page.
      - A shared note is visibly read-only; no disabled edit controls.
    prototypes:
      - name: share-dialog
        description: Clickable share dialog and shared-note view.
        path: docs/prototypes/share-dialog.html
        format: html
  businessRules:
    - id: BR-SHARE-1
      statement: >
        Only the note's owner MAY create, restrict, or revoke a share
        link for it.
    - id: BR-SHARE-2
      statement: >
        A shared note MUST render read-only; edit access is never
        granted through a share link.
```

The prototype is a plain HTML file in the repository, referenced by a
repo-relative `path`. Prototypes exist so a human can *see* the
Specification before approving it — but they are informative
renderings only: where a prototype and the requirements disagree, the
requirements prevail (PP-0004 §2.7). The ids defined here
(`note-author`, `FR-1`, `NFR-1`, `BR-SHARE-1`, the Stories' `ac-*`)
are public surface: Tasks, Evaluations, and Decisions cite them, so
they stay stable across versions and are never reused.

## 5. The governed lifecycle

All five kinds here are governed objects (PP-0002 §6.2):

`draft → proposed → approved → deprecated → archived`

Submitting is cheap: anyone — including an agent — may edit a `draft`
and move it to `proposed` (and back, to revise). The transition that
matters is `proposed → approved`: only a human may authorize it, never
an agent, and the approval must be recorded as a Decision referencing
the exact version. Set `lifecycle: proposed` on the Story, review it,
then set `lifecycle: approved` and record
`.product/brain/decisions/dec-2026-07-10-story-share-note-link.yaml`
in the same commit:

```yaml
pp: "0.1"
kind: Decision
metadata:
  id: dec-2026-07-10-story-share-note-link
  name: Approve story-share-note-link v1.0.0
  version: 1.0.0
  createdAt: "2026-07-10T16:00:00Z"
spec:
  context: >
    story-share-note-link v1.0.0 was proposed from the note-sharing
    specification work. Pilot-team interviews (know-meeting-capture)
    identify post-meeting sharing as the adoption-critical moment.
  outcome: >
    Approved for implementation as specified.
  authority: { type: human, id: alex@notely.dev, name: Alex Rivera }
  decidedAt: "2026-07-10T16:00:00Z"
  affects:
    - ref: { kind: Story, id: story-share-note-link, version: "1.0.0" }
  approves: { ref: { kind: Story, id: story-share-note-link, version: "1.0.0" } }
```

`spec.approves` pins the exact version, and `spec.authority` must be
human. One Decision approves exactly one object version, so repeat the
move for the Goal, Capability, Feature, second Story, and
Specification — each with its own Decision, approving top-down
(PP-0004 §8.2). Every approved Story must sit on a fully resolvable
Story → Feature → Capability → Goal chain; validators treat a break as
an error.

## 6. Approved means immutable

An approved version is never edited — not its criteria, not one word
of a requirement (PP-0002 §6.2): the text the human approved is the
text agents execute against. When a pilot team asks for expiring
links, you do not touch v1.0.0; you create the same `id` at a higher
version, back in `draft`:

```yaml
# story-share-note-link — two versions, side by side in history
metadata: { id: story-share-note-link, version: 1.0.0, lifecycle: approved }  # immutable
metadata: { id: story-share-note-link, version: 1.1.0, lifecycle: draft }     # adds ac-4: links expire
```

An agent may draft and propose that amendment; only a new human
Decision makes it effective. Adding a criterion is a MINOR bump;
removing or weakening one is MAJOR (PP-0004 §8.1) — visible in the
diff and the version number alike.

Validate as in tutorial 1 (schemas:
`specification/capability.schema.json`, `feature.schema.json`,
`story.schema.json`, `specification.schema.json`,
`knowledge/decision.schema.json`), commit, and continue to
[tutorial 3](./03-defining-a-constitution.md) — the rules that outrank
everything you just approved.
