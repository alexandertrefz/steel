/// <reference path="../typings/main.d.ts" />

export class EventMachine {
	public parent: EventMachine
	private _handle: hook.Handle

	private static _checkEvent(event: string | hook.IEvent): hook.Event {
		let eventObj: hook.Event
		if (typeof event === 'string' || !(event instanceof hook.Event)) {
			eventObj = new hook.Event(event)
		} else {
			eventObj = event
		}

		return eventObj
	}

	protected _getCommandHandlers(): any {
		return {}
	}

	constructor() {
		this._handle = new hook.Handle()

		let commandHandlers = this._getCommandHandlers()
		for (let command in commandHandlers) {
			if (commandHandlers.hasOwnProperty(command)) {
				this.onCommand(command, this[commandHandlers[command]])
			}
		}
	}

	public trigger(event: string | hook.IEvent, data?: any): EventMachine {
		let eventObj = EventMachine._checkEvent(event)
		this._handle.triggerHandlers(this, eventObj, data)

		if (this.parent != null && !eventObj.isPropagationStopped) {
			this.parent.trigger(eventObj, data)
		}

		return this
	}

	public on(event: string | hook.Event, handler: (event: hook.IEvent, ...args: Array<any>) => void): EventMachine {
		let key, value

		if (typeof event === 'object' && event.eventName == null) {
			for (key in event) {
				if (event.hasOwnProperty(key)) {
					value = event[key]
					this.on(key, value)
				}
			}

			return this
		}

		event = EventMachine._checkEvent(event)
		this._handle.addHandler(event, handler)

		return this
	}

	public off(event?: string | hook.IEvent, handler?: Function): EventMachine {
		let eventObj = EventMachine._checkEvent(event)
		this._handle.removeHandler(eventObj, handler)

		return this
	}

	public sendCommand(event: string | hook.IEvent, data?: any): EventMachine {
		// TODO: Output to console whenever an event gets triggered with no listeners
		let eventObj = EventMachine._checkEvent(event)
		eventObj.eventName = 'command.' + eventObj.eventName
		this.trigger(eventObj, data)
		return this
	}

	public onCommand(event: string | hook.IEvent, handler: (event: hook.IEvent, ...args: Array<any>) => void): EventMachine {
		let key, value

		if (typeof event === 'object' && event.eventName == null) {
			for (key in event) {
				if (event.hasOwnProperty(key)) {
					value = event[key]
					this.onCommand(key, value)
				}
			}

			return this
		}

		let eventObj = EventMachine._checkEvent(event)
		eventObj.eventName = 'command.' + eventObj.eventName
		this._handle.addHandler(eventObj, handler)

		return this
	}

	public offCommand(event: string | hook.IEvent, handler: Function): EventMachine {
		let eventObj = EventMachine._checkEvent(event)
		eventObj.eventName = 'command.' + eventObj.eventName
		this._handle.removeHandler(eventObj, handler)

		return this
	}

	public provideHook(eventName: string, defaultHandler: Function, data?: any): EventMachine {
		let afterEvent, beforeEvent, capitalizedEventName, event

		if (data == null) {
			data = []
		}

		capitalizedEventName = eventName[0].toUpperCase() + eventName.slice(1)
		beforeEvent = new hook.Event('before' + capitalizedEventName)

		this.trigger(beforeEvent, data)

		event = Object.assign({}, beforeEvent)
		event.eventName = eventName

		if (!(event.isCancelled || event.isDefaultPrevented)) {
			defaultHandler.call(this, ...[event, ...event.data])
		}

		// event might have been changed by defaultHandler
		if (!event.isCancelled) {
			this.trigger(event, event.data)
		}

		// event might have been changed by handlers
		if (!event.isCancelled) {
			afterEvent = Object.assign({}, event)
			afterEvent.eventName = 'after' + capitalizedEventName
			this.trigger(afterEvent, afterEvent.data)
		}

		return this
	}
}
