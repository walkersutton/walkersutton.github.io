---
layout: post
title: Mini Crossword Puzzle Leaderboard
post_description: Leaderboard for the NYT minis.
date:   2019-08-18 12:00:00 -0500
published: true
categories: blog
---
<img class="img-wide" src="https://i.imgur.com/nUY7X8b.png" alt="nyt_mini_leaderboard_main">

**Python, cron, GoogleCharts, GoogleSheetsAPI**

Welcome to the New York Times mini leaderboards project. I'm still working on automating the data input from the crossword puzzle website to my Google Sheet, so right now, I just input data manually. I've been trying to use Flask, Beautiful Soup, and lxml, but I'm getting caught up with authenticating my user when logging in.

I decided to make this leaderboard because currently on the NYT website, you can only see your friends' current day's solve time. I think it would be interesting to see how people perform over time. Who has the fastest time ever? Who has the fastest time for a particular day of the week? Like the full crosswords, does the day of the week coorespond to puzzles of different difficulties? Do we solve faster if we've solved a greater number of puzzles? There are lots of questions to ask and answers to be found with some of this data, and it's also just a fun way to see how we all fare stacked against each other.

There is a best times chart below which graphically shows each person's fastest time for a particular day of the week.

#### Best Solve Times

**there should be a dynamic chart here, but I need to figure out how to migrate it over from my static site**

More content coming soon...
