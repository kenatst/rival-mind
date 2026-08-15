# Global Intel Duel

Build the first high-fidelity frontend prototype of a world-class competitive general knowledge game.

This is NOT a SaaS dashboard, NOT an educational school app, and NOT a generic trivia website.

The vision is:

Chess.com competitive ranking × Duolingo retention × Mon Petit Prono social leagues × live TV game-show energy.

The product should feel like a global competitive sport built around knowledge.

For this first iteration, build FRONTEND ONLY using fake/mock data.

Do not build Supabase, authentication logic, payments, ads, AI generation, APIs or realtime backend yet.

Use:

React

TypeScript

Vite

reusable components

mobile-first responsive design

excellent desktop layout

clean architecture ready for future backend integration

CORE PRODUCT IDEA

Players answer general knowledge questions and build two separate progression systems:

1. XP / LEVEL

Represents activity and long-term progression.

Examples:

Level 27
18,430 XP
🔥 14 day streak

2. WORLD ELO

This is the serious competitive rating.

Inspired by Chess.com.

Everyone starts around:

1000 ELO

Competitive matches increase or decrease rating depending on:

opponent strength

victory/loss

performance

answer accuracy

speed where relevant

Example:

KENAEL
1457 ELO

Victory against 1512 ELO player:

+18 ELO

Loss against weaker player:

-21 ELO

Do NOT implement the actual algorithm yet.

Fake all results.

Create visually meaningful competitive divisions:

Rookie

Bronze

Silver

Gold

Platinum

Diamond

Master

Grandmaster

Legend

ELO should feel prestigious and important.

Example:

WORLD RANK
#18,429

🇫🇷 FRANCE
#721

DIAMOND III
1,457 ELO

The player should immediately want to climb.

VISUAL DIRECTION

The application must look like a premium modern game.

Think:

competitive

energetic

playful

extremely polished

social

addictive

accessible

prestigious

Avoid:

SaaS cards everywhere

corporate dashboards

generic purple AI gradients

excessive glassmorphism

emoji-heavy interfaces

childish educational visuals

boring Bootstrap-like layouts

excessive text

generic quiz templates

Create a strong visual identity that could become instantly recognizable.

Typography should be bold and expressive.

Use oversized numbers for:

scores

ELO

rankings

timers

streaks

Use motion and hierarchy to make important moments dramatic.

The game should feel somewhere between a sports broadcast, an esports game and a premium consumer app.

GLOBAL NAVIGATION

Desktop:

Left-side compact navigation or elegant top navigation.

Mobile:

bottom navigation.

Primary destinations:

HOME
PLAY
BATTLES
LEAGUES
RANKINGS
PROFILE

Keep navigation extremely simple.

SCREEN 1 — LANDING / INSTANT PLAY

The landing page should immediately communicate competition.

Hero example:

HOW SMART ARE YOU?

Secondary:

France is currently #4 in the world.

🇫🇷 France
12,849,221 pts

CTA:

PLAY NOW

Below:

No account required.

Show a glimpse of:

world rankings

live battles

player ELO

countries competing

The user should want to click PLAY within 3 seconds.

No giant marketing essay.

Make the game itself the marketing.

SCREEN 2 — GUEST QUIZ

Immediately launch a question.

Example:

GEOGRAPHY

Which country has the longest coastline?

Canada
Russia
Indonesia
Australia

Large timer:

07

Show:

Question 3 / 10

Do not clutter the screen.

Answers must feel highly tappable.

When the user answers:

animate the selected answer.

Then show:

✅ CORRECT

+112 XP

🔥 x7

Faster than 84% of players

Add satisfying micro-interactions.

Fake all data.

SCREEN 3 — POST-GAME CONVERSION

After several questions:

YOU'RE BETTER THAN 73% OF PLAYERS

Score:
8 / 10

Estimated skill:
1,126 ELO

World:
#842,193

France:
#47,221

CTA:

SAVE MY RANK

Secondary:

Continue as guest

This is where account creation would eventually happen.

Do not implement real authentication yet.

SCREEN 4 — HOME

The logged-in home screen should feel alive.

Top area:

Avatar
Kenael
Diamond III
1,457 ELO
World #18,429

Then show one dominant action:

PLAY

Below it:

DAILY CHALLENGE
8 hours remaining

BATTLE REQUEST
Thomas challenged you

WORLD EVENT
🇫🇷 France vs 🇪🇸 Spain
49.7% — 50.3%

PRIVATE LEAGUE
Les Génies
You are #2

Do not make this look like a dashboard.

It should feel like a game lobby.

SCREEN 5 — PLAY HUB

Offer visually distinct modes:

INFINITE

Questions without limits.

Train and earn XP.

RANKED

Competitive match affecting ELO.

Make this mode visually prestigious.

DAILY 12

Same 12 questions for everyone.

One attempt per day.

QUICK BATTLE

Challenge a friend.

CATEGORY RUN

History, Science, Sports, Cinema, Geography, etc.

The most important mode should be:

RANKED

SCREEN 6 — RANKED MATCHMAKING

Create a dramatic matchmaking screen.

Player:

KENAEL
1,457 ELO
DIAMOND III

Searching...

Then reveal opponent:

LUCAS92
1,512 ELO
DIAMOND II
🇫🇷

Show:

Expected ELO:

Win: +18
Loss: -14

Then:

MATCH STARTING

3
2
1

Use animations.

SCREEN 7 — RANKED MATCH

Both players receive the same questions.

Show both players at the top.

Kenael
3

Lucas92
2

Question:

Which empire built Machu Picchu?

4 large answer options.

Timer.

After answering, show whether the opponent has answered WITHOUT showing their answer until appropriate.

Create suspense.

Possible visual states:

Opponent thinking...

Opponent answered.

Round won.

Round lost.

Score should update dramatically.

SCREEN 8 — MATCH RESULT

This screen must feel extremely rewarding.

Example:

VICTORY

KENAEL
7

LUCAS92
5

Then:

1,457
→
1,475 ELO

+18 ELO

DIAMOND III

World ranking:

#18,429
→
#17,882

Actions:

REMATCH
SHARE
NEXT OPPONENT

Make the ELO increase animation one of the strongest moments of the entire application.

For losses:

-14 ELO

but do not make it emotionally punishing.

SCREEN 9 — WORLD LEAGUE

This is a major screen.

Header:

WORLD LEAGUE

Your rating:

1,475 ELO

Diamond III

Progress visually toward next division.

Then show leaderboard:

🇫🇷 ALEXANDRE — 2841

🇯🇵 HIKARI — 2792

🇬🇧 BEN — 2764

🇺🇸 EMILY — 2741

🇩🇪 FELIX — 2718

Show:

Top 100
Friends
France
Nearby

“Nearby” should show players close to the user's ELO/rank.

Example:

#17,880 Emma — 1476
#17,881 Jules — 1475
#17,882 YOU — 1475
#17,883 Leo — 1474

This makes climbing tangible.

SCREEN 10 — COUNTRY RANKINGS

Create a global country competition.

Example:

WORLD KNOWLEDGE RANKING

1 🇯🇵 JAPAN
2 🇩🇪 GERMANY
3 🇬🇧 UNITED KINGDOM
4 🇫🇷 FRANCE
5 🇨🇦 CANADA

Provide two tabs:

POWER

Normalized competitive strength.

TOTAL

Total contribution from all players.

France should show:

#4 WORLD

12,849,221 points

+21,482 today

Next target:

🇬🇧 UK

Need:

84,221 pts

Use a progress bar.

Make country competition feel urgent and social.

SCREEN 11 — PRIVATE LEAGUES

Create a league screen inspired by fantasy sports / Mon Petit Prono.

Example:

LES GÉNIES

12 players

Season 4

Leaderboard:

1 Lucas — 4,821 pts
2 YOU — 4,603 pts
3 Emma — 3,912 pts

Show:

Weekly rank
Season rank
Battles won
Accuracy
ELO

Actions:

INVITE FRIENDS

CREATE BATTLE

VIEW STATS

Create an invite/share modal with a fake invitation link.

SCREEN 12 — BATTLE FRIEND

Generate a challenge card.

KENAEL CHALLENGES YOU

10 questions.

Same questions.

Best score wins.

Opponent can join through a link.

Show a beautiful pre-game versus screen.

This feature must feel extremely shareable.

SCREEN 13 — DAILY 12

Strong identity.

DAILY 12

August 15

12 questions.

One attempt.

Everyone receives the same questions.

Show after completion:

11 / 12

TOP 2.8%

🇫🇷 France #8,421

Friends:

1 Emma 12/12
2 YOU 11/12
3 Lucas 9/12

CTA:

SHARE RESULT

SCREEN 14 — PROFILE

The profile should be something users WANT to share.

Example:

KENAEL
🇫🇷 France

1,475 ELO

DIAMOND III

World #17,882

Stats:

72% accuracy
438 battles
287 wins
14 day streak
18,430 XP

Strong categories:

History 82
Geography 78
Science 71

Weak categories:

Music 48
Cinema 44

Achievements:

Perfect 12
10 Win Streak
Top 10K France
Diamond

Create a profile card that looks like a gaming identity card.

SCREEN 15 — FRIENDS / SOCIAL

Sections:

ONLINE NOW

BATTLE REQUESTS

FRIENDS RANKING

RECENT ACTIVITY

Examples:

Thomas reached Gold I.

Emma scored 12/12.

Lucas passed you in your private league.

Keep social features competitive rather than turning this into a social network.

SCREEN 16 — NOTIFICATION CENTER

Design notification examples:

Thomas passed you.
By 12 ELO.

Emma wants a rematch.

France is losing against Spain.
49.7% — 50.3%

Your 14-day streak is at risk.

Only one player in your league got 12/12 today.

Make notifications feel useful and contextual.

SCREEN 17 — FUTURE LIVE EVENT PREVIEW

Create one UI mockup for a future major live event.

WORLD QUIZ

Starts Sunday 20:00

🇫🇷 FRANCE

vs

THE WORLD

254,821 registered

CTA:

REMIND ME

This does not need to function.

It is purely to establish visual direction for future live competitions.

DESIGN SYSTEM

Create reusable primitives for:

Buttons
Answer cards
Player cards
Rank badges
Division badges
Country badges
Timers
Progress bars
Score counters
ELO animations
Leaderboard rows
Tabs
Modals
Toast notifications
Bottom navigation
Desktop navigation

Use one consistent spacing system.

Maintain accessible contrast.

Buttons must have strong interaction states.

Mobile interactions must feel natural with one hand.

RESPONSIVE

Design primarily for:

390px mobile width

Then adapt elegantly to:

tablet

desktop

wide desktop

Do NOT simply stretch mobile cards to desktop.

Use the extra desktop space intelligently.

Gameplay should remain focused in a central zone.

MICROINTERACTIONS

Add tasteful animations for:

correct answer

wrong answer

timer urgency

XP increase

ELO increase/decrease

division promotion

leaderboard position change

streak increment

battle victory

matchmaking

button press

Do not overanimate everything.

Major moments should feel special.

AUDIO PREPARATION

Do not implement real sound files yet.

But structure the UI so future sound effects can correspond to:

answer correct

answer wrong

countdown

match found

victory

defeat

rank promotion

daily perfect score

The product should eventually feel excellent with sound enabled but remain completely usable muted.

IMPORTANT UX PRINCIPLES

Gameplay always wins over navigation.

A user should reach a question almost immediately.

Do not force signup before the first game.

Competitive status should always be visible.

ELO must feel more prestigious than XP.

Results must naturally encourage sharing or rematching.

Avoid information overload.

Every major screen should have ONE obvious primary action.

Build reusable components rather than duplicating screens.

Make the prototype feel like a real shipped consumer game, not a wireframe.

MOCK DATA

Populate the application with realistic fake data.

Use multiple player names, flags, rankings and divisions.

Use realistic questions from multiple categories.

Never use lorem ipsum.

Do not use fake AI buzzword copy.

TECHNICAL PREPARATION

Even though this iteration is frontend-only:

Keep business logic separated from presentation.

Create mock data/services so they can later be replaced by real APIs.

Use clear TypeScript interfaces for:

User
PlayerProfile
Question
Answer
Match
MatchResult
LeaderboardEntry
CountryRanking
League
LeagueMember
DailyChallenge
Notification
Achievement
Division

Do not hardcode everything directly inside UI components.

FINAL OBJECTIVE

The prototype should make someone think:

“Why does this not already exist?”

A user should immediately understand:

I answer questions.

I get rated.

I climb the world ranking.

I represent my country.

I beat my friends.

I join leagues.

I come back tomorrow.

Do not optimize for feature quantity.

Optimize for:

desire to play
prestige
competition
virality
clarity
retention
visual identity

Build all screens using mock data and make navigation between them functional.

Do NOT add backend yet.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4e5209dd-aa53-429c-be76-d885cdbabbcb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
