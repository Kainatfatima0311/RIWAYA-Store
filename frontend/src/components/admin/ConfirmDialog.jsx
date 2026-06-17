import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '@/components/ui/Button';

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', description, confirmLabel = 'Confirm', confirmVariant = 'destructive', loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-destructive/10 p-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
      </div>
    </Modal>
  );
}
