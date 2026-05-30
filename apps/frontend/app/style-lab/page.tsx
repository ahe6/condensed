const products = [
  {
    initials: "DM",
    name: "Daily Mug",
    detail: "Ceramic desk companion",
    price: "$21.50"
  },
  {
    initials: "NB",
    name: "Notebook Set",
    detail: "Three-pack, dot grid",
    price: "$18.00"
  },
  {
    initials: "TC",
    name: "Cable Kit",
    detail: "Compact travel organizer",
    price: "$32.00"
  }
];

const categories = ["Workspace", "Carry", "Home", "Gifts"];

export default function StyleLabPage() {
  return (
    <main className="style-lab-shell">
      <section className="style-lab-topbar" aria-label="Style lab navigation">
        <strong>TELE</strong>
        <nav aria-label="Mock navigation">
          <a href="#products">Products</a>
          <a href="#detail">Details</a>
          <a href="#cart">Cart</a>
        </nav>
      </section>

      <section className="style-lab-hero" aria-label="Storefront concept">
        <div className="style-lab-hero-copy">
          <p className="style-lab-eyebrow">Storefront direction A</p>
          <h1>Everyday goods, edited down to what earns a place.</h1>
          <p>
            A softer direct-to-consumer storefront direction with confident type, quiet surfaces,
            and product-first cards.
          </p>
          <div className="style-lab-actions">
            <a className="style-lab-button primary" href="#products">
              Start Shopping
            </a>
            <a className="style-lab-button" href="#detail">
              View Product
            </a>
          </div>
        </div>
        <div className="style-lab-hero-card" aria-label="Featured product mockup">
          <div className="style-lab-product-art">DM</div>
          <div>
            <span>Featured</span>
            <strong>Daily Mug</strong>
            <small>$21.50</small>
          </div>
        </div>
      </section>

      <section className="style-lab-categories" aria-label="Category tiles">
        {categories.map((category) => (
          <article key={category}>
            <span>{category}</span>
            <strong>Shop {category.toLowerCase()}</strong>
          </article>
        ))}
      </section>

      <section className="style-lab-section" id="products" aria-label="Product card concepts">
        <div className="style-lab-section-heading">
          <p className="style-lab-eyebrow">Product grid</p>
          <h2>Clean cards with strong product targets.</h2>
        </div>
        <div className="style-lab-product-grid">
          {products.map((product) => (
            <article className="style-lab-product-card" key={product.name}>
              <div className="style-lab-product-art">{product.initials}</div>
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

      <section className="style-lab-detail" id="detail" aria-label="Product detail concept">
        <div className="style-lab-detail-art">DM</div>
        <article>
          <p className="style-lab-eyebrow">Product detail</p>
          <h2>Daily Mug</h2>
          <p>
            A focused product page layout with the buying controls held in one calm purchase panel.
          </p>
          <div className="style-lab-pills">
            <span>Live stock</span>
            <span>Tracked delivery</span>
            <span>Secure checkout</span>
          </div>
          <label>
            <span>Variant</span>
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
            <button type="button">Add to Cart</button>
          </div>
        </article>
      </section>

      <section className="style-lab-cart" id="cart" aria-label="Cart concept">
        <div>
          <p className="style-lab-eyebrow">Cart</p>
          <h2>Checkout summary</h2>
        </div>
        <div className="style-lab-cart-summary">
          <article>
            <span>Items</span>
            <strong>2</strong>
          </article>
          <article>
            <span>Total</span>
            <strong>$39.50</strong>
          </article>
          <button type="button">Continue</button>
        </div>
      </section>
    </main>
  );
}
