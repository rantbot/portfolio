---
layout: base.njk
title: About
description: Ran Craycraft is Managing Director and a board member at thoughtbot and President of Ruby Central. Earlier, NBC, AOL, North Kingdom, and Wildebeest.
permalink: /about/
section: about
portrait: /assets/images/ran-craycraft.jpg
image: /assets/images/ran-craycraft.jpg
roles:
  - role: President, Ruby Central
    years: 2026 to present
  - role: Managing Director and board member, thoughtbot
    years: Managing Director since 2023
  - role: Co-founder and Managing Partner, Wildebeest
    years: 2014 to 2023
  - role: Founding Managing Director, North Kingdom US
    years: 2013 to 2014
  - role: General Manager, AOL Entertainment; previously Director of Product
    years: 2011 to 2013
  - role: Digital production and innovation, NBCUniversal
    years: 2005 to 2011
education:
  - degree: MA, Television, Radio & Film
    school: Syracuse University
  - degree: BS, Digital Design
    school: University of Cincinnati
---
<header class="page-head about-head grid">
  <div class="rail portrait">
    {%- if portrait %}<img src="{{ portrait }}" alt="Ran Craycraft, smiling, in a black t-shirt" width="960" height="1200">{% else %}<div class="portrait-empty" aria-hidden="true">RC</div>{% endif %}
  </div>
  <h1 class="span-main page-title page-title-md serif">I help founders and executives turn big ideas into modern businesses.</h1>
</header>

<div class="grid">
<div class="span-main prose serif">

I learned to make things from some of the best people in the business. Then I became a pretty good maker myself. Eventually, I discovered that I enjoyed helping other people make things just as much.

Most of that work is turning complicated challenges into a series of simpler decisions.

AI is making it easier than ever to build things. As making gets easier, judgment becomes more valuable. Knowing what not to build, where to focus, and when to make the difficult decisions can make all the difference. That’s where I want to spend my time.

## How I got here

I started building websites for clients at fourteen and built a window washing company at sixteen, and have been making things ever since.

At NBC, I grew from intern to producer, building emerging technologies from virtual worlds to early AI-powered live speech-to-text. It’s also where I learned how much the right partnerships can open up.

I founded Why Leave Astoria in 2008, a neighborhood social network that grew to more than 10,000 local members and raised tens of thousands of dollars a year for charity. I even officiated the wedding of two people who met through it.

At AOL, I went from Director of Product on the company's smallest team to leading product across the company and eventually working with the CEO and COO as General Manager of AOL Entertainment, where I ran Moviefone, Cambio, and AOL Music, with a $40M P&L and a 70-person team.

North Kingdom taught me how much storytelling and craft matter. That inspired me to co-found Wildebeest, which over nine years, built from scratch to work with Google, YouTube, Microsoft, Disney, and Toyota, General Motors and won a Webby, a Cannes Lions Grand Prix, and a D&AD Pencil.

I joined [thoughtbot](https://thoughtbot.com/) as one of five Managing Directors. Today I lead the Americas business and serve on the board. I’m also President of [Ruby Central](https://rubycentral.org/), supporting the people and technology behind the Ruby ecosystem.

## Always making something

On a weekend, I might be building an app, working on a book, restoring my old Ford truck, taking a long motorcycle ride, or fixing something on my ranch near Joshua Tree. I also own vacation rentals across Southern California and invest in founders bringing the physical and digital worlds together.

Over the years, I’ve helped organize fresh produce pickups for seniors, sixteen weeks of drive-in movies for my community during COVID, and founded a monthly Ladera Heights cleanup that’s still going six years later.

## What I believe

- The biggest opportunity with AI is to take on what wasn't possible before.
- Knowing what not to build is now more important than knowing how to build.
- Speed absolutely matters, but only when you’re heading in the right direction.
- Trust what people do over what they say.
- Be honest when something isn’t working, especially when it was your idea.
- If you don't know what's next, build the things you need to create it.


</div>
</div>

<section class="section grid list-section" aria-labelledby="roles-h">
  <h2 id="roles-h" class="rail eyebrow strong">Roles</h2>
  <ol class="span-main facts">
    {%- for r in roles %}<li><span>{{ r.role }}</span><span class="meta">{{ r.years }}</span></li>{% endfor %}
  </ol>
</section>

<section class="section grid list-section" aria-labelledby="edu-h">
  <h2 id="edu-h" class="rail eyebrow strong">Education</h2>
  <ol class="span-main facts">
    {%- for e in education %}<li><span>{{ e.degree }}</span><span class="meta">{{ e.school }}</span></li>{% endfor %}
  </ol>
</section>

{% include "contact.njk" %}
