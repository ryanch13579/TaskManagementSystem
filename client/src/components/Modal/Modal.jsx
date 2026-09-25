import { X } from "lucide-react";
import { styles } from "./Modal.styles";

// A popup box with a title bar and a close (X) button.
//   <Modal title="Add Plan" onClose={close}> ...form... </Modal>
function Modal({ title, onClose, width = "max-w-md", children }) {
  return (
    <div className={styles.overlay}>
      <div className={`${styles.box} ${width}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Cancel + submit buttons for the bottom of a form inside a Modal.
export function ModalFooter({ onCancel, submitLabel }) {
  return (
    <div className={styles.footer}>
      <button type="button" onClick={onCancel} className={styles.cancelBtn}>
        Cancel
      </button>
      <button type="submit" className={styles.submitBtn}>
        {submitLabel}
      </button>
    </div>
  );
}

export default Modal;
