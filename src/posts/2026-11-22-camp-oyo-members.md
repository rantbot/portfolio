---
title: "Building a members app for a nonprofit run by seniors"
description: "A simple app on a Google Sheet that helps a family member and fellow volunteers at the Camp Oyo Staff and Alumni Association track members and dues."
date: 2026-11-22
kind: making
topics: [community]
meta: Web app on Google Sheets
tone: "#2F5D46"
ink: "#F2F5F2"
cover_kicker: Camp Oyo
cover_lines:
  - Built for family
  - and any phone
---

A family member of mine keeps track of members and dues for the Camp Oyo Staff and Alumni Association. For years that meant a Google Sheet, paper forms, and checks in the mail. The people who run the association are seniors with very different comfort levels with technology, and they use whatever is in front of them, a phone one day and a desktop computer the next.

So I built them a small members app. It runs on Google Apps Script on top of the same Google Sheet, so none of their records had to move, and it costs nothing to run. I built it with Claude, and my test the whole way through was simple. Could they use it on their phone, the first time, without me there?

## Plain words and big buttons

Every label uses everyday words, like Record a payment, Add a person, and Needs checking. Choices are big buttons you tap instead of dropdowns. The type is large and easy to read, and the menu is a button that says Menu.

The Save button only appears once something has changed, and it goes away again if you change it back, so there's never a question of whether something still needs saving.

## Payments the way they actually come in

Dues, donations, and the odd T-shirt or patch come in by check, cash, or Zelle. Recording one means finding the person, tapping what it was for, and typing the amount. A donation can be in memory of or in honor of someone, and that shows on the member's history and on a record you can print or save as a PDF.

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
