import { Component, Dom } from '../../component'
import * as Increment from './Increment'

type State = Increment.State[]

type Action 
  = ['AddIncrementer']
  | Increment.Action

type Cmd = Component.Cmd<State, Action>

const render = (state: State): Dom.Element => 
  Dom.div(
    [],
    [
      ...state.map(Increment.Render),
      Dom.button(
        [ Dom.onClick<Action>(['AddIncrementer']) ],
        [ Dom.text('Add') ]
      )
    ]
  )

const update = (action: Action) => (incrementers: State): State | Cmd => {
  const [kind] = action
  switch (kind) {
    case 'AddIncrementer': 
      const id = Math.max(...incrementers.map(s => s.id)) + 1
      return [ ...incrementers, Increment.create(id) ] 
    default:
      return incrementers.map(Increment.Update(action as Increment.Action))
  }
}

// register root component
Component.createRootComponent<State, Action>({ update, render, state: [Increment.create(0)] })