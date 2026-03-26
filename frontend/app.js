// ============================================================
//  app.js  –  SOLE Sport Shoes Catalog
//  Vue 3 (CDN) + Axios + jQuery live search
// ============================================================

const API_BASE = 'http://127.0.0.1:5000';

const { createApp } = Vue;

createApp({

  // ── Data (reactive state) ────────────────────────────────
  data() {
    return {
      /* Navigation */
      view: 'list',          // 'list' | 'add'

      /* ---- ADD PRODUCT ---- */
      form: {
        name:        '',
        description: '',
        price:       '',
        image_url:   ''
      },
      formErrors:    {},     // field-level errors from frontend + backend
      serverError:   '',     // global server error message
      addSuccess:    false,  // success banner
      submitting:    false,  // loading state for submit button
      imgPreviewError: false,

      /* ---- PRODUCT LIST ---- */
      products:       [],
      loadingProducts: false,
      listError:       '',
      searchQuery:     ''    // mirrors the jQuery search input value
    };
  },

  // ── Lifecycle hook ───────────────────────────────────────
  mounted() {
    // Load products as soon as the app is ready
    this.fetchProducts();

    // ── jQuery Live Search ──────────────────────────────────
    // jQuery listens to every keystroke on #live-search,
    // then calls the Flask search endpoint via AJAX.
    // The result is handed back to Vue by updating this.products.

    const self = this;  // capture Vue context for use inside jQuery callbacks

    $(document).on('input', '#live-search', function () {
      const query = $(this).val().trim();
      self.searchQuery = query;   // sync with Vue (for clear button v-show)

      // Debounce: wait 300 ms after the user stops typing
      clearTimeout(self._searchTimer);
      self._searchTimer = setTimeout(() => {
        if (query === '') {
          // Empty search → fetch all products
          self.fetchProducts();
        } else {
          $.ajax({
            url: `${API_BASE}/products/search`,
            method: 'GET',
            data: { q: query },
            success(response) {
              if (response.success) {
                self.products = response.products;
                self.listError = '';
              }
            },
            error(xhr) {
              const msg = xhr.responseJSON?.message || 'Search failed.';
              self.listError = msg;
            }
          });
        }
      }, 300);
    });
  },

  // ── Methods ──────────────────────────────────────────────
  methods: {

    /* Switch between views */
    switchView(target) {
      this.view = target;
      if (target === 'list') {
        // Reset search and reload when coming back to list view
        this.searchQuery = '';
        this.$nextTick(() => {
          $('#live-search').val('');
        });
        this.fetchProducts();
      }
      // Reset add-form state when switching to it
      if (target === 'add') {
        this.resetForm();
      }
    },

    /* Clear a single field error when the user starts typing */
    clearError(field) {
      delete this.formErrors[field];
      this.serverError = '';
      this.addSuccess  = false;
      if (field === 'image_url') this.imgPreviewError = false;
    },

    /* Clear the search input (clear button) */
    clearSearch() {
      this.searchQuery = '';
      $('#live-search').val('').trigger('input');
    },

    /* ── Frontend validation ─────────────────────────────── */
    validateForm() {
      const errors = {};

      if (!this.form.name)
        errors.name = 'Shoe name is required.';

      if (!this.form.description)
        errors.description = 'Description is required.';

      const price = parseFloat(this.form.price);
      if (!this.form.price && this.form.price !== 0) {
        errors.price = 'Price is required.';
      } else if (isNaN(price) || price <= 0) {
        errors.price = 'Price must be a positive number.';
      }

      if (!this.form.image_url)
        errors.image_url = 'Image URL is required.';

      this.formErrors = errors;
      return Object.keys(errors).length === 0;
    },

    /* ── Submit new product (Axios) ──────────────────────── */
    async submitProduct() {
      this.addSuccess  = false;
      this.serverError = '';

      // 1. Frontend validation
      if (!this.validateForm()) return;

      this.submitting = true;

      try {
        // 2. POST to Flask API
        const response = await axios.post(`${API_BASE}/products`, {
          name:        this.form.name,
          description: this.form.description,
          price:       parseFloat(this.form.price),
          image_url:   this.form.image_url
        });

        if (response.data.success) {
          this.addSuccess = true;
          this.resetForm();
        }

      } catch (error) {
        if (error.response) {
          const data = error.response.data;

          if (data.errors) {
            // Field-level errors returned from Flask backend
            this.formErrors = data.errors;
          } else {
            this.serverError = data.message || 'An unexpected error occurred.';
          }
        } else {
          // Network error (Flask not running, CORS, etc.)
          this.serverError = 'Cannot connect to the server. Is Flask running?';
        }
      } finally {
        this.submitting = false;
      }
    },

    /* ── Fetch all products (Axios) ──────────────────────── */
    async fetchProducts() {
      this.loadingProducts = true;
      this.listError       = '';

      try {
        const response = await axios.get(`${API_BASE}/products`);
        if (response.data.success) {
          this.products = response.data.products;
        }
      } catch (error) {
        if (error.response) {
          this.listError = error.response.data.message || 'Failed to load products.';
        } else {
          this.listError = 'Cannot connect to the server. Is Flask running?';
        }
      } finally {
        this.loadingProducts = false;
      }
    },

    /* ── Reset form to blank state ───────────────────────── */
    resetForm() {
      this.form = { name: '', description: '', price: '', image_url: '' };
      this.formErrors    = {};
      this.serverError   = '';
      this.imgPreviewError = false;
      // Keep addSuccess visible for a few seconds then hide it
      setTimeout(() => { this.addSuccess = false; }, 4000);
    }

  }

}).mount('#app');
