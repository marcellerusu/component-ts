import { Component, Dom } from '../../component-ts'

export namespace Increment {
  export type State = Component.State & {
    i: number
  }

  type Action = 'Increment' | 'Decrement' | 'None'

  export const Render = ({ i }: State): Dom.Element => 
    Dom.div(
      [
        Dom.text(`Count = ${i}`),
        Dom.onClick('Increment')
      ]
    )
  export const Update = (state: State, action: Action): State => {
    switch (action as Action) {
      case 'Increment':
        return { ...state, i: state.i + 1 }
      default:
        return state
    }
  }

  const initial: State = {
      name: 'Increment',
      i: 0,
      html: Dom.div(
        [
          Dom.text(`Count = 0`)
        ]
      )
  }

  export const Component = () => { return { state: initial, update: Update, render: Render } }
}
