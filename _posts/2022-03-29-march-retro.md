---
layout: post
title: March Retro
post_description: What do I want to achieve in March?
date: 2022-04-04T04:11:00Z 
published: true
categories: blog
---

_This is the beginning of an attempt to mimic [Michael Lynch's retrospectives](https://mtlynch.io/retrospectives/). Hopefully this can help me achieve some of my goals, and maybe someone can find value in it as well._

## February Highlights
* Launched my parent's website for their [new inn](https://theinnatorient.com)
* [@wepollus](https://twitter.com/wepollus) Revival
* [Fweb3](https://fweb3.xyz)

### [The Inn at Orient](https://theinnatorient.com)
My parents sold their house last spring and bought [an inn](https://theinnatorient.com)! They've been working on lots of renovations over the past year, and just a few weeks ago, they welcomed their first guests. I was asked to help get the business set up online. I initially thought it might be interesting to build their property management/online booking system from scratch, but we ended up using a third-party service provider as I grossly underestimated the amount of work required to build something like this.

We decided to use [Cloud Beds](https://cloudbeds.com) to handle the bulk of our online reservations (We're also using Square to handle payments for those who choose to not book through one of our integrated OTAs (online travel agencies)). It certainly isn't a perfect system - there's a lot of manual configuration that needs to be completed for each booking channel. For every OTA you connect to, you have to create an account with the travel agency, configure payments, set up taxes, create listings for each room (this includes uploading images, configuring property details, etc.); I can go on. This also means that every time you want to make an edit to a listing, you have to apply the same change on every single OTA. The only OTA cross-functionality CB offers is the ability to sync room rates and room availabilities. I'm not sure if this is simply because online travel agencies have APIs with limited functionality or if Cloud Beds just decided it was easier to only support the most basic required functionality. I tried to read Airbnb's API documentation to see if they expose endpoints for updating listing details and similar functions, but their docs aren't made publicly available; it also seems rather difficult to gain access to their API.

I think there might be a gap in the market here. You could build a 'Plaid for OTAs', assuming that you could provide Cloud Beds and other hotel management SAAS companies value by making it easier for them to support more functionality with more OTAs. I would like to think that Airbnb would grant you an API key for an access request like this, but who knows.

### [@wepollus](https://twitter.com/wepollus) Revival
I built a [Twitter bot](https://twitter.com/wepollus) in 2020 that generates Twitter polls based on user interactions. A few months ago, the bot broke because of some changes to the Twitter website. I ended up putting the bot on pause for a while and decided it was time to revive @wepollus last month. I learned that at some point over the last year or so, the Twitter API was updated with a new endpoint that supports creating Twitter polls. This was great news to hear because the broken component was doing just this, but instead of using the API, it was using [Selenium](https://www.selenium.dev/). I'm happy to report that the bot is now back online. Also very happy that I no longer need Selenium to achieve this functionality because the API should significantly reduce the amount of time I spend maintaining this project.

### [Fweb3](https://fweb3.xyz)
Throughout the month of February, I participated in [Fweb3](https://fweb3.xyz), a new, annual, month-long event dedicated to learning about web3. I found out about it through [Sahil](https://twitter.com/shl/status/1488562644223082497) on Twitter; it seemed like a good opportunity to learn more about Ethereum, NFTs, and the web3 space. Over the course of few weeks, the community designed and built a fully-fledged game centered around learning about crypto. You start off by setting up a crypto wallet and to win the game, you must create your own ERC-20 token! I'd definitely recommend it to anyone interested in learning more about Ethereum. If you run into any troubles, there's a great Discord community that will help you.

## Wrap Up

### Goals for next month - keep it stupid simple
* [Cadence Calculator](https://cadecalc.app) soft launch
* Write a [Hammerspoon](https://hammerspoonTODO.com) blog post
* xx _Only Two This Month_

#### [Cadence Calculator](https://cadecalc.app) MVP
I started working on [Cadence Calculator](https://cadecalc.app) last summer. There's still a fair bit of work to be done, and I'm hoping that by the end of this month, I can begin to onboard a few interested users (that is, if there are interested users) into a pilot program. I'll write a blog post about this project soon for anyone interested.

#### Hammerspoon Blog Post
I'd like to get into the habit of publishing blog posts more often. I'm going to try to write one blog post this month (in addition to what you're currently reading). One is enough to make me struggle with setting aside the time to write, but shouldn't be overwhelming.

#### xx Only Two This Month
I really do like lists of 3, but I'm already running late with this post, so 2 goals for the month of March will have to do.