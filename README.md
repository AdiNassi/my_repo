# Bubble Trouble

Browser arcade game with Hebrew UI, customizable classroom, space and magic themes, and local cooperative play.

## Play

https://adinassi.github.io/my_repo/

Choose a preset or independently select the background, hero, projectile and targets before starting.

Solo: arrows or A/D to move, Space to fire. Touch controls are available.

Two players on one keyboard: P1 uses arrows and Space; P2 uses A/D and W. Three lives and score are shared.

P pauses. The help button pauses active play and restores it when closed. Design selection begins a new round.

## Files and deployment

The repository root contains index.html, game.js and style.css. GitHub Pages publishes master at the root. When JS or CSS changes, update the asset content hashes in index.html to avoid stale browser caches.

## Tests

Run node tests/game.test.cjs. Tests cover cooperative movement and shooting, help pause/resume, 27 visual combinations and solo reset.
