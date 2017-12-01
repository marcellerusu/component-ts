import { Component, Dom } from '../../component'

export namespace Increment {
  export type State = { count: number, id: number }

  type Id = number  
  export type Kind = 'Increment' | 'Decrement'
  export type Data = Id

  export type Action = Component.Action<Kind, Data>

  export const Render = ({ count, id }: State): Dom.Element => 
    Dom.Div(
      [],
      [
        Dom.Text(`Count = ${count}`),
        Dom.Button(
          [ Dom.OnClick<Action>({ kind: 'Increment', data: id }) ],
          [ Dom.Text('+') ]
        ),
        Dom.Button(
          [ Dom.OnClick<Action>({ kind: 'Decrement', data: id }) ],
          [ Dom.Text('-') ]
        )
      ]
    )

  export const Update = (state: State, { kind, data }: Action): State => {
    const id = data
    if (id !== state.id)
      return state

    switch (kind) {
      case 'Increment':
        return { ...state, count: state.count + 1 }
      case 'Decrement':
        return { ...state, count: state.count - 1 }
    }
  }

  export const Create = (id: number, startCount = 0): State => ({ id, count: startCount })
}