/// <reference path="../typings/main.d.ts" />

import EventMachine from './EventMachine'
import Component from './Component'

export default class Model extends EventMachine {
	protected _data: any
	public component: Component

	constructor(options: any = {}, component: Component) {
		super()

		this.component = component

		this._data = {}

		let propertyFilters = this._getPropertyFilters(options)
		this.on('beforeSet', (e, key, value) => {
			if (!~propertyFilters.indexOf(key)) {
				e.cancel()
			}

			if (value === undefined) {
				e.cancel()
			}
		})

		this._setDefaultData(options)
		this.initialize(options)
	}

	public initialize(options: any): void {
		// Fix TSLint by providing a comment :)
	}

	protected _getPropertyFilters(options: any): Array<string> {
		return []
	}

	protected _setDefaultData(options: any): void {
		this.setMany(options)
	}

	public setMany(object: any): void {
		for (let key in object) {
			if (object.hasOwnProperty(key)) {
				this.set(key, object[key])
			}
		}
	}

	private _setDefault(e: hook.IEvent, key: string, value: any): void {
		this._data[key] = value
	}

	public set(key: string, value: any): Model {
		this.provideHook('set', this._setDefault, [key, value])
		return this
	}

	public get(key: string): any {
		return this._data[key]
	}
}
