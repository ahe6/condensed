const products = [
  {
    initials: "DM",
    name: "Daily Mug",
    detail: "Ceramic desk companion",
    price: "$21.50",
    image: "/style-lab/daily-mug.png",
    color: "sage"
  },
  {
    initials: "NB",
    name: "Notebook Set",
    detail: "Three-pack, dot grid",
    price: "$18.00",
    image: "/style-lab/notebook-set.png",
    color: "clay"
  },
  {
    initials: "TC",
    name: "Cable Kit",
    detail: "Compact travel organizer",
    price: "$32.00",
    image: "/style-lab/cable-kit.png",
    color: "ink"
  }
];

export default function StyleLabPage() {
  return (
    <main className="style-lab-shell">
      <section className="style-lab-hero" aria-label="Storefront concept">
        <div className="style-lab-hero-brand" aria-label="Storefront brand">
          <strong>health</strong>
          <span>Small catalog / reliable shipping</span>
        </div>
        <div className="style-lab-hero-copy">
          <p className="style-lab-eyebrow">Desk and daily carry</p>
          <h1>Useful goods for better everyday routines.</h1>
          <p>
            Durable accessories for work, home, and travel. Live inventory, secure checkout, and
            tracked delivery on every order.
          </p>
          <div className="style-lab-actions">
            <a className="style-lab-button primary" href="#products">
              Shop arrivals
            </a>
            <a className="style-lab-button" href="#detail">
              See daily mug
            </a>
          </div>
        </div>
        <div className="style-lab-hero-proof" aria-label="Storefront promises">
          <span>edited essentials</span>
          <span>live stock</span>
          <span>tracked delivery</span>
        </div>
      </section>

      <section className="style-lab-section" id="products" aria-label="Product card concepts">
        <div className="style-lab-section-heading">
          <p className="style-lab-eyebrow">Popular right now</p>
          <h2>Ready-to-ship essentials for the desk and bag.</h2>
        </div>
        <div className="style-lab-product-grid">
          {products.map((product) => (
            <article className="style-lab-product-card" key={product.name}>
              <div className={`style-lab-product-art style-lab-product-${product.color}`}>
                <img src={product.image} alt={`${product.name} mock product`} />
              </div>
              <div className="style-lab-product-card-body">
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.detail}</p>
                </div>
                <div className="style-lab-product-buy">
                  <strong>{product.price}</strong>
                  <button type="button">Add</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="style-lab-detail-band">
        <section className="style-lab-detail" id="detail" aria-label="Product detail concept">
          <div className="style-lab-detail-art">
            <img src="/style-lab/daily-mug.png" alt="Daily Mug mock product detail" />
          </div>
          <article>
            <p className="style-lab-eyebrow">In stock today</p>
            <h2>Daily Mug</h2>
            <p>
              Stoneware weight, soft-touch glaze, and a stable base for long desk days.
            </p>
            <div className="style-lab-pills">
              <span>live stock</span>
              <span>tracked delivery</span>
              <span>secure checkout</span>
            </div>
            <label>
              <span>variant</span>
              <select defaultValue="default">
                <option value="default">Default Variant - $21.50</option>
                <option value="gift">Gift Set - $36.00</option>
              </select>
            </label>
            <div className="style-lab-detail-buy">
              <div>
                <strong>$21.50</strong>
                <span>98 in stock</span>
              </div>
              <button type="button">Add to cart</button>
            </div>
          </article>
        </section>
      </div>

      <div className="style-lab-cart-band">
        <section className="style-lab-cart" id="cart" aria-label="Cart concept">
          <div>
            <p className="style-lab-eyebrow">Secure checkout</p>
            <h2>Review, pay, and track it from your account.</h2>
          </div>
          <div className="style-lab-cart-summary">
            <article>
              <span>items</span>
              <strong>2</strong>
            </article>
            <article>
              <span>total</span>
              <strong>$39.50</strong>
            </article>
            <button type="button">Continue</button>
          </div>
        </section>
      </div>
    </main>
  );
}
