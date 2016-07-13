import EventMachine from './EventMachine'
import Component from './Component'
import Model from './Model'
import Collection from './Collection'

export default class View extends EventMachine {
	public element: HTMLElement
	public childContainer: HTMLElement
	public components: Collection<Component>
	public component: Component
	public model: Model

	protected _handleClasses(classes: string | Array<string>): void {
		let classArray: Array<string>

		if (classes == null) {
			classArray = []
		} else {
			if (typeof classes === 'string') {
				if (~classes.indexOf(' ')) {
					classArray = classes.split(' ')
				} else {
					classArray = [classes]
				}
			} else {
				classArray = classes
			}
		}

		classArray = classArray.filter((value, index, arr) => {
			return value !== ''
		})

		this.element.classList.add(...classArray)
	}

	constructor(options: any = {}, model: Model, component: Component) {
		super()

		options = (Object as any).assign({}, options)

		this.component = component

		this.model = model

		this.element = this._createElement()
		this.element.classList.add(this.getComponentName())
		this._handleClasses(options.classes)

		this.childContainer = this._createChildContainer()

		this.components = new Collection<Component>()
		this.components.on('add', (e, newComponent, index) => {
			this.element.appendChild(newComponent.view.element)
		})

		this.initialize(options)

		this.render()
	}

	protected initialize(options: any): void {
		// Fix TSLint by providing a comment :)
	}

	protected _getCommandHandlers(): any {
		return {}
	}

	protected _createElement(): HTMLElement {
		return document.createElement('div')
	}

	protected _createChildContainer(): HTMLElement {
		return this.element
	}

	public addClasses(classes: Array<string> | string): View {
		if (typeof classes === 'string') {
			classes = classes.trim().split(' ')
		}

		this.element.classList.add(...classes)
		return this
	}

	public removeClasses(classes: Array<string> | string): View {
		if (typeof classes === 'string') {
			classes = classes.trim().split(' ')
		}

		this.element.classList.remove(...classes)
		return this
	}

	public getComponentName(): string {
		return 'GenericView'
	}

	public hasInvalidComponents(): boolean {
		let result = false

		for (let component of this.components.items) {
			if (component.isInvalid) {
				result = true
				break
			}
		}

		return result
	}

	public renderComponents(options: any = {}): View {
		for (let component of this.components.items) {
			component.render({ force: options.force })
		}

		return this
	}

	public render(): View {
		this.renderComponents()

		return this
	}
}
