class SiteFooter extends HTMLElement {
    constructor() {
      super();
      this.innerHTML = `
        <footer class="site-footer">
          <!-- <a href="/terms">Terms</a> · -->
          <a href="https://github.com/Aiden-Jacobs/Cow-Points/security/policy">Security</a> · 
          <!-- <a href="/status">Status</a> · -->
          <a href="https://github.com/Aiden-Jacobs/Cow-Points">Docs</a> · 
          <!-- <a href="/contact">Contact</a> -->
        </footer>
      `;
    }
  }
  
  customElements.define('site-footer', SiteFooter);
  