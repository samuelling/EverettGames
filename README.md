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
