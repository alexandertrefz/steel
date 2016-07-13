declare namespace hook {
	interface IEvent {
		eventName: string
		isDefaultPrevented: boolean
		isCancelled: boolean
		isPropagationStopped: boolean
		data: Array<any>
		preventDefault(): void
		cancel(): void
		stopPropagation(): void
		hasNamespaces(): boolean
		getNamespaces(): Array<string>
		hasEventName(): boolean
		getEventName(): string
	}

	interface IEventOptions {
		eventName?: string
		isDefaultPrevented?: boolean
		isCancelled?: boolean
		isPropagationStopped?: boolean
	}

	class Event implements IEvent, IEventOptions {
		public eventName: string
		public isDefaultPrevented: boolean
		public isCancelled: boolean
		public isPropagationStopped: boolean
		public data: Array<any>
		constructor(options?: IEventOptions | string)
		public preventDefault(): void
		public cancel(): void
		public stopPropagation(): void
		public hasNamespaces(): boolean
		public getNamespaces(): Array<string>
		public hasEventName(): boolean
		public getEventName(): string
	}

	class NamespacedHandler {
		public namespaces: Array<string>
		public eventName: string
		public handler: Function
		constructor(event: IEvent, handler: Function)
		public matches(event: IEvent): boolean
	}

	class Handle {
		public events: Object
		public namespacedHandlers: Array<NamespacedHandler>
		public namespacedEvents: Array<string>
		constructor()
		protected _getEventsArr(event: IEvent): Array<Function>
		protected _splitEvent(event: IEvent, origArgs: any, methodName: string): void
		public addHandler(event: IEvent, handler: Function): void
		public removeHandler(event?: IEvent, handler?: Function): void
		public triggerHandlers(obj: any, event: IEvent, data?: Array<any>): void
	}
}

declare namespace steel {
	class EventMachine {
		public parent: EventMachine
		protected _handle: hook.Handle
		protected static _checkEvent(event: string | hook.IEvent): hook.Event
		protected _getCommandHandlers(): any
		constructor()
		public trigger(event: string | hook.IEvent, data?: any): EventMachine
		public on(event: any, handler: (event: hook.IEvent, ...args: Array<any>) => void): EventMachine
		public off(event?: string | hook.IEvent, handler?: Function): EventMachine
		public sendCommand(event: string | hook.IEvent, data?: any): EventMachine
		public onCommand(event: any, handler: (event: hook.IEvent, ...args: Array<any>) => void): EventMachine
		public offCommand(event: string | hook.IEvent, handler: any): EventMachine
		public provideHook(eventName: string, defaultHandler: any, data?: any): EventMachine
	}

	class Collection<T> extends EventMachine {
		public items: Array<T>
		public count: number
		protected _rangeDifference: Array<T>
		constructor(array?: Array<T>, cleanUpItems?: boolean)
		public indexOf(item: T): number
		public includes(item: T): boolean
		protected _addDefault(e: any, item: any, index: any): void
		public add(item: T): Collection<T>
		protected _addRangeDefault(event: hook.IEvent, item: T, index: number): void
		public addRange(items: Array<T>): Collection<T>
		protected _insertDefault(event: hook.IEvent, item: T, index: number): void
		public insert(item: T, index: number): Collection<T>
		protected _insertRangeDefault(event: hook.IEvent, item: T, index: number): void
		public insertRange(items: Array<T>, index: number): Collection<T>
		protected _removeDefault(event: hook.IEvent, item: T, index: number): void
		public remove(item: T): Collection<T>
		protected _removeAtDefault(event: hook.IEvent, item: T, index: number): void
		public removeAt(index: number): Collection<T>
		protected _removeRangeDefault(event: hook.IEvent, item: T, index: number): void
		public removeRange(from: number, to: number): Collection<T>
		protected _calculateSpliceIndex(from: number, to: number): any
		protected _calculateIndex(index: number): number
		protected _removeRange(from: number, to: number): void
		protected _removeAt(index: number): void
		protected _updateRange(): void
		protected _setDefault(event: hook.IEvent, index: number, value: T): void
		public set(index: number, value: T): boolean
		public get(index: number): T
	}

	class View extends EventMachine {
		public element: HTMLElement
		public childContainer: HTMLElement
		public components: Collection<Component>
		public component: Component
		public model: Model
		protected _handleClasses(classes: string | Array<string>): void
		constructor(options: any, model: Model, component: Component)
		protected initialize(options: any): void
		protected _createElement(): HTMLElement
		protected _createChildContainer(): HTMLElement
		public getComponentName(): string
		public hasInvalidComponents(): boolean
		public renderComponents(options?: any): View
		public render(): View
	}

	class Controller extends EventMachine {
		public component: Component
		constructor(options: any, component: Component)
		protected initialize(options: any): void
	}

	class Component extends EventMachine {
		public parent: Component
		public model: Model
		public view: View
		public controller: Controller
		public children: Collection<Component>
		public isInvalid: boolean
		protected _isRenderInProgress: boolean
		constructor(options?: any)
		protected initialize(options: any): void
		public setMany(object: any): Component
		public set(key: string, value: any): Component
		public get(key: string): any
		public invalidate(): Component
		public render(options?: any): Component
		public dispose(): void
	}

	class Model extends EventMachine {
		protected _data: any
		public component: Component
		constructor(options: any, component: Component)
		protected initialize(options: any): void
		protected _setDefaultData(options: any): void
		public setMany(object: any): void
		protected _setDefault(e: hook.IEvent, key: string, value: any): void
		public set(key: string, value: any): Model
		public get(key: string): any
	}

	function publish(event: string | hook.IEvent, data?: any): EventMachine
	function subscribe(event: any, handler: (event: hook.IEvent, ...args: Array<any>) => void): EventMachine
}
