// Publisher-subscriber relationship implementation
export interface IEventBus {
  subscribe(eventType: string, callback: Callback): CallbackId
  unsubscribe(eventType: string, callbackId: CallbackId): void
  emit(eventType: string, arg?: unknown): void
}

export interface Callback {
  (param?: any): void
}

export interface Subscriptions {
  [key: string]: {
    [key: string]: Callback
  }
}

export type CallbackId = string

export class EventBus implements IEventBus {
  private subscriptions: Subscriptions = {}
  private lastId = 0

  public subscribe(eventType: string, callback: Callback): CallbackId {
    const callbackId = this.getId()

    if (!this.subscriptions[eventType]) this.subscriptions[eventType] = {}

    this.subscriptions[eventType][callbackId] = callback

    return callbackId
  }

  public unsubscribe(eventType: string, callbackId: CallbackId): void {
    delete this.subscriptions[eventType][callbackId]
  }

  public emit(eventType: string, arg?: unknown): void {
    if (!this.subscriptions[eventType]) return

    const callbackIds: string[] = Object.keys(this.subscriptions[eventType])

    for (const callbackId of callbackIds) {
      this.subscriptions[eventType][callbackId](arg)
    }
  }

  private getId(): CallbackId {
    this.lastId += 1

    return `${this.lastId}`
  }
}
  