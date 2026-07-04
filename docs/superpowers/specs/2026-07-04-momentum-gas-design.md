# Momentum Gas Design

**Goal:** Keep the rider auto-accelerating through clean downhill momentum, with gas acting as an additive boost that preserves gained speed when the tank runs out.

**Design:** Clean grounded riding continues to raise speed toward the normal maximum. Gas fills only while coasting cleanly, burns only from explicit accelerate input, and adds acceleration on top of the current speed instead of clamping the rider to the old low pedal ceiling. Obstacle hits remain the punishment path: they reset gas/clean streak and can reduce speed.

**Testing:** Update the input contract test so it rejects the old `PEDAL_CAP` speed ceiling and asserts a `GAS_BOOST_CAP` tied to `MAX_SPEED`, plus the gas boost update path that preserves momentum.
