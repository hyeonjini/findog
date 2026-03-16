import { render, screen } from '@testing-library/react';
import { Dialog, DialogContent, DialogTitle } from './Dialog';

describe('Dialog', () => {
  it('renders content when open', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Test Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    render(
      <Dialog open={false}>
        <DialogContent>
          <DialogTitle>Hidden Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden Title')).not.toBeInTheDocument();
  });

  it('renders dialog title text', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>My Dialog Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByText('My Dialog Title')).toBeInTheDocument();
  });
});
