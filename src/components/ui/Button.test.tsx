import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button component', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveClass('btn', 'btn-primary', 'btn-md');
  });

  it('renders loading spinner when isLoading is true', () => {
    render(<Button isLoading>Submit</Button>);
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toBeDisabled();
    // Lucide react SVG has an svg tag with class 'spin' (defined in our styling)
    const spinner = buttonElement.querySelector('svg.spin');
    expect(spinner).toBeInTheDocument();
  });

  it('applies the correct variant class', () => {
    render(<Button variant="ghost">Cancel</Button>);
    const buttonElement = screen.getByRole('button', { name: /cancel/i });
    expect(buttonElement).toHaveClass('btn-ghost');
  });
});
