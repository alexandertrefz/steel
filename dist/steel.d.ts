declare namespace hook {
	interface IEvent {
		eventName:string
		isDefaultPrevented:boolean
		isCancelled:boolean
		isPropagationStopped:boolean
		data:Array<any>
		preventDefault():void
		cancel():void
		stopPropagation():void
		hasNamespaces():boolean
		getNamespaces():Array<string>
		hasEventName():boolean
		getEventName():string
	}

	interface IEventOptions {
		eventName?:string
		isDefaultPrevented?:boolean
		isCancelled?:boolean
		isPropagationStopped?:boolean
	}

	class Event implements IEvent, IEventOptions {
		eventName:string
		isDefaultPrevented:boolean
		isCancelled:boolean
		isPropagationStopped:boolean
		data:Array<any>
		constructor(options?:IEventOptions | string)
		preventDefault():void
		cancel():void
		stopPropagation():void
		hasNamespaces():boolean
		getNamespaces():Array<string>
		hasEventName():boolean
		getEventName():string
	}

	class NamespacedHandler {
		namespaces:Array<string>
		eventName:string
		handler:Function
		constructor(event:IEvent, handler:Function)
		matches(event:IEvent):boolean
	}

	class Handle {
		events:Object
		namespacedHandlers:Array<NamespacedHandler>
		namespacedEvents:Array<string>
		constructor()
		_getEventsArr(event:IEvent):Array<Function>
		_splitEvent(event:IEvent, origArgs:any, methodName:string):void
		addHandler(event:IEvent, handler:Function):void
		removeHandler(event?:IEvent, handler?:Function):void
		triggerHandlers(obj:any, event:IEvent, data?:Array<any>):void
	}
}

declare namespace steel {
	class EventMachine {
		parent:EventMachine
		_handle:hook.Handle
		static _checkEvent(event:string | hook.IEvent):hook.Event
		_getCommandHandlers():{}
		constructor()
		trigger(event:string | hook.IEvent, data?:any):EventMachine
		on(event:any, handler:(event:hook.IEvent, ...args:Array<any>) => void):EventMachine
		off(event?:string | hook.IEvent, handler?:Function):EventMachine
		sendCommand(event:string | hook.IEvent, data?:any):EventMachine
		onCommand(event:any, handler:(event:hook.IEvent, ...args:Array<any>) => void):EventMachine
		offCommand(event:string | hook.IEvent, handler:any):EventMachine
		provideHook(eventName:string, defaultHandler:any, data?:any):EventMachine
	}

	class Collection<T> extends EventMachine {
		items:Array<T>
		count:number
		_rangeDifference:Array<T>
		constructor(array?:Array<T>, cleanUpItems?:boolean)
		indexOf(item:T):number
		includes(item:T):boolean
		_addDefault(e:any, item:any, index:any):void
		add(item:T):Collection<T>
		_addRangeDefault(event:hook.IEvent, item:T, index:number):void
		addRange(items:Array<T>):Collection<T>
		_insertDefault(event:hook.IEvent, item:T, index:number):void
		insert(item:T, index:number):Collection<T>
		_insertRangeDefault(event:hook.IEvent, item:T, index:number):void
		insertRange(items:Array<T>, index:number):Collection<T>
		_removeDefault(event:hook.IEvent, item:T, index:number):void
		remove(item:T):Collection<T>
		_removeAtDefault(event:hook.IEvent, item:T, index:number):void
		removeAt(index:number):Collection<T>
		_removeRangeDefault(event:hook.IEvent, item:T, index:number):void
		removeRange(from:number, to:number):Collection<T>
		_calculateSpliceIndex(from:number, to:number):any
		_calculateIndex(index:number):number
		_removeRange(from:number, to:number):void
		_removeAt(index:number):void
		_updateRange():void
		_setDefault(event:hook.IEvent, index:number, value:T):void
		set(index:number, value:T):boolean
		get(index:number):T
	}

	class View extends EventMachine {
		element:HTMLElement
		childContainer:HTMLElement
		components:Collection<Component>
		component:Component
		model:Model
		_handleClasses(classes:any):void
		constructor(options:any, model:Model, component:Component)
		initialize(options:any):void
		_createElement():HTMLElement
		_createChildContainer():HTMLElement
		getComponentName():string
		hasInvalidComponents():boolean
		renderComponents(options?:any):View
		render():View
	}

	class Controller extends EventMachine {
		component:Component
		constructor(options:any, component:Component)
		initialize(options:any):void
	}

	class Component extends EventMachine {
		parent:Component
		model:Model
		view:View
		controller:Controller
		children:Collection<Component>
		isInvalid:boolean
		_isRenderInProgress:boolean
		constructor(options?:any)
		initialize(options:any):void
		setMany(object:any):Component
		set(key:string, value:any):Component
		get(key:string):any
		invalidate():Component
		render(options?:any):Component
		dispose():void
	}

	class Model extends EventMachine {
		_data:any
		component:Component
		constructor(options:any, component:Component)
		initialize(options:any):void
		_setDefaultData(options:any):void
		setMany(object:any):void
		_setDefault(e:hook.IEvent, key:string, value:any):void
		set(key:string, value:any):Model
		get(key:string):any
	}

	function publish(event:string | hook.IEvent, data?:any):EventMachine
	function subscribe(event:any, handler:(event:hook.IEvent, ...args:Array<any>) => void):EventMachine
}