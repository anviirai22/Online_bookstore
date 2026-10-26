import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import BookCard from '../components/BookCard';
import { EmptyState, ErrorBanner, LoadingState, Notice, PageIntro } from '../components/Feedback';
import { api } from '../api';

export default function HomePage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState({ books: [], pagination: {} });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const query = Object.fromEntries(searchParams.entries());
  const queryString = searchParams.toString();
  const isHome = location.pathname === '/';

  useEffect(() => {
    api.catalog.categories().then((response) => setCategories(response.data.categories)).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.catalog.books(Object.fromEntries(new URLSearchParams(queryString).entries()))
      .then((response) => { if (!cancelled) setBooks(response.data); })
      .catch((requestError) => { if (!cancelled) setError(requestError.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [queryString]);

  function updateQuery(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = Object.fromEntries([...data.entries()].filter(([, value]) => value !== ''));
    setSearchParams(next);
  }

  function clearFilters() {
    setSearchParams(query.q ? { q: query.q } : {});
  }

  return (
    <>
      {isHome && <section className="hero-section">
        <div className="hero-copy"><p className="eyebrow">A quieter kind of bookstore</p><h1>Find the book that keeps you company.</h1><p>New perspectives, old friends, and well-made pages for wherever your attention wants to go next.</p><Link className="primary-button" to="/books">Explore the shelves</Link></div>
        <div className="hero-art" aria-hidden="true"><div className="hero-sun" /><div className="hero-line line-one" /><div className="hero-line line-two" /><div className="hero-book">L<span>&amp;L</span></div><p>READ<br />WIDELY</p></div>
      </section>}
      <section className="catalog-section page-section">
        <div className="section-top">{isHome ? <div><p className="eyebrow">The current edit</p><h2>Books worth making room for</h2></div> : <PageIntro eyebrow="The catalogue" title="Browse the shelves" />}{isHome && <Link className="outline-button" to="/books">See all books</Link>}</div>
        {!isHome && <form className="search-bar" onSubmit={updateQuery}><label htmlFor="catalog-search">Search by title, author, or keyword</label><div className="search-row"><input id="catalog-search" name="q" defaultValue={query.q || ''} placeholder="Try “design”, “Mira Sen”, or “focus”" /><button className="primary-button" type="submit">Search</button></div></form>}
        <div className="catalog-layout">
          {!isHome && <aside className="filter-panel"><div className="filter-heading"><strong>Refine</strong><button type="button" className="plain-button" onClick={clearFilters}>Clear</button></div><form onSubmit={updateQuery}><label className="form-field"><span>Category</span><select name="category" defaultValue={query.category || ''}><option value="">All categories</option>{categories.map((category) => <option value={category.slug} key={category.id}>{category.name}</option>)}</select></label><div className="filter-split"><label className="form-field"><span>Min price</span><input name="minPrice" type="number" min="0" defaultValue={query.minPrice || ''} placeholder="Rs. 0" /></label><label className="form-field"><span>Max price</span><input name="maxPrice" type="number" min="0" defaultValue={query.maxPrice || ''} placeholder="Rs. 5,000" /></label></div><label className="check-field"><input name="available" type="checkbox" value="true" defaultChecked={query.available === 'true'} /><span>Only show in-stock books</span></label><label className="form-field"><span>Sort by</span><select name="sort" defaultValue={query.sort || 'newest'}><option value="newest">Newest first</option><option value="rating">Best rated</option><option value="priceAsc">Price: low to high</option><option value="priceDesc">Price: high to low</option><option value="title">Title</option></select></label><button className="primary-button full-button" type="submit">Apply filters</button></form></aside>}
          <div className="catalog-results"><Notice message={notice} /><ErrorBanner message={error} />{loading ? <LoadingState label="Opening the catalogue" /> : books.books.length === 0 ? <EmptyState title="No books found">Try another search or clear a filter to see more of the catalogue.</EmptyState> : <div className="book-grid">{books.books.map((book) => <BookCard key={book.id} book={book} onNotice={setNotice} />)}</div>}{!loading && books.pagination?.pages > 1 && <div className="pagination"><span>Page {books.pagination.page} of {books.pagination.pages}</span><div><button type="button" className="outline-button" disabled={books.pagination.page <= 1} onClick={() => setSearchParams({ ...query, page: String(books.pagination.page - 1) })}>Previous</button><button type="button" className="outline-button" disabled={books.pagination.page >= books.pagination.pages} onClick={() => setSearchParams({ ...query, page: String(books.pagination.page + 1) })}>Next</button></div></div>}</div>
        </div>
      </section>
      {isHome && <section className="values-strip"><div><span>01</span><strong>Curated, not crowded</strong><p>Good books deserve a little breathing room.</p></div><div><span>02</span><strong>Always human</strong><p>Recommendations with a point of view.</p></div><div><span>03</span><strong>Made to return to</strong><p>Build a shelf that changes with you.</p></div></section>}
    </>
  );
}
