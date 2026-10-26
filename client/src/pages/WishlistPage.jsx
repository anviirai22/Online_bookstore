import { Link } from 'react-router-dom';
import BookCard from '../components/BookCard';
import { EmptyState, PageIntro } from '../components/Feedback';
import { useWishlist } from '../contexts/WishlistContext';

export default function WishlistPage() {
  const { books } = useWishlist();
  return <section className="page-section"><PageIntro eyebrow="Keep an eye on these" title="Wishlist">Books you want to come back to.</PageIntro>{books.length ? <div className="book-grid">{books.map((book) => <BookCard key={book.id} book={book} />)}</div> : <EmptyState title="Your wishlist is open space">Save books while you browse and build a shelf for later.</EmptyState>}<Link to="/books" className="outline-button">Browse books</Link></section>;
}
