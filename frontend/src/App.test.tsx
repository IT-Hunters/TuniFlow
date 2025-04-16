import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the correct text', () => {
  render(<App />);
  const heading = screen.getByText(/vite \+ react/i); // Adjust based on your App.tsx content
  expect(heading).toBeInTheDocument();
});
