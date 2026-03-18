import { render, screen } from '@testing-library/react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from './AlertDialog';

describe('AlertDialog', () => {
  it('renders when open', () => {
    render(
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Confirm</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>,
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <AlertDialog open={false}>
        <AlertDialogContent>
          <AlertDialogTitle>Hidden</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>,
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('renders action and cancel buttons', () => {
    render(
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogTitle>Title</AlertDialogTitle>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Archive</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>,
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Archive')).toBeInTheDocument();
  });
});
