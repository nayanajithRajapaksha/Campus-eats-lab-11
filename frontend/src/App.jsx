import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from './api'
import './App.css'

const categories = ['All', 'Meals', 'Snacks', 'Drinks']

const currency = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  currencyDisplay: 'code',
  minimumFractionDigits: 2,
})

const dateTime = new Intl.DateTimeFormat('en-LK', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function readCart() {
  try {
    const stored = JSON.parse(localStorage.getItem('campusEatsCart') || '[]')
    return Array.isArray(stored)
      ? stored.filter(
          (item) => Number.isInteger(item.id) && item.id > 0 && Number.isInteger(item.quantity) && item.quantity > 0,
        )
      : []
  } catch {
    return []
  }
}

function Icon({ name, size = 20 }) {
  const paths = {
    arrow: <path d="m5 12 14 0m-6-6 6 6-6 6" />,
    bag: <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    minus: <path d="M5 12h14" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7" /><path d="M10 11v5m4-5v5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
  }

  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 42 42">
        <path d="M8 17c2-7 7-11 13-11s11 4 13 11" />
        <path d="M6 19h30c0 10-6 17-15 17S6 29 6 19Z" />
        <path d="M14 14c2-3 4-5 7-7m1 8c2-3 5-5 8-5" />
      </svg>
    </span>
  )
}

function FoodArt({ item }) {
  const palette = [
    ['#F8B35E', '#D95F35', '#FAE1A6'],
    ['#8FBC68', '#EB8D45', '#F8D898'],
    ['#F0A04B', '#A84C2B', '#F6C96C'],
    ['#9FBE67', '#D36C36', '#F4D785'],
    ['#EAB262', '#5A8A61', '#F8E3B0'],
    ['#D68A42', '#7E9F57', '#F1C16B'],
    ['#C6844B', '#F4DFC2', '#8A5A34'],
    ['#A9C95E', '#F4D15D', '#EEF0B2'],
  ][(item.id - 1) % 8]

  if (item.category === 'Drinks') {
    return (
      <svg viewBox="0 0 320 210" role="img" aria-label={`${item.name} illustration`}>
        <rect width="320" height="210" rx="26" fill={palette[2]} />
        <circle cx="64" cy="48" r="30" fill={palette[1]} opacity=".16" />
        <path d="M117 46h88l-9 118h-70l-9-118Z" fill="#fffaf0" stroke="#174c3b" strokeWidth="5" />
        <path d="M124 91h75l-6 69h-63l-6-69Z" fill={palette[0]} opacity=".82" />
        <path d="M162 46c10-18 22-26 37-29" fill="none" stroke="#174c3b" strokeWidth="5" strokeLinecap="round" />
        <path d="M184 19c12 0 21 4 27 12-14 5-25 1-27-12Z" fill="#5f9c63" />
        <circle cx="231" cy="154" r="26" fill={palette[1]} opacity=".9" />
        <path d="M218 154h26M231 141v26" stroke="#fff7e8" strokeWidth="3" opacity=".8" />
      </svg>
    )
  }

  if (item.category === 'Snacks') {
    return (
      <svg viewBox="0 0 320 210" role="img" aria-label={`${item.name} illustration`}>
        <rect width="320" height="210" rx="26" fill={palette[2]} />
        <path d="M73 148c31-68 143-88 181-24-42 45-138 59-181 24Z" fill="#fffaf0" stroke="#174c3b" strokeWidth="5" />
        <path d="M93 135c35-43 111-56 143-18-41 25-100 34-143 18Z" fill={palette[0]} />
        <path d="m117 118 18-18m20 10 18-20m17 15 17-14" stroke={palette[1]} strokeWidth="9" strokeLinecap="round" />
        <circle cx="75" cy="52" r="24" fill={palette[1]} opacity=".14" />
        <path d="M244 53c14 8 19 18 15 31-15-2-22-12-15-31Z" fill="#6c9d5d" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 320 210" role="img" aria-label={`${item.name} illustration`}>
      <rect width="320" height="210" rx="26" fill={palette[2]} />
      <ellipse cx="160" cy="140" rx="103" ry="34" fill="#fffaf0" stroke="#174c3b" strokeWidth="5" />
      <path d="M78 130c17-56 51-81 82-81s67 27 82 81" fill={palette[0]} stroke="#174c3b" strokeWidth="5" />
      <circle cx="125" cy="91" r="18" fill={palette[1]} />
      <circle cx="170" cy="79" r="16" fill="#f7e7a8" />
      <circle cx="199" cy="105" r="19" fill="#6f9e5e" />
      <path d="M85 132h150" stroke="#174c3b" strokeWidth="5" strokeLinecap="round" />
      <path d="M245 44c12 6 18 17 14 30-14 0-23-10-14-30Z" fill="#6c9d5d" />
    </svg>
  )
}

function Header({ cartCount, onCart, onHome, onMenu, onOrders, onAccount, user }) {
  return (
    <div className="site-header-bar">
      <header className="site-header">
        <button className="brand" type="button" onClick={onHome} aria-label="CampusEats home">
          <BrandMark />
          <span>CampusEats</span>
        </button>
        <nav aria-label="Primary navigation">
          <button type="button" onClick={onMenu}>Menu</button>
          <button type="button" onClick={onOrders}>My Orders</button>
        </nav>
        <div className="header-actions">
          <button className="account-button" type="button" onClick={onAccount}>
            <Icon name="user" size={18} />
            <span>{user ? user.name.split(' ')[0] : 'Sign in'}</span>
          </button>
          <button className="cart-button" type="button" onClick={onCart} aria-label={`Open cart with ${cartCount} items`}>
            <Icon name="bag" size={21} />
            <span className="cart-label">Cart</span>
            <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </header>
    </div>
  )
}

function MenuCard({ item, onAdd }) {
  return (
    <article className="menu-card">
      <div className="food-art"><FoodArt item={item} /></div>
      <div className="menu-card-body">
        <span className="category-label">{item.category}</span>
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <div className="menu-card-footer">
          <strong>{currency.format(item.price)}</strong>
          <button type="button" className="add-button" onClick={() => onAdd(item)}>
            <Icon name="plus" size={18} /> Add to cart
          </button>
        </div>
      </div>
    </article>
  )
}

function MenuSkeletons() {
  return (
    <div className="menu-grid" aria-label="Loading menu" aria-busy="true">
      {Array.from({ length: 8 }, (_, index) => (
        <div className="menu-card skeleton-card" key={index}>
          <div className="skeleton artwork-skeleton" />
          <div className="menu-card-body">
            <span className="skeleton short-line" />
            <span className="skeleton title-line" />
            <span className="skeleton text-line" />
            <span className="skeleton text-line small" />
          </div>
        </div>
      ))}
    </div>
  )
}

function CartDrawer({ items, isOpen, isSubmitting, onClose, onExplore, onQuantity, onRemove, onCheckout }) {
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)

  return (
    <>
      <button className={`scrim ${isOpen ? 'visible' : ''}`} type="button" onClick={onClose} aria-label="Close cart" tabIndex={isOpen ? 0 : -1} />
      <aside className={`cart-drawer ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen} aria-label="Shopping cart" role="dialog" aria-modal="true" inert={!isOpen}>
        <div className="drawer-header">
          <div><span className="eyebrow">Your order</span><h2>Campus cart</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close cart"><Icon name="close" /></button>
        </div>

        {items.length === 0 ? (
          <div className="empty-cart">
            <span className="empty-cart-icon"><Icon name="bag" size={32} /></span>
            <h3>Your cart is hungry</h3>
            <p>Add something delicious from the menu and it will appear here.</p>
            <button type="button" className="secondary-button" onClick={onExplore}>Explore the menu</button>
          </div>
        ) : (
          <>
            <div className="cart-lines">
              {items.map((item) => (
                <div className="cart-line" key={item.id}>
                  <div className="cart-line-art"><FoodArt item={item} /></div>
                  <div className="cart-line-copy">
                    <h3>{item.name}</h3>
                    <span>{currency.format(item.price)}</span>
                    <div className="quantity-row">
                      <div className="quantity-control" aria-label={`Quantity for ${item.name}`}>
                        <button type="button" onClick={() => onQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name}`}><Icon name="minus" size={16} /></button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button type="button" onClick={() => onQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= 20} aria-label={`Increase ${item.name}`}><Icon name="plus" size={16} /></button>
                      </div>
                      <button className="remove-button" type="button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`}><Icon name="trash" size={17} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="drawer-footer">
              <div className="subtotal-row"><span>Subtotal</span><strong>{currency.format(subtotal)}</strong></div>
              <p>Pay on pickup · No online payment required</p>
              <button className="primary-button checkout-button" type="button" onClick={onCheckout} disabled={isSubmitting}>
                {isSubmitting ? 'Placing your order…' : 'Place order'}
                {!isSubmitting && <Icon name="arrow" />}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}

function AuthModal({ mode, isOpen, error, isSubmitting, onClose, onMode, onSubmit, user, onLogout }) {
  const [fields, setFields] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})

  const update = (event) => {
    setFields((current) => ({ ...current, [event.target.name]: event.target.value }))
    setErrors((current) => ({ ...current, [event.target.name]: '' }))
  }

  const submit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (mode === 'register' && fields.name.trim().length < 2) nextErrors.name = 'Enter at least 2 characters.'
    if (!/^\S+@\S+\.\S+$/.test(fields.email)) nextErrors.email = 'Enter a valid email address.'
    if (fields.password.length < 8) nextErrors.password = 'Use at least 8 characters.'
    if (mode === 'register' && fields.password !== fields.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) onSubmit(fields)
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Close account dialog"><Icon name="close" /></button>
        <BrandMark />
        {user ? (
          <div className="account-panel">
            <span className="eyebrow">Signed in</span>
            <h2 id="auth-title">Hi, {user.name}</h2>
            <p>{user.email}</p>
            <button className="secondary-button" type="button" onClick={onLogout}>Sign out</button>
          </div>
        ) : (
          <>
            <span className="eyebrow">Welcome to CampusEats</span>
            <h2 id="auth-title">{mode === 'login' ? 'Good to see you again.' : 'Create your account.'}</h2>
            <p className="modal-intro">Sign in to place an order and keep track of every pickup.</p>
            <div className="auth-tabs" role="tablist" aria-label="Account action">
              <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => onMode('login')}>Sign in</button>
              <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => onMode('register')}>Register</button>
            </div>
            <form onSubmit={submit} noValidate>
              {mode === 'register' && (
                <label>Full name
                  <input name="name" value={fields.name} onChange={update} autoComplete="name" placeholder="Kasun Perera" aria-invalid={Boolean(errors.name)} />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </label>
              )}
              <label>Email address
                <input name="email" type="email" value={fields.email} onChange={update} autoComplete="email" placeholder="you@campus.edu" aria-invalid={Boolean(errors.email)} />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </label>
              <label>Password
                <input name="password" type="password" value={fields.password} onChange={update} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" aria-invalid={Boolean(errors.password)} />
                {errors.password && <span className="field-error">{errors.password}</span>}
              </label>
              {mode === 'register' && (
                <label>Confirm password
                  <input name="confirmPassword" type="password" value={fields.confirmPassword} onChange={update} autoComplete="new-password" placeholder="Repeat your password" aria-invalid={Boolean(errors.confirmPassword)} />
                  {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                </label>
              )}
              {error && <div className="form-error" role="alert">{error}</div>}
              <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  )
}

function OrdersView({ orders, isLoading, error, onRetry, onMenu }) {
  return (
    <main className="orders-page">
      <div className="page-heading">
        <span className="eyebrow">Your order history</span>
        <h1>My Orders</h1>
        <p>All your CampusEats pickups, newest first.</p>
      </div>
      {isLoading ? (
        <div className="orders-list" aria-busy="true">
          {[1, 2, 3].map((item) => <div className="order-card order-skeleton skeleton" key={item} />)}
        </div>
      ) : error ? (
        <EmptyState title="We couldn't load your orders" copy={error} action="Try again" onAction={onRetry} />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders yet" copy="Your first campus pickup is only a few clicks away." action="Explore the menu" onAction={onMenu} />
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-card-header">
                <div><span>Order</span><strong>#{String(order.id).padStart(4, '0')}</strong></div>
                <span className="status-pill"><Icon name="check" size={15} /> {order.status}</span>
              </div>
              <div className="order-meta"><span>{dateTime.format(new Date(order.createdAtUtc))}</span><span>{order.paymentMethod}</span></div>
              <div className="order-items">
                {order.items.map((item) => (
                  <div key={`${order.id}-${item.menuItemId}`}><span>{item.quantity} × {item.name}</span><strong>{currency.format(item.lineTotal)}</strong></div>
                ))}
              </div>
              <div className="order-total"><span>Total</span><strong>{currency.format(order.total)}</strong></div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}

function EmptyState({ title, copy, action, onAction }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon"><BrandMark /></span>
      <h2>{title}</h2>
      <p>{copy}</p>
      <button className="primary-button" type="button" onClick={onAction}>{action}</button>
    </div>
  )
}

function Confirmation({ order, onOrders, onMenu }) {
  return (
    <main className="confirmation-page">
      <div className="confirmation-card">
        <span className="success-mark"><Icon name="check" size={40} /></span>
        <span className="eyebrow">Order confirmed</span>
        <h1>Lunch is sorted.</h1>
        <p>Your order <strong>#{String(order.id).padStart(4, '0')}</strong> is saved. Pay {currency.format(order.total)} when you pick it up.</p>
        <div className="confirmation-actions">
          <button className="primary-button" type="button" onClick={onOrders}>View my orders</button>
          <button className="secondary-button" type="button" onClick={onMenu}>Back to menu</button>
        </div>
      </div>
    </main>
  )
}

function App() {
  const [menu, setMenu] = useState([])
  const [menuState, setMenuState] = useState({ loading: true, error: '' })
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [cart, setCart] = useState(readCart)
  const [cartOpen, setCartOpen] = useState(false)
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authState, setAuthState] = useState({ loading: false, error: '' })
  const [authIntent, setAuthIntent] = useState(null)
  const [view, setView] = useState('menu')
  const [orders, setOrders] = useState([])
  const [ordersState, setOrdersState] = useState({ loading: false, error: '' })
  const [checkoutState, setCheckoutState] = useState({ loading: false, error: '' })
  const [confirmedOrder, setConfirmedOrder] = useState(null)
  const [announcement, setAnnouncement] = useState('')

  const loadMenu = useCallback(() => {
    return apiRequest('/api/menu').then((data) => {
      const items = Array.isArray(data) ? data : []
      setMenu(items)
      const menuIds = new Set(items.map((item) => item.id))
      setCart((current) => current
        .filter((line) => menuIds.has(line.id))
        .map((line) => ({ ...line, quantity: Math.min(20, line.quantity) })))
      setMenuState({ loading: false, error: '' })
    }).catch((error) => {
      setMenuState({ loading: false, error: error.message })
    })
  }, [])

  useEffect(() => { loadMenu() }, [loadMenu])
  useEffect(() => { localStorage.setItem('campusEatsCart', JSON.stringify(cart)) }, [cart])
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setCartOpen(false)
        setAuthOpen(false)
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  const cartItems = useMemo(() => cart
    .map((line) => {
      const item = menu.find((candidate) => candidate.id === line.id)
      return item ? { ...item, quantity: line.quantity } : null
    })
    .filter(Boolean), [cart, menu])

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const filteredMenu = useMemo(() => {
    const term = search.trim().toLowerCase()
    return menu.filter((item) => {
      const inCategory = category === 'All' || item.category === category
      const matches = !term || `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(term)
      return inCategory && matches
    })
  }, [menu, search, category])

  const announce = (message) => {
    setAnnouncement('')
    window.setTimeout(() => setAnnouncement(message), 20)
  }

  const showMenu = () => {
    setView('menu')
    setCartOpen(false)
    window.setTimeout(() => document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' }), 0)
  }

  const showHome = () => {
    setView('menu')
    setCartOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const addToCart = (item) => {
    setCart((current) => {
      const existing = current.find((line) => line.id === item.id)
      if (existing) return current.map((line) => line.id === item.id ? { ...line, quantity: Math.min(20, line.quantity + 1) } : line)
      return [...current, { id: item.id, quantity: 1 }]
    })
    announce(`${item.name} added to your cart.`)
  }

  const changeQuantity = (id, quantity) => {
    if (quantity < 1) {
      setCart((current) => current.filter((line) => line.id !== id))
      return
    }
    setCart((current) => current.map((line) => line.id === id ? { ...line, quantity: Math.min(20, quantity) } : line))
  }

  const loadOrders = useCallback(async (activeToken = token) => {
    if (!activeToken) return
    setOrdersState({ loading: true, error: '' })
    try {
      const data = await apiRequest('/api/orders/me', { token: activeToken })
      setOrders(Array.isArray(data) ? data : [])
      setOrdersState({ loading: false, error: '' })
    } catch (error) {
      if (error.status === 401) {
        setToken(null)
        setUser(null)
        setView('menu')
        setAuthIntent('orders')
        setAuthOpen(true)
        setAuthState({ loading: false, error: 'Your session expired. Please sign in again.' })
      } else {
        setOrdersState({ loading: false, error: error.message })
      }
    }
  }, [token])

  const showOrders = () => {
    if (!user) {
      setAuthMode('login')
      setAuthIntent('orders')
      setAuthOpen(true)
      setAuthState({ loading: false, error: 'Sign in to see your orders.' })
      return
    }
    setView('orders')
    loadOrders()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submitAuth = async (fields) => {
    setAuthState({ loading: true, error: '' })
    const path = authMode === 'login' ? '/api/auth/login' : '/api/auth/register'
    const body = authMode === 'login'
      ? { email: fields.email.trim(), password: fields.password }
      : { name: fields.name.trim(), email: fields.email.trim(), password: fields.password }
    try {
      const data = await apiRequest(path, { method: 'POST', body: JSON.stringify(body) })
      setToken(data.token)
      setUser(data.user)
      setAuthOpen(false)
      setAuthState({ loading: false, error: '' })
      if (authIntent === 'orders') {
        setView('orders')
        loadOrders(data.token)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else if (authIntent === 'checkout') {
        setCartOpen(true)
      }
      setAuthIntent(null)
      announce(`Welcome, ${data.user.name}.`)
    } catch (error) {
      setAuthState({ loading: false, error: error.message })
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setOrders([])
    setView('menu')
    setAuthOpen(false)
    setAuthIntent(null)
    announce('You have signed out.')
  }

  const checkout = async () => {
    if (!user || !token) {
      setCartOpen(false)
      setAuthMode('login')
      setAuthIntent('checkout')
      setAuthOpen(true)
      setAuthState({ loading: false, error: 'Sign in before placing your order.' })
      return
    }
    if (cartItems.length === 0) return
    setCheckoutState({ loading: true, error: '' })
    try {
      const order = await apiRequest('/api/orders', {
        method: 'POST', token,
        body: JSON.stringify({ items: cartItems.map((item) => ({ menuItemId: item.id, quantity: item.quantity })) }),
      })
      setConfirmedOrder(order)
      setCart([])
      setCartOpen(false)
      setCheckoutState({ loading: false, error: '' })
      setView('confirmation')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      if (error.status === 401) {
        setToken(null)
        setUser(null)
        setCartOpen(false)
        setCheckoutState({ loading: false, error: '' })
        setAuthIntent('checkout')
        setAuthOpen(true)
        setAuthState({ loading: false, error: 'Your session expired. Please sign in again.' })
      } else {
        setCheckoutState({ loading: false, error: error.message })
      }
    }
  }

  return (
    <div className="app-shell">
      <Header cartCount={cartCount} onCart={() => setCartOpen(true)} onHome={showHome} onMenu={showMenu} onOrders={showOrders}
        onAccount={() => { setAuthIntent(null); setAuthState({ loading: false, error: '' }); setAuthOpen(true) }} user={user} />

      {view === 'orders' ? (
        <OrdersView orders={orders} isLoading={ordersState.loading} error={ordersState.error} onRetry={() => loadOrders()} onMenu={showMenu} />
      ) : view === 'confirmation' && confirmedOrder ? (
        <Confirmation order={confirmedOrder} onOrders={showOrders} onMenu={showMenu} />
      ) : (
        <main>
          <section className="hero-section">
            <div className="hero-copy">
              <span className="eyebrow"><span className="live-dot" /> Fresh on campus, every day</span>
              <h1>Your next bite,<br /><em>between lectures.</em></h1>
              <p>Skip the long queue. Pick your campus favourites, order ahead, and collect when it suits your timetable.</p>
              <div className="hero-actions">
                <button className="primary-button" type="button" onClick={showMenu}>Explore Menu <Icon name="arrow" /></button>
                <span><strong>8</strong> campus favourites</span>
              </div>
            </div>
            <div className="hero-visual" aria-label="A colourful campus lunch bowl illustration">
              <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
              <div className="hero-food-card"><FoodArt item={{ id: 1, name: 'Campus lunch bowl', category: 'Meals' }} /></div>
              <span className="floating-note note-one"><Icon name="check" size={16} /> Ready for pickup</span>
              <span className="floating-note note-two">Made fresh <strong>daily</strong></span>
            </div>
          </section>

          <section className="benefit-strip" aria-label="CampusEats benefits">
            <div><strong>Fast pickup</strong><span>Order between classes</span></div>
            <div><strong>Freshly made</strong><span>Prepared on campus</span></div>
            <div><strong>Pay on pickup</strong><span>Simple and secure</span></div>
          </section>

          <section className="menu-section" id="menu">
            <div className="section-heading">
              <div><span className="eyebrow">Made for your day</span><h2>Explore the menu</h2></div>
              <p>Comfort food, quick snacks, and cool drinks—ready when you are.</p>
            </div>
            <div className="menu-toolbar">
              <label className="search-box"><span className="sr-only">Search menu</span><Icon name="search" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search dishes…" />
                {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><Icon name="close" size={17} /></button>}
              </label>
              <div className="category-chips" aria-label="Filter menu by category">
                {categories.map((item) => <button type="button" key={item} className={category === item ? 'active' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
              </div>
            </div>

            {menuState.loading ? <MenuSkeletons /> : menuState.error ? (
              <EmptyState title="The menu is taking a break" copy={menuState.error} action="Try again" onAction={() => {
                setMenuState({ loading: true, error: '' })
                loadMenu()
              }} />
            ) : filteredMenu.length === 0 ? (
              <EmptyState title="No dishes found" copy="Try another search or switch the category filter." action="Clear filters" onAction={() => { setSearch(''); setCategory('All') }} />
            ) : (
              <div className="menu-grid">{filteredMenu.map((item) => <MenuCard item={item} onAdd={addToCart} key={item.id} />)}</div>
            )}
          </section>
        </main>
      )}

      <footer><div className="brand"><BrandMark /><span>CampusEats</span></div><p>Good food, right on schedule.</p><span>Made for SLIIT campus life.</span></footer>

      <CartDrawer items={cartItems} isOpen={cartOpen} isSubmitting={checkoutState.loading}
        onClose={() => { setCartOpen(false); setCheckoutState({ loading: false, error: '' }) }} onExplore={showMenu} onQuantity={changeQuantity}
        onRemove={(id) => setCart((current) => current.filter((line) => line.id !== id))} onCheckout={checkout} />
      {checkoutState.error && <div className="error-toast" role="alert">{checkoutState.error}<button type="button" onClick={() => setCheckoutState({ loading: false, error: '' })}><Icon name="close" size={16} /></button></div>}
      <AuthModal key={`${authOpen}-${authMode}-${user?.id ?? 'guest'}`} mode={authMode} isOpen={authOpen} error={authState.error} isSubmitting={authState.loading}
        onClose={() => { setAuthOpen(false); setAuthIntent(null) }} onMode={(nextMode) => { setAuthMode(nextMode); setAuthState({ loading: false, error: '' }) }}
        onSubmit={submitAuth} user={user} onLogout={logout} />
      <div className="sr-only" aria-live="polite">{announcement}</div>
    </div>
  )
}

export default App
