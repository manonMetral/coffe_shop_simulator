/**
 * Anything broadcast to the clients as an event. The simulation events are typed;
 * the events coming from other contexts (customers…) are only known by their type.
 */
export interface BroadcastEvent {
  readonly type: string;
}
