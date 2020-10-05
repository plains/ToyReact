export class Component {
    constructor() {
        this.props = Object.create(null)
        this.children = []
        this._root = undefined;
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
        this.children.push(component);
    }
    render() {}
}

class ElementWrapper {
    constructor(type) {
        this.root = document.createElement(type)
    }
    setAttribute(p, value) {
        return this.root.setAttribute(p, value)
    }
    appendChild(component) {
        return this.root.appendChild(component.root)
    }
}

class TextNodeWrapper {
    constructor(text) {
        this.root = document.createTextNode(text)
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
            if (typeof child === "string") {
                child = new TextNodeWrapper(child)
            }
            if (typeof child === "object" && child instanceof Array) {
                insertChildren(child)
            } else {
                node.appendChild(child)
            }
        }
    }

    insertChildren(children)
    return node
}

export function render(node, container) {
    container.appendChild(node.root)
}