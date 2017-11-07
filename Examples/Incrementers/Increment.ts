import { Component, Dom } from '../../component-ts'

export namespace Increment {
  const _name = 'Increment'
  export type State = Component.State & { count: number, id: number }

  type Id = number  
  type Kind = 'Increment' | 'Decrement'
  type Data = Id

  export type Action = Component.Action<Kind, Data>

  export const Render = ({ count, id }: State): Dom.Element => 
    Dom.ForComponent(_name,
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

  // registers component and returns the state
  export const Create = (id: number, startCount = 0): State => 
    Component.CreateComponent<State, Action>({
      state: { _name, id, count: startCount }, render: Render, update: Update
    }).state
}