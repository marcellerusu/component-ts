import Bacon from 'bacon'

export namespace Component {
  // At some POINT we have to start doing garbage collection
  const rootElementId = 'component-index'

  export type State = {
    name: string,
    html: Dom.Element,
  }

  export type Action = any // think about this a bit more

  type Render = (s: State) => Dom.Element
  type Update = (s: State, action: string) => State

  export type Component = {
    state: State,
    update: Update,
    render: Render
  }

  let rootComponent: Component
  
  const eventStream = Bacon.Bus()
  let components: Component[] = [] as [Component]


  export const CreateComponent = (component: Component) => {

    components.push(component)
    return component
  } 

  export const CreateRootComponent = (component: Component) => {
    if (components.some(({state}) => name === state.name))
      throw `${name} is already registered as the root component`

    rootComponent = component

    return rootComponent
  }

  eventStream.onValue(({name, action}: Action) => {
    //for now broadcast event to everyone
    components = 
      components
        .map(comp => 
          comp.state.name === name 
          ? ({...comp,
              state: {...comp.state,
                html: render(comp, action)
              }
            })
          : comp
        )
    })

    const render = (comp: Component, action: string) => {
        const newState = comp.update(comp.state, action)
        const elem = comp.render(newState)
        const html = toHtml(comp, elem)
        // TODO actually reload this html
        
        //
        return elem
    }

    const RegisterEventListener = (elem: HTMLElement, event: string, action: Action) => {
      $(elem) // TODO: get bacon.jquery to work
        .asEventStream(event)
        .onValue(() => eventStream.push(action))
    }

    const toHtml: (comp: Component, elem: Dom.Element) => HTMLElement = 
      (comp, {type, assignables, children}) => {
      const elem = document.createElement(type.toLowerCase())
      let events = []
      assignables.forEach(assignable => {
        if ((assignable as Dom.Attribute).value) {
          let attr = assignable as Dom.Attribute
          elem.setAttribute(attr.type.toLowerCase(), attr.value)
        } else {
          let event = assignable as Dom.Event
          if (!event) throw `${assignable} is not a valid Assignable property on element`
          events.push([event.type, { name: comp.state.name, action: event.action }])
        }
      })
      events.forEach(([type, action]) => RegisterEventListener(elem, type, action))
      return elem
    }
    // const component = components.find(comp => comp._id === _id)
    // if (!component) throw `${_id} isn't a registered component`
    // const newState = component.update(component.state, action)
    // if (typeof newState === 'undefined')
    //   throw `Component ${_id}'s update should not returned undefined`
    // components.map(comp => comp._id === component._id ? newState : component.state)
    // const html = component.render(newState)
}

export namespace Dom {

  /* Events */
  type OnClick = 'OnClick'
  type OnMouseOver = 'OnMouseOver'

  type EventType = OnClick | OnMouseOver

  export type Event = {
    type: EventType,
    action: string
  }

  export const onClick : (action: string) => Event 
    = (action) => ({ type: 'OnClick', action })

  export const onMouseOver : (action: string) => Event 
    = (action) => ({ type: 'OnMouseOver', action })

  /* Attributes */
  type Text = 'Text'
  type Href = 'Href'

  type AttributeType = Text | Href

  export type Attribute = {
    type: AttributeType,
    value: string
  }

  export const text : (string) => Attribute 
    = (value) => ({ type: 'Text', value})

  export const href : (string) => Attribute 
    = (value) => ({ type: 'Href', value})


  export type Assignable = Event | Attribute

  /* Html Elements */
  type Div = 'Div'
  type A = 'A'
  type Empty = 'Empty'

  type ElementType = Div | A | Empty

  export type Element = {
    type: ElementType,
    assignables?: Assignable[],
    children?: Element[]
  }

  type ElementFunction<T> = (attributes: Assignable[], children?: Element[]) => Element

  const emptyElement: Element = { type: 'Empty' }

  export const div : ElementFunction<Div>
    = (attributes: Assignable[], children: Element[] = [emptyElement]) => 
      ({
        type: 'Div',
        assignables: attributes,
        children
      })

  export const a : ElementFunction<A> 
    = (attributes: Assignable[], children: Element[] = [emptyElement]) => 
      ({ 
        type: 'A',
        assignables: attributes,
        children
      })
}
