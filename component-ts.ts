const Bacon = require('baconjs')
const _ = require('lodash')
const morphdom = require('morphdom')

export namespace Component {
  const rootElementId = 'component-index'
  const dataAttr = 'data-cid'

  export type Action<K, D> = { kind: K, data?: D }


  export type Component<S, A extends Action<any, any>> = {
    state: S,
    update: (s: S, a: A) => S,
    render: (s: S) => Dom.Element
  }


  let rootComponent: Component<any, Action<any, any>> // ah this is annoying
  let rootHtml: HTMLElement
  const eventStream = Bacon.Bus() as { 
    onValue: (onV: (a: Action<any, any>) => void) => void,
    push: (a: Action<any, any>) => void
  }

  // this is fine
  export const CreateRootComponent = <S, A extends Action<any, any>>(component: Component<S, A>) => {
    if (rootComponent)
      throw `${rootComponent} has already been registered as the root component`
    if (typeof component.state === 'function') // yes I know the typescript should catch this but ahh
      throw `state can't be a function - ${component}`

    rootComponent = component
    window.onload = () => {
      const elem = document.getElementById(rootElementId);
      const { state, render } = rootComponent
    
      if (elem)
        elem.appendChild(toHtml(render(state)))
      else
        throw `Can't find root element - #${rootElementId}`
    }
    return rootComponent
  }

  eventStream.onValue(action => {
    const oldRoot = document.getElementById(rootElementId);
    if (!oldRoot)
      throw `Can't find root element - #${rootElementId}`

    const {render, state, update} = rootComponent
    const newState = update(state, action)
    const newHtml = render(newState)
    const newRoot = toHtml(newHtml)
    rootComponent.state = newState
    morphdom(oldRoot, newRoot)
    oldRoot.id = rootElementId
  })
  

  const toHtml = (element : Dom.Element): HTMLElement | Text => {
    let {type, assignables, children, value} = element
    if (type === 'Empty') return document.createElement('div')
    if (type === 'Text') {
      if (!value)
        throw `Text elements need a value property`
      const d = document.createTextNode(value)
      return d
    }
    
    const elem = document.createElement(type.toLowerCase())
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
        elem.appendChild(toHtml(child))
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
    assignables?: Assignable<any, any>[],
    children?: Element[],
    value?: string
  }

  type ElementFunction<T> = (attributes: Assignable<any, any>[], children?: Element[]) => Element

  const emptyElement: Element = { type: 'Empty' }

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
