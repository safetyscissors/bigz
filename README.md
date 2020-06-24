# Bigz

Weekend sprint to build a game to play with friends.

![gameplay](https://github.com/safetyscissors/bigz/blob/master/playing.jpg)

## This is

Bigz. A card game that plays very similar to uno but has the benefit of
supporting > 8 players which most multiplayers suck at.
It is a basic LAMP server for playing around with long polling. The UI is rendered on canvas.

## Some learnings

- Best version of a lobby so far.
  - Creates a player and game id and saves it to localstorage to simplify refreshes.
  - When creating a lobby, creates a game instance with an explicit "lobby" state which simplifies everything.
- Saves states.
  - Bummer for memory usage but doesnt require a Host client and resilient to refreshing mid game.
- Long polling gets tons of timezone and tolerance issues when comparing js nanos db auto timestamps. Is better to just insert the js nanos when an update is made.
- The feed of cards played is a good feedback for the user in case they miss animations.

## Rules

 - Winner plays all their cards first.
 - In your turn, play a card >= the top card on the pile. If you cannot, pick up the pile.
 - After your turn, draw until you have 3 cards in your hand again or until the deck is empty.
 - Special cards
    - 💣 clears the pile.
    - ✨ lets the next player play any card.
    - ≤7 forces the next player to play a card ≤ 7.
    - * takes the value of the last played card.
