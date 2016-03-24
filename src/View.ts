import EventMachine from './EventMachine'
import Component from './Component'
import Model from './Model'
import Collection from './Collection'

export default class View extends EventMachine {
	element:HTMLElement
	childContainer:HTMLElement
	components:Collection<Component>
	component:Component
	model:Model

	_handleClasses(classes) {
		if (typeof classes === 'string') {
			if (~classes.indexOf(' ')) {
				classes = classes.split(' ')
			} else {
				classes = [classes]
			}
		} else if (classes == null) {
			classes = []
		}

		this.element.classList.add(...classes)
	}

	constructor(options:any = {}, model:Model, component:Component) {
		super()

		options = Object.assign({}, options)

		this.component = component

		this.model = model

		this.element = this._createElement()
		this.element.classList.add(this.getComponentName())
		this._handleClasses(options.classes)

		this.childContainer = this._createChildContainer()

		this.components = new Collection<Component>()
		this.components.on('add', (e, component, index) => {
			this.element.appendChild(component.view.element)
		})

		this.initialize(options)

		this.render()
	}

	initialize(options:any):void {

	}

	_createElement():HTMLElement {
		return document.createElement('div')
	}

	_createChildContainer() {
		return this.element
	}

	getComponentName():string {
		return 'GenericView'
	}

	hasInvalidComponents():boolean {
		let result = false

		for (let component of this.components.items) {
			if (component.isInvalid) {
				result = true
				break
			}
		}

		return result
	}

	renderComponents(options:any = {}):View {
		for (let component of this.components.items) {
			component.render({ force: options.force })
		}

		return this
	}

	render():View {
		this.renderComponents()

		return this
	}
}
