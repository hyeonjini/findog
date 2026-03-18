interface SaveButtonProps {
  onSave: () => void;
  saving: boolean;
  disabled?: boolean;
}

export function SaveButton({ onSave, saving, disabled }: SaveButtonProps) {
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={saving || disabled}
      style={{
        width: '100%',
        padding: '10px',
        background: saving || disabled ? '#93c5fd' : '#2563eb',
        color: '#ffffff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: saving || disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {saving ? 'Saving...' : 'Save Product'}
    </button>
  );
}
