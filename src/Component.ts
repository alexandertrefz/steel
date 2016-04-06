import { Collection } from './Collection'
import { EventMachine } from './EventMachine'
import { Model } from './Model'
import { View } from './View'
import { Controller } from './Controller'

export class Component extends EventMachine {
	public parent: Component
	public model: Model
	public view: View
	public controller: Controller
	public children: Collection<Component>

	public isInvalid: boolean
	private _isRenderInProgress: boolean

	constructor(options: any = {}) {
		super()

		this.children = new Collection<Component>()

		this.children.on('add', (e, item) => {
			item.parent = this
			this.view.childContainer.appendChild(item.view.element)
			item.trigger('gotAdded')
		})

		this.children.on('remove', (e, item) => {
			item.parent = null
			this.view.childContainer.removeChild(item.view.element)
			item.trigger('gotRemoved')
		})

		this.initialize(options)
	}

	public initialize(options: any): void {
		this.model = new Model({}, this)
		this.view = new View({}, this.model, this)
		this.controller = new Controller({}, this)
	}

	public setMany(object: any): Component {
		this.model.setMany(object)
		return this
	}

	public set(key: string, value: any): Component {
		this.model.set(key, value)
		return this
	}

	public get(key: string): any {
		return this.model.get(key)
	}

	public invalidate(): Component {
		this.isInvalid = true
		this.trigger('invalidation')

		return this
	}

	public render(options: any = {}): Component {
		let forceRenderComponents
		this._isRenderInProgress = true

		if (this.isInvalid || options.force) {
			this.view.render()
		}

		if (this.view.hasInvalidComponents()) {
			forceRenderComponents = true
		} else {
			forceRenderComponents = false
		}

		this.view.renderComponents({ force: forceRenderComponents })

		for (let child of this.children.items) {
			child.render()
		}

		this.isInvalid = false
		this._isRenderInProgress = false
		return this
	}

	public dispose(): void {
		// TODO: Dispose View
		// TODO: Dispose Model
		// TODO: Dispose Controller
		// TODO: Make dispose hookable
		for (let child of this.children.items) {
			child.dispose()
		}

		if (this.parent != null) {
			this.parent.children.remove(this)
		}

		this.off()

		return null
	}
}
