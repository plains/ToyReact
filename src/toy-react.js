const isObject = obj => {
    return obj !== null && typeof obj === "object"
}

const replaceContent = (node, range) => {
    range.insertNode(node)
    range.setStartAfter(node)
    range.deleteContents()

    range.setStartBefore(node)
    range.setEndAfter(node)
}

export class Component {
    constructor(props) {
        this.props = props || Object.create(null)
        this.children = []
        this._root = null
        this._range = null
        this._vdom = null
        this.vchildren = []
    }

    setAttribute(p, value) {
        this.props[p] = value
    }

    appendChild(component) {
        this.children.push(component)
    }

    get vdom() {
        return this.render().vdom
    }

    render() {}

    _renderToDom(range) {
        this._range = range
        this._vdom = this.vdom
        this._vdom._renderToDom(range)
    }

    update() {
        let isSameNode = (oldNode, newNode) => {
            if (oldNode.type !== newNode.type) return false

            for(let p in newNode.props) {
                if (oldNode.props[p] !== newNode.props[p]) return false
            }

            if (oldNode.props.length !== newNode.props.length) return false

            if (newNode.type === "#text") {
                if (newNode.content !== oldNode.content) return false
            }

            return true
        }

        let update = (oldNode, newNode) => {
            if (!isSameNode(oldNode, newNode)) {
                newNode._renderToDom(oldNode._range)
                return
            }
            let tailChild = oldNode.vchildren[oldNode.vchildren.length - 1]
            for (let i = 0; i < newNode.vchildren.length; i++) {
                if (oldNode.vchildren[i]) {
                    update(oldNode.vchildren[i], newNode.vchildren[i])
                } else {
                    let childRange = document.createRange()
                    let tailChildRange = tailChild._range
                    childRange.setStart(tailChildRange.startContainer, tailChildRange.endOffset)
                    childRange.setEnd(tailChildRange.startContainer, tailChildRange.endOffset)
                    newNode.vchildren[i]._renderToDom(childRange)
                    tailChild = newNode.vchildren[i]
                }
            }
        }

        let newVdom = this.vdom
        update(this._vdom, newVdom)
        this._vdom = newVdom
    }

    setState(newState) {
        if (!isObject(this.state) || this.state === undefined) {
            this.state = newState
            this.update()
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
        this.update()
    }
}

class ElementWrapper extends Component {
    constructor(type) {
        super()
        this.type = type
        this._range = null
    }

    get vdom() {
        this.vchildren = this.children.map(child => child.vdom)
        return this
    }

    _renderToDom(range) {
        this._range = range
        // debugger
        // vdom 转换为 dom to range
        let root = document.createElement(this.type)

        for (let p in this.props) {
            let value = this.props[p]
            if (p.match(/on([\s\S]+)$/)) {
                root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
            } else if(p.toLowerCase() === "classname") {
                root.setAttribute("class", value)
            } else {
                root.setAttribute(p, value)
            }
        }

        if (!this.vchildren.length) {
            this.vchildren = this.children.map(child => child.vdom)
        }

        for (let child of this.vchildren) {
            let childRange = document.createRange()
            childRange.setStart(root, root.childNodes.length)
            childRange.setEnd(root, root.childNodes.length)
            child._renderToDom(childRange)
        }

        replaceContent(root, range)
    }
}

class TextNodeWrapper extends Component {
    constructor(text) {
        super()
        this.type = "#text"
        this.content = text;
        this._range = null
    }

    get vdom() {
        return this
    }

    _renderToDom(range) {
        let root = document.createTextNode(this.content)
        replaceContent(root, range)
        this._range = range
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
