import { Component, Dom } from '../../component-ts'
import { Increment } from './Increment'

namespace Root {
  type State = Component.State & { incrementers: Increment.State[] }

  type Kind = 'Add_Incrementer'
  type Data = null

  type Action = Component.Action<Kind, Data>

  const Render = (state: State): Dom.Element => 
    Dom.ForComponent(state._id,
      Dom.Div(
        [],
        [
          ...state.incrementers.map(Increment.Render),
          Dom.Button(
            [ Dom.OnClick<Action>({kind: 'Add_Incrementer'}) ],
            [ Dom.Text('Add')]
          )
        ]
      )
    )

  const Update = (state: State, action: Action): State => {
    switch (action.kind) {
      case 'Add_Incrementer': 
        const id = state.incrementers.map(inc => inc.id)
          .reduce((prevId, curId) => Math.max(prevId, curId), 0) + 1
        return {...state, incrementers: [...state.incrementers, Increment.Create(id) ] }
      default:
        return state
    }
  }

  // register root component
  Component.CreateRootComponent<State, Action>({
    state: { incrementers: [ Increment.Create(0) ] }, update: Update, render: Render 
  })
}
