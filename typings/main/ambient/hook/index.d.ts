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
		data:any
		constructor(options?:IEventOptions|string)
		preventDefault():void
		cancel():void
		stopPropagation():void
		hasNamespaces():boolean
		getNamespaces():string[]
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
		protected _getEventsArr(event:IEvent):Array<Function>|undefined
		protected _splitEvent(event:IEvent, origArgs:any, methodName:string):void
		addHandler(event:IEvent, handler:Function):void
		removeHandler(event?:IEvent, handler?:Function):void
		triggerHandlers(obj:any, event:IEvent, data?:Array<any>):void
	}
}
