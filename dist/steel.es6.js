/// <reference path="../typings/main.d.ts" />
class EventMachine {
    constructor() {
        this._handle = new hook.Handle();
        let commandHandlers = this._getCommandHandlers();
        for (let command in commandHandlers) {
            if (commandHandlers.hasOwnProperty(command)) {
                this.onCommand(command, this[commandHandlers[command]]);
            }
        }
    }
    static _checkEvent(event) {
        if (typeof event === 'string' || !(event instanceof hook.Event)) {
            event = new hook.Event(event);
        }
        return event;
    }
    _getCommandHandlers() {
        return {};
    }
    trigger(event, data) {
        let eventObj = EventMachine._checkEvent(event);
        this._handle.triggerHandlers(this, eventObj, data);
        if (this.parent != null && !eventObj.isPropagationStopped) {
            this.parent.trigger(eventObj, data);
        }
        return this;
    }
    on(event, handler) {
        if (typeof event === 'object' && !(event instanceof hook.Event)) {
            for (let key in event) {
                if (event.hasOwnProperty(key)) {
                    this.on(key, event[key]);
                }
            }
            return this;
        }
        event = EventMachine._checkEvent(event);
        this._handle.addHandler(event, handler);
        return this;
    }
    off(event, handler) {
        if (event === undefined) {
            this._handle.removeHandler();
        }
        else {
            event = EventMachine._checkEvent(event);
            this._handle.removeHandler(event, handler);
        }
        return this;
    }
    sendCommand(event, data) {
        // TODO: Output to console whenever an event gets triggered with no listeners
        let eventObj = EventMachine._checkEvent(event);
        eventObj.eventName = 'command.' + eventObj.eventName;
        this.trigger(eventObj, data);
        return this;
    }
    onCommand(event, handler) {
        let key, value;
        if (typeof event === 'object' && !(event instanceof hook.Event)) {
            for (key in event) {
                if (event.hasOwnProperty(key)) {
                    value = event[key];
                    this.onCommand(key, value);
                }
            }
            return this;
        }
        let eventObj = EventMachine._checkEvent(event);
        eventObj.eventName = 'command.' + eventObj.eventName;
        this._handle.addHandler(eventObj, handler);
        return this;
    }
    offCommand(event, handler) {
        let eventObj = EventMachine._checkEvent(event);
        eventObj.eventName = 'command.' + eventObj.eventName;
        this._handle.removeHandler(eventObj, handler);
        return this;
    }
    provideHook(eventName, defaultHandler, data) {
        let afterEvent, beforeEvent, capitalizedEventName, event;
        if (data == null) {
            data = [];
        }
        capitalizedEventName = eventName[0].toUpperCase() + eventName.slice(1);
        beforeEvent = new hook.Event('before' + capitalizedEventName);
        this.trigger(beforeEvent, data);
        event = Object.assign({}, beforeEvent);
        event.eventName = eventName;
        if (!(event.isCancelled || event.isDefaultPrevented)) {
            defaultHandler.call(this, ...[event, ...event.data]);
        }
        // event might have been changed by defaultHandler
        if (!event.isCancelled) {
            this.trigger(event, event.data);
        }
        // event might have been changed by handlers
        if (!event.isCancelled) {
            afterEvent = Object.assign({}, event);
            afterEvent.eventName = 'after' + capitalizedEventName;
            this.trigger(afterEvent, afterEvent.data);
        }
        return this;
    }
}

class Model extends EventMachine {
    constructor(options = {}, component) {
        super();
        this.component = component;
        this._data = {};
        let propertyFilters = this._getPropertyFilters(options);
        this.on('beforeSet', (e, key, value) => {
            if (!~propertyFilters.indexOf(key)) {
                e.cancel();
            }
            if (value === undefined) {
                e.cancel();
            }
        });
        this._setDefaultData(options);
        this.initialize(options);
    }
    initialize(options) {
        // Fix TSLint by providing a comment :)
    }
    _getPropertyFilters(options) {
        return [];
    }
    _setDefaultData(options) {
        this.setMany(options);
    }
    setMany(object) {
        for (let key in object) {
            if (object.hasOwnProperty(key)) {
                this.set(key, object[key]);
            }
        }
    }
    _setDefault(e, key, value) {
        this._data[key] = value;
    }
    set(key, value) {
        this.provideHook('set', this._setDefault, [key, value]);
        return this;
    }
    get(key) {
        return this._data[key];
    }
}

// TODO: Implement _rangeDifference for removals
class Collection extends EventMachine {
    constructor(items = []) {
        super();
        this.items = items;
        this._updateRange();
    }
    /* Make Collection behave like an array, in ES6 environments
    [Symbol.iterator]() {
        return this.items[Symbol.iterator]()
    }
    //*/
    indexOf(item) {
        return this.items.indexOf(item);
    }
    includes(item) {
        return !!~this.items.indexOf(item);
    }
    _addDefault(e, item, index) {
        this.items.push(item);
        this._updateRange();
    }
    add(item) {
        this.provideHook('add', this._addDefault, [item, this.count]);
        return this;
    }
    _addRangeDefault(event, item, index) {
        this.items.push(item);
        this._rangeDifference.push(item);
        this._updateRange();
    }
    addRange(items) {
        let item, i, count, newIndex;
        count = this.count;
        this._rangeDifference = [];
        for (i = 0; i < items.length; i++) {
            item = items[i];
            newIndex = count + i;
            this.provideHook('add', this._addRangeDefault, [item, newIndex]);
        }
        this.trigger('rangeAdded', [this._rangeDifference, count]);
        return this;
    }
    _insertDefault(event, item, index) {
        this.items.splice(index, 0, item);
        this._updateRange();
    }
    insert(item, index) {
        this.provideHook('add', this._insertDefault, [item, index]);
        return this;
    }
    _insertRangeDefault(event, item, index) {
        this.items.splice(index, 0, item);
        this._rangeDifference.push(item);
        this._updateRange();
    }
    insertRange(items, index) {
        let item, i, initialIndex;
        initialIndex = index;
        this._rangeDifference = [];
        for (i = 0; i < items.length; i++) {
            item = items[i];
            this.provideHook('add', this._insertRangeDefault, [item, index++]);
        }
        this.trigger('rangeAdded', [this._rangeDifference, initialIndex]);
        return this;
    }
    _removeDefault(event, item, index) {
        this._removeAt(index);
    }
    remove(item) {
        this.provideHook('remove', this._removeDefault, [item, this.indexOf(item)]);
        return this;
    }
    _removeAtDefault(event, item, index) {
        this._removeAt(index);
    }
    removeAt(index) {
        this.provideHook('remove', this._removeAtDefault, [this.items[index], index]);
        return this;
    }
    _removeRangeDefault(event, item, index) {
        this._removeAt(index);
    }
    removeRange(from, to) {
        let elements, index, item, i;
        index = from;
        elements = [];
        while (this.items.length) {
            elements.push(this.get(index));
            if (index++ === this._calculateIndex(to)) {
                break;
            }
        }
        for (i = 0; i < elements.length; i++) {
            item = elements[i];
            this.provideHook('remove', this._removeRangeDefault, [item, this.indexOf(item)]);
        }
        return this;
    }
    removeAll() {
        return this.removeRange(0, -1);
    }
    _calculateSpliceIndex(from, to) {
        // work around TS Compiler here :/
        let left1 = to < 0;
        let right1 = from >= 0;
        let result1 = !(left1 ^ right1) && (to < 0 || -1);
        let result = !to || 1 + to - from + (result1 * this.items.length);
        if (typeof result === 'boolean') {
            return 1;
        }
        else {
            return result;
        }
    }
    _calculateIndex(index) {
        if (index === 0) {
            return index;
        }
        else {
            return this._calculateSpliceIndex(1, index);
        }
    }
    _removeRange(from, to) {
        this.items.splice(from, this._calculateSpliceIndex(from, to));
        this._updateRange();
    }
    _removeAt(index) {
        this._removeRange(index, index);
    }
    _updateRange() {
        this.count = this.items.length;
    }
    _setDefault(event, index, value) {
        this.items[this._calculateIndex(index)] = value;
    }
    set(index, value) {
        if (index >= this.count) {
            console.log(new Error('Index is out of range.'));
            return false;
        }
        this.provideHook('set', this._setDefault, [index, value]);
        return true;
    }
    get(index) {
        return this.items[this._calculateIndex(index)];
    }
}

class View extends EventMachine {
    constructor(options = {}, model, component) {
        super();
        options = Object.assign({}, options);
        this.component = component;
        this.model = model;
        this.element = this._createElement();
        this.element.classList.add(this.getComponentName());
        this._handleClasses(options.classes);
        this.childContainer = this._createChildContainer();
        this.components = new Collection();
        this.components.on('add', (e, newComponent, index) => {
            this.element.appendChild(newComponent.view.element);
        });
        this.initialize(options);
        this.render();
    }
    _handleClasses(classes = []) {
        if (typeof classes === 'string') {
            if (classes.trim() === '') {
                classes = [];
            }
            else {
                classes = classes.trim().split(' ');
            }
        }
        this.element.classList.add(...classes);
    }
    initialize(options) {
        // Fix TSLint by providing a comment :)
    }
    _getCommandHandlers() {
        return {};
    }
    _createElement() {
        return document.createElement('div');
    }
    _createChildContainer() {
        return this.element;
    }
    addClasses(classes) {
        if (typeof classes === 'string') {
            classes = classes.trim().split(' ');
        }
        this.element.classList.add(...classes);
        return this;
    }
    removeClasses(classes) {
        if (typeof classes === 'string') {
            classes = classes.trim().split(' ');
        }
        this.element.classList.remove(...classes);
        return this;
    }
    getComponentName() {
        return 'GenericView';
    }
    hasInvalidComponents() {
        let result = false;
        for (let component of this.components.items) {
            if (component.isInvalid) {
                result = true;
                break;
            }
        }
        return result;
    }
    renderComponents(options = {}) {
        for (let component of this.components.items) {
            component.render({ force: options.force });
        }
        return this;
    }
    render() {
        this.renderComponents();
        return this;
    }
}

class Controller extends EventMachine {
    constructor(options = {}, component) {
        super();
        this.component = component;
        this.initialize(options);
    }
    initialize(options) {
        // Fix TSLint by providing a comment :)
    }
}

class Component extends EventMachine {
    constructor(options = {}) {
        super();
        this.children = new Collection();
        this.children.on('add', (e, item) => {
            item.parent = this;
            this.view.childContainer.appendChild(item.view.element);
            item.trigger('gotAdded');
        });
        this.children.on('remove', (e, item) => {
            item.parent = null;
            this.view.childContainer.removeChild(item.view.element);
            item.trigger('gotRemoved');
        });
        this.initialize(options);
    }
    initialize(options) {
        this.model = new Model({}, this);
        this.view = new View({}, this.model, this);
        this.controller = new Controller({}, this);
    }
    setMany(object) {
        this.model.setMany(object);
        return this;
    }
    set(key, value) {
        this.model.set(key, value);
        return this;
    }
    get(key) {
        return this.model.get(key);
    }
    invalidate() {
        this.isInvalid = true;
        this.trigger('invalidation');
        return this;
    }
    render(options = {}) {
        let forceRenderComponents;
        this._isRenderInProgress = true;
        if (this.isInvalid || options.force) {
            this.view.render();
        }
        if (this.view.hasInvalidComponents()) {
            forceRenderComponents = true;
        }
        else {
            forceRenderComponents = false;
        }
        this.view.renderComponents({ force: forceRenderComponents });
        for (let child of this.children.items) {
            child.render();
        }
        this.isInvalid = false;
        this._isRenderInProgress = false;
        return this;
    }
    addClasses(classes) {
        this.view.addClasses(classes);
        return this;
    }
    removeClasses(classes) {
        this.view.removeClasses(classes);
        return this;
    }
    dispose() {
        // TODO: Dispose View
        // TODO: Dispose Model
        // TODO: Dispose Controller
        // TODO: Make dispose hookable
        for (let child of this.children.items) {
            child.dispose();
        }
        if (this.parent != null) {
            this.parent.children.remove(this);
        }
        this.off();
    }
}

let pubSubMachine = new EventMachine();
let publish = pubSubMachine.trigger.bind(pubSubMachine);
let subscribe = pubSubMachine.on.bind(pubSubMachine);

export { publish, subscribe, EventMachine, Model, View, Controller, Component, Collection };