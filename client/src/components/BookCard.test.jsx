import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import BookCard from './BookCard';

vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('../contexts/CartContext', () => ({ useCart: () => ({ add: vi.fn().mockResolvedValue(undefined) }) }));
vi.mock('../contexts/WishlistContext', () => ({ useWishlist: () => ({ books: [], toggle: vi.fn() }) }));

const book = { id: 'book-1', title: 'The Test Shelf', author: 'A Reader', category: { name: 'Fiction' }, price: 12, priceCents: 1200, stockQuantity: 4, available: true, averageRating: 4, reviewCount: 2, coverUrl: '' };

describe('BookCard', () => {
  it('renders catalogue details and adds a book to the cart', async () => {
    const onNotice = vi.fn();
    render(<MemoryRouter><BookCard book={book} onNotice={onNotice} /></MemoryRouter>);
    expect(screen.getByText('The Test Shelf')).toBeInTheDocument();
    expect(screen.getByText('A Reader')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    await waitFor(() => expect(onNotice).toHaveBeenCalledWith('The Test Shelf was added to your cart.'));
  });
});
