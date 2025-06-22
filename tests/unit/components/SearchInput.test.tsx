/**
 * SearchInput component unit tests
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchInput from '../../../src/components/SearchInput';

// Mock the Electron API from preload
beforeAll(() => {
  // Mock electron API
  (global as any).window.electronAPI = {
    hideWindow: jest.fn(),
    quitApp: jest.fn(),
    onKeyPress: jest.fn(),
  };
});

describe('SearchInput', () => {
  const defaultProps = {
    searchQuery: '',
    isSearchActive: false,
    onSearchChange: jest.fn(),
    onSearchSubmit: jest.fn(),
  };
  
  it('renders correctly with default props', () => {
    render(<SearchInput {...defaultProps} />);
    
    // Check if the input field is rendered
    const inputElement = screen.getByPlaceholderText('Type a command...');
    expect(inputElement).toBeInTheDocument();
  });
  
  it('calls onSearchChange when typing', () => {
    const mockOnChange = jest.fn();
    render(<SearchInput 
      {...defaultProps}
      onSearchChange={mockOnChange}
    />);
    
    // Find the input element
    const inputElement = screen.getByPlaceholderText('Type a command...');
    
    // Simulate typing
    const changeEvent = { target: { value: 'git' } } as React.ChangeEvent<HTMLInputElement>;
    fireEvent.change(inputElement, changeEvent);
    
    // Verify onSearchChange was called
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(changeEvent);
  });
  
  it('displays search query from props', () => {
    render(<SearchInput 
      {...defaultProps}
      searchQuery="git"
    />);
    
    // Find the input element
    const inputElement = screen.getByPlaceholderText('Type a command...') as HTMLInputElement;
    
    // Check if input value matches prop
    expect(inputElement.value).toBe('git');
  });
});
