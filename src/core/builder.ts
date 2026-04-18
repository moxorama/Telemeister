import type {
  BotHandlerContext,
  BotState,
  EnterHandler,
  ResponseHandler,
  StateHandlers,
  GuardHandler,
  CommandHandler,
  CommandResult,
} from './types.js';

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
   *   .onEnter(async (context) => {
   *     await context.ctx.reply('Welcome!');
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
   * Called when the user sends any update while in this state
   *
   * Example:
   *   .onResponse(async (context) => {
   *     if (context.ctx.message?.text === 'yes') {
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

  /**
   * Set a command handler for this state (overrides global commands)
   * Called when user sends this command while in this state
   *
   * Example:
   *   .onCommand('cancel', async (context) => {
   *     await context.reply('Operation cancelled');
   *     return 'mainMenu';
   *   })
   */
  onCommand(command: string, handler: CommandHandler<TState>): this {
    const existing = this.handlers.get(this.state) || {};
    if (!existing.onCommand) {
      existing.onCommand = new Map<string, CommandHandler<TState>>();
    }
    existing.onCommand.set(command.toLowerCase(), handler);
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

  /**
   * Set a command handler for all these states (overrides global commands)
   */
  onCommand(command: string, handler: CommandHandler<TState>): this {
    for (const state of this.states) {
      const existing = this.handlers.get(state) || {};
      if (!existing.onCommand) {
        existing.onCommand = new Map<string, CommandHandler<TState>>();
      }
      existing.onCommand.set(command.toLowerCase(), handler);
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
 *   .onEnter(async (context) => {
 *     await context.ctx.reply('Welcome!');
 *     return 'menu'; // ✅ Type-safe: only 'idle' | 'welcome' | 'menu' | 'collectName' allowed
 *   })
 *   .onResponse(async (context) => {
 *     return 'collectName'; // ✅ Also type-safe
 *   });
 * ```
 *
 * @template TState - Union type of all valid states (defaults to string)
 */
export class BotBuilder<TState extends BotState = BotState> {
  private handlers = new Map<TState, StateHandlers<TState>>();
  private globalCommandHandlers = new Map<string, CommandHandler<TState>>();
  private guardHandlers: GuardHandler<TState>[] = [];

  /**
   * Register handlers for one or more states using chaining
   * @param state - State name(s) to configure
   * @returns StateBuilder for method chaining
   */
  forState(state: TState): StateBuilder<TState>;
  forState(states: TState[]): MultiStateBuilder<TState>;
  forState(state: TState | TState[]): StateBuilder<TState> | MultiStateBuilder<TState> {
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
   * Register a global command handler (works in all states unless overridden)
   * @param command - Command name without leading slash (e.g., 'start', 'help')
   * @param handler - Handler function
   * @returns this for chaining
   * @example
   *   .onCommand('start', async (context) => {
   *     await context.reply('Welcome!');
   *     return 'welcome';
   *   })
   */
  onCommand(command: string, handler: CommandHandler<TState>): this {
    this.globalCommandHandlers.set(command.toLowerCase(), handler);
    return this;
  }

  guard(handler: GuardHandler<TState>): this {
    this.guardHandlers.push(handler);
    return this;
  }

  async executeGuards(context: BotHandlerContext<TState>): Promise<boolean> {
    for (const guard of this.guardHandlers) {
      if (!(await guard(context))) return false;
    }
    return true;
  }

  /**
   * Register a command handler for a specific state (overrides global)
   * @param state - State name
   * @param command - Command name without leading slash
   * @param handler - Handler function
   * @returns this for chaining
   * @example
   *   .onCommand('cancel', 'order', async (context) => {
   *     // Only works when user is in 'order' state
   *     await context.reply('Order cancelled');
   *     return 'mainMenu';
   *   })
   */
  onCommandForState(state: TState, command: string, handler: CommandHandler<TState>): this {
    const existing = this.handlers.get(state) || {};
    if (!existing.onCommand) {
      existing.onCommand = new Map<string, CommandHandler<TState>>();
    }
    existing.onCommand.set(command.toLowerCase(), handler);
    this.handlers.set(state, existing);
    return this;
  }

  /**
   * Execute the onEnter handler for a given state
   * @internal Called by the bot handlers
   * @returns The next state to transition to (if any), or void
   */
  async executeOnEnter(state: TState, context: BotHandlerContext<TState>): Promise<TState | void> {
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
    context: BotHandlerContext<TState>
  ): Promise<TState | void> {
    const handlers = this.handlers.get(state);
    const handler = handlers?.onResponse;
    if (handler) {
      return await handler(context);
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

  /**
   * Execute a command handler
   * @internal Called by the bot handlers
   * @returns CommandResult indicating if command was handled and next state
   *
   * Priority order:
   * 1. State-specific command handler (if exists)
   * 2. Global command handler (if exists)
   * 3. None - let state onResponse handle it
   */
  async executeCommand(
    command: string,
    currentState: TState,
    context: BotHandlerContext<TState>
  ): Promise<CommandResult<TState>> {
    const normalizedCommand = command.toLowerCase();

    // First check for state-specific command handler
    const stateHandlers = this.handlers.get(currentState);
    const stateCommandHandler = stateHandlers?.onCommand?.get(normalizedCommand);
    if (stateCommandHandler) {
      const result = await stateCommandHandler(context);
      return this.normalizeCommandResult(result);
    }

    // Fall back to global command handler
    const globalHandler = this.globalCommandHandlers.get(normalizedCommand);
    if (globalHandler) {
      const result = await globalHandler(context);
      return this.normalizeCommandResult(result);
    }

    // No handler found
    return { handled: false };
  }

  /**
   * Normalize command handler return value to CommandResult
   */
  private normalizeCommandResult(
    result: CommandResult<TState> | TState | void
  ): CommandResult<TState> {
    if (result === undefined || result === null) {
      // Handler returned void - treat as handled with no state change
      return { handled: true };
    }
    if (typeof result === 'object' && 'handled' in result) {
      // Already a CommandResult
      return result as CommandResult<TState>;
    }
    // Handler returned a state string - treat as handled with state transition
    return { handled: true, nextState: result as TState };
  }

  /**
   * Check if a command has a registered handler (global or for specific state)
   */
  hasCommandHandler(command: string, state?: TState): boolean {
    const normalizedCommand = command.toLowerCase();

    if (state) {
      const stateHandlers = this.handlers.get(state);
      if (stateHandlers?.onCommand?.has(normalizedCommand)) {
        return true;
      }
    }

    return this.globalCommandHandlers.has(normalizedCommand);
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
  GuardHandler,
  CommandHandler,
  CommandResult,
} from './types.js';
