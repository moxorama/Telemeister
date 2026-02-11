import type {
  BotHandlerContext,
  BotState,
  EnterHandler,
  ResponseHandler,
  StateHandlers,
} from "./types";

/**
 * State Builder - Fluent API for configuring a single state
 *
 * @template TState - Union type of all valid states
 */
class StateBuilder<TState extends BotState = BotState> {
  private state: TState;
  private handlers: Map<TState, StateHandlers<TState>>;

  constructor(state: TState, handlers: Map<TState, StateHandlers<TState>>) {
    this.state = state;
    this.handlers = handlers;
  }

  /**
   * Set the onEnter handler for this state
   * Called when the user enters this state
   * Can optionally return a state name to immediately transition to
   *
   * Example:
   *   .onEnter(async (ctx) => {
   *     await ctx.send('Welcome!');
   *     // Optionally transition immediately:
   *     return 'anotherState';
   *   })
   */
  onEnter(handler: EnterHandler<TState>): this {
    const existing = this.handlers.get(this.state) || {};
    existing.onEnter = handler;
    this.handlers.set(this.state, existing);
    return this;
  }

  /**
   * Set the onResponse handler for this state
   * Called when the user sends a message while in this state
   *
   * Example:
   *   .onResponse(async (ctx, response) => {
   *     if (response === 'yes') {
   *       return 'confirmed';
   *     }
   *     return 'cancelled';
   *   })
   */
  onResponse(handler: ResponseHandler<TState>): this {
    const existing = this.handlers.get(this.state) || {};
    existing.onResponse = handler;
    this.handlers.set(this.state, existing);
    return this;
  }
}

/**
 * Multi-State Builder - Registers handlers for multiple states at once
 *
 * @template TState - Union type of all valid states
 */
class MultiStateBuilder<TState extends BotState = BotState> {
  private states: TState[];
  private handlers: Map<TState, StateHandlers<TState>>;

  constructor(states: TState[], handlers: Map<TState, StateHandlers<TState>>) {
    this.states = states;
    this.handlers = handlers;
  }

  onEnter(handler: EnterHandler<TState>): this {
    for (const state of this.states) {
      const existing = this.handlers.get(state) || {};
      existing.onEnter = handler;
      this.handlers.set(state, existing);
    }
    return this;
  }

  onResponse(handler: ResponseHandler<TState>): this {
    for (const state of this.states) {
      const existing = this.handlers.get(state) || {};
      existing.onResponse = handler;
      this.handlers.set(state, existing);
    }
    return this;
  }
}

/**
 * Bot Builder - Main API for registering state handlers
 *
 * For type-safe state returns, define your states as a union type:
 *
 * @example
 * ```typescript
 * // Define your states
 * type MyStates = 'idle' | 'welcome' | 'menu' | 'collectName';
 *
 * // Create typed builder
 * const typedBuilder = botBuilder as BotBuilder<MyStates>;
 *
 * typedBuilder
 *   .forState('welcome')
 *   .onEnter(async (ctx) => {
 *     await ctx.send('Welcome!');
 *     return 'menu'; // ✅ Type-safe: only 'idle' | 'welcome' | 'menu' | 'collectName' allowed
 *   })
 *   .onResponse(async (ctx, response) => {
 *     return 'collectName'; // ✅ Also type-safe
 *   });
 * ```
 *
 * @template TState - Union type of all valid states (defaults to string)
 */
export class BotBuilder<TState extends BotState = BotState> {
  private handlers = new Map<TState, StateHandlers<TState>>();

  /**
   * Register handlers for one or more states using chaining
   * @param state - State name(s) to configure
   * @returns StateBuilder for method chaining
   */
  forState(state: TState): StateBuilder<TState>;
  forState(states: TState[]): MultiStateBuilder<TState>;
  forState(
    state: TState | TState[],
  ): StateBuilder<TState> | MultiStateBuilder<TState> {
    if (Array.isArray(state)) {
      return new MultiStateBuilder(state, this.handlers);
    }
    return new StateBuilder(state, this.handlers);
  }

  /**
   * Register an onEnter handler for a state
   * @param state - State name
   * @param handler - Handler function
   * @returns this for chaining
   */
  onEnter(state: TState, handler: EnterHandler<TState>): this {
    const existing = this.handlers.get(state) || {};
    existing.onEnter = handler;
    this.handlers.set(state, existing);
    return this;
  }

  /**
   * Register an onResponse handler for a state
   * @param state - State name
   * @param handler - Handler function
   * @returns this for chaining
   */
  onResponse(state: TState, handler: ResponseHandler<TState>): this {
    const existing = this.handlers.get(state) || {};
    existing.onResponse = handler;
    this.handlers.set(state, existing);
    return this;
  }

  /**
   * Execute the onEnter handler for a given state
   * @internal Called by the bot handlers
   * @returns The next state to transition to (if any), or void
   */
  async executeOnEnter(
    state: TState,
    context: BotHandlerContext<TState>,
  ): Promise<TState | void> {
    const handlers = this.handlers.get(state);
    const handler = handlers?.onEnter;
    if (handler) {
      return await handler(context);
    }
  }

  /**
   * Execute the onResponse handler for a given state
   * @internal Called by the bot handlers
   * @returns The next state to transition to, or void
   */
  async executeOnResponse(
    state: TState,
    context: BotHandlerContext<TState>,
    response: string,
  ): Promise<TState | void> {
    const handlers = this.handlers.get(state);
    const handler = handlers?.onResponse;
    if (handler) {
      return await handler(context, response);
    }
  }

  /**
   * Check if a state has an onEnter handler
   */
  hasOnEnter(state: TState): boolean {
    return !!this.handlers.get(state)?.onEnter;
  }

  /**
   * Check if a state has an onResponse handler
   */
  hasOnResponse(state: TState): boolean {
    return !!this.handlers.get(state)?.onResponse;
  }

  /**
   * Get all registered state names
   */
  getRegisteredStates(): TState[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get handlers for a specific state
   */
  getHandlers(state: TState): StateHandlers<TState> | undefined {
    return this.handlers.get(state);
  }
}

/**
 * Global bot builder instance (untyped - accepts any string state)
 *
 * For type safety, cast to BotBuilder<YourStateUnion>:
 * ```typescript
 * const typedBuilder = botBuilder as BotBuilder<'idle' | 'welcome' | 'menu'>;
 * ```
 */
export const botBuilder = new BotBuilder();

// Re-export types for convenience
export type {
  BotHandlerContext,
  BotState,
  EnterHandler,
  ResponseHandler,
} from "./types";
