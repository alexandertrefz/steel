(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.steel = global.steel || {})));
}(this, function (exports) { 'use strict';

    function __extends(d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    /// <reference path="../typings/main.d.ts" />
    var EventMachine = (function () {
        function EventMachine() {
            this._handle = new hook.Handle();
            var commandHandlers = this._getCommandHandlers();
            for (var command in commandHandlers) {
                if (commandHandlers.hasOwnProperty(command)) {
                    this.onCommand(command, this[commandHandlers[command]]);
                }
            }
        }
        EventMachine._checkEvent = function (event) {
            if (typeof event === 'string' || !(event instanceof hook.Event)) {
                event = new hook.Event(event);
            }
            return event;
        };
        EventMachine.prototype._getCommandHandlers = function () {
            return {};
        };
        EventMachine.prototype.trigger = function (event, data) {
            var eventObj = EventMachine._checkEvent(event);
            this._handle.triggerHandlers(this, eventObj, data);
            if (this.parent != null && !eventObj.isPropagationStopped) {
                this.parent.trigger(eventObj, data);
            }
            return this;
        };
        EventMachine.prototype.on = function (event, handler) {
            if (typeof event === 'object' && !(event instanceof hook.Event)) {
                for (var key in event) {
                    if (event.hasOwnProperty(key)) {
                        this.on(key, event[key]);
                    }
                }
                return this;
            }
            event = EventMachine._checkEvent(event);
            this._handle.addHandler(event, handler);
            return this;
        };
        EventMachine.prototype.off = function (event, handler) {
            if (event === undefined) {
                this._handle.removeHandler();
            }
            else {
                event = EventMachine._checkEvent(event);
                this._handle.removeHandler(event, handler);
            }
            return this;
        };
        EventMachine.prototype.sendCommand = function (event, data) {
            // TODO: Output to console whenever an event gets triggered with no listeners
            var eventObj = EventMachine._checkEvent(event);
            eventObj.eventName = 'command.' + eventObj.eventName;
            this.trigger(eventObj, data);
            return this;
        };
        EventMachine.prototype.onCommand = function (event, handler) {
            var key, value;
            if (typeof event === 'object' && !(event instanceof hook.Event)) {
                for (key in event) {
                    if (event.hasOwnProperty(key)) {
                        value = event[key];
                        this.onCommand(key, value);
                    }
                }
                return this;
            }
            var eventObj = EventMachine._checkEvent(event);
            eventObj.eventName = 'command.' + eventObj.eventName;
            this._handle.addHandler(eventObj, handler);
            return this;
        };
        EventMachine.prototype.offCommand = function (event, handler) {
            var eventObj = EventMachine._checkEvent(event);
            eventObj.eventName = 'command.' + eventObj.eventName;
            this._handle.removeHandler(eventObj, handler);
            return this;
        };
        EventMachine.prototype.provideHook = function (eventName, defaultHandler, data) {
            var afterEvent, beforeEvent, capitalizedEventName, event;
            if (data == null) {
                data = [];
            }
            capitalizedEventName = eventName[0].toUpperCase() + eventName.slice(1);
            beforeEvent = new hook.Event('before' + capitalizedEventName);
            this.trigger(beforeEvent, data);
            event = Object.assign({}, beforeEvent);
            event.eventName = eventName;
            if (!(event.isCancelled || event.isDefaultPrevented)) {
                defaultHandler.call.apply(defaultHandler, [this].concat([event].concat(event.data)));
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
        };
        return EventMachine;
    }());

    var Model = (function (_super) {
        __extends(Model, _super);
        function Model(options, component) {
            if (options === void 0) { options = {}; }
            _super.call(this);
            this.component = component;
            this._data = {};
            var propertyFilters = this._getPropertyFilters(options);
            this.on('beforeSet', function (e, key, value) {
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
        Model.prototype.initialize = function (options) {
            // Fix TSLint by providing a comment :)
        };
        Model.prototype._getPropertyFilters = function (options) {
            return [];
        };
        Model.prototype._setDefaultData = function (options) {
            this.setMany(options);
        };
        Model.prototype.setMany = function (object) {
            for (var key in object) {
                if (object.hasOwnProperty(key)) {
                    this.set(key, object[key]);
                }
            }
        };
        Model.prototype._setDefault = function (e, key, value) {
            this._data[key] = value;
        };
        Model.prototype.set = function (key, value) {
            this.provideHook('set', this._setDefault, [key, value]);
            return this;
        };
        Model.prototype.get = function (key) {
            return this._data[key];
        };
        return Model;
    }(EventMachine));

    // TODO: Implement _rangeDifference for removals
    var Collection = (function (_super) {
        __extends(Collection, _super);
        function Collection(items) {
            if (items === void 0) { items = []; }
            _super.call(this);
            this.items = items;
            this._updateRange();
        }
        /* Make Collection behave like an array, in ES6 environments
        [Symbol.iterator]() {
            return this.items[Symbol.iterator]()
        }
        //*/
        Collection.prototype.indexOf = function (item) {
            return this.items.indexOf(item);
        };
        Collection.prototype.includes = function (item) {
            return !!~this.items.indexOf(item);
        };
        Collection.prototype._addDefault = function (e, item, index) {
            this.items.push(item);
            this._updateRange();
        };
        Collection.prototype.add = function (item) {
            this.provideHook('add', this._addDefault, [item, this.count]);
            return this;
        };
        Collection.prototype._addRangeDefault = function (event, item, index) {
            this.items.push(item);
            this._rangeDifference.push(item);
            this._updateRange();
        };
        Collection.prototype.addRange = function (items) {
            var item, i, count, newIndex;
            count = this.count;
            this._rangeDifference = [];
            for (i = 0; i < items.length; i++) {
                item = items[i];
                newIndex = count + i;
                this.provideHook('add', this._addRangeDefault, [item, newIndex]);
            }
            this.trigger('rangeAdded', [this._rangeDifference, count]);
            return this;
        };
        Collection.prototype._insertDefault = function (event, item, index) {
            this.items.splice(index, 0, item);
            this._updateRange();
        };
        Collection.prototype.insert = function (item, index) {
            this.provideHook('add', this._insertDefault, [item, index]);
            return this;
        };
        Collection.prototype._insertRangeDefault = function (event, item, index) {
            this.items.splice(index, 0, item);
            this._rangeDifference.push(item);
            this._updateRange();
        };
        Collection.prototype.insertRange = function (items, index) {
            var item, i, initialIndex;
            initialIndex = index;
            this._rangeDifference = [];
            for (i = 0; i < items.length; i++) {
                item = items[i];
                this.provideHook('add', this._insertRangeDefault, [item, index++]);
            }
            this.trigger('rangeAdded', [this._rangeDifference, initialIndex]);
            return this;
        };
        Collection.prototype._removeDefault = function (event, item, index) {
            this._removeAt(index);
        };
        Collection.prototype.remove = function (item) {
            this.provideHook('remove', this._removeDefault, [item, this.indexOf(item)]);
            return this;
        };
        Collection.prototype._removeAtDefault = function (event, item, index) {
            this._removeAt(index);
        };
        Collection.prototype.removeAt = function (index) {
            this.provideHook('remove', this._removeAtDefault, [this.items[index], index]);
            return this;
        };
        Collection.prototype._removeRangeDefault = function (event, item, index) {
            this._removeAt(index);
        };
        Collection.prototype.removeRange = function (from, to) {
            var elements, index, item, i;
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
        };
        Collection.prototype.removeAll = function () {
            return this.removeRange(0, -1);
        };
        Collection.prototype._calculateSpliceIndex = function (from, to) {
            // work around TS Compiler here :/
            var left1 = to < 0;
            var right1 = from >= 0;
            var result1 = !(left1 ^ right1) && (to < 0 || -1);
            var result = !to || 1 + to - from + (result1 * this.items.length);
            if (typeof result === 'boolean') {
                return 1;
            }
            else {
                return result;
            }
        };
        Collection.prototype._calculateIndex = function (index) {
            if (index === 0) {
                return index;
            }
            else {
                return this._calculateSpliceIndex(1, index);
            }
        };
        Collection.prototype._removeRange = function (from, to) {
            this.items.splice(from, this._calculateSpliceIndex(from, to));
            this._updateRange();
        };
        Collection.prototype._removeAt = function (index) {
            this._removeRange(index, index);
        };
        Collection.prototype._updateRange = function () {
            this.count = this.items.length;
        };
        Collection.prototype._setDefault = function (event, index, value) {
            this.items[this._calculateIndex(index)] = value;
        };
        Collection.prototype.set = function (index, value) {
            if (index >= this.count) {
                console.log(new Error('Index is out of range.'));
                return false;
            }
            this.provideHook('set', this._setDefault, [index, value]);
            return true;
        };
        Collection.prototype.get = function (index) {
            return this.items[this._calculateIndex(index)];
        };
        return Collection;
    }(EventMachine));

    var View = (function (_super) {
        __extends(View, _super);
        function View(options, model, component) {
            var _this = this;
            if (options === void 0) { options = {}; }
            _super.call(this);
            options = Object.assign({}, options);
            this.component = component;
            this.model = model;
            this.element = this._createElement();
            this.element.classList.add(this.getComponentName());
            this._handleClasses(options.classes);
            this.childContainer = this._createChildContainer();
            this.components = new Collection();
            this.components.on('add', function (e, newComponent, index) {
                _this.element.appendChild(newComponent.view.element);
            });
            this.initialize(options);
            this.render();
        }
        View.prototype._handleClasses = function (classes) {
            if (classes === void 0) { classes = []; }
            if (typeof classes === 'string') {
                if (classes.trim() === '') {
                    classes = [];
                }
                else {
                    classes = classes.trim().split(' ');
                }
            }
            (_a = this.element.classList).add.apply(_a, classes);
            var _a;
        };
        View.prototype.initialize = function (options) {
            // Fix TSLint by providing a comment :)
        };
        View.prototype._getCommandHandlers = function () {
            return {};
        };
        View.prototype._createElement = function () {
            return document.createElement('div');
        };
        View.prototype._createChildContainer = function () {
            return this.element;
        };
        View.prototype.addClasses = function (classes) {
            if (typeof classes === 'string') {
                classes = classes.trim().split(' ');
            }
            (_a = this.element.classList).add.apply(_a, classes);
            return this;
            var _a;
        };
        View.prototype.removeClasses = function (classes) {
            if (typeof classes === 'string') {
                classes = classes.trim().split(' ');
            }
            (_a = this.element.classList).remove.apply(_a, classes);
            return this;
            var _a;
        };
        View.prototype.getComponentName = function () {
            return 'GenericView';
        };
        View.prototype.hasInvalidComponents = function () {
            var result = false;
            for (var _i = 0, _a = this.components.items; _i < _a.length; _i++) {
                var component = _a[_i];
                if (component.isInvalid) {
                    result = true;
                    break;
                }
            }
            return result;
        };
        View.prototype.renderComponents = function (options) {
            if (options === void 0) { options = {}; }
            for (var _i = 0, _a = this.components.items; _i < _a.length; _i++) {
                var component = _a[_i];
                component.render({ force: options.force });
            }
            return this;
        };
        View.prototype.render = function () {
            this.renderComponents();
            return this;
        };
        return View;
    }(EventMachine));

    var Controller = (function (_super) {
        __extends(Controller, _super);
        function Controller(options, component) {
            if (options === void 0) { options = {}; }
            _super.call(this);
            this.component = component;
            this.initialize(options);
        }
        Controller.prototype.initialize = function (options) {
            // Fix TSLint by providing a comment :)
        };
        return Controller;
    }(EventMachine));

    var Component = (function (_super) {
        __extends(Component, _super);
        function Component(options) {
            var _this = this;
            if (options === void 0) { options = {}; }
            _super.call(this);
            this.children = new Collection();
            this.children.on('add', function (e, item) {
                item.parent = _this;
                _this.view.childContainer.appendChild(item.view.element);
                item.trigger('gotAdded');
            });
            this.children.on('remove', function (e, item) {
                item.parent = null;
                _this.view.childContainer.removeChild(item.view.element);
                item.trigger('gotRemoved');
            });
            this.initialize(options);
        }
        Component.prototype.initialize = function (options) {
            this.model = new Model({}, this);
            this.view = new View({}, this.model, this);
            this.controller = new Controller({}, this);
        };
        Component.prototype.setMany = function (object) {
            this.model.setMany(object);
            return this;
        };
        Component.prototype.set = function (key, value) {
            this.model.set(key, value);
            return this;
        };
        Component.prototype.get = function (key) {
            return this.model.get(key);
        };
        Component.prototype.invalidate = function () {
            this.isInvalid = true;
            this.trigger('invalidation');
            return this;
        };
        Component.prototype.render = function (options) {
            if (options === void 0) { options = {}; }
            var forceRenderComponents;
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
            for (var _i = 0, _a = this.children.items; _i < _a.length; _i++) {
                var child = _a[_i];
                child.render();
            }
            this.isInvalid = false;
            this._isRenderInProgress = false;
            return this;
        };
        Component.prototype.addClasses = function (classes) {
            this.view.addClasses(classes);
            return this;
        };
        Component.prototype.removeClasses = function (classes) {
            this.view.removeClasses(classes);
            return this;
        };
        Component.prototype.dispose = function () {
            // TODO: Dispose View
            // TODO: Dispose Model
            // TODO: Dispose Controller
            // TODO: Make dispose hookable
            for (var _i = 0, _a = this.children.items; _i < _a.length; _i++) {
                var child = _a[_i];
                child.dispose();
            }
            if (this.parent != null) {
                this.parent.children.remove(this);
            }
            this.off();
        };
        return Component;
    }(EventMachine));

    var pubSubMachine = new EventMachine();
    var publish = pubSubMachine.trigger.bind(pubSubMachine);
    var subscribe = pubSubMachine.on.bind(pubSubMachine);

    exports.publish = publish;
    exports.subscribe = subscribe;
    exports.EventMachine = EventMachine;
    exports.Model = Model;
    exports.View = View;
    exports.Controller = Controller;
    exports.Component = Component;
    exports.Collection = Collection;

    Object.defineProperty(exports, '__esModule', { value: true });

}));