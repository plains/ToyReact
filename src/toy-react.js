const isObject = obj => {
    return obj !== null && typeof obj === "object"
}

export class Component {
    constructor() {
        this.props = Object.create(null)
        this.children = []
        this._root = null
        this._range = null
    }
    get root(){
        if (!this._root) {
            this._root = this.render().root
        }
        return this._root
    }
    setAttribute(p, value) {
        this.props[p] = value
    }
    appendChild(component) {
        this.children.push(component)
    }
    render() {}
    _renderToDom(range) {
        this._range = range
        this.render()._renderToDom(range)
    }
    reRender() {
        this._range.deleteContents()
        this._renderToDom(this._range)
    }
    setState(newState) {
        if (!isObject(this.state) || this.state === undefined) {
            this.state = newState
            this.reRender()
            return
        }
        let merge = (oldState, newState) => {
            for (let p in newState) {
                if (isObject(newState[p])) {
                    if (oldState[p] === undefined || oldState[p] === null) {
                        oldState[p] = 
                        (newState[p] instanceof Array && []) || 
                        (newState[p] instanceof Object && {})
                    }
                    merge(oldState[p], newState[p])
                } else {
                    oldState[p] = newState[p]
                }
            }
        }
        merge(this.state, newState)
        this.reRender()
    }
}

class ElementWrapper {
    constructor(type) {
        this.root = document.createElement(type)
        this._range = null
    }
    setAttribute(p, value) {
        if (p.match(/on([\s\S]+)$/)) {
            this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
        } else if(p.toLowerCase() === "classname") {
            this.root.setAttribute("class", value)
        } else {
            this.root.setAttribute(p, value)
        }
    }
    appendChild(component) {
        let range = document.createRange()
        range.setStart(this.root, this.root.childNodes.length)
        range.setEnd(this.root, this.root.childNodes.length)
        component._renderToDom(range)
    }
    _renderToDom(range) {
        range.deleteContents()
        range.insertNode(this.root)
    }
    reRender() {
        this._range.deleteContents()
        this._renderToDom(this._range)
    }
}

class TextNodeWrapper {
    constructor(text) {
        this.root = document.createTextNode(text)
    }
    _renderToDom(range) {
        range.deleteContents()
        range.insertNode(this.root)
    }
}

export function createElement(type, attrs, ...children) {
    let node;
    if (typeof type === "function") {
        node = new type
    } else {
        node = new ElementWrapper(type)
    }
    for (let p in attrs) {
        node.setAttribute(p, attrs[p])
    }
    
    let insertChildren = (children) => {
        for(let child of children){
            if (typeof child === "object" && child instanceof Array) {
                insertChildren(child)
            } else if(child instanceof ElementWrapper || child instanceof Component) {
                node.appendChild(child)
            } else {
                child = new TextNodeWrapper(child)
                node.appendChild(child)
            }
        }
    }

    insertChildren(children)
    return node
}

export function render(component, parentElement) {
    let range = document.createRange()
    range.setStart(parentElement, 0)
    range.setEnd(parentElement, parentElement.childNodes.length)
    range.deleteContents()
    component._renderToDom(range)
}