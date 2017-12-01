import { Component, Dom } from '../../component'
import { Increment } from './Increment'

namespace Root {
  type State = { incrementers: Increment.State[] }

  type Kind = 'AddIncrementer' | Increment.Kind
  type Data = Increment.Data | null

  type Action = Component.Action<Kind, Data>

  const Render = (state: State): Dom.Element => 
    Dom.Div(
      [],
      [
        ...state.incrementers.map(Increment.Render),
        Dom.Button(
          [ Dom.OnClick<Action>({kind: 'AddIncrementer'}) ],
          [ Dom.Text('Add')]
        )
      ]
    )

  const Update = (state: State, action: Action): State => {
    switch (action.kind) {
      case 'AddIncrementer': 
        const id = state.incrementers.map(inc => inc.id)
          .reduce((prevId, curId) => Math.max(prevId, curId), 0) + 1
        return { 
          incrementers: [...state.incrementers, Increment.Create(id) ] 
        }
      case 'Increment':
      case 'Decrement':      
        return {
          incrementers: state.incrementers.map(incr => 
            incr.id === action.data
              ? Increment.Update(incr, action as Increment.Action) 
              : incr)
        }
      default:
        return state
    }
  }

  // register root component
  Component.CreateRootComponent<State, Action>({
    state: { incrementers: [ Increment.Create(0) ] }, update: Update, render: Render 
  })
}
