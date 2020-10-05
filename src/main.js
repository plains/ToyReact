import {createElement, Component, render} from "./toy-react"

class MyComponent extends Component {
    render() {
        return <div><h1>MyComponent</h1>{this.children}</div>
    }
}

render(<MyComponent id="box" class="con" width="100%">
        <span>abc</span>
        <br/ ><br/ ><br/ >
        <div>efg</div>
    </MyComponent>, document.body)


/**
 * 自定义组件
 * 属性 porps, get root
 * 行为：appendChild
 * 
 * @babel/plugin-transform-react-jsx
 * 在碰到大写的标签的时候，会将其作为一个类来对待，将引用传递给 createElement
 * 
 * 这样的话 createElement 接收到的 Type 就需要做额外的包装处理，来让 DOM 元素与自定义组件融合
 * 1. 自定义组件的 render 函数，本质上还是在生成 DOM
 * 
 * 利用 wrapper 将 DOM 和自定义组件的 API 兼容起来，达到目的
 * 
 */