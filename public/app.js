const dbStatus = document.getElementById('dbStatus');
const productsTableBody = document.getElementById('productsTableBody');
const addProductForm = document.getElementById('addProductForm');
const formMessage = document.getElementById('formMessage');
const refreshProductsBtn = document.getElementById('refreshProductsBtn');

const API_BASE = '/api';

async function checkDatabaseConnection() {
  try {
    const response = await fetch(`${API_BASE}/test`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Database connection failed');
    }

    dbStatus.textContent = data.message;
    dbStatus.style.color = 'green';
  } catch (error) {
    dbStatus.textContent = `Connection error: ${error.message}`;
    dbStatus.style.color = 'red';
  }
}

async function loadProducts() {
  try {
    productsTableBody.innerHTML = `
      <tr>
        <td colspan="10">Loading products...</td>
      </tr>
    `;

    const response = await fetch(`${API_BASE}/products`);
    const products = await response.json();

    if (!response.ok) {
      throw new Error(products.error || 'Failed to load products');
    }

    productsTableBody.innerHTML = '';

    if (products.length === 0) {
      productsTableBody.innerHTML = `
        <tr>
          <td colspan="10">No products found.</td>
        </tr>
      `;
      return;
    }

    products.forEach((product) => {
      const row = document.createElement('tr');

      row.innerHTML = `
        <td>${product.product_id}</td>
        <td>${product.album_id}</td>
        <td>${product.album_title}</td>
        <td>${product.supplier_id || 'None'}</td>
        <td>${product.format}</td>
        <td>$${Number(product.price).toFixed(2)}</td>
        <td>${product.condition_type}</td>
        <td>${product.stock_quantity}</td>
        <td>
          <input 
            type="number" 
            min="0" 
            class="table-input"
            id="stock-${product.product_id}"
            value="${product.stock_quantity}"
          />
          <button 
            class="btn"
            onclick="updateStock(${product.product_id})"
          >
            Update
          </button>
        </td>
        <td>
          <button 
            class="btn"
            onclick="deleteProduct(${product.product_id})"
          >
            Delete
          </button>
        </td>
      `;

      productsTableBody.appendChild(row);
    });
  } catch (error) {
    productsTableBody.innerHTML = `
      <tr>
        <td colspan="10">Error: ${error.message}</td>
      </tr>
    `;
  }
}

async function addProduct(event) {
  event.preventDefault();

  const formData = new FormData(addProductForm);

  const newProduct = {
    album_id: Number(formData.get('album_id')),
    supplier_id: formData.get('supplier_id')
      ? Number(formData.get('supplier_id'))
      : null,
    format: formData.get('format'),
    price: Number(formData.get('price')),
    condition_type: formData.get('condition_type'),
    stock_quantity: Number(formData.get('stock_quantity'))
  };

  try {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newProduct)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add product');
    }

    formMessage.textContent = data.message;
    formMessage.style.color = 'green';

    addProductForm.reset();
    await loadProducts();
  } catch (error) {
    formMessage.textContent = `Error: ${error.message}`;
    formMessage.style.color = 'red';
  }
}

async function updateStock(productId) {
  const stockInput = document.getElementById(`stock-${productId}`);
  const stockQuantity = Number(stockInput.value);

  if (stockQuantity < 0) {
    alert('Stock quantity cannot be negative.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stock_quantity: stockQuantity
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update product');
    }

    alert(data.message);
    await loadProducts();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

async function deleteProduct(productId) {
  const confirmDelete = confirm(
    `Are you sure you want to delete product ID ${productId}?`
  );

  if (!confirmDelete) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete product');
    }

    alert(data.message);
    await loadProducts();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

addProductForm.addEventListener('submit', addProduct);

refreshProductsBtn.addEventListener('click', loadProducts);

checkDatabaseConnection();
loadProducts();