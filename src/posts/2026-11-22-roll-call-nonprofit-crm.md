---
title: "Roll Call, a free CRM for small nonprofits built on Google Sheets"
description: "A free CRM I created on Google Sheets so a small nonprofit run by senior volunteers can track members, dues, and donations from any phone, even offline."
tldr: "Roll Call is a free CRM I designed and built for the Camp Oyo Staff and Alumni Association, a volunteer-run nonprofit that had outgrown offline spreadsheets passed from person to person and stacks of paper applications. It runs on Google Sheets and Apps Script. Volunteers add new members directly, record dues and donations, sign in with an emailed code instead of a password, and can still look people up with no signal."
date: 2026-11-22
kind: making
topics: [community]
meta: Nonprofit CRM on Google Sheets
tone: "#2F5D46"
ink: "#F2F5F2"
cover_kicker: Roll Call
cover_lines:
  - Built for family
  - and any phone
---

Roll Call is a CRM I created for the Camp Oyo Staff and Alumni Association, a small nonprofit run by volunteers. A family member of mine keeps track of its members and dues, and I built Roll Call to make that job a lot easier for them and everyone they work with.

## Why a small nonprofit needed a CRM

For years, the member list didn't live in one place. It lived in several offline spreadsheets that got passed from person to person, and every copy could be a little different from the last.

New members signed up on paper at events, and there were lots and lots of those forms. Many were close to illegible, which left someone squinting at a name or an email address before it could go anywhere.

Money came in by check, cash, and Zelle, for dues, donations, and the odd T-shirt or patch. And the people keeping up with all of it are seniors with very different comfort levels with technology, using whatever is in front of them, a phone one day and a desktop computer the next. Sometimes they're somewhere remote with no cell coverage at all, and they still need to look someone up.

## What Roll Call does

Roll Call replaces all of that with one shared list. It runs on Google Apps Script on top of a single Google Sheet, so there are no more copies to pass around, and it costs nothing to run. New people go straight into the app instead of onto a paper form, so there's nothing to decipher later. And when there's no signal, the same icon on their phone opens a saved copy of the roster, so they can still find anyone.

I built it with Claude, and my test the whole way through was simple. Could they use it on their phone, the first time, without me there?

## Plain words and big buttons

Every label uses everyday words, like Record a payment, Add a person, and Needs checking. Choices are big buttons you tap instead of dropdowns. The type is large and easy to read, and the menu is a button that says Menu.

The Save button only appears once something has changed, and it goes away again if you change it back, so there's never a question of whether something still needs saving.

## Payments the way they actually come in

Recording a payment means finding the person, tapping what it was for, and typing the amount. A donation can be in memory of or in honor of someone, and that shows on the member's history and on a record you can print or save as a PDF.

Every member has a short ID like K7PX, with no letters or numbers that look alike, so it's easy to read over the phone.

Zelle doesn't let other apps request money, so the app writes a friendly payment request instead, with the amount and how to pay, and opens it in their own email. It comes from them, and replies go to them.

## Signing in without a password

There are no passwords. You type your email and the app sends a six-digit code, with the code right in the subject line so it shows up in the phone's notification. Type it in, or tap the button in the email.

The first version sent a sign-in link, and it was a struggle. On a phone, a link often opens inside the email app's own browser, so you'd be signed in there but not in the app you actually use. A code you type on the same screen avoids all of that.

<figure class="spread">
  <img src="/assets/images/projects/camp-oyo-sign-in.jpg" alt="A phone showing an email with the subject Your Camp Oyo sign-in code is 482913, the code in large numbers, and a green Sign in to Camp Oyo button" width="1600" height="1000" loading="lazy" decoding="async">
  <figcaption>The code is in the subject line, so it shows up before you even open the email.</figcaption>
</figure>

## A page for every member

Members can sign in with the email on their record to see their membership and payment history, update their address, phone, or email, and see how to pay their dues. Their changes save right away and get flagged to be checked. If someone sends a payment, they can say so, and it waits to be confirmed once the money arrives.

## Working without signal

Sometimes the app gets used where there's no cell coverage. Now it can live on the home screen, and every time it opens with signal it saves a copy of the roster on the phone. With no signal, the same icon opens that copy. You can find anyone and see their details and payments, and a strip across the top says it's look-up only.

If signal drops in the middle of an edit, the form locks right away instead of failing on Save. Whatever was typed stays on the screen, and everything unlocks by itself when signal comes back.

<figure class="spread">
  <img src="/assets/images/projects/camp-oyo-offline.jpg" alt="Two phones showing the app offline, a list of members under a strip that says Offline. Look up only, no changes, and one member's contact details, membership, notes, and payments" width="1600" height="1000" loading="lazy" decoding="async">
  <figcaption>With no signal, the saved copy opens instead. The members shown are made up.</figcaption>
</figure>

## Built from getting stuck

Many of the best changes came from where people got stuck, on a sign-in link that opened in the wrong place or somewhere with no signal. Each time, the fix was to take something away or say something more plainly, until the app just did what they expected.
