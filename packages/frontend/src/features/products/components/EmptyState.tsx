import { Button } from '@findog/design-system';
import { cn } from '@findog/design-system/utils/cn';

export interface EmptyStateProps {
  onCreateClick?: () => void;
  className?: string;
}

export function EmptyState({ onCreateClick, className }: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className={cn(
        'flex flex-col items-center justify-center py-20 text-center',
        className,
      )}
    >
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: 'var(--color-brand-50)', fontSize: '2rem' }}
      >
        📦
      </div>

      <h3
        className="mb-2"
        style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)',
        }}
      >
        추적 중인 상품이 없어요
      </h3>

      <p
        className="mb-6 max-w-xs"
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-muted)',
          lineHeight: 'var(--line-height-normal)',
        }}
      >
        관심 있는 상품을 추가하고 한곳에서 관리하세요.
      </p>

      {onCreateClick && (
        <Button onClick={onCreateClick}>
          + 첫 번째 상품 추가하기
        </Button>
      )}
    </div>
  );
}
