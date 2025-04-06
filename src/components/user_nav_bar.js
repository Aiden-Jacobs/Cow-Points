class User_nav_bar extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
        this.innerHTML = `<nav>
                    <ul id="nav-bar">
                        <li><a href="user_dashboard.html">Dashboard</a></li>
                        <li><a href="points.html">Points</a></li>
                        <!-- <li><a href="friends.html">Friends</a></li> -->
                        <!-- <li><a href="#add-point">Add Point</a></li> -->
                        <!-- <li><a href="user_settings.html">Settings</a></li> -->
                    </ul>
                </nav>`;
    }
  }

customElements.define('user-nav-bar', User_nav_bar);
