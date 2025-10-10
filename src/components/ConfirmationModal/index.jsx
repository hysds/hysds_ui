import React from "react";
import PropTypes from "prop-types";

import { Button } from "../Buttons";

import "./style.css";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  confirmColor,
  loading,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="confirmation-modal-overlay" onClick={handleBackdropClick}>
      <div className="confirmation-modal">
        <div className="confirmation-modal-header">
          <h3 className="confirmation-modal-title">{title}</h3>
          <button
            className="confirmation-modal-close"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>
        <div className="confirmation-modal-body">
          <p className="confirmation-modal-message">{message}</p>
        </div>
        <div className="confirmation-modal-footer">
          <Button
            size="large"
            color="fail"
            label={cancelText || "Cancel"}
            onClick={onClose}
            disabled={loading}
          />
          <Button
            size="large"
            color={confirmColor || "success"}
            label={confirmText || "Confirm"}
            onClick={onConfirm}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmColor: PropTypes.string,
  loading: PropTypes.bool,
};

ConfirmationModal.defaultProps = {
  confirmText: "Confirm",
  cancelText: "Cancel",
  confirmColor: "success",
  loading: false,
};

export default ConfirmationModal;
