import EventMachine from './EventMachine'
import Component from './Component'

export default class Controller extends EventMachine {
	public component: Component

	constructor(options: any = {}, component: Component) {
		super()

		this.component = component

		this.initialize(options)
	}

	public initialize(options: any): void {
		// Fix TSLint by providing a comment :)
	}
}
