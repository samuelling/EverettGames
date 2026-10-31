# Everett Games

Everett's game console: a cartridge picker for all the games Everett has dreamed up.
Tap a cartridge once to hear its name, then tap it again (or press ▶). The game plays
right on the console's screen; the orange eject button takes you back to the cartridges.
A link like `.../EverettGames/#megamax` boots straight into a game.

**Play:** https://samuelling.github.io/EverettGames/

## Cartridges

| Game | Where it lives |
| --- | --- |
| MegaMax | `games/megamax/` (this repo) |
| Math Buddies | `games/learn/?s=math` (this repo) |
| Letter Land | `games/learn/?s=read` (this repo) |
| Brick Ninja | [samuelling/Brick-Ninja](https://github.com/samuelling/Brick-Ninja) |
| Toilet Goalie | [samuelling/toilet-goalie](https://github.com/samuelling/toilet-goalie) |
| Slapanimal | [samuelling/Slapanimal](https://github.com/samuelling/Slapanimal) |
| Chip's Candy Run | coming soon |
| Animal Journey | coming soon |

To add a game, add one line to the `GAMES` list near the bottom of `index.html`
(a folder in this repo or a link to another repo's GitHub Pages site).

## MegaMax

Everett's arena fighting game.

- **Arena.** Fight in a round arena. Beat a fighter and they join your team (28 fighters).
- **Levels.** Every win is a new level, and every level the bad guys get tougher:
  bigger, smarter, faster, with more health and harder hits (and a red glow that gets
  angrier). Every 5th level is a **boss** with a crown: Jack, Magma, Bonez, Sir Clank, Drako.
- **Buddy Island.** Only buddies live here (14 kinds), no enemies. Find one hiding in the bushes
  or chase one down. Catching it makes your fighter **bigger** (up to 4 sizes), and
  the buddy becomes your partner, nipping at the other fighter during matches.
- **MEGAMAX skill.** Landing hits fills the meter. When it's full, your buddy goes
  giant and blasts the other fighter.
- **Be the fighter or be the Coach.** In Coach mode the fighter fights on their own,
  and you tap the calls: Punch, Power, Dodge, Cheer (fills the MEGAMAX meter) and MEGAMAX.

Opponents get bigger as you win, so you'll need Buddy Island to keep up.

**Controls.** On a touchscreen you get a joystick plus big buttons. On a keyboard:
arrows/WASD move, J punch, K power, Space jump, L MEGAMAX, H cheer (Coach), M mute.

Progress saves in the browser. Everything is drawn in code and all sounds are
synthesized, so there are no image or audio files.

## Math Buddies & Letter Land

Learning games that use the MegaMax buddies. Everything is spoken aloud, so no reading
is needed to play. Each round is 8 questions, and each finished round earns a buddy
sticker for the shared sticker book.

- **Math Buddies:** counting (tap to count), more/fewer, shapes, what comes next,
  adding and taking away with buddies, make 10, teen numbers, then Grade 1–3 skills
  (missing addends, place value, comparing numbers, clocks, halves/fourths, adding and
  subtracting within 100, skip counting, coins, even/odd, arrays, multiplication, division,
  fractions, rounding, area).
- **Letter Land:** balloon-pop letters, big/little letters, beginning sounds (munch the
  cookie), rhymes, clapping syllables, sight words, reading CVC words, spelling with letter
  tiles, missing vowels, then sh/ch/th, blends, silent-e, vowel teams, fill-in-the-blank
  sentences, opposites, compound words, short stories with questions, prefixes and suffixes.

**Grown-up setup.** The first time the console opens on a device, it asks a grown-up for
the child's birthday. It works out the grade (turning 5 by Sept 1 means Kindergarten that
year), and the grown-up can correct it. Only the resulting Kindergarten school year is
saved, in this browser on this device. The birthday is not kept, it is never sent
anywhere, and it is used only to set where the learning games start. Hold the ⚙︎ on the
console for 2 s to change or erase it. If setup is skipped, the games assume Kindergarten
in 2026–27.

**Difficulty = calendar + staircase.**
- **Calendar:** the Kindergarten year comes from the grown-up setup (2026–27 for Everett). Each September 1 starts a new
  grade, and within a year the level rises about one step a month (10 steps per grade).
- **Staircase:** a transformed 3-down/1-up rule on first-try answers. Three right in a row
  makes it one step harder, and any miss makes it one step easier, which settles at about
  79% correct. Step size shrinks after reversals. It starts at early-K (level 0.5).
- **Grown-ups panel:** hold the little gear on the title screen for 1.5 s. It shows the
  grade, levels, accuracy per skill and the staircase state, and lets you shift a grade
  up or down.

## MegaMax adaptive difficulty

Fight results run a 2-down/1-up staircase that settles around a 71% win rate. Winning
with more than 70% health left counts as an instant step up, and losing badly takes an
extra step down. It changes the bad guy's smarts, health, damage, speed and fireball
rate. Level numbers, bosses and unlocks stay the same.
