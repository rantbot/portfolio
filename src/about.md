---
layout: base.njk
title: About
description: Ran Craycraft is Managing Director and a board member at thoughtbot and President of Ruby Central. Earlier, NBC, AOL, North Kingdom, and Wildebeest.
permalink: /about/
section: about
portrait: ""
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
<section class="about">
  <div class="portrait">
    {%- if portrait %}<img src="{{ portrait }}" alt="Ran Craycraft">{% else %}<div class="portrait-empty" aria-hidden="true">RC</div>{% endif %}
  </div>
  <div class="prose serif">
    <h1 class="serif display-3">I started by making the work. Then I learned to build the business around it.</h1>

I started a window-washing company at sixteen. Since then, I’ve worked across media, technology, consulting, and community organizing, following opportunities to create something useful and make it last.

At NBC, I went from intern to editor, shooter, and producer, eventually working on new digital ventures and experiences. That included companion platforms for Heroes, fantasy football shows, virtual-world productions, and the skunkworks project that became Hulu.

I also founded Why Leave Astoria, a neighborhood social network that grew to more than 10,000 members. We brought people together through events and charitable activities, and worked with local businesses on deals and loyalty programs.

At AOL, I helped launch AOL Industry and establish partnerships with trade publications across defense, energy, and government. I later became GM of AOL Entertainment, responsible for a portfolio including Moviefone, AOL TV, Cambio, and AOL Music, with a $40M P&L and a 70-person organization.

After helping North Kingdom launch its US operation, I co-founded Wildebeest. For nine years, we built products, platforms, and experimental experiences for clients including Google, YouTube, Disney, and GM.

Today I’m Managing Director and a board member at thoughtbot. My work spans business growth, organizational design, delivery, and new offerings. I also serve as President of Ruby Central, helping strengthen the organization that supports the Ruby ecosystem.

In Ladera Heights, I’ve organized produce pickups, sixteen weeks of drive-in movie nights, and a monthly neighborhood cleanup that continues six years after it began.

<p class="faint">Across these settings, I enjoy finding an opportunity, bringing the right people together, and turning an idea into something people can use, enjoy, or build on.</p>
  </div>
</section>

<section class="block split" aria-labelledby="roles-h">
  <h2 id="roles-h" class="label">Roles</h2>
  <ol class="list plain">
    {%- for r in roles %}<li class="list-row"><span>{{ r.role }}</span><span class="small muted">{{ r.years }}</span></li>{% endfor %}
  </ol>
</section>

<section class="block split" aria-labelledby="edu-h">
  <h2 id="edu-h" class="label">Education</h2>
  <ol class="list plain">
    {%- for e in education %}<li class="list-row"><span>{{ e.degree }}</span><span class="small muted">{{ e.school }}</span></li>{% endfor %}
  </ol>
</section>

<section class="closing" aria-labelledby="contact-h">
  <h2 id="contact-h" class="serif display-2">{{ site.invitation }} <span class="faint">{{ site.invitation_note }}</span> <a href="mailto:{{ site.email }}" class="ul">{{ site.email }}</a></h2>
</section>
