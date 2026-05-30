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

const categories = [
  { name: "Workspace", tone: "sage" },
  { name: "Carry", tone: "ink" },
  { name: "Home", tone: "cream" },
  { name: "Gifts", tone: "clay" }
];

const swatches = ["#17130f", "#6f7f60", "#c86f48", "#f3dfb3", "#f8f0df"];

export default function StyleLabPage() {
  return (
    <main className="style-lab-shell">
      <section className="style-lab-topbar" aria-label="Style lab navigation">
        <strong>tele</strong>
        <nav aria-label="Mock navigation">
          <a href="#products">products</a>
          <a href="#detail">details</a>
          <a href="#cart">cart</a>
        </nav>
      </section>

      <section className="style-lab-hero" aria-label="Storefront concept">
        <div className="style-lab-hero-copy">
          <p className="style-lab-eyebrow">storefront direction a</p>
          <h1>everyday goods, edited down to what earns a place.</h1>
          <p>
            a softer direct-to-consumer storefront direction with confident type, quiet surfaces,
            and product-first cards.
          </p>
          <div className="style-lab-actions">
            <a className="style-lab-button primary" href="#products">
              start shopping
            </a>
            <a className="style-lab-button" href="#detail">
              view product
            </a>
          </div>
        </div>
        <div className="style-lab-hero-card" aria-label="Featured product mockup">
          <div className="style-lab-product-art">
            <img src="/style-lab/daily-mug.png" alt="Daily Mug mock product" />
          </div>
          <div>
            <span>featured</span>
            <strong>daily mug</strong>
            <small>$21.50</small>
          </div>
        </div>
      </section>

      <section className="style-lab-categories" aria-label="Category tiles">
        {categories.map((category) => (
          <article className={`style-lab-category-${category.tone}`} key={category.name}>
            <span>{category.name.toLowerCase()}</span>
            <strong>shop {category.name.toLowerCase()}</strong>
          </article>
        ))}
      </section>

      <section className="style-lab-palette" aria-label="Color palette concept">
        <div>
          <p className="style-lab-eyebrow">color story</p>
          <h2>warm neutrals with sage, clay, and ink accents.</h2>
        </div>
        <div className="style-lab-swatches" aria-label="Palette swatches">
          {swatches.map((swatch) => (
            <span key={swatch} style={{ background: swatch }} />
          ))}
        </div>
      </section>

      <section className="style-lab-section" id="products" aria-label="Product card concepts">
        <div className="style-lab-section-heading">
          <p className="style-lab-eyebrow">product grid</p>
          <h2>clean cards with strong product targets.</h2>
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
            <p className="style-lab-eyebrow">product detail</p>
            <h2>daily mug</h2>
            <p>
              a focused product page layout with the buying controls held in one calm purchase panel.
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
              <button type="button">add to cart</button>
            </div>
          </article>
        </section>
      </div>

      <div className="style-lab-cart-band">
        <section className="style-lab-cart" id="cart" aria-label="Cart concept">
          <div>
            <p className="style-lab-eyebrow">cart</p>
            <h2>checkout summary</h2>
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
            <button type="button">continue</button>
          </div>
        </section>
      </div>
    </main>
  );
}
