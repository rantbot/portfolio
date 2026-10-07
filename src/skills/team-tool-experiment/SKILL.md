---
name: team-tool-experiment
description: Plan, build and judge a small internal tool as an honest experiment. Use when someone wants to build a tool for their team, test whether an AI helper is worth keeping, or decide if an internal experiment should live or die.
---

# Team tool experiment

Help the user turn an idea for a team tool into a small, honest experiment. The goal is a clear answer about whether people actually use it, not a polished product.

## The four rules

Every experiment follows these. Check the plan against them before building anything, and push back when one is missing.

1. **It solves a problem someone on the team actually has.** Name the person or role and the moment the problem happens. "Sales reps retype opportunity details into the CRM after a Slack post" is a problem. "AI for sales" is not.
2. **It asks one honest question.** Write it down before building, phrased so behavior can answer it. Good examples are "Does anyone click this twice?" and "Is the brief good enough that people stop doing their own research?"
3. **It counts, anonymously, whether people use it.** Decide the one or two events that answer the question, like a rewrite kept versus undone, or a brief opened before a meeting. Count events, not identities. The answer should come from behavior, not politeness.
4. **It changes nothing until a person says yes.** Anything that edits records, sends messages or moves money shows what it will do first and waits for an explicit confirmation.

## Steps

1. **Frame it.** Ask who has the problem, when it happens, and what they do today. Write a one-paragraph problem statement and the one question.
2. **Find the smallest version.** Cut the idea down to the single action that would answer the question. Prefer working inside tools people already use, like a browser extension, a Slack app or a calendar entry, over a new destination.
3. **Plan the guardrails.** List every action that changes something outside the tool, and add a confirmation step or a read-back check to each. If an outside system can report success while ignoring a change, read the result back and confirm it actually took.
4. **Plan the counting.** Define the events, where they're counted, and what result would mean keep, change or stop. Write these thresholds down before launch.
5. **Build and ship it to the people it's for.** Keep a short changelog in plain language. Ask for one specific kind of feedback, the part most likely to be wrong.
6. **Judge it.** After a fixed period, compare the counts to the thresholds. Recommend keep, change or throw away, and say why. Throwing an experiment away is a good outcome when the question has been answered.

## Output

When planning, produce a short brief with these headings. The problem, The question, Smallest version, Guardrails, What we'll count, Decision rule.

When judging, produce a short verdict with the numbers, the recommendation and the one thing learned.

---
From Ran Craycraft, “Building tools for my own team.” Shared under the MIT License.
