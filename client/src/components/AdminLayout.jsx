import { NavLink, Outlet } from 'react-router-dom';

function linkClass({ isActive }) { return isActive ? 'admin-nav-link active' : 'admin-nav-link'; }

export default function AdminLayout() {
  return <section className="admin-shell"><aside className="admin-sidebar"><p className="eyebrow">Operations</p><h1>Admin desk</h1><nav><NavLink to="/admin" end className={linkClass}>Overview</NavLink><NavLink to="/admin/books" className={linkClass}>Books &amp; stock</NavLink><NavLink to="/admin/categories" className={linkClass}>Categories</NavLink><NavLink to="/admin/orders" className={linkClass}>Orders</NavLink><NavLink to="/admin/reviews" className={linkClass}>Reviews</NavLink><NavLink to="/admin/users" className={linkClass}>Users</NavLink></nav></aside><div className="admin-content"><Outlet /></div></section>;
}
