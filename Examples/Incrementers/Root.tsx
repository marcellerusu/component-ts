import { Component, Dom } from '../../component-ts'
import { Increment } from './Increment'

namespace Root {
  type State = Component.State & {
    incrementers: [Increment.State, number][]
  }

  type Action = ['Increment', number] | ['Decrement', number] | ['None', 0]

  const Render = (state: State): Dom.Element => {
    return Dom.div(
      [],
      state[0].incrementers.map(Increment.Render)
    )
  }

  const Update = (state: State, [action, _id]: Action): State => 
  ({ ...state,
      incrementers: state.incrementers.map(([incr, id]) =>
        id === _id 
          ? [Increment.Update(incr, action), id] as [Increment.State, number]
          : [incr, id] as [Increment.State, number]
      )
  })

  const initialIncr: [Increment.State[], number][] = [
    [
      [Component.CreateComponent(Increment.Component()).state as Increment.State], 
      0
    ]
  ]

  const initial: State = {
    name: 'Root',
    html: Dom.div(
      [],
      [
        Increment.Render(initialIncr[0][0][0])
      ]
    ),
    incrementers: initialIncr
  }

  const Create = Component
                  .CreateRootComponent({
                    render: Render, 
                    update: Update, 
                    state: initial
                  })
}
