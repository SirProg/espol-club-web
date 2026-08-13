import Modal from './Modal'
import Button from './Button'

/**
 * Confirmación destructiva. El texto es obligatorio: ningún borrado/baja
 * ocurre sin que el usuario vea qué está a punto de hacer.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = '¿Confirmar acción?',
  message,
  confirmLabel = 'Confirmar',
  danger,
  busy,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Procesando…' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="t-body">{message}</p>
    </Modal>
  )
}
