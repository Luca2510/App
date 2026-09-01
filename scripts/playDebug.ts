/**
 * Phase 0 exit-criterion harness: play one full life start-to-ending using
 * only the pure engine + shipped content, no UI. Run with `npm run play:debug`.
 */
import { playDebugRun } from "../engine/debugRun";
import { createInitialState } from "../engine/gameState";
import { cards, endings, STARTING_CARD_ID } from "../content";

const result = playDebugRun(createInitialState(STARTING_CARD_ID), cards, endings);

for (const line of result.log) {
  // eslint-disable-next-line no-console
  console.log(line);
}
