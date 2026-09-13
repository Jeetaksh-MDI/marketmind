# MarketMind behavioral model

MarketMind is deliberately **not** a clinical personality test. It is an explainable educational model that infers scenario-based tendencies from revealed choices inside a short economic simulation.

## Latent trait vector

The engine maintains eight scores from 0–100:

1. Risk appetite
2. Loss sensitivity
3. Patience
4. Independent thinking
5. Competitive drive
6. Social orientation
7. Value discipline
8. Sunk-cost resistance

Each scenario contributes one or more weighted observations. A final trait score is the weighted mean of all evidence collected for that trait.

## Confidence

Confidence rises with the amount of evidence and falls when the evidence is internally inconsistent. It is intentionally a heuristic confidence indicator, not a statistical confidence interval.

## Exhaustive interpretation bands

Every possible 0–100 score maps to one and only one range:

- 0–20: Very low
- 21–40: Low
- 41–60: Balanced
- 61–80: High
- 81–100: Very high

Each trait contains text for all five bands, so no valid result can fall through to an undefined interpretation.

## Archetype assignment

Eight archetypes are represented as ideal eight-dimensional vectors. The user is assigned to the archetype with the smallest Euclidean distance from their final vector.

This is smoother than chained `if/else` thresholds: a one-point change cannot abruptly flip a user into an unrelated type solely because a hard boundary was crossed.

Archetypes:

- Strategic Optimizer
- Bold Builder
- Security Architect
- Independent Contrarian
- Cooperative Strategist
- Adaptive Opportunist
- Calculated Explorer
- Consistent Planner

## Why outcomes and personality are separate

A player can make a sound decision and receive a bad simulated outcome, or make a weak decision and get lucky. Trait inference is primarily based on the **decision**, not whether the random market outcome happened to reward it.

Random outcomes use a seeded pseudo-random generator, making each session internally reproducible.

## Error handling and safety

- Numeric inputs are clamped to scenario bounds.
- Range controls prevent invalid allocations.
- Double submissions are locked.
- Money formatting never exposes `NaN` or `Infinity`.
- Game state is saved after each committed round.
- Network analytics failures never block gameplay.
- If tracking is not configured, the public game still works fully.
- Profile wording uses “suggests”, “showed” and “in these scenarios”; it does not claim diagnosis.
