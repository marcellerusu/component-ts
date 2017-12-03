import { Component, Dom } from '../../component'

export type State = { count: number, id: number }

type Id = number  

export type Action
  = ['Increment', Id] 
  | ['Decrement', Id]

export const Render = ({ count, id }: State): Dom.Element => 
  Dom.div(
    [],
    [
      Dom.text(`Count = ${count}`),
      Dom.button(
        [ Dom.onClick<Action>(['Increment', id]) ],
        [ Dom.text('+') ]
      ),
      Dom.button(
        [ Dom.onClick<Action>(['Decrement', id]) ],
        [ Dom.text('-') ]
      )
    ]
  )

export const Update = ([kind, id]: Action) => (state: State): State => {
  if (id !== state.id)
    return state

  switch (kind) {
    case 'Increment':
      return { ...state, count: state.count + 1 }
    case 'Decrement':
      return { ...state, count: state.count - 1 }
  }
}

export const create = (id: number, startCount = 0): State => ({ id, count: startCount })