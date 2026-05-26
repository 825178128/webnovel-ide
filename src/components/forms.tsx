import type { ReactNode } from 'react'

export function FormPanel(props: { title: string; children: ReactNode }) {
  return (
    <section className="form-panel">
      <h1>{props.title}</h1>
      {props.children}
    </section>
  )
}

export function TextField(props: {
  label: string
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
}) {
  return (
    <label className="field-block">
      {props.label}
      <input
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        autoFocus={props.autoFocus}
      />
    </label>
  )
}

export function TextAreaField(props: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="field-block">
      {props.label}
      <textarea value={props.value} onChange={(event) => props.onChange(event.target.value)} />
    </label>
  )
}
