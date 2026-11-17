const products = [
    { id: 1, name: 'Guatemalan coffee', price: 14.50, category: 'central-america', image: './src/media/catalog/default' },
    { id: 2, name: 'Colombian coffee', price: 15.00, category: 'south-america', image: './src/media/catalog/default' },
    { id: 3, name: 'Ethiopian coffee', price: 16.75, category: 'africa', image: './src/media/catalog/default' },
    { id: 4, name: 'Kenyan coffee', price: 17.25, category: 'africa', image: './src/media/catalog/default' },
    { id: 5, name: 'Brazilian coffee', price: 13.90, category: 'south-america', image: './src/media/catalog/default' },
    { id: 6, name: 'Costa Rican coffee', price: 15.50, category: 'central-america', image: './src/media/catalog/default' },
    { id: 7, name: 'Sumatran coffee', price: 16.00, category: 'asia', image: './src/media/catalog/default' },
    { id: 8, name: 'Honduran coffee', price: 14.20, category: 'central-america', image: './src/media/catalog/default' }
];

const categories = [
    { id: 'central-america', name: 'Central America' },
    { id: 'south-america', name: 'South America' },
    { id: 'africa', name: 'Africa' },
    { id: 'asia', name: 'Asia' }
];

const productList = document.querySelector('#product-list');
const productTemplate = document.querySelector('#product-template');
const categoryFilter = document.querySelector('#category-filter');
const cartItems = document.querySelector('#cart-items');
const cartStatus = document.querySelector('#cart-status');
const cartSidebar = document.querySelector('#cart');
const cartToggles = document.querySelectorAll('.cart-toggle');
const cartClose = document.querySelector('#cart-close');
const cartClear = document.querySelector('#cart-clear');
const navbar = document.querySelector('.navbar');

let cart = [];

try {
    cart = JSON.parse(localStorage.getItem('roastery-cart')) || [];
} catch {
    cartStatus.textContent = 'Saved cart could not be loaded.';
}

cart = Array.isArray(cart) ? cart.filter(isCartItemValid) : [];

function isCartItemValid(item) {
    return (item && products.some((product) => product.id === item.id) && Number.isInteger(item.quantity) && item.quantity > 0);
}


function renderProducts() {
    productList.replaceChildren();
    const selectedCategory = categoryFilter.value;

    products.forEach((product) => {
        if (shouldBeSkiped(selectedCategory, product)) {
            return;
        }

        const card = productTemplate.content.cloneNode(true);

        card.querySelector('h3').textContent = product.name;
        card.querySelector('p').textContent = `$${product.price.toFixed(2)}`;

        card.querySelectorAll('img').forEach((image) => { renderImage(image, product); });

        card.querySelector('button').addEventListener('click', () => addToCart(product.id));
        productList.appendChild(card);
    });
}

function shouldBeSkiped(category, product) {
    return (category !== 'all' && product.category !== category);
}

function renderImage(image, product) {
    const suffix = image.classList.contains('hover') ? '-hover' : '';
    const sources = image.parentElement.querySelectorAll('source');

    image.alt = `${product.name} bag`;
    image.src = `${product.image}-b${suffix}.webp`;
    sources[0].srcset = `${product.image}-s${suffix}.webp`;
    sources[1].srcset = image.src;
}

function renderCart() {
    cartItems.replaceChildren();
    cartStatus.textContent = cart.length === 0 ? 'Your cart is empty.' : 'Products in your cart:';
    cartClear.disabled = cart.length === 0;

    cart.forEach((item) => {
        const product = products.find((product) => product.id === item.id);
        const row = document.createElement('li');
        const description = document.createElement('span');
        const controls = document.createElement('div');
        const quantity = document.createElement('span');

        description.innerHTML = `$${product.price.toFixed(2)} <strong>${product.name}</strong>`;
        row.dataset.productId = item.id;
        controls.className = 'cart-quantity';
        quantity.textContent = item.quantity;
        quantity.setAttribute('aria-label', `Quantity: ${item.quantity}`);

        controls.appendChild(createQuantityButton(product, -1));
        controls.appendChild(quantity);
        controls.appendChild(createQuantityButton(product, 1));
        row.appendChild(description);
        row.appendChild(controls);
        cartItems.appendChild(row);
    });
}

function createQuantityButton(product, change) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = change === 1 ? '+' : '−';
    button.dataset.change = change;
    button.setAttribute('aria-label', change === 1
        ? `Add one ${product.name} to cart`
        : `Remove one ${product.name} from cart`);

    button.addEventListener('click', () => {
        if (change === 1) {
            addToCart(product.id);
        } else {
            removeFromCart(product.id);
        }

        const replacement = cartItems.querySelector(
            `[data-product-id="${product.id}"] [data-change="${change}"]`
        );
        (replacement || cartClose).focus();
    });

    return button;
}

function removeFromCart(productId) {
    const item = cart.find((entry) => entry.id === productId);
    if (!item) {
        return;
    }

    item.quantity -= 1;
    cart = cart.filter((entry) => entry.quantity > 0);
    saveCart();
}

function setCartOpen(isOpen) {
    const focusWasInCart = cartSidebar.contains(document.activeElement);
    cartSidebar.hidden = !isOpen;
    cartToggles.forEach((button) => button.setAttribute('aria-expanded', String(isOpen)));

    if (!isOpen && focusWasInCart) {
        const visibleToggle = Array.from(cartToggles).find((button) => button.getClientRects().length > 0);
        visibleToggle?.focus();
    }
}

function updateCartPosition() {
    cartSidebar.style.setProperty('--navbar-height', `${navbar.getBoundingClientRect().height}px`);
}

function saveCart() {
    renderCart();
    try {
        localStorage.setItem('roastery-cart', JSON.stringify(cart));
    } catch {
        cartStatus.textContent = 'Cart updated, but storage is unavailable. Changes will not survive a reload.';
    }
}

function addToCart(productId) {
    const existingItem = cart.find((item) => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: productId, quantity: 1 });
    }
    saveCart();
    setCartOpen(true);
}

cartToggles.forEach((button) => {
    button.addEventListener('click', () => setCartOpen(cartSidebar.hidden));
});
cartClose.addEventListener('click', () => setCartOpen(false));
cartClear.addEventListener('click', () => {
    cart = [];
    saveCart();
    cartClose.focus();
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !cartSidebar.hidden) {
        setCartOpen(false);
    }
});

const navbarObserver = new ResizeObserver(updateCartPosition);
navbarObserver.observe(navbar);
updateCartPosition();

categories.forEach((category) => {
    const option = document.createElement('option');

    option.value = category.id;
    option.textContent = category.name;
    categoryFilter.appendChild(option);
});

categoryFilter.addEventListener('change', renderProducts);
renderProducts();
renderCart();
