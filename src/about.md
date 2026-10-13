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
  <h1 class="span-main page-title page-title-md serif">I started by making the work. Then I learned to build the business around it.</h1>
</header>

<div class="grid">
<div class="span-main prose serif">

I learned to make things from some of the best people in the business. Then I became a pretty good maker myself. Eventually, I discovered that I enjoyed helping other people make things just as much.

Over the years, I’ve found my place helping founders and executives turn complicated challenges into a series of simpler decisions. I love bringing clarity to uncertainty, helping good people do ambitious work, and figuring out how to turn big ideas into real businesses.

I’ve always believed in increasing ambition rather than simply doing less. And I think we’re entering an extraordinary moment for people willing to think bigger.

AI is making it easier than ever to turn ideas into reality. But just because we can build something doesn’t mean we should. As making becomes easier, judgment becomes more valuable. Knowing what not to build, where to focus, how to get to market quickly, and when to make the difficult decisions can make all the difference.

That’s where I want to spend my time. Helping people make better bets, build stronger businesses, and prepare for whatever comes next.

## How I got here

I started a window-washing company at sixteen and have been making things ever since.

At NBC, I went from intern to editor, shooter, and producer, working across emerging technologies from virtual worlds and interactive television to early AI-powered closed captioning. It was also where I first learned the importance of business development and partnerships, and how bringing the right people and ideas together could create entirely new opportunities.

I founded Why Leave Astoria, a neighborhood social network that grew to more than 10,000 members. What started as a digital platform became a real community, creating friendships, bringing neighbors together, and raising tens of thousands of dollars annually for charity. I even officiated the wedding of two people who met through the platform.

At AOL, I went from Director of Product on one of the company’s smallest teams to leading product across the organization. I worked closely with the CEO and COO on the company’s future, including the strategy and acquisitions that would help shape its eventual exit. Along the way, I served as GM of AOL Entertainment, overseeing brands including Moviefone, AOL TV, Cambio, and AOL Music, with a $40M P&L and a 70-person team.

At North Kingdom, I joined a legendary creative team and learned how much storytelling, craftsmanship, and design polish matter when creating experiences for the world’s biggest brands. That experience inspired me to co-found Wildebeest, a consultancy that brought the same creative ambition to building real products and platforms.

Over nine years, we grew Wildebeest from nothing into a company working with the people and brands we’d once dreamed of collaborating with, including Google, YouTube, Disney, and GM. Along the way, our work earned some of the industry’s highest honors, including a Webby, a Cannes Lions Grand Prix, and a D&AD Pencil.

I joined [thoughtbot](https://thoughtbot.com/) as one of five Managing Directors and grew into leading the entire Americas business. Today, my work spans growth, organizational design, consulting, and helping teams and clients navigate the changing landscape of technology and product development. I also serve on thoughtbot’s board and as President of [Ruby Central](https://rubycentral.org/), supporting the people and organizations behind the Ruby ecosystem.

## Always making something

Making things is my career, and it’s also how I spend most of my free time.

On any given weekend, I might be building an app, working on a book, restoring my old Ford truck, or fixing something at my place in the desert. I built an authentic Old West saloon near Joshua Tree, which has given me a pretty good excuse to collect Western memorabilia.

I also own vacation rental properties across Southern California, where creating memorable physical experiences has become another creative outlet.

I’m an angel investor in innovative founders pursuing unconventional ideas, particularly those exploring what’s possible when the physical and digital worlds come together.

Closer to home, I’ve helped organize neighborhood produce pickups, sixteen weeks of drive-in movies, and a monthly community cleanup in Ladera Heights that’s still going six years later.

The projects are different, but the motivation is pretty much the same. I love seeing an idea become something real, especially when it brings people together or makes their lives a little better.

## What I believe

- Technology should increase our ambition, not just make the things we already do more efficient.
- The biggest opportunity with AI is attempting things that weren’t possible before. Doing the same work with fewer people is a much smaller prize.
- Knowing what not to build is becoming as important as knowing how to build.
- Most complicated problems can be broken into a series of simpler decisions.
- Speed matters, but only when you’re heading in the right direction.
- The best prototypes help people discover what matters before committing to building it.
- Trust what people do over what they say.
- Be honest when something isn’t working, especially when it was your idea.
- You can’t know exactly what comes next, but you can build something that’s ready for it.


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
