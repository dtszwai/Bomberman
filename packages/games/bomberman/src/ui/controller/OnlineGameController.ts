import {
  BaseGameController,
  GameControllerConfig,
  RenderInput,
} from "./BaseGameController";
import { Tile } from "@arcade/realtime-core";
import {
  ServerClockOffset,
  findInterpolationPair,
  lerpPosition,
} from "@arcade/netcode";
import {
  GameEvent,
  GameResyncSnapshot,
  GameSnapshot,
  PowerupSnapshot,
} from "../../sim/types";
import { ExplosionSnapshot } from "../../sim/entities/Explosion";
import { FlameCell } from "../../sim/types";

export interface OnlineGameControllerConfig extends GameControllerConfig {
  getBuffer: () => readonly GameSnapshot[];
  getEvents: () => GameEvent[];
  getResync: () => (
    | (GameResyncSnapshot & { snapshot: GameSnapshot })
    | undefined
  );
}

/** Time (ms) we render behind the latest server snapshot so there's always
 *  a "next" sample to interpolate toward. 80 ms covers a dropped packet at
 *  30 Hz with margin. */
const INTERP_DELAY_MS = 80;

interface ActiveExplosion {
  id: number;
  cell: Tile;
  flameCells: FlameCell[];
  startedAt: number;
  durationMs: number;
}

interface InFlightDestruction {
  cell: Tile;
  destroyedAt: number;
  durationMs: number;
}

const cellKey = (cell: Tile) => `${cell.row},${cell.column}`;

export class OnlineGameController extends BaseGameController {
  private getBuffer: () => readonly GameSnapshot[];
  private getEvents: () => GameEvent[];
  private getResync: OnlineGameControllerConfig["getResync"];
  private animationFrameId: number | null = null;
  private readonly clockOffset = new ServerClockOffset();

  // Event-sourced client state.
  private destroyedCells = new Map<string, Tile>();
  private blockDestructions = new Map<string, InFlightDestruction>();
  private explosions = new Map<number, ActiveExplosion>();
  private powerups = new Map<number, PowerupSnapshot>();
  /** Object identity of the last resync we hydrated from. */
  private lastAppliedResync: unknown = null;

  constructor(config: OnlineGameControllerConfig) {
    super(config);
    this.getBuffer = config.getBuffer;
    this.getEvents = config.getEvents;
    this.getResync = config.getResync;
  }

  public override setRoundData(
    payload: Parameters<BaseGameController["setRoundData"]>[0]
  ) {
    super.setRoundData(payload);
    this.destroyedCells.clear();
    this.blockDestructions.clear();
    this.explosions.clear();
    this.powerups.clear();
    this.lastAppliedResync = null;
  }

  public start(): void {
    this.animationFrameId ??= window.requestAnimationFrame(this.frame);
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.cleanup();
  }

  private frame = () => {
    this.animationFrameId = window.requestAnimationFrame(this.frame);

    this.applyResync();
    this.drainEvents();

    const buffer = this.getBuffer();
    if (buffer.length === 0) return;

    const latest = buffer[buffer.length - 1];
    this.clockOffset.sample(latest.timestamp);

    const serverNow = this.clockOffset.now();
    const renderAt = serverNow - INTERP_DELAY_MS;
    const interpolated = this.interpolate(buffer, renderAt);

    this.pruneExplosions(serverNow);
    this.pruneBlockDestructions(serverNow);

    this.update(this.buildRenderInput(interpolated));
  };

  private applyResync() {
    const resync = this.getResync();
    if (!resync || resync === this.lastAppliedResync) return;
    this.lastAppliedResync = resync;

    this.destroyedCells.clear();
    this.blockDestructions.clear();
    this.explosions.clear();
    this.powerups.clear();

    for (const cell of resync.destroyedBlockCells) {
      this.destroyedCells.set(cellKey(cell), cell);
    }
    for (const e of resync.explosions) {
      this.explosions.set(e.id, e);
    }
    for (const p of resync.powerups) {
      this.powerups.set(p.id, p);
    }
    // `deadPlayerIds` — player state already encodes DEATH via `currentState`.
    // Kept on the wire for future HUD / replay needs.
  }

  private drainEvents() {
    const events = this.getEvents();
    if (events.length === 0) return;
    for (const e of events) this.applyEvent(e);
    events.length = 0;
  }

  private applyEvent(event: GameEvent) {
    switch (event.kind) {
      case "bomb:placed":
        // Presence in wire snapshot handles rendering; event reserved for
        // audio cues / replay.
        break;
      case "bomb:exploded":
        this.explosions.set(event.id, {
          id: event.id,
          cell: event.cell,
          flameCells: event.flameCells,
          startedAt: event.startedAt,
          durationMs: event.durationMs,
        });
        break;
      case "block:destroyed": {
        const key = cellKey(event.cell);
        this.blockDestructions.set(key, {
          cell: event.cell,
          destroyedAt: event.destroyedAt,
          durationMs: event.durationMs,
        });
        // Mark tilemap reconciliation after destruction completes. The
        // destroyedCells set drives floor conversion in BaseGameController.
        // We add the cell immediately so repeated flames don't re-trigger
        // animation on a now-floor cell.
        this.destroyedCells.set(key, event.cell);
        break;
      }
      case "powerup:spawned":
        this.powerups.set(event.id, {
          id: event.id,
          cell: event.cell,
          type: event.type,
        });
        break;
      case "powerup:collected":
        this.powerups.delete(event.id);
        break;
      case "player:died":
        // Player state in snapshot already encodes DEATH via `currentState`.
        break;
    }
  }

  private pruneExplosions(serverNow: number) {
    for (const [id, e] of this.explosions) {
      if (serverNow >= e.startedAt + e.durationMs) this.explosions.delete(id);
    }
  }

  private pruneBlockDestructions(serverNow: number) {
    for (const [key, d] of this.blockDestructions) {
      if (serverNow >= d.destroyedAt + d.durationMs) {
        this.blockDestructions.delete(key);
      }
    }
  }

  private buildRenderInput(snapshot: GameSnapshot): RenderInput {
    return {
      snapshot,
      destroyedCells: [...this.destroyedCells.values()],
      blockDestructions: [...this.blockDestructions.values()].map((d) => ({
        cell: d.cell,
        destroyedAt: d.destroyedAt,
      })),
      bombs: snapshot.bombs.map((b) => ({ cell: b.cell, placedAt: b.placedAt })),
      explosions: [...this.explosions.values()].map<ExplosionSnapshot>((e) => ({
        id: e.id,
        cell: e.cell,
        flameCells: e.flameCells,
        startedAt: e.startedAt,
        durationMs: e.durationMs,
      })),
      powerups: {
        powerups: [...this.powerups.values()].map((p) => ({
          cell: p.cell,
          type: p.type,
        })),
      },
    };
  }

  private interpolate(
    buffer: readonly GameSnapshot[],
    renderAt: number
  ): GameSnapshot {
    const { prev, next, t } = findInterpolationPair(buffer, renderAt);
    if (!prev) return next ?? buffer[0];
    if (!next) return prev;

    return {
      ...next,
      players: next.players.map((n) => {
        const p = prev.players.find((pp) => pp.id === n.id);
        if (!p) return n;
        return { ...n, position: lerpPosition(p.position, n.position, t) };
      }),
    };
  }
}
