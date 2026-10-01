interface FieldErrorProps {
  message: string | undefined
}

// Renders nothing when there is no error, so it can sit under every field.
function FieldError({ message }: FieldErrorProps) {
  if (message === undefined) {
    return null
  }
  return <span className="field-error">{message}</span>
}

export default FieldError
