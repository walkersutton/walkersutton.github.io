---
layout: post
title:  "Investigating Cycling Gradients"
post_description:   Reverse engineering Strava's gradient algorithm.
date:   2023-08-08 23:17:34
published:  true
categories: blog
---

I recently built [Cyclemetry](https://github.com/walkersutton/cyclemetry), a command line tool for creating cycling telemtry video overlays. I'm pretty happy with overlays it can generate, but there's one thing that I'm still not thrilled with; the computed gradient values.

## Naive gradient calculations
Cyclemetry currently calculates gradient values by using a [function defined in the gpxpy Python library](https://github.com/tkrajina/gpxpy/blob/dev/gpxpy/geo.py#L227-L243). This function uses basic trigonometry to calculate the angle between 2 points in space.

<img class="img-med-responsive" src="https://i.imgur.com/4ZHRuUS.png" alt="gradient_calculation">

After I implemented computing the gradients using the aforementioned function, it seemed like the values were a bit off. Scrolling through the data, I noticed that gradients I was generating were frequently xx-yy% less than the gradient values I observed on the same Strava activity.

who's to say Strava is the source of truth? maybe Strava is wrong. probably not

INSERT GRAPH - plot strava values against my computed values

discuss sliding window approach - find article and link

INSERT GRAPH - plot with sliding window smoothing - look at old commit where removed sliding window