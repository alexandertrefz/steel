/// <reference path="../typings/main.d.ts" />

import { EventMachine } from './EventMachine'

// TODO: Implement _rangeDifference for removals
export class Collection<T> extends EventMachine {
	public items: Array<T>
	public count: number
	private _rangeDifference: Array<T>

	constructor(array: Array<T> = [], cleanUpItems: boolean = false) {
		super()

		if (cleanUpItems) {
			array = array.filter((value) => value !== undefined)
		}

		this.items = array
		this._updateRange()
	}

	/* Make Collection behave like an array, in ES6 environments
	[Symbol.iterator]() {
		return this.items[Symbol.iterator]()
	}
	//*/

	public indexOf(item: T): number {
		return this.items.indexOf(item)
	}

	public includes(item: T): boolean {
		return !!~this.items.indexOf(item)
	}

	protected _addDefault(e: hook.Event, item: any, index: number): void {
		this.items.push(item)
		this._updateRange()
	}

	public add(item: T): Collection<T> {
		this.provideHook('add', this._addDefault, [item, this.count])
		return this
	}

	protected _addRangeDefault(event: hook.IEvent, item: T, index: number): void {
		this.items.push(item)
		this._rangeDifference.push(item)
		this._updateRange()
	}

	public addRange(items: Array<T>): Collection<T> {
		let item, i, count, newIndex
		count = this.count

		this._rangeDifference = []

		for (i = 0; i < items.length; i++) {
			item = items[i]
			newIndex = count + i
			this.provideHook('add', this._addRangeDefault, [item, newIndex])
		}

		this.trigger('rangeAdded', [this._rangeDifference, count])

		return this
	}

	protected _insertDefault(event: hook.IEvent, item: T, index: number): void {
		this.items.splice(index, 0, item)
		this._updateRange()
	}

	public insert(item: T, index: number): Collection<T> {
		this.provideHook('add', this._insertDefault, [item, index])
		return this
	}

	protected _insertRangeDefault(event: hook.IEvent, item: T, index: number): void {
		this.items.splice(index, 0, item)
		this._rangeDifference.push(item)
		this._updateRange()
	}

	public insertRange(items: Array<T>, index: number): Collection<T> {
		let item, i, initialIndex

		initialIndex = index
		this._rangeDifference = []

		for (i = 0; i < items.length; i++) {
			item = items[i]
			this.provideHook('add', this._insertRangeDefault, [item, index++])
		}

		this.trigger('rangeAdded', [this._rangeDifference, initialIndex])

		return this
	}

	protected _removeDefault(event: hook.IEvent, item: T, index: number): void {
		this._removeAt(index)
	}

	public remove(item: T): Collection<T> {
		this.provideHook('remove', this._removeDefault, [item, this.indexOf(item)])
		return this
	}

	protected _removeAtDefault(event: hook.IEvent, item: T, index: number): void {
		this._removeAt(index)
	}

	public removeAt(index: number): Collection<T> {
		this.provideHook('remove', this._removeAtDefault, [this.items[index], index])
		return this
	}

	protected _removeRangeDefault(event: hook.IEvent, item: T, index: number): void {
		this._removeAt(index)
	}

	public removeRange(from: number, to: number): Collection<T> {
		let elements, index, item, i
		index = from
		elements = []

		while (this.items.length) {
			elements.push(this.get(index))
			if (index++ === this._calculateIndex(to)) {
				break
			}
		}

		for (i = 0; i < elements.length; i++) {
			item = elements[i]
			this.provideHook('remove', this._removeRangeDefault, [item, this.indexOf(item)])
		}

		return this
	}

	private _calculateSpliceIndex(from: number, to: number): any { // boolean | number
		// work around TS Compiler here :/
		let left1: any = to < 0
		let right1: any = from >= 0
		let result1: any = !(left1 ^ right1) && (to < 0 || -1)

		return !to || 1 + to - from + (result1 * this.items.length)
	}

	private _calculateIndex(index: number): number {
		if (index === 0) {
			return index
		} else {
			return this._calculateSpliceIndex(1, index)
		}
	}

	protected _removeRange(from: number, to: number): void {
		this.items.splice(from, this._calculateSpliceIndex(from, to))
		this._updateRange()
	}

	protected _removeAt(index: number): void {
		this._removeRange(index, index)
	}

	private _updateRange(): void {
		this.count = this.items.length
	}

	private _setDefault(event: hook.IEvent, index: number, value: T): void {
		this.items[this._calculateIndex(index)] = value
	}

	public set(index: number, value: T): boolean {
		if (index >= this.count) {
			console.log(new Error('Index is out of range.'))
			return false
		}

		this.provideHook('set', this._setDefault, [index, value])

		return true
	}

	public get(index: number): T {
		return this.items[this._calculateIndex(index)]
	}
}
