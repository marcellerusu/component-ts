const Bacon = require('baconjs')
const _ = require('lodash')

export namespace Component {
  const rootElementId = 'component-index'
  const dataAttr = 'data-cid'

  export type Action<K, D> = { kind: K, data?: D }

  export type State = { _id?: number }

  export type Component<S extends State, A extends Action<any, any>> = {
    state: S,
    update: (s: S, a: A) => S,
    render: (s: S) => Dom.Element
  }

  let rootComponent: Component<State, any> // ah this is annoying
  let rootHtml: HTMLElement
  const eventStream = Bacon.Bus() as { 
    onValue: (onV: (a: Action<any, any>) => void) => void,
    push: (a: Action<any, any>) => void
  }

  let components: Component<State, any>[] = []

  // this is fine
  // export const CreateComponent = <S extends State, A extends Action<any, any>>(component: Component<S, A>) => {
  //   const newComponent = {...component,
  //     state: {...(component.state as object), _id: cur_id++}
  //   }
    
  //   components.push(newComponent)

  //   return newComponent
  // } 

  // export const RegisterUpdate = 

  // this is fine
  export const CreateRootComponent = <S extends State, A extends Action<any, any>>(component: Component<S, A>) => {
    if (rootComponent)
      throw `${rootComponent} has already been registered as the root component`
    
    if (typeof component.state === 'function') // yes I know the typescript should catch this but ahh
      throw `state can't be a function - ${component}`

    rootComponent = component
    let { state, render } = rootComponent
    state = {...state, _id: cur_id++}
    window.onload = () => {
      const elem = document.getElementById(rootElementId);
      if (elem)
        elem.appendChild(toHtml(render(state)))
      else
        throw `Can't find root element - #${rootElementId}`
    }
    rootComponent = {...rootComponent, state}
    components.push(rootComponent)
    return rootComponent
  }

  // this is not fine
  eventStream.onValue(action => {
    const root = document.getElementById(rootElementId);
    if (!root)
      throw `Can't find root element - #${rootElementId}`

    const findHtmlElem = (compId: number, root: HTMLElement): HTMLElement | null => {
      for (let i = 0; i < root.children.length; i++) {
        const child = root.children.item(i) as HTMLElement
        const name = child.getAttribute(dataAttr)
        if (!name) continue
        if (name === compId.toString())
          return child
        return findHtmlElem(compId, child)
      }
      return null
    }

    components.forEach((comp) => {
      const {render, state, update} = comp
      const newState = update(state, action)
      if (_.isEqual(newState, state)) return
      const newHtml = toHtml(render(newState))
      const rootNode = document.getElementById(rootElementId)
      if (!rootNode) throw `can't find root element ${rootElementId}`
      if (!state._id) throw `state doesn't have an _id ${state}`
      const oldHtml = findHtmlElem(state._id, rootNode)
      if (!oldHtml) throw `can't find html element for ${state._id}`
      if (!oldHtml.parentElement) throw `can't get parent html element of ${state._id}`
      oldHtml.parentElement.replaceChild(newHtml, oldHtml)
      comp.state = newState
    })
  })
  

  const toHtml = (element : Dom.Element, prev_cid: number | undefined = undefined): HTMLElement | Text => {
    let {type, assignables, children, value, _cid} = element
    debugger
    if (type === 'Empty') return document.createElement('div')
    if (type === 'Text') {
      if (!value)
        throw `Text elements need a value property`
      const d = document.createTextNode(value)
      return d
    }
    if (!_cid)
      if (!prev_cid) throw `no cid or prev_cid`
      else _cid = prev_cid
    
    const elem = document.createElement(type.toLowerCase())
    elem.setAttribute(dataAttr, _cid.toString())
    let events: Dom.Event<Action<any, any>>[] = []

    if (!assignables)
      throw `${element} doesn't have a assignables property`

    assignables.forEach(assignable => {
      if ((assignable as Dom.Attribute).value) {
        let attr = assignable as Dom.Attribute
        elem.setAttribute(attr.type.toLowerCase(), attr.value)
      } else {
        let event = assignable as Dom.Event<Action<any, any>>
        if (!event) throw `${assignable} is not a valid Assignable property on element`
        events.push(event)
      }
    })
    events.forEach(({type, action}) => {
      Bacon.fromEvent(elem, type.toLowerCase())
        .onValue(() => eventStream.push(action))
    })
    if (children)
      children.forEach(child => {
        elem.appendChild(toHtml(child, _cid))
      })
    return elem
  }
}

export namespace Dom {

  /* Events */
  type OnClickType = 'click'
  type OnMouseOverType = 'OnMouseOver'

  type EventType = OnClickType | OnMouseOverType

  export type Event<Action extends Component.Action<any, any>> = {
    type: EventType,
    action: Action
  }

  type EventFunction = <Action extends Component.Action<any, any>>(action: Action) => Event<Action>

  // yes this type is disgusting :)
  const event = <Action extends Component.Action<any, any>>(type: EventType) => 
    (action: Action): Event<Action> => ({type, action})

  export const OnClick: EventFunction = event('click')

  export const OnMouseOver: EventFunction = event('OnMouseOver')

  /* Attributes */
  type TextType = 'Text'
  type HrefType = 'Href'

  type AttributeType = TextType | HrefType

  export type Attribute = {
    type: AttributeType,
    value: string
  }

  export const href : (string) => Attribute 
    = (value) => ({ type: 'Href', value})


  export type Assignable<K, D> = Event<Component.Action<K, D>> | Attribute

  /* Html Elements */
  type DivType = 'Div'
  type AType = 'A'
  type ButtonType = 'Button'
  type EmptyType = 'Empty'

  type ElementType = DivType | AType | EmptyType | ButtonType | TextType

  export type Element = {
    type: ElementType,
    _cid?: number,
    assignables?: Assignable<any, any>[],
    children?: Element[],
    value?: string
  }

  type ElementFunction<T> = (attributes: Assignable<any, any>[], children?: Element[]) => Element

  const emptyElement: Element = { type: 'Empty' }

  export const ForComponent = (_cid: number | undefined, e: Element): Element => ({ ...e, _cid })

  export const Div: ElementFunction<DivType>
    = (attributes, children = [emptyElement]) => 
      ({
        type: 'Div',
        assignables: attributes,
        children
      })

  export const A: ElementFunction<AType> = (attributes, children = [emptyElement]) => 
      ({ 
        type: 'A',
        assignables: attributes,
        children
      })

  export const Button: ElementFunction<ButtonType> = (attributes, children = [emptyElement]) => 
    ({
      type: 'Button',
      assignables: attributes,
      children
    })
  
  export const Text = (value: string): Element  => 
    ({
      type: 'Text',
      value
    })
}
