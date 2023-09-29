---
layout: post
title:  "Investigating Cycling Gradients"
post_description:   Reverse engineering Strava's gradient algorithm.
date:   2023-08-08 23:17:34
published:  true
categories: blog
---
a command line tool for creating cycling telemtry video overlays.
[TODO - scratch]




I have a bunch GoPro footage from bike trips I've taken recently. I wanted to post some of the best clips [TODO clips clips - replace repeated word] to YouTube in the style of [Safa Brian](https://www.youtube.com/@SAFABrian)'s cycling videos - POV clips with stats from the ride overlayed atop the video. I wasn't sure how Safa includes these stats in his videos, so I started Googling.

I was looking for a piece of software that was both free and compatible with MacOS. The only thing I found that met my criteria was [Garmin VIRB Edit](https://www.garmin.com/en-US/p/573412). Here's a frame from my test video:

<img class="img-med-responsive" src="https://i.imgur.com/EHBYBjQ.jpg" alt="Garmin VIRB Edit screenshot">

TODO - draft copied snippet
I spent some time experimenting with the existing free tools for overaling telemetry data on my cycling activities.

I wasn't able to customize the graphics as much as I would have liked to, so I decided to build my own tool for generating data overlays, [Cyclemetry](https://github.com/walkersutton/cyclemetry). After 2 months, I was able to generate a video overlay that looked nearly identical to those in Safas' videos:

<img class="img-med-responsive" src="https://i.imgur.com/ko0K0Fa.png" alt="Cyclemetry screenshot">

## uh oh

I thought Cyclemetry's overlay looked great: the course and elevation profile both followed the same basic shapes I saw on Strava and in my VIRB Edit test. The speed and power values seemed to change appropriately when I was  accelerating, braking, and coasting in the POV video. The gradient values changed between positive to negative I transitioned between uphills and downhills. [TODO - replace between between duplicate word]

While proudly admiring my first polished YouTube video featuring a Cyclemetry overlay, I picked up on something that looked off to me. In the video, the largest consistent negative gradient observed is around -3%. -3% (TODO - replace double gradient value) isn't flat by any means, but it also isn't super steep. [TODO fix this] The speeds seen in the video seemed unsustainable for me on a -3% grade; I knew something was off.

I decided to compare the Cyclemetry video with the Garmin VIRB Edit video. I noticed that the gradient values on my Cyclemetry video consistently deviated from those seen in the VIRB Edit video and on Strava by over 50%! 

<div class="flex-container">
    [TODO - does first alt text need to be updated to VIRB or something?]
    <img class="img-med-responsive" src="https://i.imgur.com/wxU0RRc.png" alt="gradient_calculation">
    <img class="img-med-responsive" src="https://i.imgur.com/MS9ibF7.png" alt="strava_screenshot">
</div>

VIRB Edit and Strava had nearly identical gradient values, so I figured my gradient calculations were just off somewhere. Let's investigate.

## Bikes in bytes
*(if you're already familiar with GPX/FIT filetypes, feel free to skip this section)*

When recording a cycling activity, a GPS-enabled device typically records the current latitude, longitude, elevation, and time every second. Depending on your device configuration, additional data can also be recorded (heart rate, temperature, power, etc.), but for now let's focus on the geo-positioning data.

What can we do with latitude, longitude, and elevation data?
* calculate speed data
* calculate gradient data
* calculate cadence data (only for fixed gear bicycles, [blog post coming in the future](/coming_soon))
* determine elevation gain/loss
* draw a course map
* draw an elevation profile
* and *more*

## Naive gradient calculations
I found a [function defined in the gpxpy Python library](https://github.com/tkrajina/gpxpy/blob/dev/gpxpy/geo.py#L227-L243) that uses basic trigonometry to calculate the gradient of a surface:

<img class="img-med-responsive" src="https://i.imgur.com/4ZHRuUS.png" alt="gradient_calculation">

This seemed like a reasonable way to caluclate the gradient, so I wasn't sure what was wrong



 more text here




## Why is Strava steeper?
Before I 


After generating gradient values using the gpxpy library

Scrolling through the data, I noticed that gradients I was generating were frequently xx-yy% less than the gradient values I observed on the same Strava activity.

who's to say Strava is the source of truth? maybe Strava is wrong. probably not

INSERT GRAPH - plot strava values against my computed values

discuss sliding window approach - find article and link

INSERT GRAPH - plot with sliding window smoothing - look at old commit where removed sliding window

## lol maybe my barometric altimeter is just bad
it calculates the elevation values? but having an innacurate calibration should still have same relative differences, right? unless it's just really shit
https://support.wahoofitness.com/hc/en-us/articles/115000441324-Why-are-there-Elevation-differences-in-my-ride-data-#:~:text=When%20a%20ride%20starts%2C%20the,ROAM%20adjusts%20using%20GPS%20data.




TODO
*People know what gradients are, right? If you don't, not to worry. In cycling, a gradient is [a measure of a road's steepness](https://cyclingmagazine.ca/sections/news/gradient/#:~:text=Gradient%20is%20a%20measure%20of,between%203%2D15%20per%20cent.) (-Cycling Magazine)*
